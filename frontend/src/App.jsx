/**
 * Meridian — Main Application
 * Redesigned with Obsidian Black (#090A0F), Pure White, and Electric Indigo (#6366F1).
 */

import React, { useState } from 'react';
import {
  LogOut,
  User,
  ShieldCheck,
  Lock,
  Mail,
  ArrowRight,
  Zap,
} from 'lucide-react';
import MeridianLogo from './components/MeridianLogo';
import { useAuth } from './hooks/useAuth';
import Briefing from './components/Briefing';
import Bills from './components/Bills';
import Tasks from './components/Tasks';
import CalendarView from './components/CalendarView';
import Health from './components/Health';
import Documents from './components/Documents';
import Spending from './components/Spending';
import UserProfileMenu from './components/UserProfileMenu';

export default function App() {
  const {
    user,
    isAuthenticated,
    login,
    signup,
    confirmSignup,
    logout,
    loginAsDemo,
    loginWithGoogle,
    loading: authLoading,
    error: authError,
  } = useAuth();

  // Auth screen mode: 'login' | 'signup' | 'confirm'
  const [authMode, setAuthMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [confirmCode, setConfirmCode] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [localError, setLocalError] = useState('');
  const [infoMessage, setInfoMessage] = useState('');

  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    setLocalError('');
    setInfoMessage('');
    setActionLoading(true);

    try {
      if (authMode === 'login') {
        await login(email, password);
      } else if (authMode === 'signup') {
        const res = await signup(email, password, name);
        if (res.isConfirmed) {
          setInfoMessage('Account created! Logging in...');
        } else {
          setAuthMode('confirm');
          setInfoMessage(`Verification code sent to ${email}.`);
        }
      } else if (authMode === 'confirm') {
        await confirmSignup(email, confirmCode);
        setInfoMessage('Account confirmed! Logging in...');
        await login(email, password);
      }
    } catch (err) {
      setLocalError(err.message || 'Authentication error.');
    } finally {
      setActionLoading(false);
    }
  };

  // =========================================================================
  // UNAUTHENTICATED: CINEMATIC AESTHETIC SPLIT AUTH SCREEN
  // =========================================================================
  // UNAUTHENTICATED: CLEAN MINIMALIST WHITE & #9BDEE8 ACCENT AUTH SCREEN
  // =========================================================================
  if (!isAuthenticated && !authLoading) {
    return (
      <div className="min-h-screen text-black flex flex-col justify-between relative overflow-hidden selection:bg-accent-100 selection:text-accent-900">
        {/* Background Animated Video */}
        <video
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover pointer-events-none z-0"
        >
          <source src="/cloud-animated.mp4" type="video/mp4" />
        </video>

        {/* Soft atmospheric overlay for readability */}
        <div className="absolute inset-0 bg-white/30 backdrop-blur-[1px] pointer-events-none z-0" />

        {/* Minimal top branding */}
        <header className="relative z-10 max-w-7xl mx-auto w-full px-6 py-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <MeridianLogo className="w-10 h-10" />
            <div>
              <span className="text-2xl font-bold tracking-tight text-black block font-serif">Meridian</span>
            </div>
          </div>
        </header>

        {/* Center Canvas */}
        <main className="relative z-10 max-w-7xl mx-auto w-full px-4 sm:px-6 py-8 lg:py-12 flex-1 flex flex-col items-center justify-center">
          <div className="w-full max-w-md mx-auto">
            <div className="bg-white/95 backdrop-blur-xl rounded-3xl border border-white/80 p-7 sm:p-9 shadow-2xl">
              {/* Modern Pill Switcher */}
              <div className="flex bg-zinc-100 p-1 rounded-xl border border-zinc-200/60 mb-6">
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode('login');
                    setLocalError('');
                  }}
                  className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                    authMode === 'login'
                      ? 'bg-white text-black shadow-xs'
                      : 'text-zinc-500 hover:text-black font-semibold'
                  }`}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode('signup');
                    setLocalError('');
                  }}
                  className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                    authMode === 'signup' || authMode === 'confirm'
                      ? 'bg-white text-black shadow-xs'
                      : 'text-zinc-500 hover:text-black font-semibold'
                  }`}
                >
                  Create Account
                </button>
              </div>

              {/* Google Sign In Option */}
              <div className="mb-5">
                <button
                  type="button"
                  onClick={() => {
                    setLocalError('');
                    loginWithGoogle();
                  }}
                  className="w-full py-2.5 px-4 bg-white hover:bg-zinc-50 text-zinc-800 text-xs font-bold rounded-xl border border-zinc-300 shadow-xs hover:border-zinc-400 transition-all flex items-center justify-center gap-2.5 active:scale-[0.99] cursor-pointer"
                >
                  <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.36 24 12 24z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 10.03 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.36 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                    />
                  </svg>
                  <span>Continue with Google</span>
                </button>

                <div className="relative my-4">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-zinc-200" />
                  </div>
                  <div className="relative flex justify-center text-[10px] uppercase">
                    <span className="bg-white/95 px-2 text-zinc-400 font-semibold tracking-wider">
                      or continue with email
                    </span>
                  </div>
                </div>
              </div>

              {/* Alerts */}
              {(localError || authError) && (
                <div className="p-3.5 mb-5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
                  {localError || authError}
                </div>
              )}

              {infoMessage && (
                <div className="p-3.5 mb-5 rounded-xl bg-zinc-100 border border-zinc-200 text-zinc-800 text-xs font-medium">
                  {infoMessage}
                </div>
              )}

              {/* Auth Form */}
              <form onSubmit={handleAuthSubmit} className="space-y-4">
                {authMode === 'signup' && (
                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 mb-1.5">Your Full Name</label>
                    <div className="relative">
                      <input
                        type="text"
                        required
                        placeholder="Akshat Mohanty"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full text-xs px-3 py-2.5 pl-9 bg-white border border-zinc-300 rounded-xl text-black placeholder-zinc-400 focus:outline-none focus:border-black focus:ring-2 focus:ring-black/5 transition"
                      />
                      <User className="w-4 h-4 text-zinc-400 absolute left-3 top-2.5" />
                    </div>
                  </div>
                )}

                {authMode !== 'confirm' ? (
                  <>
                    <div>
                      <label className="block text-xs font-semibold text-zinc-700 mb-1.5">Email Address</label>
                      <div className="relative">
                        <input
                          type="email"
                          required
                          placeholder="akshat@example.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="w-full text-xs px-3 py-2.5 pl-9 bg-white border border-zinc-300 rounded-xl text-black placeholder-zinc-400 focus:outline-none focus:border-black focus:ring-2 focus:ring-black/5 transition"
                        />
                        <Mail className="w-4 h-4 text-zinc-400 absolute left-3 top-2.5" />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-zinc-700 mb-1.5">Password</label>
                      <div className="relative">
                        <input
                          type="password"
                          required
                          placeholder="••••••••"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="w-full text-xs px-3 py-2.5 pl-9 bg-white border border-zinc-300 rounded-xl text-black placeholder-zinc-400 focus:outline-none focus:border-black focus:ring-2 focus:ring-black/5 transition"
                        />
                        <Lock className="w-4 h-4 text-zinc-400 absolute left-3 top-2.5" />
                      </div>
                    </div>
                  </>
                ) : (
                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 mb-1.5">Confirmation Code</label>
                    <input
                      type="text"
                      required
                      placeholder="6-digit code"
                      value={confirmCode}
                      onChange={(e) => setConfirmCode(e.target.value)}
                      className="w-full text-xs px-3 py-3 bg-white border border-zinc-300 rounded-xl text-black focus:outline-none focus:border-black focus:ring-2 focus:ring-black/5 text-center tracking-widest text-lg font-mono font-bold"
                    />
                    <span className="text-[11px] text-zinc-500 mt-1.5 block">Enter the 6-digit code sent to your email.</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={actionLoading}
                  className="w-full py-3 px-4 bg-white hover:bg-zinc-50 text-black border border-zinc-300 hover:border-zinc-400 text-xs font-bold rounded-xl shadow-xs hover:shadow-sm transition-all active:scale-[0.99] flex items-center justify-center gap-2 disabled:opacity-50 mt-2 cursor-pointer"
                >
                  {actionLoading ? (
                    'Processing...'
                  ) : (
                    <>
                      <span>
                        {authMode === 'login'
                          ? 'Sign In to Dashboard'
                          : authMode === 'signup'
                          ? 'Create Free Account'
                          : 'Verify & Continue'}
                      </span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>

              {/* Instant Demo Access Button */}
              <div className="mt-6 pt-5 border-t border-zinc-100 text-center">
                <button
                  type="button"
                  onClick={loginAsDemo}
                  className="w-full py-2.5 px-4 bg-zinc-50 hover:bg-zinc-100 text-zinc-800 text-xs font-bold rounded-xl border border-zinc-200 transition flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Zap className="w-4 h-4 text-zinc-700" />
                  <span>Continue as Demo User (Instant)</span>
                </button>
              </div>
            </div>

            {/* Security badge footer */}
            <div className="mt-6 text-center text-xs text-zinc-500 flex items-center justify-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-zinc-400" />
              <span>Secure login</span>
            </div>
          </div>
        </main>

        <footer className="relative z-10 max-w-7xl mx-auto w-full px-6 py-6 text-center text-xs text-zinc-500 font-medium">
          made by Akshat Mohanty
        </footer>
      </div>
    );
  }

  // =========================================================================
  // AUTHENTICATED: HOME DASHBOARD (WITH CLOUD ANIMATED 2 BACKGROUND)
  // =========================================================================
  return (
    <div className="min-h-screen text-black flex flex-col relative overflow-x-hidden selection:bg-accent-100 selection:text-accent-900">
      {/* Background Animated Video for Home Page */}
      <video
        autoPlay
        loop
        muted
        playsInline
        className="fixed inset-0 w-full h-full object-cover pointer-events-none z-0"
      >
        <source src="/cloud-animated2.mp4" type="video/mp4" />
      </video>

      {/* Atmospheric overlay to ensure crisp contrast and readability */}
      <div className="fixed inset-0 bg-white/40 pointer-events-none z-0" />

      {/* ====================================================================
       * FULL-WIDTH TOP BAR
       * ==================================================================== */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-zinc-200/80 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Brand Left */}
          <div className="flex items-center gap-3">
            <MeridianLogo className="w-10 h-10" />
            <div>
              <h1 className="text-2xl font-bold text-black tracking-tight font-serif">Meridian</h1>
            </div>
          </div>

          {/* User Profile Dropdown & Logout */}
          <div className="flex items-center gap-3">
            <UserProfileMenu />
          </div>
        </div>
      </header>

      {/* ====================================================================
       * MAIN CONTENT CANVAS
       * ==================================================================== */}
      <main className="relative z-10 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-8 flex-1">
        {/* 1. Full-Width AI Morning Briefing (Loads First) */}
        <Briefing />

        {/* 2. Three-Column Desktop Grid (1-Column on Mobile) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {/* Left Column: Bills + Spending */}
          <div className="space-y-6">
            <Bills />
            <Spending />
          </div>

          {/* Center Column: Tasks + Calendar */}
          <div className="space-y-6">
            <Tasks />
            <CalendarView />
          </div>

          {/* Right Column: Health + Documents */}
          <div className="space-y-6">
            <Health />
            <Documents />
          </div>
        </div>
      </main>

      {/* ====================================================================
       * ARCHITECTURAL FOOTER
       * ==================================================================== */}
      <footer className="relative z-10 py-6 mt-12 text-center text-xs text-zinc-500 font-medium">
        made by Akshat Mohanty
      </footer>
    </div>
  );
}
