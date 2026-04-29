import React, { useState, useEffect } from 'react';
import { X, User, Lock, Globe, Bell, Shield, Check, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';
import { updateUserProfile } from '@/services/authService';
import { getRoleLabel } from '@/services/roleService';

export function ProfileSettingsModal({ isOpen, onClose, theme }) {
  const { user, profile, refreshProfile, updateName, updatePassword } = useAuth();

  // ─── Profile state ───
  const [name, setName] = useState('');
  const [defaultModel, setDefaultModel] = useState('pro');
  const [language, setLanguage] = useState('es');
  const [notifications, setNotifications] = useState(true);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState('');
  const [profileError, setProfileError] = useState('');

  // ─── Password state ───
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPwd, setShowCurrentPwd] = useState(false);
  const [showNewPwd, setShowNewPwd] = useState(false);
  const [showConfirmPwd, setShowConfirmPwd] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [passwordError, setPasswordError] = useState('');

  // ─── Active tab ───
  const [activeTab, setActiveTab] = useState('profile');

  // Load profile data when modal opens
  useEffect(() => {
    if (isOpen && profile) {
      setName(profile.full_name || '');
      setDefaultModel(profile.default_model || 'pro');
      setLanguage(profile.language || 'es');
      setNotifications(profile.notifications_enabled ?? true);
      // Reset password fields
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setPasswordSuccess('');
      setPasswordError('');
      setProfileSuccess('');
      setProfileError('');
      setActiveTab('profile');
    }
  }, [isOpen, profile]);

  if (!isOpen) return null;

  // ─── Save profile (name + preferences) ───
  const handleSaveProfile = async () => {
    if (!user || !profile) return;
    setProfileLoading(true);
    setProfileError('');
    setProfileSuccess('');

    try {
      // Update name in both auth + DB if it changed
      if (name !== profile.full_name) {
        await updateName(name);
      }

      // Update other preferences in DB
      await updateUserProfile(user.id, {
        default_model: defaultModel,
        language: language,
        notifications_enabled: notifications,
      });
      await refreshProfile();
      setProfileSuccess('Cambios guardados correctamente.');
      setTimeout(() => {
        setProfileSuccess('');
      }, 3000);
    } catch (err) {
      setProfileError(err.message || 'Error al guardar cambios.');
    } finally {
      setProfileLoading(false);
    }
  };

  // ─── Change password ───
  const handleChangePassword = async () => {
    setPasswordError('');
    setPasswordSuccess('');

    if (!currentPassword) {
      setPasswordError('Ingresa tu contraseña actual.');
      return;
    }
    if (newPassword.length < 6) {
      setPasswordError('La nueva contraseña debe tener al menos 6 caracteres.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('Las contraseñas no coinciden.');
      return;
    }
    if (currentPassword === newPassword) {
      setPasswordError('La nueva contraseña debe ser diferente a la actual.');
      return;
    }

    setPasswordLoading(true);
    try {
      await updatePassword(currentPassword, newPassword);
      setPasswordSuccess('Contraseña actualizada correctamente.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => {
        setPasswordSuccess('');
      }, 3000);
    } catch (err) {
      setPasswordError(err.message || 'Error al cambiar la contraseña.');
    } finally {
      setPasswordLoading(false);
    }
  };

  const inputClass = cn(
    "w-full px-4 py-2.5 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all text-sm",
    theme === 'dark' ? "bg-[#2d2d2d] border-white/10 text-white placeholder-gray-500" : "bg-gray-50 border-black/10 text-gray-900 placeholder-gray-400"
  );

  const tabClass = (tab) => cn(
    "flex-1 py-2 text-sm font-medium rounded-lg transition-all text-center cursor-pointer",
    activeTab === tab
      ? (theme === 'dark' ? "bg-white/10 text-white" : "bg-black/10 text-gray-900")
      : (theme === 'dark' ? "text-gray-500 hover:text-gray-300" : "text-gray-400 hover:text-gray-600")
  );

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

        {/* Tab Switcher */}
        <div className={cn(
          "flex gap-1 mx-6 mt-4 p-1 rounded-xl",
          theme === 'dark' ? "bg-white/5" : "bg-black/5"
        )}>
          <button className={tabClass('profile')} onClick={() => setActiveTab('profile')}>
            <span className="flex items-center justify-center gap-1.5">
              <User className="w-3.5 h-3.5" /> Perfil
            </span>
          </button>
          <button className={tabClass('password')} onClick={() => setActiveTab('password')}>
            <span className="flex items-center justify-center gap-1.5">
              <Lock className="w-3.5 h-3.5" /> Contraseña
            </span>
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* ═══════════════════ PROFILE TAB ═══════════════════ */}
          {activeTab === 'profile' && (
            <>
              {/* Feedback */}
              {profileError && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                  <AlertCircle className="w-4 h-4 shrink-0" />{profileError}
                </div>
              )}
              {profileSuccess && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-green-500/10 border border-green-500/20 text-green-400 text-sm">
                  <Check className="w-4 h-4 shrink-0" />{profileSuccess}
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
                    className={inputClass}
                    placeholder="Tu nombre completo"
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
                    className={cn(inputClass, "opacity-60 cursor-not-allowed")}
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
                      className={cn(inputClass, "appearance-none")}
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
                      className={cn(inputClass, "appearance-none")}
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

              {/* Save Profile Button */}
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
                  onClick={handleSaveProfile}
                  disabled={profileLoading}
                  className="flex-1 py-2.5 rounded-lg font-bold bg-[#0066cc] text-white shadow-lg shadow-blue-500/20 hover:bg-[#0055aa] active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {profileLoading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <Check className="w-4 h-4" /> Guardar Cambios
                    </>
                  )}
                </button>
              </div>
            </>
          )}

          {/* ═══════════════════ PASSWORD TAB ═══════════════════ */}
          {activeTab === 'password' && (
            <>
              {/* Feedback */}
              {passwordError && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                  <AlertCircle className="w-4 h-4 shrink-0" />{passwordError}
                </div>
              )}
              {passwordSuccess && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-green-500/10 border border-green-500/20 text-green-400 text-sm">
                  <Check className="w-4 h-4 shrink-0" />{passwordSuccess}
                </div>
              )}

              <div className="space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-widest opacity-50">Cambiar Contraseña</h3>
                <p className={cn("text-sm", theme === 'dark' ? "text-gray-400" : "text-gray-500")}>
                  Ingresa tu contraseña actual para verificar tu identidad y establece una nueva.
                </p>

                {/* Current Password */}
                <div className="space-y-1.5">
                  <label className="text-sm font-medium opacity-70 flex items-center gap-2">
                    <Lock className="w-4 h-4" /> Contraseña actual
                  </label>
                  <div className="relative">
                    <input
                      type={showCurrentPwd ? 'text' : 'password'}
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      className={cn(inputClass, "pr-10")}
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPwd(!showCurrentPwd)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
                    >
                      {showCurrentPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* New Password */}
                <div className="space-y-1.5">
                  <label className="text-sm font-medium opacity-70 flex items-center gap-2">
                    <Lock className="w-4 h-4" /> Nueva contraseña
                  </label>
                  <div className="relative">
                    <input
                      type={showNewPwd ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className={cn(inputClass, "pr-10")}
                      placeholder="Mínimo 6 caracteres"
                      minLength={6}
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPwd(!showNewPwd)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
                    >
                      {showNewPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {/* Password strength hint */}
                  {newPassword && (
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex-1 h-1 rounded-full bg-gray-700 overflow-hidden">
                        <div className={cn(
                          "h-full rounded-full transition-all duration-300",
                          newPassword.length < 6 ? "w-1/4 bg-red-500" :
                          newPassword.length < 10 ? "w-2/4 bg-yellow-500" :
                          newPassword.length < 14 ? "w-3/4 bg-blue-500" :
                          "w-full bg-green-500"
                        )} />
                      </div>
                      <span className={cn(
                        "text-[10px] font-medium",
                        newPassword.length < 6 ? "text-red-400" :
                        newPassword.length < 10 ? "text-yellow-400" :
                        newPassword.length < 14 ? "text-blue-400" :
                        "text-green-400"
                      )}>
                        {newPassword.length < 6 ? 'Débil' :
                         newPassword.length < 10 ? 'Regular' :
                         newPassword.length < 14 ? 'Buena' :
                         'Fuerte'}
                      </span>
                    </div>
                  )}
                </div>

                {/* Confirm Password */}
                <div className="space-y-1.5">
                  <label className="text-sm font-medium opacity-70 flex items-center gap-2">
                    <Lock className="w-4 h-4" /> Confirmar nueva contraseña
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPwd ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className={cn(
                        inputClass,
                        "pr-10",
                        confirmPassword && newPassword !== confirmPassword ? "ring-2 ring-red-500/50 border-red-500/50" : "",
                        confirmPassword && newPassword === confirmPassword ? "ring-2 ring-green-500/50 border-green-500/50" : ""
                      )}
                      placeholder="Repite la nueva contraseña"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPwd(!showConfirmPwd)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
                    >
                      {showConfirmPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {confirmPassword && newPassword !== confirmPassword && (
                    <p className="text-xs text-red-400 mt-1">Las contraseñas no coinciden</p>
                  )}
                </div>
              </div>

              {/* Change Password Button */}
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
                  onClick={handleChangePassword}
                  disabled={passwordLoading || !currentPassword || !newPassword || !confirmPassword}
                  className="flex-1 py-2.5 rounded-lg font-bold bg-[#0066cc] text-white shadow-lg shadow-blue-500/20 hover:bg-[#0055aa] active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {passwordLoading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <Lock className="w-4 h-4" /> Cambiar Contraseña
                    </>
                  )}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
