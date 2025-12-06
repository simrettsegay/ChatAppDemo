import { useState, useRef, useCallback, useEffect } from 'react';
import { io, Socket } from 'socket.io-client';
import { ChatSidebar } from './ChatSidebar';
import { ChatHeader } from './ChatHeader';
import { ChatInput } from './ChatInput';
import { Message as MessageComponent } from './Message';
import { useUserStatus } from '@/hooks/useUserStatus';
import { useAutoScroll } from '@/hooks/useAutoScroll';
import type { Message as MessageType } from './types';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';

interface ApiMessage extends Omit<MessageType, 'timestamp'> {
  id: string;
  content: string;
  senderId: string;
  createdAt: string;
  sender: {
    id: string;
    username: string;
    avatar?: string;
  };
}

interface ApiConversation {
  id: string;
  participants: Array<{
    user: {
      id: string;
      username: string;
      email: string;
      avatar?: string;
    };
  }>;
  messages: ApiMessage[];
  updatedAt: string;
}

interface ConversationListItem {
  id: string;
  name: string;
  avatar: string | undefined;
  lastMessage: string;
  lastMessageTime: Date;
  unreadCount: number;
}

const CURRENT_USER_ID = 'current-user';

interface ChatInterfaceProps {
  conversationId?: string;
}

export function ChatInterface({ }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<MessageType[]>([]);
  const [conversations, setConversations] = useState<ConversationListItem[]>([]);
  const [conversationsData, setConversationsData] = useState<ApiConversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<ApiConversation | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [socket, setSocket] = useState<Socket | null>(null);
  const lastMessageRef = useRef<HTMLDivElement>(null);

  // Handle incoming messages from socket
  const handleNewMessage = useCallback((message: MessageType) => {
    setMessages(prev => [...prev, message]);
  }, []);

  // Handle sending messages
  const handleSendMessage = useCallback(async (content: string) => {
    if (!user || !selectedConversation || !socket) return;

    const tempId = `temp-${Date.now()}`;
    const newMessage: MessageType = {
      id: tempId,
      content,
      senderId: user.id,
      timestamp: new Date(),
      status: 'sending',
    };

    // Optimistic update

    try {
      // Include the tempId in the socket emit
      socket.emit('send_message', {
        content,
        conversationId: selectedConversation.id,
        senderId: user.id,
        tempId, // Include tempId so server can send it back
      });
    } catch (error) {
      console.error('Error sending message:', error);
      setMessages(prev =>
        prev.map(msg =>
          msg.id === tempId
            ? { ...msg, status: 'error' as const }
            : msg
        )
      );
      
      toast({
        title: 'Error',
        description: 'Failed to send message',
        variant: 'destructive',
      });
    }
  }, [selectedConversation, user, socket]);

  // Join conversation room when selected
  useEffect(() => {
    if (socket && selectedConversation) {
      socket.emit('join_conversation', selectedConversation.id);
      // Also fetch messages when conversation changes
      fetchMessages(selectedConversation.id);
    }
  }, [selectedConversation?.id, socket]);

  // Socket.IO connection and event listeners
  useEffect(() => {
    if (!user) return;

    // Initialize Socket.IO connection with proper options
    const newSocket = io('http://localhost:5000', {
      query: { 
        userId: user.id 
      },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      timeout: 20000,
      autoConnect: true
    });

    // Connection established
    newSocket.on('connect', () => {
      console.log('Socket.IO Connected with ID:', newSocket.id);
    });

    // Connection error
    newSocket.on('connect_error', (error) => {
      console.error('Socket.IO Connection Error:', error);
      // Attempt to reconnect
      setTimeout(() => {
        newSocket.connect();
      }, 1000);
    });

    // Log all socket events for debugging
    const logEvent = (event: string, ...args: any[]) => {
      console.log(`Socket event: ${event}`, args);
    };
    newSocket.onAny(logEvent);

    // Listen for new messages
    newSocket.on('receive_message', handleNewMessage);

    setSocket(newSocket);

    // Clean up on unmount
    return () => {
      newSocket.off('receive_message', handleNewMessage);
      newSocket.close();
    };
  }, [user?.id, handleNewMessage]);

  // Auto-scroll only moves the last message into view (safe)
  useAutoScroll(lastMessageRef, [messages.length]);

  // User status hook
  useUserStatus(CURRENT_USER_ID, {
    initialStatus: 'online',
  });

  // Get the other participant's name for the conversation header
  const getParticipantName = useCallback((conv: ApiConversation) => {
    if (!conv) return 'Unknown User';
    const otherParticipant = conv.participants?.find(p => p.user.id !== user?.id);
    return otherParticipant?.user.username || 'Unknown User';
  }, [user?.id]);

  // Get the other participant's avatar for the conversation header
  const getParticipantAvatar = useCallback((conv: ApiConversation) => {
    if (!conv) return undefined;
    const otherParticipant = conv.participants?.find(p => p.user.id !== user?.id);
    return otherParticipant?.user.avatar;
  }, [user?.id]);

  // Fetch conversations when component mounts
  useEffect(() => {
    const fetchConversations = async () => {
      try {
        const userData = localStorage.getItem('user');
        if (!userData) {
          throw new Error('Not authenticated');
        }
        
        const { accessToken } = JSON.parse(userData);
        
        const response = await fetch('http://localhost:5000/api/conversations', {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch conversations');
        }

        const data: ApiConversation[] = await response.json();
        
        const toConversationListItem = (conv: ApiConversation): ConversationListItem => ({
          id: conv.id,
          name: conv.participants
            .filter(p => p.user.id !== user?.id)
            .map(p => p.user.username)
            .join(', '),
          avatar: conv.participants[0]?.user.avatar,
          lastMessage: conv.messages[0]?.content || 'No messages yet',
          lastMessageTime: new Date(conv.updatedAt),
          unreadCount: 0, // You might want to track this on the backend
        });
        
        setConversations(data.map(toConversationListItem));
        setConversationsData(data);
        
        // Select the first conversation by default
        if (data.length > 0) {
          setSelectedConversation(data[0]);
          fetchMessages(data[0].id);
        }
      } catch (error) {
        console.error('Error fetching conversations:', error);
        toast({
          title: 'Error',
          description: 'Failed to load conversations',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchConversations();
  }, [user?.id]);

  const fetchMessages = async (conversationId: string) => {
    try {
      const userData = localStorage.getItem('user');
      if (!userData) {
        throw new Error('Not authenticated');
      }
      
      const { accessToken } = JSON.parse(userData);
      
      const response = await fetch(
        `http://localhost:5000/api/conversations/${conversationId}/messages`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch messages');
      }

      const data: { messages: ApiMessage[] } = await response.json();
      
      // Transform API messages to match our frontend type
      const formattedMessages = data.messages.map(msg => ({
        id: msg.id,
        content: msg.content,
        senderId: msg.senderId,
        timestamp: new Date(msg.createdAt),
        status: 'delivered' as const,
        sender: {
          id: msg.sender.id,
          name: msg.sender.username,
          avatar: msg.sender.avatar,
        },
      }));
      
      setMessages(formattedMessages);
    } catch (error) {
      console.error('Error fetching messages:', error);
      toast({
        title: 'Error',
        description: 'Failed to load messages',
        variant: 'destructive',
      });
    }
  };

  const handleIncomingMessage = useCallback((data: any) => {
    if (data.tempId) {
      // This is an update to an optimistically added message
      setMessages((prev) =>
        prev.map((msg) => (msg.id === data.tempId ? { ...data, id: data.id } : msg))
      );
    } else {
      // This is a new message
      setMessages((prev) => [...prev, data]);
    }
  }, []);

  // Toggle sidebar on mobile
  const toggleSidebar = useCallback(() => {
    setIsSidebarOpen((prev: boolean) => !prev);
  }, []);

  // Close sidebar when clicking outside on mobile
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const sidebar = document.querySelector('.chat-sidebar');
      const target = event.target as HTMLElement;
      
      if (isSidebarOpen && 
          window.innerWidth < 768 && 
          !sidebar?.contains(target) && 
          !target.closest('.menu-button')) {
        setIsSidebarOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isSidebarOpen]);

return (
  <div className="flex h-screen bg-gray-50 relative">
    {/* Mobile menu button */}
    <button 
      onClick={toggleSidebar}
      className="md:hidden fixed top-4 left-4 z-40 p-2 rounded-md bg-blue-600 text-white"
      aria-label="Toggle menu"
    >
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
      </svg>
    </button>

    <ChatSidebar
      isOpen={isSidebarOpen}
      className="chat-sidebar"
      user={{
        name: user?.username || 'User',
        avatar: user?.avatar
      }}
      contacts={conversations.map(conv => ({
        id: conv.id,
        name: conv.name,
        avatar: conv.avatar,
        isOnline: true,
        lastMessage: conv.lastMessage,
        lastMessageTime: conv.lastMessageTime,
        unreadCount: conv.unreadCount,
        username: conv.name
      }))}
      selectedContactId={selectedConversation?.id}
      onSelectContact={(contact) => {
        const conv = conversationsData.find(c => c.id === contact.id);
        if (conv) {
          setSelectedConversation(conv);
          fetchMessages(conv.id);
          // Close sidebar on mobile after selecting a conversation
          if (window.innerWidth < 768) {
            setIsSidebarOpen(false);
          }
        }
      }}
      onNewChat={() => {
        // Handle new chat
      }}
    />
    <div className="flex-1 flex flex-col overflow-hidden">
  {selectedConversation ? (
    <>
      <ChatHeader
        title={getParticipantName(selectedConversation)}
        avatarUrl={getParticipantAvatar(selectedConversation)}
        isOnline={true}
        onMenuClick={() => setIsSidebarOpen(!isSidebarOpen)}
      />

      <div className="flex-1 overflow-y-auto p-4">
        <div className="max-w-3xl mx-auto space-y-4">
          {messages.map((message) => (
            <MessageComponent
              key={message.id}
              message={message}
              isCurrentUser={message.senderId === user?.id}
            />
          ))}

          <div ref={lastMessageRef} />
        </div>
      </div>

      <div className="border-t border-gray-200 dark:border-gray-700 p-4">
        <ChatInput
          onSendMessage={handleSendMessage}
          onTypingChange={() => {}}
        />
      </div>
    </>
  ) : (
    <div className="flex items-center justify-center h-full">
      <div className="text-center">
        <h3 className="text-lg font-medium text-gray-900">
          No conversation selected
        </h3>
        <p className="mt-1 text-sm text-gray-500">
          Select a conversation or start a new one.
           </p>
       </div>
      </div>
   )}
    </div>
    </div>
   
  );
}
