import React, { useState } from 'react';
import { VercelV0Chat } from '@/components/v0-ai-chat';
import archieLogo from '@/assets/Archie logo blanco.png';
import { UserDropdown } from '@/components/user-dropdown';
import { ChatSidebar } from '@/components/ChatSidebar';
import { PanelLeft } from 'lucide-react';

export function ChatPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#0d0d0d] font-sans text-gray-100 flex flex-col">
      {/* Sidebar */}
      <ChatSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Header */}
      <header className="flex h-16 items-center justify-between px-6 border-b border-white/5 bg-[#0d0d0d]/80 backdrop-blur-md sticky top-0 z-30">
        <div className="flex items-center gap-3">
          {/* Toggle sidebar */}
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
            title="Historial de chats"
          >
            <PanelLeft className="w-5 h-5" />
          </button>
          <a href="/">
            <img src={archieLogo} alt="Archie logo" className="h-10 w-auto" />
          </a>
        </div>

        <div className="flex items-center gap-4">
          <UserDropdown />
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 w-full flex flex-col items-center justify-start pt-20 pb-20">
        <VercelV0Chat />
      </main>
    </div>
  );
}
