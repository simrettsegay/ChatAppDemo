// src/components/chat/ChatInput.tsx
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Paperclip, Mic, Send, Smile } from "lucide-react";

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  onTypingChange?: (isTyping: boolean) => void;  // Add this line
  isSending?: boolean;
}

export function ChatInput({ onSendMessage, isSending = false }: ChatInputProps) {
  const [message, setMessage] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    onSendMessage(message);
    setMessage("");
  };

  return (
    <div className="p-4 bg-white dark:bg-gray-900/80 backdrop-blur-sm border-t border-gray-100 dark:border-gray-800">
      <form
        onSubmit={handleSubmit}
        className="flex items-end space-x-2 max-w-3xl mx-auto"
      >
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="rounded-full text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-gray-800"
        >
          <Smile className="h-5 w-5" />
        </Button>

        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="rounded-full text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-gray-800"
        >
          <Paperclip className="h-5 w-5" />
        </Button>

        <div className="relative flex-1">
          <Input
            placeholder="Type a message..."
            className="w-full pr-12 bg-gray-50 dark:bg-gray-800 border-0 focus-visible:ring-2 focus-visible:ring-blue-500/20 h-12 rounded-full pl-5"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            disabled={isSending}
          />

          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="absolute right-1 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full text-gray-500 hover:bg-gray-200/50 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-gray-700/50"
          >
            <Mic className="h-5 w-5" />
          </Button>
        </div>

        <Button
          type="submit"
          size="icon"
          disabled={!message.trim() || isSending}
          className={`h-12 w-12 rounded-full transition-all ${
            message.trim()
              ? "bg-gradient-to-r from-[#00264d] to-[#02386e] text-white hover:from-[#003366] hover:to-[#024b8f]"
              : "bg-gray-100 text-gray-400 dark:bg-gray-800 dark:text-gray-600"
          }`}
        >
          <Send className="h-5 w-5" />
        </Button>
      </form>
    </div>
  );
}
