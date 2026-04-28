import React, { useState, useEffect } from 'react';
import { X, User, Lock, Globe, Bell, Shield, Check, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';
import { updateUserProfile } from '@/services/authService';
import { getRoleLabel } from '@/services/roleService';

export function ProfileSettingsModal({ isOpen, onClose, theme }) {
  const { user, profile, refreshProfile } = useAuth();
  const [name, setName] = useState('');
  const [defaultModel, setDefaultModel] = useState('pro');
  const [language, setLanguage] = useState('es');
  const [notifications, setNotifications] = useState(true);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  // Load profile data when modal opens
  useEffect(() => {
    if (isOpen && profile) {
      setName(profile.full_name || '');
      setDefaultModel(profile.default_model || 'pro');
      setLanguage(profile.language || 'es');
      setNotifications(profile.notifications_enabled ?? true);
    }
  }, [isOpen, profile]);

  if (!isOpen) return null;

  const handleSave = async () => {
    if (!user || !profile) return;
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      await updateUserProfile(user.id, {
        full_name: name,
        default_model: defaultModel,
        language: language,
        notifications_enabled: notifications,
      });
      await refreshProfile();
      setSuccess('Cambios guardados correctamente.');
      setTimeout(() => {
        setSuccess('');
        onClose();
      }, 1500);
    } catch (err) {
      setError(err.message || 'Error al guardar cambios.');
    } finally {
      setLoading(false);
    }
  };

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
            <div className="w-3 h-3 rounded-full bg-[#ff5f56] shadow-sm border border-black/20 cursor-pointer" onClick={onClose}></div>
            <div className="w-3 h-3 rounded-full bg-[#ffbd2e] shadow-sm border border-black/20"></div>
            <div className="w-3 h-3 rounded-full bg-[#27c93f] shadow-sm border border-black/20"></div>
          </div>
          <h2 className="text-sm font-semibold opacity-80">Ajustes de Perfil</h2>
          <button onClick={onClose} className="p-1 hover:bg-black/10 rounded-md transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Feedback */}
          {error && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
              <AlertCircle className="w-4 h-4 shrink-0" />{error}
            </div>
          )}
          {success && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-green-500/10 border border-green-500/20 text-green-400 text-sm">
              <Check className="w-4 h-4 shrink-0" />{success}
            </div>
          )}

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
                <Shield className="w-4 h-4" /> Correo electrónico
              </label>
              <input
                type="email"
                value={user?.email || profile?.email || ''}
                disabled
                className={cn(
                  "w-full px-4 py-2.5 rounded-lg border focus:outline-none transition-all opacity-60 cursor-not-allowed",
                  theme === 'dark' ? "bg-[#2d2d2d] border-white/10" : "bg-gray-50 border-black/10"
                )}
              />
            </div>

            {/* Role badge */}
            {profile?.role && (
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium opacity-70">Rol:</span>
                <span className={cn(
                  "text-xs font-bold px-3 py-1 rounded-full",
                  profile.role === 'superadmin' ? "bg-red-500/20 text-red-400 border border-red-500/30" :
                  profile.role === 'pro' ? "bg-blue-500/20 text-blue-400 border border-blue-500/30" :
                  profile.role === 'student' ? "bg-green-500/20 text-green-400 border border-green-500/30" :
                  "bg-gray-500/20 text-gray-400 border border-gray-500/30"
                )}>
                  {getRoleLabel(profile.role)}
                </span>
              </div>
            )}
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
                  <option value="es">Español</option>
                  <option value="en">English</option>
                  <option value="fr">Français</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium opacity-70 flex items-center gap-2">
                  <Shield className="w-4 h-4" /> Modelo por defecto
                </label>
                <select
                  value={defaultModel}
                  onChange={(e) => setDefaultModel(e.target.value)}
                  className={cn(
                    "w-full px-4 py-2.5 rounded-lg border appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500/50",
                    theme === 'dark' ? "bg-[#2d2d2d] border-white/10" : "bg-gray-50 border-black/10"
                  )}
                >
                  <option value="rapido">Rápido</option>
                  <option value="pensar">Pensar</option>
                  <option value="pro">Pro</option>
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
              onClick={handleSave}
              disabled={loading}
              className="flex-1 py-2.5 rounded-lg font-bold bg-[#0066cc] text-white shadow-lg shadow-blue-500/20 hover:bg-[#0055aa] active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <Check className="w-4 h-4" /> Guardar Cambios
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
