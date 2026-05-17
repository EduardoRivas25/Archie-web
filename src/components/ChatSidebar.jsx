import React, { useState, useEffect, useCallback } from 'react';
import { PenSquare, Search, Trash2, MessageCircle, ChevronLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import * as chatService from '@/services/chatService';

const GROUP_ORDER = ['Hoy', 'Ayer', 'Esta semana', 'Anterior'];

export function ChatSidebar({ isOpen, onClose, activeSessionId, onSelectSession, onNewChat, refreshTrigger }) {
  const { theme } = useTheme();
  const { user } = useAuth();
  const [search, setSearch] = useState('');
  const [sessions, setSessions] = useState([]);
  const [hoveredChat, setHoveredChat] = useState(null);
  const [loading, setLoading] = useState(false);

  // Load sessions from DB
  const loadSessions = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const data = await chatService.getSessionsByUser(user.id);
      setSessions(data);
    } catch (err) {
      console.error('Error loading sessions:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadSessions();
  }, [loadSessions, refreshTrigger]);

  const filtered = sessions.filter(c =>
    c.title.toLowerCase().includes(search.toLowerCase())
  );
  const groups = chatService.groupSessionsByDate(filtered);

  const deleteChat = async (e, id) => {
    e.stopPropagation();
    try {
      await chatService.deleteSession(id);
      setSessions(prev => prev.filter(c => c.id !== id));
      if (activeSessionId === id) {
        onNewChat?.();
      }
    } catch (err) {
      console.error('Error deleting session:', err);
    }
  };

  const handleNewChat = () => {
    onNewChat?.();
  };

  return (
    <>
      {/* Mobile Backdrop - Only visible on small screens when open */}
      <div
        className={cn(
          'lg:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition-opacity duration-300',
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        )}
        onClick={onClose}
      />

      {/* Sidebar panel */}
      <aside
        className={cn(
          'fixed lg:relative left-0 top-0 h-[100dvh] lg:h-full z-50 flex flex-col transition-all duration-300 ease-in-out overflow-hidden',
          theme === 'dark' ? 'bg-[#0d0d0d] border-r border-white/5' : 'bg-white border-r border-black/5',
          isOpen ? 'w-[min(18rem,86vw)] opacity-100 translate-x-0 lg:w-72' : 'w-0 opacity-0 -translate-x-full lg:translate-x-0'
        )}
      >
        <div className="flex h-full w-[min(18rem,86vw)] shrink-0 flex-col lg:w-72">
          {/* Top actions */}
          <div className="flex items-center justify-between px-3 pt-4 pb-2">
            <button
              onClick={onClose}
              className={cn(
                "p-1.5 rounded-lg transition-colors",
                theme === 'dark' ? "text-gray-400 hover:text-white hover:bg-white/5" : "text-gray-500 hover:text-gray-900 hover:bg-black/5"
              )}
              title="Cerrar lateral"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            {/* New chat */}
            <button
              onClick={handleNewChat}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl
                         bg-[#0066cc]/10 hover:bg-[#0066cc]/20
                         text-[#4da6ff] text-sm font-medium
                         border border-[#0066cc]/20 hover:border-[#0066cc]/40
                         transition-all"
            >
              <PenSquare className="w-4 h-4" />
              <span className="truncate">Nuevo chat</span>
            </button>
          </div>

          {/* Search */}
          <div className="px-3 pb-3">
            <div className={cn(
              "flex items-center gap-2 px-3 py-2 rounded-xl border transition-colors",
              theme === 'dark' ? "bg-white/5 border-white/8 focus-within:border-white/20" : "bg-gray-50 border-gray-200 focus-within:border-gray-300"
            )}>
              <Search className="w-4 h-4 text-gray-500 shrink-0" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Buscar chats..."
                className={cn(
                  "flex-1 bg-transparent text-sm outline-none placeholder-gray-500",
                  theme === 'dark' ? "text-gray-200" : "text-gray-800"
                )}
              />
            </div>
          </div>

          {/* Chat list */}
          <div className="flex-1 overflow-y-auto px-2 pb-4 space-y-4 custom-scrollbar">
            {loading && sessions.length === 0 ? (
              <div className="flex items-center justify-center py-8">
                <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : (
              GROUP_ORDER.map(group => {
                const items = groups[group];
                if (!items?.length) return null;
                return (
                  <div key={group}>
                    <p className="text-[11px] font-bold text-gray-500 uppercase tracking-widest px-3 mb-1.5 opacity-60">
                      {group}
                    </p>
                    <div className="space-y-0.5">
                      {items.map(chat => (
                        <div
                          key={chat.id}
                          onClick={() => onSelectSession?.(chat.id)}
                          onMouseEnter={() => setHoveredChat(chat.id)}
                          onMouseLeave={() => setHoveredChat(null)}
                          className={cn(
                            'group flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer',
                            'transition-all duration-150',
                            activeSessionId === chat.id
                              ? 'bg-[#0066cc]/15 border border-[#0066cc]/25 text-[#4da6ff]'
                              : theme === 'dark'
                                ? 'hover:bg-white/5 text-gray-300 border border-transparent'
                                : 'hover:bg-black/5 text-gray-600 border border-transparent'
                          )}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <MessageCircle className={cn(
                              'w-4 h-4 shrink-0',
                              activeSessionId === chat.id ? 'text-[#4da6ff]' : 'text-gray-600'
                            )} />
                            <span className="text-sm truncate font-medium">{chat.title}</span>
                          </div>

                          {/* Delete button */}
                          {(hoveredChat === chat.id || activeSessionId === chat.id) && (
                            <button
                              onClick={e => deleteChat(e, chat.id)}
                              className="shrink-0 p-1 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-400/10 transition-colors ml-1"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })
            )}

            {!loading && sessions.length === 0 && (
              <div className="text-center py-8 px-4">
                <p className="text-sm text-gray-500">No hay chats aún</p>
                <p className="text-xs text-gray-600 mt-1">Inicia una conversación con Archie</p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className={cn(
            "px-4 py-3 border-t text-center",
            theme === 'dark' ? "border-white/8" : "border-black/5"
          )}>
            <p className="text-[10px] text-gray-600 font-medium">Archie AI · v1.0</p>
          </div>
        </div>
      </aside>
    </>
  );
}
