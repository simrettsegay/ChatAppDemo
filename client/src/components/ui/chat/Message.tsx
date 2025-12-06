import { format, isValid } from 'date-fns';
import { cn } from "@/lib/utils";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { User } from 'lucide-react';
import type { Message as MessageType } from './types';

interface MessageProps {
  message: MessageType;
  isCurrentUser: boolean;
  showAvatar?: boolean;
  className?: string;
}

export function Message({ message, isCurrentUser, showAvatar = true, className }: MessageProps) {
  const formatTime = (date?: Date | string | number) => {
    if (!date) return '';
    try {
      const dateObj = date instanceof Date ? date : new Date(date);
      return isValid(dateObj) ? format(dateObj, 'h:mm a') : '';
    } catch (e) {
      console.error('Error formatting date:', e);
      return '';
    }
  };

  return (
    <div
      className={cn(
        'flex gap-2 items-start group',
        {
          'justify-end': isCurrentUser,
          'justify-start': !isCurrentUser
        },
        className
      )}
    >
      {!isCurrentUser && showAvatar && (
        <div className="flex-shrink-0">
          <Avatar className="h-8 w-8">
            <AvatarImage src={message.senderAvatar} alt={message.senderName} />
            <AvatarFallback>{message.senderName?.charAt(0).toUpperCase() || 'U'}</AvatarFallback>
          </Avatar>
        </div>
      )}
      
      <div
        className={cn(
          'relative max-w-xs md:max-w-md lg:max-w-lg px-4 py-2 rounded-2xl shadow-sm transition-all',
          {
            'bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-br-none shadow-blue-500/20': isCurrentUser,
            'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-bl-none shadow-gray-200/50 dark:shadow-gray-800/50': !isCurrentUser,
            'ml-10': !isCurrentUser && !showAvatar,
            'mr-10': isCurrentUser
          }
        )}
      >
        {!isCurrentUser && message.senderName && (
          <p className="text-xs font-medium mb-1 text-blue-600 dark:text-blue-400">
            {message.senderName}
          </p>
        )}
        
        <p className="text-sm leading-relaxed break-words">{message.content}</p>
        
        <div className="flex items-center justify-end mt-1 space-x-1">
          <span 
            className={cn("text-xs", {
              'text-white/70': isCurrentUser,
              'text-gray-500 dark:text-gray-400': !isCurrentUser
            })}
          >
            {formatTime(message.timestamp)}
          </span>
          
          {isCurrentUser && message.status && (
            <span className="text-xs opacity-70">
              {message.status === 'sending' && '🔄'}
              {message.status === 'sent' && '✓'}
              {message.status === 'delivered' && '✓✓'}
              {message.status === 'read' && '✓✓✓'}
            </span>
          )}
        </div>
      </div>
      
      {isCurrentUser && showAvatar && (
        <div className="flex-shrink-0">
          <Avatar className="h-8 w-8">
            <AvatarImage src={message.senderAvatar} alt="You" />
            <AvatarFallback>You</AvatarFallback>
          </Avatar>
        </div>
      )}
    </div>
  );
}
