/**
 * Meridian — Main Application
 * Redesigned with Obsidian Black (#090A0F), Pure White, and Electric Indigo (#6366F1).
 */

import React, { useState } from 'react';
import {
  Compass,
  LogOut,
  User,
  ShieldCheck,
  Sparkles,
  Lock,
  Mail,
  ArrowRight,
  Zap,
  CheckCircle2,
  Clock,
  Layers,
} from 'lucide-react';
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
  if (!isAuthenticated && !authLoading) {
    return (
      <div className="min-h-screen bg-[#090A0F] text-white flex flex-col justify-between relative overflow-hidden selection:bg-accent-500/30 selection:text-white">
        {/* Ambient background mesh glows */}
        <div className="absolute -top-40 left-1/4 w-96 h-96 bg-accent-600/15 rounded-full blur-[128px] pointer-events-none" />
        <div className="absolute -bottom-40 right-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-[128px] pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-7xl h-full bg-[radial-gradient(circle_at_center,rgba(99,102,241,0.06),transparent_70%)] pointer-events-none" />

        {/* Minimal top branding */}
        <header className="relative z-10 max-w-7xl mx-auto w-full px-6 py-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-accent-600 to-indigo-500 flex items-center justify-center text-white shadow-glow-sm">
              <Compass className="w-5 h-5" />
            </div>
            <div>
              <span className="text-lg font-extrabold tracking-tight text-white block">Meridian</span>
              <span className="text-[11px] text-slate-400 font-medium -mt-1 block">Intelligent Daily OS</span>
            </div>
          </div>

          <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.04] border border-white/10 text-xs text-slate-300">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Serverless AWS Bedrock</span>
          </div>
        </header>

        {/* Center Canvas */}
        <main className="relative z-10 max-w-7xl mx-auto w-full px-4 sm:px-6 py-8 lg:py-12 flex-1 flex items-center justify-center">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center w-full max-w-5xl">
            {/* Left Hero Section (Desktop) */}
            <div className="lg:col-span-6 space-y-6 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent-500/10 border border-accent-500/20 text-accent-300 text-xs font-semibold shadow-glow-sm">
                <Sparkles className="w-3.5 h-3.5 text-accent-400" />
                <span>Replaces 10 fragmented apps with 1 page</span>
              </div>

              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white leading-[1.15]">
                Start every morning with{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent-400 via-indigo-300 to-white">
                  total clarity.
                </span>
              </h2>

              <p className="text-slate-400 text-sm sm:text-base leading-relaxed max-w-lg mx-auto lg:mx-0">
                Every morning at 7:00 AM, Claude 3.5 Sonnet analyzes your bills, urgency-ranked tasks, 7-day calendar, health reminders, documents, and monthly spending to deliver a plain-English briefing.
              </p>

              {/* Feature Highlights Grid */}
              <div className="pt-2 grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-lg mx-auto lg:mx-0">
                <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/[0.06] backdrop-blur-md text-left">
                  <Clock className="w-4 h-4 text-accent-400 mb-2" />
                  <div className="text-xs font-bold text-white">7 AM Daily AI</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">Automated EventBridge trigger</div>
                </div>
                <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/[0.06] backdrop-blur-md text-left">
                  <Layers className="w-4 h-4 text-accent-400 mb-2" />
                  <div className="text-xs font-bold text-white">Single-Table</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">DynamoDB high efficiency</div>
                </div>
                <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/[0.06] backdrop-blur-md text-left">
                  <CheckCircle2 className="w-4 h-4 text-accent-400 mb-2" />
                  <div className="text-xs font-bold text-white">Cedar Secured</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">Strict per-user data isolation</div>
                </div>
              </div>
            </div>

            {/* Right Form Card */}
            <div className="lg:col-span-6 w-full max-w-md mx-auto">
              <div className="bg-[#11131a]/85 backdrop-blur-2xl rounded-3xl border border-white/10 p-7 sm:p-9 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.9),0_0_1px_1px_rgba(255,255,255,0.08)]">
                {/* Modern Pill Switcher */}
                <div className="flex bg-white/[0.04] p-1 rounded-xl border border-white/5 mb-6">
                  <button
                    type="button"
                    onClick={() => {
                      setAuthMode('login');
                      setLocalError('');
                    }}
                    className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                      authMode === 'login'
                        ? 'bg-accent-600 text-white shadow-glow-sm'
                        : 'text-slate-400 hover:text-white'
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
                        ? 'bg-accent-600 text-white shadow-glow-sm'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Create Account
                  </button>
                </div>

                {/* Alerts */}
                {(localError || authError) && (
                  <div className="p-3.5 mb-5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs font-medium">
                    {localError || authError}
                  </div>
                )}

                {infoMessage && (
                  <div className="p-3.5 mb-5 rounded-xl bg-accent-500/10 border border-accent-500/20 text-accent-300 text-xs font-medium">
                    {infoMessage}
                  </div>
                )}

                {/* Auth Form */}
                <form onSubmit={handleAuthSubmit} className="space-y-4">
                  {authMode === 'signup' && (
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1.5">Your Full Name</label>
                      <div className="relative">
                        <input
                          type="text"
                          required
                          placeholder="Akshat Mohanty"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          className="w-full text-xs px-3 py-2.5 pl-9 bg-white/[0.04] border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-accent-400 focus:ring-2 focus:ring-accent-500/20 transition"
                        />
                        <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                      </div>
                    </div>
                  )}

                  {authMode !== 'confirm' ? (
                    <>
                      <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1.5">Email Address</label>
                        <div className="relative">
                          <input
                            type="email"
                            required
                            placeholder="akshat@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full text-xs px-3 py-2.5 pl-9 bg-white/[0.04] border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-accent-400 focus:ring-2 focus:ring-accent-500/20 transition"
                          />
                          <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1.5">Password</label>
                        <div className="relative">
                          <input
                            type="password"
                            required
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full text-xs px-3 py-2.5 pl-9 bg-white/[0.04] border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-accent-400 focus:ring-2 focus:ring-accent-500/20 transition"
                          />
                          <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                        </div>
                      </div>
                    </>
                  ) : (
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1.5">Confirmation Code</label>
                      <input
                        type="text"
                        required
                        placeholder="6-digit code"
                        value={confirmCode}
                        onChange={(e) => setConfirmCode(e.target.value)}
                        className="w-full text-xs px-3 py-3 bg-white/[0.04] border border-white/10 rounded-xl text-white focus:outline-none focus:border-accent-400 focus:ring-2 focus:ring-accent-500/20 text-center tracking-widest text-lg font-mono font-bold"
                      />
                      <span className="text-[11px] text-slate-400 mt-1.5 block">Enter the 6-digit code sent to your email.</span>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={actionLoading}
                    className="w-full py-3 px-4 bg-gradient-to-r from-accent-600 to-indigo-600 hover:from-accent-500 hover:to-indigo-500 text-white text-xs font-bold rounded-xl shadow-glow-sm hover:shadow-glow-md transition-all active:scale-[0.99] flex items-center justify-center gap-2 disabled:opacity-50 mt-2"
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
                <div className="mt-6 pt-5 border-t border-white/[0.08] text-center">
                  <button
                    type="button"
                    onClick={loginAsDemo}
                    className="w-full py-2.5 px-4 bg-white/[0.04] hover:bg-white/[0.08] text-white text-xs font-bold rounded-xl border border-white/10 hover:border-white/20 transition flex items-center justify-center gap-2"
                  >
                    <Zap className="w-4 h-4 text-amber-400" />
                    <span>Continue as Demo User (Instant)</span>
                  </button>
                </div>
              </div>

              {/* Security badge footer */}
              <div className="mt-6 text-center text-xs text-slate-500 flex items-center justify-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-slate-400" />
                <span>Secure login</span>
              </div>
            </div>
          </div>
        </main>

        <footer className="relative z-10 max-w-7xl mx-auto w-full px-6 py-6 text-center text-xs text-slate-500 border-t border-white/[0.04]">
          Built with AWS Serverless • Amazon Bedrock Claude 3.5 Sonnet • AWS Cedar Authorization
        </footer>
      </div>
    );
  }

  // =========================================================================
  // AUTHENTICATED: AESTHETIC OBSIDIAN + ELECTRIC INDIGO DASHBOARD SHELL
  // =========================================================================
  return (
    <div className="min-h-screen bg-[#090A0F] text-slate-100 flex flex-col relative selection:bg-accent-500/30 selection:text-white">
      {/* Subtle ambient lighting backdrop */}
      <div className="fixed top-0 left-1/3 w-[600px] h-[350px] bg-accent-600/10 rounded-full blur-[140px] pointer-events-none -z-10" />
      <div className="fixed bottom-0 right-1/4 w-[500px] h-[300px] bg-indigo-500/08 rounded-full blur-[140px] pointer-events-none -z-10" />

      {/* ====================================================================
       * FULL-WIDTH TOP BAR
       * ==================================================================== */}
      <header className="sticky top-0 z-40 bg-[#090A0F]/80 backdrop-blur-xl border-b border-white/[0.08] shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Brand Left */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-accent-600 to-indigo-500 flex items-center justify-center text-white shadow-glow-sm">
              <Compass className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-extrabold text-white tracking-tight">Meridian</h1>
                <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-accent-500/10 text-accent-300 border border-accent-500/20">
                  <ShieldCheck className="w-3 h-3 text-accent-400" />
                  Cedar Secured
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block">Unified Daily Management System</p>
            </div>
          </div>

          {/* User Profile + Logout Right */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2.5 pl-2">
              <div className="w-9 h-9 rounded-full bg-accent-500/15 border border-accent-400/30 text-accent-300 flex items-center justify-center font-bold text-xs shadow-glow-sm">
                {(user?.name || user?.email || 'U').charAt(0).toUpperCase()}
              </div>
              <div className="hidden md:block text-left">
                <p className="text-xs font-bold text-white leading-none">{user?.name || 'User'}</p>
                <p className="text-[10px] text-slate-400 mt-0.5 truncate max-w-[150px]">{user?.email || 'authenticated'}</p>
              </div>
            </div>

            <button
              onClick={logout}
              className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl border border-transparent hover:border-rose-500/20 transition"
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
      <footer className="border-t border-white/[0.08] bg-[#090A0F]/60 backdrop-blur-md py-6 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-accent-400 animate-pulse shadow-glow-sm" />
            <span className="text-slate-300">AWS Serverless Architecture</span>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-[11px]">
            <span className="px-2 py-0.5 bg-white/[0.04] border border-white/[0.06] rounded-md text-slate-300 font-medium">Lambda</span>
            <span className="px-2 py-0.5 bg-white/[0.04] border border-white/[0.06] rounded-md text-slate-300 font-medium">API Gateway</span>
            <span className="px-2 py-0.5 bg-white/[0.04] border border-white/[0.06] rounded-md text-slate-300 font-medium">DynamoDB</span>
            <span className="px-2 py-0.5 bg-white/[0.04] border border-white/[0.06] rounded-md text-slate-300 font-medium">Amazon S3</span>
            <span className="px-2 py-0.5 bg-white/[0.04] border border-white/[0.06] rounded-md text-slate-300 font-medium">EventBridge</span>
            <span className="px-2 py-0.5 bg-white/[0.04] border border-white/[0.06] rounded-md text-slate-300 font-medium">Claude 3.5 Sonnet</span>
            <span className="px-2 py-0.5 bg-white/[0.04] border border-white/[0.06] rounded-md text-slate-300 font-medium">AWS Cedar</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
