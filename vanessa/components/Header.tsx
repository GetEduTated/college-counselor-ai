import React from 'react';
import { CalendarIcon, SignOutIcon } from './icons';

interface HeaderProps {
  userEmail: string | null;
  onSignOut: () => void;
}

const Header: React.FC<HeaderProps> = ({ userEmail, onSignOut }) => {
  const iconButtonClasses = "p-2 rounded-full text-[var(--color-text-secondary)]/80 hover:bg-white/10 hover:text-[var(--color-accent-primary)] transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--color-accent-primary)]";

  return (
    <header className="bg-[var(--color-bg-primary)]/70 backdrop-blur-lg shadow-md w-full sticky top-0 z-10">
      <div className="container mx-auto px-4 py-2 flex justify-between items-center h-[76px]">
        {/* Left Icon: Book a Meeting */}
        <div className="w-1/3 flex justify-start">
           <a 
            href="https://mvpscollege.youcanbook.me/?i=itt_4c9b0f30-f753-4be0-b26f-6097d2ab72da"
            target="_blank" 
            rel="noopener noreferrer"
            className={iconButtonClasses}
            aria-label="Book a meeting with your counselor"
            title="Book a meeting"
          >
            <CalendarIcon className="w-6 h-6" />
          </a>
        </div>

        {/* Center Title */}
        <div className="w-1/3 flex justify-center">
          <h1 className="text-3xl font-semibold text-[var(--color-text-secondary)]" style={{ fontFamily: 'var(--font-heading)' }}>
            Vanessa
          </h1>
        </div>

        {/* Right Icon: Sign Out */}
        <div className="w-1/3 flex justify-end">
          {userEmail && (
             <button 
               onClick={onSignOut} 
               className={iconButtonClasses}
               title={`Sign out (${userEmail})`}
               aria-label="Sign Out"
             >
               <SignOutIcon className="w-6 h-6" />
             </button>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;