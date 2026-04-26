import React, { useState } from 'react';
import { VercelV0Chat } from '@/components/v0-ai-chat';
import archieLogo from '@/assets/Archie texto logo blanco.png';
import { UserDropdown } from '@/components/user-dropdown';
import { ChatSidebar } from '@/components/ChatSidebar';
import { PanelLeft } from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';
import { ProfileSettingsModal } from '@/components/ProfileSettingsModal';
import { cn } from '@/lib/utils';

export function ChatPage() {
  const [sidebarOpen, setSidebarOpen] = useState(true); // Default open on desktop
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
      "h-screen font-sans flex overflow-hidden transition-colors duration-300",
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

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 relative h-full">
        {/* Header */}
        <header className={cn(
          "flex h-14 items-center justify-between px-4 border-b backdrop-blur-md sticky top-0 z-30 transition-colors",
          theme === 'dark' ? "border-white/5 bg-[#0d0d0d]/80" : "border-black/5 bg-white/80"
        )}>
          <div className="flex items-center gap-3">
            {/* Toggle sidebar button (only if closed) */}
            {!sidebarOpen && (
              <button
                onClick={() => setSidebarOpen(true)}
                className={cn(
                  "p-2 rounded-xl transition-colors",
                  theme === 'dark' ? "text-gray-400 hover:text-white hover:bg-white/5" : "text-gray-500 hover:text-gray-900 hover:bg-black/5"
                )}
                title="Abrir historial"
              >
                <PanelLeft className="w-5 h-5" />
              </button>
            )}
            <a href="/" className="flex items-center gap-2">
              <img src={archieLogo} alt="Archie logo" className="h-6 w-auto" />
            </a>
          </div>

          <div className="flex items-center gap-4">
            <UserDropdown onOpenProfile={() => setProfileOpen(true)} />
          </div>
        </header>

        {/* Chat Main (solo el chat) */}
        <main className="flex-1 overflow-y-auto w-full flex flex-col">
          <div className="flex-1 flex flex-col justify-start md:justify-start lg:justify-start min-h-0">
            <div className="max-w-4xl mx-auto w-full px-4 pt-4 pb-10 md:pt-10 md:pb-20 mt-auto md:mt-0">
              <VercelV0Chat />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
