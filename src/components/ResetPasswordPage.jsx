import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Lock, ArrowLeft, Check, AlertCircle } from 'lucide-react';
import { resetPassword } from '@/services/authService';
import archieAvatar from '../assets/Archie avatar.png';
import Antigravity from './Antigravity';

export function ResetPasswordPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const token = searchParams.get('token');
  const status = searchParams.get('insforge_status');
  const insforgeError = searchParams.get('insforge_error');

  useEffect(() => {
    if (status === 'error' && insforgeError) {
      setError(insforgeError);
    }
  }, [status, insforgeError]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (newPassword.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Las contraseñas no coinciden.');
      return;
    }
    if (!token) {
      setError('Token inválido. Solicita un nuevo enlace de recuperación.');
      return;
    }

    setLoading(true);
    try {
      await resetPassword(newPassword, token);
      setSuccess(true);
      setTimeout(() => navigate('/login'), 3000);
    } catch (err) {
      setError(err.message || 'Error al restablecer la contraseña.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-[#0d0d0d] flex items-center justify-center p-4 font-sans text-gray-100 overflow-hidden">
      <div className="absolute inset-0 z-0 pointer-events-none">
        <Antigravity
          count={400} magnetRadius={10} ringRadius={10} waveSpeed={0.4}
          waveAmplitude={2.5} particleSize={2} lerpSpeed={0.1} color="#123dd4"
          autoAnimate particleVariance={0.9} rotationSpeed={0} depthFactor={1}
          pulseSpeed={3} particleShape="sphere" fieldStrength={10}
        />
      </div>

      <div className="relative z-10 bg-[#1c1c1e]/90 backdrop-blur-xl w-full max-w-md rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.5)] border border-white/10 overflow-hidden">
        {/* MacOS Window Controls */}
        <div className="flex items-center gap-2 px-4 py-3 bg-[#2d2d2d]/80 border-b border-white/10">
          <div className="w-3 h-3 rounded-full bg-[#ff5f56] shadow-sm border border-black/20"></div>
          <div className="w-3 h-3 rounded-full bg-[#ffbd2e] shadow-sm border border-black/20"></div>
          <div className="w-3 h-3 rounded-full bg-[#27c93f] shadow-sm border border-black/20"></div>
        </div>

        <div className="px-8 pb-8 pt-6">
          <div className="flex flex-col items-center mb-6">
            <img src={archieAvatar} alt="Archie" className="w-24 h-24 rounded-full mb-4 shadow-lg border-2 border-white/10 object-cover" />
            <h1 className="text-2xl font-bold tracking-tight text-white">
              {success ? '¡Contraseña actualizada!' : 'Nueva contraseña'}
            </h1>
            <p className="text-sm text-gray-400 mt-2 text-center">
              {success
                ? 'Tu contraseña ha sido actualizada. Redirigiendo al login...'
                : 'Ingresa tu nueva contraseña para restablecer el acceso'}
            </p>
          </div>

          {success ? (
            <div className="flex flex-col items-center gap-4 py-6">
              <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center">
                <Check className="w-8 h-8 text-green-400" />
              </div>
            </div>
          ) : (
            <form className="space-y-4" onSubmit={handleSubmit}>
              {error && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  {error}
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-300">Nueva contraseña</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500">
                    <Lock className="h-5 w-5" />
                  </div>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-[#2d2d2d] border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all placeholder-gray-500"
                    placeholder="••••••••"
                    minLength={6}
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-300">Confirmar contraseña</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500">
                    <Lock className="h-5 w-5" />
                  </div>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-[#2d2d2d] border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all placeholder-gray-500"
                    placeholder="••••••••"
                    minLength={6}
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#0066cc] hover:bg-[#0055aa] text-white font-medium py-2.5 rounded-lg transition-all shadow-sm active:scale-[0.98] flex items-center justify-center gap-2 mt-2 disabled:opacity-50"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  'RESTABLECER CONTRASEÑA'
                )}
              </button>
            </form>
          )}

          <div className="mt-6 text-center">
            <a
              href="/login"
              className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Volver al login
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
