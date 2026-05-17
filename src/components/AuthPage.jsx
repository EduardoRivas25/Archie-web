import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Mail, Lock, User, ArrowLeft, AlertCircle, KeyRound } from 'lucide-react';
import { FcGoogle } from 'react-icons/fc';
import { FaGithub } from 'react-icons/fa';
import archieAvatar from '../assets/Archie avatar.png';
import Antigravity from './Antigravity';
import { useAuth } from '@/context/AuthContext';
import { sendPasswordReset, verifyEmail, resendVerificationEmail, exchangeResetToken, resetPassword, createUserProfile, getUserProfile } from '@/services/authService';
import { determineRoleForNewUser } from '@/services/roleService';
import { FaceCaptureStep } from '@/components/FaceCaptureStep';
import { enrollFace, getFaceEnrollmentStatus, verifyFace } from '@/services/biometricService';

export function AuthPage() {
  const [mode, setMode] = useState('login'); // 'login' | 'register' | 'forgot' | 'verify' | 'reset-code'
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const {
    signIn,
    signUp,
    signInWithGoogle,
    signInWithGitHub,
    isAuthenticated,
    biometricVerified,
    completeBiometricVerification,
  } = useAuth();

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
  const clearFeedback = () => { setError(''); setSuccess(''); };

  const goToBiometricStep = async (enrollMessage, verifyMessage) => {
    try {
      const status = await getFaceEnrollmentStatus();
      if (status.enrolled && !status.needsReenrollment) {
        setMode('face-verify');
        setSuccess(verifyMessage);
      } else {
        setMode('face-enroll');
        setSuccess(status.needsReenrollment ? 'Actualizamos el modelo facial. Registra tu rostro de nuevo para continuar.' : enrollMessage);
      }
    } catch {
      setMode('face-enroll');
      setSuccess(enrollMessage);
    }
  };

  useEffect(() => {
    if (isAuthenticated && !biometricVerified && searchParams.get('biometric') === 'required') {
      queueMicrotask(() => {
        clearFeedback();
        void goToBiometricStep(
          'Esta cuenta aun no tiene rostro registrado. Registralo para continuar.',
          'Verifica tu rostro para continuar.'
        );
      });
    }
  }, [isAuthenticated, biometricVerified, searchParams]);

  // ─── Login ──────────────────────────────────────────────
  const handleLogin = async (e) => {
    e.preventDefault();
    clearFeedback();
    if (!email || !password) { setError('Ingresa tus credenciales.'); return; }

    setLoading(true);
    try {
      await signIn(email, password);
      await goToBiometricStep(
        'Credenciales correctas. Registra tu rostro para proteger el acceso.',
        'Credenciales correctas. Verifica tu rostro para continuar.'
      );
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
        setMode('face-enroll');
        setSuccess('Cuenta creada. Registra tu rostro para proteger el acceso.');
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
        setSuccess('Email verificado. Registra tu rostro para continuar.');
        setMode('face-enroll');
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
  const handleFaceEnroll = async (imageDataUrl) => {
    const result = await enrollFace(imageDataUrl);
    await completeBiometricVerification();
    return result;
  };

  const handleFaceVerify = async (imageDataUrl) => {
    const result = await verifyFace(imageDataUrl);
    if (result.failureReason === 'NO_ENROLLMENT' || result.failureReason === 'REENROLL_REQUIRED') {
      setMode('face-enroll');
      setSuccess(result.failureReason === 'REENROLL_REQUIRED'
        ? 'Actualizamos el modelo facial. Registra tu rostro de nuevo para continuar.'
        : 'Esta cuenta aun no tiene rostro registrado. Registralo para continuar.');
      return { ...result, failureReason: 'Registra tu rostro para continuar.' };
    }
    if (result.passed) {
      await completeBiometricVerification();
    }
    return result;
  };

  const handleFaceSuccess = () => {
    setTimeout(() => navigate('/chat'), 700);
  };

  const getTitle = () => {
    switch (mode) {
      case 'login': return 'Bienvenido';
      case 'register': return 'Crea tu cuenta';
      case 'forgot': return 'Recuperar contraseña';
      case 'verify': return 'Verifica tu email';
      case 'reset-code': return 'Nueva contraseña';
      case 'face-enroll': return 'Registro facial';
      case 'face-verify': return 'Verificacion facial';
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
      case 'face-enroll': return 'Captura tu rostro para asociarlo a tu cuenta';
      case 'face-verify': return 'Confirma que eres la misma persona registrada';
      default: return '';
    }
  };

  return (
    <div className="relative min-h-[100dvh] bg-[#0d0d0d] flex items-start justify-center overflow-x-hidden overflow-y-auto px-3 py-3 font-sans text-gray-100 sm:items-center sm:p-4">
      {/* Background Animation */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <Antigravity
          count={400} magnetRadius={10} ringRadius={10} waveSpeed={0.4}
          waveAmplitude={2.5} particleSize={2} lerpSpeed={0.1} color="#123dd4"
          autoAnimate particleVariance={0.9} rotationSpeed={0} depthFactor={1}
          pulseSpeed={3} particleShape="sphere" fieldStrength={10}
        />
      </div>

      <div className={`relative z-10 my-auto bg-[#1c1c1e]/90 backdrop-blur-xl w-full ${mode === 'face-enroll' || mode === 'face-verify' ? 'max-w-[22rem] sm:max-w-md' : 'max-w-md'} rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.5)] border border-white/10 overflow-hidden`}>
        {/* MacOS Window Controls */}
        <div className="flex items-center gap-2 px-4 py-3 bg-[#2d2d2d]/80 border-b border-white/10">
          <div className="w-3 h-3 rounded-full bg-[#ff5f56] shadow-sm border border-black/20"></div>
          <div className="w-3 h-3 rounded-full bg-[#ffbd2e] shadow-sm border border-black/20"></div>
          <div className="w-3 h-3 rounded-full bg-[#27c93f] shadow-sm border border-black/20"></div>
        </div>

        <div className={`${mode === 'face-enroll' || mode === 'face-verify' ? 'px-4 sm:px-8' : 'px-5 sm:px-8'} pb-5 pt-4 sm:pb-8 sm:pt-6`}>
          <div className="flex flex-col items-center mb-4 sm:mb-6">
            <img src={archieAvatar} alt="Archie" className={`${mode === 'face-enroll' || mode === 'face-verify' ? 'w-16 h-16 sm:w-28 sm:h-28' : 'w-24 h-24 sm:w-32 sm:h-32'} rounded-full mb-3 sm:mb-4 shadow-lg border-2 border-white/10 object-cover`} />
            <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">{getTitle()}</h1>
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
          {mode === 'face-enroll' && (
            <FaceCaptureStep
              title="Registra tu rostro"
              description="Esta captura se guardara en InsForge para futuros inicios de sesion."
              submitLabel="REGISTRAR ROSTRO"
              loadingLabel="Registrando..."
              onSubmit={handleFaceEnroll}
              onSuccess={handleFaceSuccess}
              multiCapture
            />
          )}

          {mode === 'face-verify' && (
            <FaceCaptureStep
              title="Verifica tu rostro"
              description="Despues de tus credenciales, necesitamos confirmar tu identidad."
              submitLabel="VERIFICAR ROSTRO"
              loadingLabel="Verificando..."
              onSubmit={handleFaceVerify}
              onSuccess={handleFaceSuccess}
              multiCapture={false}
            />
          )}

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
            {(mode === 'forgot' || mode === 'verify' || mode === 'reset-code' || mode === 'face-verify') && (
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
