import React from 'react';
import { VercelV0Chat } from '@/components/v0-ai-chat';
import archieLogo from '@/assets/Archie logo blanco.png';
import { UserDropdown } from '@/components/user-dropdown';

export function ChatPage() {
  return (
    <div className="min-h-screen bg-[#0d0d0d] font-sans text-gray-100 flex flex-col">
      <header className="flex h-16 items-center justify-between px-6 border-b border-white/5 bg-[#0d0d0d]/80 backdrop-blur-md sticky top-0 z-50">
        <div className="flex items-center gap-2">
           <a href="/">
             <img src={archieLogo} alt="Archie logo" className="h-10 w-auto" />
           </a>
        </div>
        <div className="flex items-center gap-4">
           <button className="text-sm font-medium text-gray-400 hover:text-white transition-colors">
             Historial
           </button>
           <UserDropdown />
        </div>
      </header>
      
      <main className="flex-1 w-full flex flex-col items-center justify-start pt-20 pb-20">
        <VercelV0Chat />
      </main>
    </div>
  );
}
