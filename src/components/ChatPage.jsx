import React, { useState } from 'react';
import { VercelV0Chat } from '@/components/v0-ai-chat';
import archieLogo from '@/assets/Archie logo blanco.png';
import { UserDropdown } from '@/components/user-dropdown';
import { ChatSidebar } from '@/components/ChatSidebar';
import { PanelLeft } from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';
import { ProfileSettingsModal } from '@/components/ProfileSettingsModal';
import { cn } from '@/lib/utils';

export function ChatPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const { theme } = useTheme();

  const user = {
    name: "Usuario Archie",
    username: "@usuario",
    avatar: "",
    initials: "UA",
    status: "online",
  };

  return (
    <div className={cn(
      "min-h-screen font-sans flex flex-col transition-colors duration-300",
      theme === 'dark' ? "bg-[#0d0d0d] text-gray-100" : "bg-gray-50 text-gray-900"
    )}>
      {/* Sidebar */}
      <ChatSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Profile/Settings Modal */}
      <ProfileSettingsModal 
        isOpen={profileOpen} 
        onClose={() => setProfileOpen(false)} 
        user={user}
        theme={theme}
      />

      {/* Header */}
      <header className={cn(
        "flex h-16 items-center justify-between px-6 border-b backdrop-blur-md sticky top-0 z-30 transition-colors",
        theme === 'dark' ? "border-white/5 bg-[#0d0d0d]/80" : "border-black/5 bg-white/80"
      )}>
        <div className="flex items-center gap-3">
          {/* Toggle sidebar */}
          <button
            onClick={() => setSidebarOpen(true)}
            className={cn(
              "p-2 rounded-xl transition-colors",
              theme === 'dark' ? "text-gray-400 hover:text-white hover:bg-white/5" : "text-gray-500 hover:text-gray-900 hover:bg-black/5"
            )}
            title="Historial de chats"
          >
            <PanelLeft className="w-5 h-5" />
          </button>
          <a href="/">
            <img src={archieLogo} alt="Archie logo" className="h-10 w-auto" />
          </a>
        </div>

        <div className="flex items-center gap-4">
          <UserDropdown onOpenProfile={() => setProfileOpen(true)} />
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 w-full flex flex-col items-center justify-start pt-20 pb-20">
        <VercelV0Chat />
      </main>
    </div>
  );
}
