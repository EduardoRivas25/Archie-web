import React, { useState } from 'react';
import { X, User, Lock, Globe, Bell, Shield, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

export function ProfileSettingsModal({ isOpen, onClose, user, theme }) {
  const [name, setName] = useState(user.name);
  const [password, setPassword] = useState('');
  const [language, setLanguage] = useState('Español');
  const [notifications, setNotifications] = useState(true);
  const [privacy, setPrivacy] = useState('Público');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm" 
        onClick={onClose}
      />
      
      {/* Modal Card - macOS Style */}
      <div className={cn(
        "relative w-full max-w-lg rounded-2xl shadow-2xl border overflow-hidden transition-all duration-300",
        theme === 'dark' 
          ? "bg-[#1c1c1e]/90 border-white/10 text-white" 
          : "bg-white/90 border-black/10 text-gray-900"
      )}>
        {/* Window Controls */}
        <div className={cn(
          "flex items-center justify-between px-4 py-3 border-b",
          theme === 'dark' ? "bg-[#2d2d2d]/80 border-white/10" : "bg-gray-100 border-black/5"
        )}>
          <div className="flex gap-2">
            <div className="w-3 h-3 rounded-full bg-[#ff5f56] shadow-sm border border-black/20" onClick={onClose}></div>
            <div className="w-3 h-3 rounded-full bg-[#ffbd2e] shadow-sm border border-black/20"></div>
            <div className="w-3 h-3 rounded-full bg-[#27c93f] shadow-sm border border-black/20"></div>
          </div>
          <h2 className="text-sm font-semibold opacity-80">Ajustes de Perfil</h2>
          <button onClick={onClose} className="p-1 hover:bg-black/10 rounded-md transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* User Info Section */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-widest opacity-50">Información Personal</h3>
            
            <div className="space-y-1.5">
              <label className="text-sm font-medium opacity-70 flex items-center gap-2">
                <User className="w-4 h-4" /> Nombre Completo
              </label>
              <input 
                type="text" 
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={cn(
                  "w-full px-4 py-2.5 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all",
                  theme === 'dark' ? "bg-[#2d2d2d] border-white/10" : "bg-gray-50 border-black/10"
                )}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium opacity-70 flex items-center gap-2">
                <Lock className="w-4 h-4" /> Nueva Contraseña
              </label>
              <input 
                type="password" 
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={cn(
                  "w-full px-4 py-2.5 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all",
                  theme === 'dark' ? "bg-[#2d2d2d] border-white/10" : "bg-gray-50 border-black/10"
                )}
              />
            </div>
          </div>

          {/* Settings Section */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-widest opacity-50">Preferencias</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium opacity-70 flex items-center gap-2">
                  <Globe className="w-4 h-4" /> Idioma
                </label>
                <select 
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className={cn(
                    "w-full px-4 py-2.5 rounded-lg border appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500/50",
                    theme === 'dark' ? "bg-[#2d2d2d] border-white/10" : "bg-gray-50 border-black/10"
                  )}
                >
                  <option>Español</option>
                  <option>English</option>
                  <option>Français</option>
                </select>
              </div>

              <div className="space-y-1.5 text-left">
                <label className="text-sm font-medium opacity-70 flex items-center gap-2">
                   <Shield className="w-4 h-4" /> Privacidad
                </label>
                <select 
                  value={privacy}
                  onChange={(e) => setPrivacy(e.target.value)}
                  className={cn(
                    "w-full px-4 py-2.5 rounded-lg border appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500/50",
                    theme === 'dark' ? "bg-[#2d2d2d] border-white/10" : "bg-gray-50 border-black/10"
                  )}
                >
                  <option>Público</option>
                  <option>Privado</option>
                </select>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl border border-dashed border-white/20">
              <div className="flex items-center gap-3">
                <Bell className="w-5 h-5 opacity-70" />
                <div>
                  <p className="text-sm font-medium">Notificaciones</p>
                  <p className="text-xs opacity-50">Recibir alertas del chatbot</p>
                </div>
              </div>
              <button 
                onClick={() => setNotifications(!notifications)}
                className={cn(
                  "w-12 h-6 rounded-full transition-all relative",
                  notifications ? "bg-green-500" : "bg-gray-600"
                )}
              >
                <div className={cn(
                  "absolute top-1 w-4 h-4 rounded-full bg-white transition-all",
                  notifications ? "left-7" : "left-1"
                )} />
              </button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4 border-t border-white/10">
            <button 
              onClick={onClose}
              className={cn(
                "flex-1 py-2.5 rounded-lg font-medium transition-all hover:bg-black/10",
                theme === 'dark' ? "text-gray-400" : "text-gray-600"
              )}
            >
              Cancelar
            </button>
            <button 
              onClick={onClose}
              className="flex-1 py-2.5 rounded-lg font-bold bg-[#0066cc] text-white shadow-lg shadow-blue-500/20 hover:bg-[#0055aa] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
            >
              <Check className="w-4 h-4" /> Guardar Cambios
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
