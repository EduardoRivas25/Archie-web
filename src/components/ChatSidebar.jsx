import React, { useState } from 'react';
import { PenSquare, Search, Trash2, MessageCircle, X, ChevronLeft } from 'lucide-react';
import { cn } from '@/lib/utils';

const SAMPLE_CHATS = [
  { id: 1, title: 'Ayuda con integrales dobles', time: 'Hoy' },
  { id: 2, title: 'Algoritmo de ordenamiento burbuja', time: 'Hoy' },
  { id: 3, title: 'Diferencia entre TCP y UDP', time: 'Ayer' },
  { id: 4, title: 'Qué es una derivada parcial', time: 'Ayer' },
  { id: 5, title: 'Subconsultas en SQL explicadas', time: 'Esta semana' },
  { id: 6, title: 'Modelo OSI y sus 7 capas', time: 'Esta semana' },
  { id: 7, title: 'Recursividad en Python', time: 'Esta semana' },
  { id: 8, title: 'Álgebra lineal: eigenvalores', time: 'Anterior' },
  { id: 9, title: 'Máquinas de estado finito', time: 'Anterior' },
];

function groupChats(chats) {
  return chats.reduce((groups, chat) => {
    if (!groups[chat.time]) groups[chat.time] = [];
    groups[chat.time].push(chat);
    return groups;
  }, {});
}

import { useTheme } from '@/context/ThemeContext';

export function ChatSidebar({ isOpen, onClose }) {
  const { theme } = useTheme();
  const [search, setSearch] = useState('');
  const [chats, setChats] = useState(SAMPLE_CHATS);
  const [activeChat, setActiveChat] = useState(null);
  const [hoveredChat, setHoveredChat] = useState(null);

  const filtered = chats.filter(c =>
    c.title.toLowerCase().includes(search.toLowerCase())
  );
  const groups = groupChats(filtered);
  const groupOrder = ['Hoy', 'Ayer', 'Esta semana', 'Anterior'];

  const deleteChat = (e, id) => {
    e.stopPropagation();
    setChats(prev => prev.filter(c => c.id !== id));
    if (activeChat === id) setActiveChat(null);
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className={cn(
          'fixed inset-0 z-40 bg-black/50 backdrop-blur-sm transition-opacity duration-300',
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        )}
        onClick={onClose}
      />

      {/* Sidebar panel */}
      <aside
        className={cn(
          'fixed left-0 top-0 h-full z-50 w-72 flex flex-col transition-all duration-300 ease-in-out',
          theme === 'dark' ? 'bg-[#111111] border-r border-white/8' : 'bg-white border-r border-black/5',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Top actions */}
        <div className="flex items-center justify-between px-3 pt-4 pb-2">
          {/* Logo / collapse */}
          <button
            onClick={onClose}
            className={cn(
              "p-1.5 rounded-lg transition-colors",
              theme === 'dark' ? "text-gray-400 hover:text-white hover:bg-white/5" : "text-gray-500 hover:text-gray-900 hover:bg-black/5"
            )}
            title="Cerrar"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          {/* New chat */}
          <button
            onClick={() => setActiveChat(null)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl
                       bg-[#0066cc]/10 hover:bg-[#0066cc]/20
                       text-[#4da6ff] text-sm font-medium
                       border border-[#0066cc]/20 hover:border-[#0066cc]/40
                       transition-all"
          >
            <PenSquare className="w-4 h-4" />
            Nuevo chat
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
              placeholder="Buscar conversaciones..."
              className={cn(
                "flex-1 bg-transparent text-sm outline-none placeholder-gray-500",
                theme === 'dark' ? "text-gray-200" : "text-gray-800"
              )}
            />
            {search && (
              <button onClick={() => setSearch('')} className="text-gray-500 hover:text-gray-300 transition-colors">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Chat list */}
        <div className="flex-1 overflow-y-auto px-2 pb-4 space-y-4 custom-scrollbar">
          {groupOrder.map(group => {
            const items = groups[group];
            if (!items?.length) return null;
            return (
              <div key={group}>
                <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider px-2 mb-1">
                  {group}
                </p>
                <div className="space-y-0.5">
                  {items.map(chat => (
                    <div
                      key={chat.id}
                      onClick={() => setActiveChat(chat.id)}
                      onMouseEnter={() => setHoveredChat(chat.id)}
                      onMouseLeave={() => setHoveredChat(null)}
                      className={cn(
                        'group flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer',
                        'transition-all duration-150',
                        activeChat === chat.id
                          ? 'bg-[#0066cc]/15 border border-[#0066cc]/25 text-[#4da6ff]'
                          : theme === 'dark' 
                            ? 'hover:bg-white/5 text-gray-300 hover:text-white border border-transparent' 
                            : 'hover:bg-black/5 text-gray-600 hover:text-gray-900 border border-transparent'
                      )}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <MessageCircle className={cn(
                          'w-3.5 h-3.5 shrink-0',
                          activeChat === chat.id ? 'text-[#4da6ff]' : 'text-gray-600 group-hover:text-gray-400'
                        )} />
                        <span className="text-sm truncate font-medium">{chat.title}</span>
                      </div>

                      {/* Delete button — visible on hover */}
                      {(hoveredChat === chat.id || activeChat === chat.id) && (
                        <button
                          onClick={e => deleteChat(e, chat.id)}
                          className="shrink-0 p-1 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-400/10 transition-colors ml-1"
                          title="Eliminar chat"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}

          {filtered.length === 0 && (
            <div className="text-center py-10 text-gray-500 text-sm">
              No se encontraron conversaciones
            </div>
          )}
        </div>

        {/* Footer */}
        <div className={cn(
          "px-3 py-3 border-t text-center",
          theme === 'dark' ? "border-white/8" : "border-black/5"
        )}>
          <p className="text-[11px] text-gray-600">Archie AI · v1.0</p>
        </div>
      </aside>
    </>
  );
}
