
import React from 'react';
import { Message, Role } from '../types';
import { UserIcon, BotIcon } from './icons';

interface ChatMessageProps {
  message: Message;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  const isUser = message.role === Role.USER;

  const createMarkup = () => {
    // A simple markdown to HTML converter for bold text and basic lists
    const html = message.text
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') 
      .replace(/\n\s*([*-])\s(.*)/g, '<br />&bull; $2') 
      .replace(/\n/g, '<br />');
    return { __html: html };
  };

  return (
    <div className={`flex items-start gap-3 my-4 ${isUser ? 'justify-end' : 'justify-start'}`}>
      {!isUser && (
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[var(--color-accent-primary)] flex items-center justify-center text-white">
          <BotIcon className="w-5 h-5" />
        </div>
      )}
      <div
        className={`max-w-xs md:max-w-md lg:max-w-2xl px-4 py-3 rounded-2xl shadow ${
          isUser
            ? 'bg-[var(--color-accent-secondary)] text-[var(--color-text-secondary)] rounded-br-none'
            : 'bg-[var(--color-bg-secondary)] text-[var(--color-text-primary)] rounded-bl-none'
        }`}
      >
        <div className="prose prose-sm max-w-none break-words" dangerouslySetInnerHTML={createMarkup()} />
      </div>
       {isUser && (
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center text-gray-600">
          <UserIcon className="w-5 h-5" />
        </div>
      )}
    </div>
  );
};

export default ChatMessage;