import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, User, ArrowLeft, AlertCircle, KeyRound } from 'lucide-react';
import { FcGoogle } from 'react-icons/fc';
import { FaGithub } from 'react-icons/fa';
import archieAvatar from '../assets/Archie avatar.png';
import Antigravity from './Antigravity';
import { useAuth } from '@/context/AuthContext';
import { sendPasswordReset, verifyEmail, resendVerificationEmail, exchangeResetToken, resetPassword, createUserProfile, getUserProfile } from '@/services/authService';
import { determineRoleForNewUser } from '@/services/roleService';

export function AuthPage() {
  const [mode, setMode] = useState('login'); // 'login' | 'register' | 'forgot' | 'verify' | 'reset-code'
  const navigate = useNavigate();
  const { signIn, signUp, signInWithGoogle, signInWithGitHub } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Verification
  const [verifyOtp, setVerifyOtp] = useState('');
  const [pendingEmail, setPendingEmail] = useState('');

  // Password reset
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [resetToken, setResetToken] = useState('');

  const clearFeedback = () => { setError(''); setSuccess(''); };

  // ─── Login ──────────────────────────────────────────────
  const handleLogin = async (e) => {
    e.preventDefault();
    clearFeedback();
    if (!email || !password) { setError('Ingresa tus credenciales.'); return; }

    setLoading(true);
    try {
      await signIn(email, password);
      navigate('/chat');
    } catch (err) {
      setError(err.message || 'Credenciales inválidas.');
    } finally {
      setLoading(false);
    }
  };

  // ─── Register ───────────────────────────────────────────
  const handleRegister = async (e) => {
    e.preventDefault();
    clearFeedback();
    if (!email || !password || !name) { setError('Completa todos los campos.'); return; }
    if (password.length < 6) { setError('La contraseña debe tener al menos 6 caracteres.'); return; }

    setLoading(true);
    try {
      const result = await signUp(email, password, name);
      if (result?.requireEmailVerification) {
        setPendingEmail(email);
        setMode('verify');
        setSuccess('Te enviamos un código de verificación a tu correo.');
      } else {
        navigate('/chat');
      }
    } catch (err) {
      setError(err.message || 'Error al registrarse.');
    } finally {
      setLoading(false);
    }
  };

  // ─── Verify Email ───────────────────────────────────────
  const handleVerifyEmail = async (e) => {
    e.preventDefault();
    clearFeedback();
    if (!verifyOtp || verifyOtp.length !== 6) { setError('Ingresa el código de 6 dígitos.'); return; }

    setLoading(true);
    try {
      const data = await verifyEmail(pendingEmail, verifyOtp);
      if (data?.accessToken) {
        // After verification, create profile if needed
        const userId = data.user?.id;
        if (userId) {
          const existing = await getUserProfile(userId);
          if (!existing) {
            const role = await determineRoleForNewUser(pendingEmail);
            await createUserProfile(userId, name || pendingEmail.split('@')[0], pendingEmail, role);
          }
        }
        setSuccess('¡Email verificado! Redirigiendo...');
        setTimeout(() => {
          window.location.href = '/chat';
        }, 1500);
      }
    } catch (err) {
      setError(err.message || 'Código inválido.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    clearFeedback();
    setLoading(true);
    try {
      await resendVerificationEmail(pendingEmail);
      setSuccess('Código reenviado a tu correo.');
    } catch (err) {
      setError(err.message || 'Error al reenviar código.');
    } finally {
      setLoading(false);
    }
  };

  // ─── Forgot Password ───────────────────────────────────
  const handleForgotPassword = async (e) => {
    e.preventDefault();
    clearFeedback();
    if (!email) { setError('Ingresa tu correo.'); return; }

    setLoading(true);
    try {
      await sendPasswordReset(email);
      setPendingEmail(email);
      setMode('reset-code');
      setSuccess('Te enviamos un código de recuperación a tu correo.');
    } catch (err) {
      setError(err.message || 'Error al enviar correo de recuperación.');
    } finally {
      setLoading(false);
    }
  };

  // ─── Reset Code + New Password ──────────────────────────
  const handleResetCode = async (e) => {
    e.preventDefault();
    clearFeedback();
    if (!resetCode || resetCode.length !== 6) { setError('Ingresa el código de 6 dígitos.'); return; }
    if (!newPassword || newPassword.length < 6) { setError('La contraseña debe tener al menos 6 caracteres.'); return; }

    setLoading(true);
    try {
      const tokenData = await exchangeResetToken(pendingEmail, resetCode);
      if (tokenData?.token) {
        await resetPassword(newPassword, tokenData.token);
        setSuccess('¡Contraseña actualizada! Redirigiendo al login...');
        setTimeout(() => {
          setMode('login');
          clearFeedback();
        }, 2000);
      }
    } catch (err) {
      setError(err.message || 'Código inválido o expirado.');
    } finally {
      setLoading(false);
    }
  };

  // ─── OAuth ──────────────────────────────────────────────
  const handleGoogleLogin = async () => {
    clearFeedback();
    setLoading(true);
    try {
      await signInWithGoogle();
    } catch (err) {
      setError(err.message || 'Error con Google.');
      setLoading(false);
    }
  };

  const handleGitHubLogin = async () => {
    clearFeedback();
    setLoading(true);
    try {
      await signInWithGitHub();
    } catch (err) {
      setError(err.message || 'Error con GitHub.');
      setLoading(false);
    }
  };

  // ─── Render Title / Description ─────────────────────────
  const getTitle = () => {
    switch (mode) {
      case 'login': return 'Bienvenido';
      case 'register': return 'Crea tu cuenta';
      case 'forgot': return 'Recuperar contraseña';
      case 'verify': return 'Verifica tu email';
      case 'reset-code': return 'Nueva contraseña';
      default: return 'Bienvenido';
    }
  };

  const getDescription = () => {
    switch (mode) {
      case 'login': return 'Ingresa tus credenciales para acceder al sistema';
      case 'register': return 'Completa tus datos para registrarte en la plataforma';
      case 'forgot': return 'Te enviaremos un código de recuperación a tu correo';
      case 'verify': return `Ingresa el código de 6 dígitos enviado a ${pendingEmail}`;
      case 'reset-code': return `Ingresa el código enviado a ${pendingEmail} y tu nueva contraseña`;
      default: return '';
    }
  };

  return (
    <div className="relative min-h-screen bg-[#0d0d0d] flex items-center justify-center p-4 font-sans text-gray-100 overflow-hidden">
      {/* Background Animation */}
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
            <img src={archieAvatar} alt="Archie" className="w-32 h-32 rounded-full mb-4 shadow-lg border-2 border-white/10 object-cover" />
            <h1 className="text-3xl font-bold tracking-tight text-white">{getTitle()}</h1>
            <p className="text-sm text-gray-400 mt-2 text-center">{getDescription()}</p>
          </div>

          {/* Feedback */}
          {error && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm mb-4">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}
          {success && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-green-500/10 border border-green-500/20 text-green-400 text-sm mb-4">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {success}
            </div>
          )}

          {/* ─── LOGIN FORM ─── */}
          {mode === 'login' && (
            <form className="space-y-4" onSubmit={handleLogin}>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-300">Correo electrónico</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500"><Mail className="h-5 w-5" /></div>
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-[#2d2d2d] border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all placeholder-gray-500"
                    placeholder="tu@correo.com" required />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-300">Contraseña</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500"><Lock className="h-5 w-5" /></div>
                  <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-[#2d2d2d] border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all placeholder-gray-500"
                    placeholder="••••••••" required />
                </div>
              </div>

              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center gap-2 cursor-pointer group">
                  <input type="checkbox" className="w-4 h-4 rounded border-gray-600 bg-[#2d2d2d] text-blue-500 focus:ring-blue-500 focus:ring-offset-[#1c1c1e]" />
                  <span className="text-sm text-gray-400 group-hover:text-white transition-colors">Recordarme</span>
                </label>
                <button type="button" onClick={() => { setMode('forgot'); clearFeedback(); }}
                  className="text-sm text-blue-500 font-medium hover:text-blue-400 transition-colors">
                  ¿Olvidaste tu contraseña?
                </button>
              </div>

              <button type="submit" disabled={loading}
                className="w-full bg-[#0066cc] hover:bg-[#0055aa] text-white font-medium py-2.5 rounded-lg transition-all shadow-sm active:scale-[0.98] flex items-center justify-center gap-2 mt-2 disabled:opacity-50">
                {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'INGRESAR'}
              </button>
            </form>
          )}

          {/* ─── REGISTER FORM ─── */}
          {mode === 'register' && (
            <form className="space-y-4" onSubmit={handleRegister}>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-300">Nombre completo</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500"><User className="h-5 w-5" /></div>
                  <input type="text" value={name} onChange={(e) => setName(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-[#2d2d2d] border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all placeholder-gray-500"
                    placeholder="Juan Pérez" required />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-300">Correo electrónico</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500"><Mail className="h-5 w-5" /></div>
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-[#2d2d2d] border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all placeholder-gray-500"
                    placeholder="tu@correo.com" required />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-300">Contraseña</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500"><Lock className="h-5 w-5" /></div>
                  <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-[#2d2d2d] border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all placeholder-gray-500"
                    placeholder="••••••••" minLength={6} required />
                </div>
              </div>

              <button type="submit" disabled={loading}
                className="w-full bg-[#0066cc] hover:bg-[#0055aa] text-white font-medium py-2.5 rounded-lg transition-all shadow-sm active:scale-[0.98] flex items-center justify-center gap-2 mt-2 disabled:opacity-50">
                {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'REGISTRARSE'}
              </button>
            </form>
          )}

          {/* ─── FORGOT PASSWORD ─── */}
          {mode === 'forgot' && (
            <form className="space-y-4" onSubmit={handleForgotPassword}>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-300">Correo electrónico</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500"><Mail className="h-5 w-5" /></div>
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-[#2d2d2d] border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all placeholder-gray-500"
                    placeholder="tu@correo.com" required />
                </div>
              </div>

              <button type="submit" disabled={loading}
                className="w-full bg-[#0066cc] hover:bg-[#0055aa] text-white font-medium py-2.5 rounded-lg transition-all shadow-sm active:scale-[0.98] flex items-center justify-center gap-2 mt-2 disabled:opacity-50">
                {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'ENVIAR CÓDIGO'}
              </button>
            </form>
          )}

          {/* ─── VERIFY EMAIL ─── */}
          {mode === 'verify' && (
            <form className="space-y-4" onSubmit={handleVerifyEmail}>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-300">Código de verificación</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500"><KeyRound className="h-5 w-5" /></div>
                  <input type="text" value={verifyOtp} onChange={(e) => setVerifyOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    className="w-full pl-10 pr-4 py-2.5 bg-[#2d2d2d] border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all placeholder-gray-500 text-center text-lg tracking-[0.5em] font-mono"
                    placeholder="000000" maxLength={6} required />
                </div>
              </div>

              <button type="submit" disabled={loading}
                className="w-full bg-[#0066cc] hover:bg-[#0055aa] text-white font-medium py-2.5 rounded-lg transition-all shadow-sm active:scale-[0.98] flex items-center justify-center gap-2 mt-2 disabled:opacity-50">
                {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'VERIFICAR'}
              </button>

              <button type="button" onClick={handleResendCode} disabled={loading}
                className="w-full text-sm text-blue-500 hover:text-blue-400 transition-colors py-2">
                Reenviar código
              </button>
            </form>
          )}

          {/* ─── RESET CODE + NEW PASSWORD ─── */}
          {mode === 'reset-code' && (
            <form className="space-y-4" onSubmit={handleResetCode}>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-300">Código de recuperación</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500"><KeyRound className="h-5 w-5" /></div>
                  <input type="text" value={resetCode} onChange={(e) => setResetCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    className="w-full pl-10 pr-4 py-2.5 bg-[#2d2d2d] border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all placeholder-gray-500 text-center text-lg tracking-[0.5em] font-mono"
                    placeholder="000000" maxLength={6} required />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-300">Nueva contraseña</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500"><Lock className="h-5 w-5" /></div>
                  <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-[#2d2d2d] border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all placeholder-gray-500"
                    placeholder="••••••••" minLength={6} required />
                </div>
              </div>

              <button type="submit" disabled={loading}
                className="w-full bg-[#0066cc] hover:bg-[#0055aa] text-white font-medium py-2.5 rounded-lg transition-all shadow-sm active:scale-[0.98] flex items-center justify-center gap-2 mt-2 disabled:opacity-50">
                {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'RESTABLECER CONTRASEÑA'}
              </button>
            </form>
          )}

          {/* ─── OAuth (login + register) ─── */}
          {(mode === 'login' || mode === 'register') && (
            <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/10"></div></div>
                <div className="relative flex justify-center text-sm"><span className="px-2 bg-[#1c1c1e] text-gray-400">O continúa con</span></div>
              </div>

              <div className="mt-6 grid grid-cols-2 gap-3">
                <button onClick={handleGoogleLogin} disabled={loading}
                  className="flex items-center justify-center gap-2 px-4 py-2 bg-[#2d2d2d] border border-white/10 rounded-lg shadow-sm hover:bg-[#3d3d3d] hover:border-white/20 transition-all text-sm font-medium text-gray-200 disabled:opacity-50">
                  <FcGoogle className="h-5 w-5" /> Google
                </button>
                <button onClick={handleGitHubLogin} disabled={loading}
                  className="flex items-center justify-center gap-2 px-4 py-2 bg-[#2d2d2d] border border-white/10 rounded-lg shadow-sm hover:bg-[#3d3d3d] hover:border-white/20 transition-all text-sm font-medium text-gray-200 disabled:opacity-50">
                  <FaGithub className="h-5 w-5" /> GitHub
                </button>
              </div>
            </div>
          )}

          {/* ─── Mode Switch ─── */}
          <div className="mt-8 text-center">
            {(mode === 'login' || mode === 'register') && (
              <p className="text-sm text-gray-400">
                {mode === 'login' ? '¿No tienes una cuenta?' : '¿Ya tienes una cuenta?'}{' '}
                <button onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); clearFeedback(); }}
                  className="text-blue-500 font-medium hover:text-blue-400 transition-colors">
                  {mode === 'login' ? 'Regístrate' : 'Inicia sesión'}
                </button>
              </p>
            )}
            {(mode === 'forgot' || mode === 'verify' || mode === 'reset-code') && (
              <button onClick={() => { setMode('login'); clearFeedback(); }}
                className="text-sm text-blue-500 font-medium hover:text-blue-400 transition-colors">
                Volver al inicio de sesión
              </button>
            )}
          </div>

          <div className="mt-6 text-center">
            <a href="/" className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors">
              <ArrowLeft className="w-4 h-4" /> Volver al inicio
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
