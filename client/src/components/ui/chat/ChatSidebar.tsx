import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Search, Inbox, Users, UserCircle } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import type { Contact } from './types.ts';

interface ChatSidebarProps {
  isOpen: boolean;
  user: {
    name: string;
    avatar?: string;
  };
  contacts: Contact[];
  selectedContactId?: string;
  onSelectContact: (contact: Contact) => void;
  onNewChat?: () => void;
  className?: string;
}

// Helper function to format time
const formatMessageTime = (date: Date) => {
  if (!(date instanceof Date) || isNaN(date.getTime())) return '';
  
  const now = new Date();
  const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
  
  if (diffInDays === 0) {
    // Today - show time
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } else if (diffInDays === 1) {
    // Yesterday
    return 'Yesterday';
  } else if (diffInDays < 7) {
    // Within a week - show day name
    return date.toLocaleDateString([], { weekday: 'short' });
  } else {
    // Older - show date
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  }
};

export function ChatSidebar({
  isOpen,
  user,
  contacts,
  selectedContactId,
  onSelectContact,
  onNewChat,
  className = '',
}: ChatSidebarProps) {
  return (
    <div 
      className={`${isOpen ? 'w-full md:w-80' : 'w-0'} 
      flex flex-col transition-all duration-300 overflow-hidden h-screen fixed md:relative z-50
      bg-gradient-to-br from-[#00172d] to-[#02386e] text-white ${className}`}
    >
      {/* Sidebar Header */}
      <div className="p-5 flex items-center justify-between border-b border-white/10">
        <div className="flex items-center space-x-3">
          <Avatar className="ring-2 ring-white/20">
            {user.avatar ? (
              <AvatarImage src={user.avatar} />
            ) : (
              <AvatarFallback className="bg-white/20 flex items-center justify-center">
                <UserCircle className="h-6 w-6" />
              </AvatarFallback>
            )}
          </Avatar>
          <div>
            <p className="font-medium">{user.name}</p>
            <p className="text-xs text-white/70">Active now</p>
          </div>
        </div>
        <div className="flex items-center space-x-1">
          <Button variant="ghost" size="icon" className="text-white/80 hover:bg-white/10 hover:text-white rounded-full">
            <Inbox className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon" className="text-white/80 hover:bg-white/10 hover:text-white rounded-full">
            <Users className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-white/70" />
          <Input
            placeholder="Search or start new chat"
            className="pl-10 w-full bg-white/10 border-none text-white placeholder:text-white/60 focus-visible:ring-2 focus-visible:ring-white/20"
          />
        </div>
      </div>

      {/* Contacts List */}
      <ScrollArea className="flex-1 px-2">
        <div className="space-y-1">
          {contacts.map((contact) => (
            <div
              key={contact.id}
              className={`flex items-center p-3 rounded-lg mx-2 transition-all cursor-pointer
                ${selectedContactId === contact.id 
                  ? 'bg-white/10' 
                  : 'hover:bg-white/5'}`}
              onClick={() => onSelectContact(contact)}
            >
              <div className="relative">
                <Avatar className="ring-2 ring-white/20">
                  {contact.avatar ? (
                    <AvatarImage src={contact.avatar} />
                  ) : (
                    <AvatarFallback className="bg-white/20 flex items-center justify-center">
                      <UserCircle className="h-5 w-5" />
                    </AvatarFallback>
                  )}
                </Avatar>

                {contact.isOnline && (
                  <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-400 rounded-full border-2 border-blue-600"></div>
                )}
              </div>

              <div className="ml-3 flex-1 min-w-0">
                <div className="flex justify-between items-center">
                  <p className="text-sm font-medium text-white truncate">
                    {contact.name}
                  </p>
                  {contact.lastMessageTime && (
                    <span className="text-xs text-white/60 whitespace-nowrap ml-2">
                      {formatMessageTime(new Date(contact.lastMessageTime))}
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-between">
                  <p className="text-xs text-white/70 truncate max-w-[180px]">
                    {contact.lastMessage}
                  </p>
                  {contact.unreadCount ? (
                    <span className="ml-2 bg-white text-blue-600 text-xs font-semibold h-5 w-5 flex items-center justify-center rounded-full">
                      {contact.unreadCount}
                    </span>
                  ) : null}
                </div>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
