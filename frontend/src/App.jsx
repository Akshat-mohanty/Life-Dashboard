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

export default function App() {
  const {
    user,
    isAuthenticated,
    login,
    signup,
    confirmSignup,
    logout,
    loginAsDemo,
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
  // UNAUTHENTICATED: CLEAN MINIMALIST WHITE & EMERALD AUTH SCREEN
  // =========================================================================
  if (!isAuthenticated && !authLoading) {
    return (
      <div className="min-h-screen bg-white text-black flex flex-col justify-between relative selection:bg-accent-100 selection:text-accent-900">
        {/* Minimal top branding */}
        <header className="relative z-10 max-w-7xl mx-auto w-full px-6 py-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <MeridianLogo className="w-10 h-10" />
            <div>
              <span className="text-xl font-extrabold tracking-tight text-black block">Meridian</span>
            </div>
          </div>
        </header>

        {/* Center Canvas */}
        <main className="relative z-10 max-w-7xl mx-auto w-full px-4 sm:px-6 py-8 lg:py-12 flex-1 flex flex-col items-center justify-center">
          <div className="w-full max-w-md mx-auto">
            <div className="bg-white rounded-3xl border border-zinc-200 p-7 sm:p-9 shadow-sm">
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
                      ? 'bg-accent-600 text-white shadow-sm'
                      : 'text-zinc-600 hover:text-black font-semibold'
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
                      ? 'bg-accent-600 text-white shadow-sm'
                      : 'text-zinc-600 hover:text-black font-semibold'
                  }`}
                >
                  Create Account
                </button>
              </div>

              {/* Alerts */}
              {(localError || authError) && (
                <div className="p-3.5 mb-5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
                  {localError || authError}
                </div>
              )}

              {infoMessage && (
                <div className="p-3.5 mb-5 rounded-xl bg-accent-50 border border-accent-200 text-accent-800 text-xs font-medium">
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
                        className="w-full text-xs px-3 py-2.5 pl-9 bg-white border border-zinc-300 rounded-xl text-black placeholder-zinc-400 focus:outline-none focus:border-accent-600 focus:ring-2 focus:ring-accent-600/15 transition"
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
                          className="w-full text-xs px-3 py-2.5 pl-9 bg-white border border-zinc-300 rounded-xl text-black placeholder-zinc-400 focus:outline-none focus:border-accent-600 focus:ring-2 focus:ring-accent-600/15 transition"
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
                          className="w-full text-xs px-3 py-2.5 pl-9 bg-white border border-zinc-300 rounded-xl text-black placeholder-zinc-400 focus:outline-none focus:border-accent-600 focus:ring-2 focus:ring-accent-600/15 transition"
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
                      className="w-full text-xs px-3 py-3 bg-white border border-zinc-300 rounded-xl text-black focus:outline-none focus:border-accent-600 focus:ring-2 focus:ring-accent-600/15 text-center tracking-widest text-lg font-mono font-bold"
                    />
                    <span className="text-[11px] text-zinc-500 mt-1.5 block">Enter the 6-digit code sent to your email.</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={actionLoading}
                  className="w-full py-3 px-4 bg-accent-600 hover:bg-accent-700 text-white text-xs font-bold rounded-xl shadow-sm hover:shadow transition-all active:scale-[0.99] flex items-center justify-center gap-2 disabled:opacity-50 mt-2"
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
                  className="w-full py-2.5 px-4 bg-zinc-50 hover:bg-zinc-100 text-zinc-800 text-xs font-bold rounded-xl border border-zinc-200 transition flex items-center justify-center gap-2"
                >
                  <Zap className="w-4 h-4 text-accent-600" />
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

        <footer className="relative z-10 max-w-7xl mx-auto w-full px-6 py-6 text-center text-xs text-zinc-400 border-t border-zinc-100">
          made by Akshat Mohanty
        </footer>
      </div>
    );
  }

  // =========================================================================
  // AUTHENTICATED: CLEAN MINIMALIST WHITE & BLACK WITH EMERALD ACCENT
  // =========================================================================
  return (
    <div className="min-h-screen bg-white text-black flex flex-col relative selection:bg-accent-100 selection:text-accent-900">
      {/* ====================================================================
       * FULL-WIDTH TOP BAR
       * ==================================================================== */}
      <header className="sticky top-0 z-40 bg-white border-b border-zinc-200 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Brand Left */}
          <div className="flex items-center gap-3">
            <MeridianLogo className="w-10 h-10" />
            <div>
              <h1 className="text-xl font-extrabold text-black tracking-tight">Meridian</h1>
            </div>
          </div>

          {/* User Profile + Logout Right */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2.5 pl-2">
              <div className="w-9 h-9 rounded-full bg-accent-50 border border-accent-200 text-accent-800 flex items-center justify-center font-bold text-xs shadow-xs">
                {(user?.name || user?.email || 'U').charAt(0).toUpperCase()}
              </div>
              <div className="hidden md:block text-left">
                <p className="text-xs font-bold text-black leading-none">{user?.name || 'User'}</p>
                <p className="text-[10px] text-zinc-500 mt-0.5 truncate max-w-[150px]">{user?.email || 'authenticated'}</p>
              </div>
            </div>

            <button
              onClick={logout}
              className="p-2 text-zinc-500 hover:text-rose-600 hover:bg-rose-50 rounded-xl border border-zinc-200 transition"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* ====================================================================
       * MAIN CONTENT CANVAS
       * ==================================================================== */}
      <main className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-8 flex-1">
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
      <footer className="border-t border-zinc-200 bg-white py-6 mt-12 text-center text-xs text-zinc-400">
        made by Akshat Mohanty
      </footer>
    </div>
  );
}
