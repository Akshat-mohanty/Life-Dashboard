/**
 * Meridian — Main Application
 * Redesigned with Obsidian Black (#090A0F), Pure White, and Electric Indigo (#6366F1).
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import {
  LogOut,
  User,
  Lock,
  Mail,
  ArrowRight,
  Zap,
  LogIn,
  Eye,
  EyeOff,
  Key,
  LayoutGrid,
  CheckSquare,
  CreditCard,
  PieChart,
  HeartPulse,
  Calendar,
  FileText,
  Sparkles,
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
import {
  tasksApi,
  billsApi,
  spendingApi,
  calendarApi,
  healthApi,
  documentsApi,
} from './api/client';

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
  const [showPassword, setShowPassword] = useState(false);
  const [name, setName] = useState('');
  const [confirmCode, setConfirmCode] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [localError, setLocalError] = useState('');
  const [infoMessage, setInfoMessage] = useState('');

  // Dashboard workspace view tab: 'overview' | 'focus' | 'finances' | 'life'
  const [activeTab, setActiveTab] = useState('overview');

  // Cached summary telemetry for the Horizon Pulse Bar
  const { data: tasksData } = useQuery({
    queryKey: ['tasks'],
    queryFn: tasksApi.list,
    enabled: isAuthenticated,
  });
  const { data: billsData } = useQuery({
    queryKey: ['bills'],
    queryFn: billsApi.list,
    enabled: isAuthenticated,
  });
  const { data: calendarData } = useQuery({
    queryKey: ['calendar'],
    queryFn: () => calendarApi.list(),
    enabled: isAuthenticated,
  });
  const { data: healthData } = useQuery({
    queryKey: ['health'],
    queryFn: healthApi.list,
    enabled: isAuthenticated,
  });
  const { data: docsData } = useQuery({
    queryKey: ['documents'],
    queryFn: documentsApi.list,
    enabled: isAuthenticated,
  });
  const currentMonthStr = new Date().toISOString().slice(0, 7);
  const { data: spendingSummaryData } = useQuery({
    queryKey: ['spending', 'summary', currentMonthStr],
    queryFn: () => spendingApi.summary(currentMonthStr, 50000),
    enabled: isAuthenticated,
  });

  const tasksSummary = tasksData?.summary || { pendingCount: 0, completedCount: 0 };
  const billsSummary = billsData?.summary || { totalUnpaidAmount: 0, overdueCount: 0 };
  const calendarSummary = calendarData?.summary || { todayCount: 0, next7DaysCount: 0 };
  const healthSummary = healthData?.summary || { totalCount: 0 };
  const docsSummary = docsData?.summary || { totalCount: 0 };
  const spendingSummary = spendingSummaryData?.summary || {
    currentMonthTotal: 0,
    softMonthlyBudget: 50000,
  };

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
  // UNAUTHENTICATED: PIXEL-PERFECT REPLICA OF REFERENCE DESIGN
  // =========================================================================
  if (!isAuthenticated && !authLoading) {
    return (
      <div className="min-h-screen text-black flex items-center justify-center relative overflow-hidden selection:bg-accent-100 selection:text-accent-900 p-4">
        {/* Background Animated Video for Home Page */}
        <video
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover pointer-events-none z-0"
        >
          <source src="/cloud-animated2.mp4" type="video/mp4" />
        </video>

        {/* Soft atmospheric overlay */}
        <div className="absolute inset-0 bg-white/20 pointer-events-none z-0" />

        {/* Subtle concentric orbital rings radiating behind card */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden z-0">
          <div className="w-[520px] h-[520px] rounded-full border border-white/40 shadow-[0_0_24px_rgba(255,255,255,0.25)]" />
          <div className="absolute w-[780px] h-[780px] rounded-full border border-white/25" />
          <div className="absolute w-[1060px] h-[1060px] rounded-full border border-white/15" />
          <div className="absolute w-[1360px] h-[1360px] rounded-full border border-white/10" />
        </div>

        {/* Top-Left Logo / Branding matching reference */}
        <div className="absolute top-8 left-8 sm:top-10 sm:left-12 z-20 flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-black flex items-center justify-center text-white shadow-xs">
            <svg viewBox="0 0 24 24" className="w-4 h-4 fill-white">
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M12 4a3.5 3.5 0 0 0-3.5 3.5c0 .35.05.69.15 1.01A5 5 0 0 0 7.5 8.5 3.5 3.5 0 0 0 4 12a3.5 3.5 0 0 0 3.5 3.5c.35 0 .69-.05 1.01-.15A5 5 0 0 0 8.5 16.5 3.5 3.5 0 0 0 12 20a3.5 3.5 0 0 0 3.5-3.5c0-.35-.05-.69-.15-1.01A5 5 0 0 0 16.5 15.5 3.5 3.5 0 0 0 20 12a3.5 3.5 0 0 0-3.5-3.5c-.35 0-.69.05-1.01.15A5 5 0 0 0 15.5 7.5 3.5 3.5 0 0 0 12 4zm0 6a2 2 0 1 0 0 4 2 2 0 0 0 0-4z"
              />
            </svg>
          </div>
          <span className="text-xl font-bold tracking-tight text-zinc-900">Ebolt</span>
        </div>

        {/* Center Floating Glassmorphic Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="relative z-10 w-full max-w-[425px] mx-auto bg-white/80 backdrop-blur-2xl rounded-[32px] border border-white/70 shadow-[0_25px_60px_-15px_rgba(30,50,90,0.12),0_0_35px_rgba(155,222,232,0.2)] p-8 sm:p-9"
        >
          {/* Top Squircle Icon */}
          <div className="w-14 h-14 rounded-2xl bg-white shadow-[0_4px_16px_rgba(0,0,0,0.06)] border border-white/90 flex items-center justify-center mx-auto mb-5">
            <LogIn className="w-5 h-5 text-zinc-700 stroke-[2.2]" />
          </div>

          {/* Heading & Subtitle */}
          <h1 className="text-[22px] sm:text-2xl font-bold text-zinc-900 tracking-tight text-center">
            {authMode === 'login'
              ? 'Sign in with email'
              : authMode === 'signup'
              ? 'Create your account'
              : 'Confirm your email'}
          </h1>
          <p className="text-xs text-zinc-500 text-center max-w-[280px] mx-auto mt-2 mb-6 leading-relaxed">
            {authMode === 'login'
              ? 'Make a new doc to bring your words, data, and teams together. For free'
              : authMode === 'signup'
              ? 'Bring your metrics, daily tasks, and data together. For free'
              : `Enter the verification code sent to ${email}`}
          </p>

          {/* Alert messages */}
          {(localError || authError) && (
            <div className="p-3 mb-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
              {localError || authError}
            </div>
          )}

          {infoMessage && (
            <div className="p-3 mb-4 rounded-xl bg-zinc-100 border border-zinc-200 text-zinc-800 text-xs font-medium">
              {infoMessage}
            </div>
          )}

          {/* Auth Form */}
          <form onSubmit={handleAuthSubmit} className="space-y-3">
            {authMode === 'signup' && (
              <div className="relative flex items-center bg-[#f1f4f8]/90 hover:bg-[#ebf0f6] focus-within:bg-white focus-within:border-zinc-300 focus-within:ring-2 focus-within:ring-zinc-400/20 rounded-2xl px-4 py-3.5 transition-all border border-transparent">
                <User className="w-4 h-4 text-zinc-400 mr-3 flex-shrink-0" />
                <input
                  type="text"
                  required
                  placeholder="Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-transparent text-xs sm:text-sm text-zinc-800 placeholder-zinc-400 focus:outline-none"
                />
              </div>
            )}

            {authMode !== 'confirm' ? (
              <>
                {/* Email Input */}
                <div className="relative flex items-center bg-[#f1f4f8]/90 hover:bg-[#ebf0f6] focus-within:bg-white focus-within:border-zinc-300 focus-within:ring-2 focus-within:ring-zinc-400/20 rounded-2xl px-4 py-3.5 transition-all border border-transparent">
                  <Mail className="w-4 h-4 text-zinc-400 mr-3 flex-shrink-0" />
                  <input
                    type="email"
                    required
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-transparent text-xs sm:text-sm text-zinc-800 placeholder-zinc-400 focus:outline-none"
                  />
                </div>

                {/* Password Input */}
                <div className="relative flex items-center bg-[#f1f4f8]/90 hover:bg-[#ebf0f6] focus-within:bg-white focus-within:border-zinc-300 focus-within:ring-2 focus-within:ring-zinc-400/20 rounded-2xl px-4 py-3.5 transition-all border border-transparent">
                  <Lock className="w-4 h-4 text-zinc-400 mr-3 flex-shrink-0" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-transparent text-xs sm:text-sm text-zinc-800 placeholder-zinc-400 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-zinc-400 hover:text-zinc-600 transition flex-shrink-0 focus:outline-none cursor-pointer"
                  >
                    {showPassword ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                  </button>
                </div>
              </>
            ) : (
              <div className="relative flex items-center bg-[#f1f4f8]/90 hover:bg-[#ebf0f6] focus-within:bg-white focus-within:border-zinc-300 focus-within:ring-2 focus-within:ring-zinc-400/20 rounded-2xl px-4 py-3.5 transition-all border border-transparent">
                <Key className="w-4 h-4 text-zinc-400 mr-3 flex-shrink-0" />
                <input
                  type="text"
                  required
                  placeholder="6-digit code"
                  value={confirmCode}
                  onChange={(e) => setConfirmCode(e.target.value)}
                  className="w-full bg-transparent text-xs sm:text-sm text-zinc-800 placeholder-zinc-400 focus:outline-none tracking-widest font-mono"
                />
              </div>
            )}

            {authMode === 'login' && (
              <div className="flex justify-end pt-0.5 pb-1">
                <button
                  type="button"
                  onClick={() => setInfoMessage('Password reset link sent to your email.')}
                  className="text-xs text-zinc-500 hover:text-zinc-800 transition font-normal cursor-pointer"
                >
                  Forgot password?
                </button>
              </div>
            )}

            {/* Primary Action Button */}
            <button
              type="submit"
              disabled={actionLoading}
              className="w-full py-3.5 px-4 bg-[#1d1f27] hover:bg-[#121318] text-white text-xs sm:text-sm font-semibold rounded-2xl shadow-[0_6px_20px_rgba(0,0,0,0.15)] transition-all active:scale-[0.99] disabled:opacity-60 cursor-pointer flex items-center justify-center gap-2 mt-2"
            >
              {actionLoading ? (
                'Processing...'
              ) : authMode === 'login' ? (
                'Get Started'
              ) : authMode === 'signup' ? (
                'Create Account'
              ) : (
                'Verify Code'
              )}
            </button>
          </form>

          {/* Dotted Divider */}
          <div className="relative flex items-center justify-center my-5">
            <div className="border-t border-dotted border-zinc-300 w-full" />
            <span className="bg-transparent px-3 text-[11px] text-zinc-400 font-normal tracking-wide whitespace-nowrap">
              Or sign in with
            </span>
            <div className="border-t border-dotted border-zinc-300 w-full" />
          </div>

          {/* Social Row: Google, Facebook, Apple */}
          <div className="grid grid-cols-3 gap-3">
            {/* Google */}
            <button
              type="button"
              onClick={() => {
                setLocalError('');
                loginWithGoogle();
              }}
              className="h-11 bg-white hover:bg-zinc-50 border border-zinc-200/90 rounded-2xl flex items-center justify-center shadow-xs hover:border-zinc-300 transition-all active:scale-95 cursor-pointer"
              title="Sign in with Google"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
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
            </button>

            {/* Facebook */}
            <button
              type="button"
              onClick={loginAsDemo}
              className="h-11 bg-white hover:bg-zinc-50 border border-zinc-200/90 rounded-2xl flex items-center justify-center shadow-xs hover:border-zinc-300 transition-all active:scale-95 cursor-pointer"
              title="Sign in with Facebook"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="#1877F2">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
              </svg>
            </button>

            {/* Apple */}
            <button
              type="button"
              onClick={loginAsDemo}
              className="h-11 bg-white hover:bg-zinc-50 border border-zinc-200/90 rounded-2xl flex items-center justify-center shadow-xs hover:border-zinc-300 transition-all active:scale-95 cursor-pointer text-zinc-900"
              title="Sign in with Apple"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.37c.62-.75 1.04-1.8 0.92-2.85-.9.04-2 .6-2.65 1.36-.58.67-.99 1.74-.86 2.78 1.01.08 1.97-.54 2.59-1.29z" />
              </svg>
            </button>
          </div>

          {/* Mode Switcher & Quick Demo */}
          <div className="mt-5 text-center space-y-2">
            <p className="text-xs text-zinc-500">
              {authMode === 'login' ? "Don't have an account? " : 'Already have an account? '}
              <button
                type="button"
                onClick={() => {
                  setAuthMode(authMode === 'login' ? 'signup' : 'login');
                  setLocalError('');
                  setInfoMessage('');
                }}
                className="text-zinc-900 font-semibold hover:underline cursor-pointer ml-1"
              >
                {authMode === 'login' ? 'Sign up' : 'Sign in'}
              </button>
            </p>

            <button
              type="button"
              onClick={loginAsDemo}
              className="text-[11px] text-zinc-400 hover:text-zinc-700 transition cursor-pointer inline-flex items-center gap-1 mx-auto"
            >
              <Zap className="w-3 h-3 text-amber-500" />
              <span>Instant Demo Access</span>
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  // =========================================================================
  // AUTHENTICATED: EXECUTIVE DASHBOARD (NON-BULKY BENTO WORKSPACE)
  // =========================================================================
  const displayName = user?.name || (user?.email ? user.email.split('@')[0] : 'Akshat');
  const todayFormattedHeader = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  });

  return (
    <div className="min-h-screen bg-[#fafbfc] text-zinc-900 flex flex-col relative overflow-x-hidden selection:bg-accent-100 selection:text-accent-900">
      {/* ====================================================================
       * SLEEK EXECUTIVE TOP BAR
       * ==================================================================== */}
      <motion.header
        initial={{ opacity: 0, y: -15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-zinc-200/80 shadow-2xs"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-15 flex items-center justify-between">
          {/* Brand & Greeting */}
          <div className="flex items-center gap-3">
            <MeridianLogo className="w-8 h-8" />
            <div className="flex items-center gap-2.5">
              <span className="text-xl font-bold tracking-tight text-zinc-900 font-serif">Meridian</span>
              <span className="hidden sm:inline text-zinc-300">/</span>
              <span className="hidden sm:inline text-xs font-medium text-zinc-500">
                Welcome, <span className="font-semibold text-zinc-800">{displayName}</span>
              </span>
            </div>
          </div>

          {/* Right Controls: Status & User Profile */}
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200/70 text-[11px] font-semibold text-emerald-700">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>Bedrock AI Active</span>
            </div>

            <UserProfileMenu />
          </div>
        </div>
      </motion.header>

      {/* ====================================================================
       * MAIN EXECUTIVE WORKSPACE CANVAS
       * ==================================================================== */}
      <main className="relative z-10 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-5 sm:py-6 flex-1">
        {/* 1. Executive Horizon Pulse Ribbon */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.05 }}
          className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-5"
        >
          {/* Tasks Pulse */}
          <button
            type="button"
            onClick={() => setActiveTab('focus')}
            className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
              activeTab === 'focus'
                ? 'bg-zinc-900 text-white border-zinc-900 shadow-sm'
                : 'bg-white hover:bg-zinc-50 border-zinc-200/80 text-zinc-900 shadow-2xs'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span
                className={`text-[10px] font-bold uppercase tracking-wider ${
                  activeTab === 'focus' ? 'text-zinc-400' : 'text-zinc-400'
                }`}
              >
                Pending Tasks
              </span>
              <CheckSquare
                className={`w-3.5 h-3.5 ${
                  activeTab === 'focus' ? 'text-cyan-300' : 'text-zinc-500'
                }`}
              />
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-lg font-extrabold tracking-tight">
                {tasksSummary.pendingCount}
              </span>
              <span
                className={`text-[10px] ${
                  activeTab === 'focus' ? 'text-zinc-400' : 'text-zinc-500'
                }`}
              >
                ({tasksSummary.completedCount} done)
              </span>
            </div>
          </button>

          {/* Bills Pulse */}
          <button
            type="button"
            onClick={() => setActiveTab('finances')}
            className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
              activeTab === 'finances'
                ? 'bg-zinc-900 text-white border-zinc-900 shadow-sm'
                : 'bg-white hover:bg-zinc-50 border-zinc-200/80 text-zinc-900 shadow-2xs'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span
                className={`text-[10px] font-bold uppercase tracking-wider ${
                  activeTab === 'finances' ? 'text-zinc-400' : 'text-zinc-400'
                }`}
              >
                Unpaid Bills
              </span>
              <CreditCard
                className={`w-3.5 h-3.5 ${
                  activeTab === 'finances' ? 'text-cyan-300' : 'text-zinc-500'
                }`}
              />
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-lg font-extrabold tracking-tight">
                ₹{(billsSummary.totalUnpaidAmount || 0).toLocaleString('en-IN')}
              </span>
              {billsSummary.overdueCount > 0 && (
                <span className="text-[10px] font-bold text-rose-500">
                  {billsSummary.overdueCount} overdue
                </span>
              )}
            </div>
          </button>

          {/* Spending Pulse */}
          <button
            type="button"
            onClick={() => setActiveTab('finances')}
            className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
              activeTab === 'finances'
                ? 'bg-zinc-900 text-white border-zinc-900 shadow-sm'
                : 'bg-white hover:bg-zinc-50 border-zinc-200/80 text-zinc-900 shadow-2xs'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span
                className={`text-[10px] font-bold uppercase tracking-wider ${
                  activeTab === 'finances' ? 'text-zinc-400' : 'text-zinc-400'
                }`}
              >
                Monthly Spend
              </span>
              <PieChart
                className={`w-3.5 h-3.5 ${
                  activeTab === 'finances' ? 'text-cyan-300' : 'text-zinc-500'
                }`}
              />
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-lg font-extrabold tracking-tight">
                ₹{(spendingSummary.currentMonthTotal || 0).toLocaleString('en-IN')}
              </span>
            </div>
          </button>

          {/* Calendar Pulse */}
          <button
            type="button"
            onClick={() => setActiveTab('focus')}
            className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
              activeTab === 'focus'
                ? 'bg-zinc-900 text-white border-zinc-900 shadow-sm'
                : 'bg-white hover:bg-zinc-50 border-zinc-200/80 text-zinc-900 shadow-2xs'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span
                className={`text-[10px] font-bold uppercase tracking-wider ${
                  activeTab === 'focus' ? 'text-zinc-400' : 'text-zinc-400'
                }`}
              >
                Next 7 Days
              </span>
              <Calendar
                className={`w-3.5 h-3.5 ${
                  activeTab === 'focus' ? 'text-cyan-300' : 'text-zinc-500'
                }`}
              />
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-lg font-extrabold tracking-tight">
                {calendarSummary.next7DaysCount || 0}
              </span>
              <span
                className={`text-[10px] ${
                  activeTab === 'focus' ? 'text-zinc-400' : 'text-zinc-500'
                }`}
              >
                Events
              </span>
            </div>
          </button>

          {/* Habits & Vault Pulse */}
          <button
            type="button"
            onClick={() => setActiveTab('life')}
            className={`p-3 rounded-2xl border text-left transition-all cursor-pointer col-span-2 sm:col-span-1 ${
              activeTab === 'life'
                ? 'bg-zinc-900 text-white border-zinc-900 shadow-sm'
                : 'bg-white hover:bg-zinc-50 border-zinc-200/80 text-zinc-900 shadow-2xs'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span
                className={`text-[10px] font-bold uppercase tracking-wider ${
                  activeTab === 'life' ? 'text-zinc-400' : 'text-zinc-400'
                }`}
              >
                Habits & Vault
              </span>
              <HeartPulse
                className={`w-3.5 h-3.5 ${
                  activeTab === 'life' ? 'text-cyan-300' : 'text-zinc-500'
                }`}
              />
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-lg font-extrabold tracking-tight">
                {healthSummary.totalCount || 0}
              </span>
              <span
                className={`text-[10px] ${
                  activeTab === 'life' ? 'text-zinc-400' : 'text-zinc-500'
                }`}
              >
                habits • {docsSummary.totalCount || 0} docs
              </span>
            </div>
          </button>
        </motion.div>

        {/* 2. Workspace Segmented Navigation */}
        <div className="flex items-center justify-between flex-wrap gap-3 mb-5">
          <div className="flex items-center gap-1 p-1 bg-zinc-200/70 rounded-xl">
            <button
              type="button"
              onClick={() => setActiveTab('overview')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'overview'
                  ? 'bg-white text-zinc-900 shadow-2xs font-bold'
                  : 'text-zinc-600 hover:text-zinc-900'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Overview</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('focus')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'focus'
                  ? 'bg-white text-zinc-900 shadow-2xs font-bold'
                  : 'text-zinc-600 hover:text-zinc-900'
              }`}
            >
              <CheckSquare className="w-3.5 h-3.5" />
              <span>Tasks & Schedule</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('finances')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'finances'
                  ? 'bg-white text-zinc-900 shadow-2xs font-bold'
                  : 'text-zinc-600 hover:text-zinc-900'
              }`}
            >
              <CreditCard className="w-3.5 h-3.5" />
              <span>Finances & Spending</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('life')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'life'
                  ? 'bg-white text-zinc-900 shadow-2xs font-bold'
                  : 'text-zinc-600 hover:text-zinc-900'
              }`}
            >
              <HeartPulse className="w-3.5 h-3.5" />
              <span>Health & Documents</span>
            </button>
          </div>

          <div className="text-xs text-zinc-400 font-medium hidden sm:block">
            {todayFormattedHeader}
          </div>
        </div>

        {/* 3. Main Dynamic Content by Workspace View */}
        <AnimatePresence mode="wait">
          {activeTab === 'overview' && (
            <motion.div
              key="overview"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
            >
              {/* Sleek Intelligence Banner */}
              <Briefing />

              {/* Bento Grid Architecture */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
                {/* Left Column (7 cols / ~58%) */}
                <div className="lg:col-span-7 space-y-5">
                  <Tasks />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <Bills />
                    <Spending />
                  </div>
                </div>

                {/* Right Column (5 cols / ~42%) */}
                <div className="lg:col-span-5 space-y-5">
                  <CalendarView />
                  <Health />
                  <Documents />
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'focus' && (
            <motion.div
              key="focus"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
            >
              <Briefing />
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-start">
                <div>
                  <Tasks />
                </div>
                <div>
                  <CalendarView />
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'finances' && (
            <motion.div
              key="finances"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-start"
            >
              <div>
                <Bills />
              </div>
              <div>
                <Spending />
              </div>
            </motion.div>
          )}

          {activeTab === 'life' && (
            <motion.div
              key="life"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-start"
            >
              <div>
                <Health />
              </div>
              <div>
                <Documents />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Architectural Footer */}
      <footer className="relative z-10 py-5 mt-8 text-center text-xs text-zinc-400 font-medium border-t border-zinc-200/60">
        Meridian • Powered by AWS Bedrock & Claude 3.5 Sonnet
      </footer>
    </div>
  );
}
