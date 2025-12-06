import type { Message } from './types.ts';
import { format } from 'date-fns';

interface ChatListProps {
  messages: Message[];
  currentUserId?: string;
  className?: string;
}

export function ChatList({ messages, currentUserId, className = '' }: ChatListProps) {
  const formatTime = (date: Date) => {
    return format(new Date(date), 'h:mm a');
  };

  return (
    <div className={`flex-1 overflow-y-auto p-4 ${className}`}>
      <div className="max-w-3xl mx-auto space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${
              message.senderId === currentUserId ? 'justify-end' : 'justify-start'
            }`}
          >
            <div
              className={`relative max-w-xs md:max-w-md lg:max-w-lg px-5 py-3 rounded-2xl shadow-sm transition-all ${
                message.senderId === currentUserId
                  ? 'bg-gradient-to-r from-[#00264d] to-[#02386e] text-white rounded-br-none shadow-[#00264d]/20' 
                  : 'bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 rounded-bl-none shadow-gray-200/50 dark:shadow-gray-800/50'
              }`}
            >
              {message.senderId !== currentUserId && message.senderName && (
                <p className="text-xs font-medium mb-1 text-blue-600 dark:text-blue-400">
                  {message.senderName}
                </p>
              )}
              <p className="text-sm leading-relaxed">{message.content}</p>
              <div className="flex items-center justify-end mt-1 space-x-1">
                <span className={`text-xs ${
                  message.senderId === currentUserId ? 'text-white/70' : 'text-gray-500'
                }`}>
                  {formatTime(message.timestamp)}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
