import './App.css'
import { Routes, Route } from 'react-router-dom';
import { Suspense, lazy } from 'react';

// ─── Lazy-loaded route components (code splitting) ───────────────
const LandingPage = lazy(() => import('@/components/LandingPage'));
const AuthPage = lazy(() => import('@/components/AuthPage').then(m => ({ default: m.AuthPage })));
const ChatPage = lazy(() => import('@/components/ChatPage').then(m => ({ default: m.ChatPage })));
const ResetPasswordPage = lazy(() => import('@/components/ResetPasswordPage').then(m => ({ default: m.ResetPasswordPage })));
const ProtectedRoute = lazy(() => import('@/components/ProtectedRoute').then(m => ({ default: m.ProtectedRoute })));

// ─── Loading spinner shown while chunks download ────────────────
function PageLoader() {
  return (
    <div className="min-h-screen bg-[#0d0d0d] flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="h-10 w-10 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" />
        <p className="text-sm text-gray-400 animate-pulse">Cargando...</p>
      </div>
    </div>
  )
}

function App() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<AuthPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route
          path="/chat"
          element={
            <ProtectedRoute>
              <ChatPage />
            </ProtectedRoute>
          }
        />
      </Routes>
    </Suspense>
  )
}

export default App
