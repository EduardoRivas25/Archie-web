import React, { useState } from 'react';
import { Mail, Lock, User, ArrowLeft } from 'lucide-react';
import { FcGoogle } from 'react-icons/fc';
import { FaGithub } from 'react-icons/fa';
import archieAvatar from '../assets/Archie avatar.png';
import Antigravity from './Antigravity';

export function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);

  return (
    <div className="relative min-h-screen bg-[#0d0d0d] flex items-center justify-center p-4 font-sans text-gray-100 overflow-hidden">
      {/* Background Animation */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <Antigravity
          count={400}
          magnetRadius={10}
          ringRadius={10}
          waveSpeed={0.4}
          waveAmplitude={2.5}
          particleSize={2}
          lerpSpeed={0.1}
          color="#123dd4"
          autoAnimate
          particleVariance={0.9}
          rotationSpeed={0}
          depthFactor={1}
          pulseSpeed={3}
          particleShape="sphere"
          fieldStrength={10}
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
            <img 
              src={archieAvatar} 
              alt="Archie" 
              className="w-32 h-32 rounded-full mb-4 shadow-lg border-2 border-white/10 object-cover" 
            />
            <h1 className="text-3xl font-bold tracking-tight text-white">
              {isLogin ? 'Bienvenido' : 'Crea tu cuenta'}
            </h1>
            <p className="text-sm text-gray-400 mt-2 text-center">
              {isLogin 
                ? 'Ingresa tus credenciales para acceder al sistema' 
                : 'Completa tus datos para registrarte en la plataforma'}
            </p>
          </div>

          <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
            {!isLogin && (
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-300">Nombre completo</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500">
                    <User className="h-5 w-5" />
                  </div>
                  <input 
                    type="text" 
                    className="w-full pl-10 pr-4 py-2.5 bg-[#2d2d2d] border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all placeholder-gray-500"
                    placeholder="Juan Pérez"
                  />
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-300">Correo electrónico</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500">
                  <Mail className="h-5 w-5" />
                </div>
                <input 
                  type="email" 
                  className="w-full pl-10 pr-4 py-2.5 bg-[#2d2d2d] border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all placeholder-gray-500"
                  placeholder="tu@correo.com"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-300">Contraseña</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500">
                  <Lock className="h-5 w-5" />
                </div>
                <input 
                  type="password" 
                  className="w-full pl-10 pr-4 py-2.5 bg-[#2d2d2d] border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all placeholder-gray-500"
                  placeholder="••••••••"
                />
              </div>
            </div>

            {isLogin && (
              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center gap-2 cursor-pointer group">
                  <input type="checkbox" className="w-4 h-4 rounded border-gray-600 bg-[#2d2d2d] text-blue-500 focus:ring-blue-500 focus:ring-offset-[#1c1c1e]" />
                  <span className="text-sm text-gray-400 group-hover:text-white transition-colors">Recordarme</span>
                </label>
                <a href="#" className="text-sm text-blue-500 font-medium hover:text-blue-400 transition-colors">
                  ¿Olvidaste tu contraseña?
                </a>
              </div>
            )}

            <button className="w-full bg-[#0066cc] hover:bg-[#0055aa] text-white font-medium py-2.5 rounded-lg transition-all shadow-sm active:scale-[0.98] flex items-center justify-center gap-2 mt-2">
              {isLogin ? 'INGRESAR' : 'REGISTRARSE'}
            </button>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/10"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-[#1c1c1e] text-gray-400">O continúa con</span>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-3">
              <button className="flex items-center justify-center gap-2 px-4 py-2 bg-[#2d2d2d] border border-white/10 rounded-lg shadow-sm hover:bg-[#3d3d3d] hover:border-white/20 transition-all text-sm font-medium text-gray-200">
                <FcGoogle className="h-5 w-5" />
                Google
              </button>
              <button className="flex items-center justify-center gap-2 px-4 py-2 bg-[#2d2d2d] border border-white/10 rounded-lg shadow-sm hover:bg-[#3d3d3d] hover:border-white/20 transition-all text-sm font-medium text-gray-200">
                <FaGithub className="h-5 w-5" />
                GitHub
              </button>
            </div>
          </div>

          <div className="mt-8 text-center">
            <p className="text-sm text-gray-400">
              {isLogin ? '¿No tienes una cuenta?' : '¿Ya tienes una cuenta?'}{' '}
              <button 
                onClick={() => setIsLogin(!isLogin)}
                className="text-blue-500 font-medium hover:text-blue-400 transition-colors"
              >
                {isLogin ? 'Regístrate' : 'Inicia sesión'}
              </button>
            </p>
          </div>

          <div className="mt-6 text-center">
            <a 
              href="/"
              className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Volver al inicio
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
