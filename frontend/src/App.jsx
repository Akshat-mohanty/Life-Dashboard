/**
 * Life Dashboard — Main Application
 * Layout:
 * - Top Bar: App Title left, User Profile + Logout right
 * - Top: AI Morning Briefing Card (Full Width)
 * - 3-Column Grid on Desktop (1-Column on Mobile):
 *   Left: Bills + Spending
 *   Center: Tasks + Calendar
 *   Right: Health + Documents
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

  // Unauthenticated: Render Sign In / Sign Up / Demo View
  if (!isAuthenticated && !authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-950 flex flex-col justify-center items-center px-4 py-12">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-emerald-500/20 border border-emerald-400/30 text-emerald-400 mb-3 shadow-lg shadow-emerald-500/10">
            <Compass className="w-8 h-8" />
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Life Dashboard</h1>
          <p className="text-slate-400 text-sm mt-1 max-w-sm mx-auto">
            10 apps replaced by 1 intelligent page with daily Bedrock AI briefings.
          </p>
        </div>

        {/* Auth Card */}
        <div className="w-full max-w-md bg-white/95 backdrop-blur-md rounded-2xl border border-white/20 p-8 shadow-2xl">
          <div className="flex border-b border-slate-200 mb-6">
            <button
              onClick={() => {
                setAuthMode('login');
                setLocalError('');
              }}
              className={`flex-1 pb-3 text-sm font-bold border-b-2 transition ${
                authMode === 'login'
                  ? 'border-emerald-600 text-emerald-700'
                  : 'border-transparent text-slate-400 hover:text-slate-600'
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => {
                setAuthMode('signup');
                setLocalError('');
              }}
              className={`flex-1 pb-3 text-sm font-bold border-b-2 transition ${
                authMode === 'signup' || authMode === 'confirm'
                  ? 'border-emerald-600 text-emerald-700'
                  : 'border-transparent text-slate-400 hover:text-slate-600'
              }`}
            >
              Create Account
            </button>
          </div>

          {(localError || authError) && (
            <div className="p-3 mb-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
              {localError || authError}
            </div>
          )}

          {infoMessage && (
            <div className="p-3 mb-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-medium">
              {infoMessage}
            </div>
          )}

          <form onSubmit={handleAuthSubmit} className="space-y-4">
            {authMode === 'signup' && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Your Name</label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    placeholder="Akshat Mohanty"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full text-xs px-3 py-2.5 pl-9 bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                </div>
              </div>
            )}

            {authMode !== 'confirm' ? (
              <>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address</label>
                  <div className="relative">
                    <input
                      type="email"
                      required
                      placeholder="akshat@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full text-xs px-3 py-2.5 pl-9 bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Password</label>
                  <div className="relative">
                    <input
                      type="password"
                      required
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full text-xs px-3 py-2.5 pl-9 bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  </div>
                </div>
              </>
            ) : (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Confirmation Code</label>
                <input
                  type="text"
                  required
                  placeholder="6-digit code"
                  value={confirmCode}
                  onChange={(e) => setConfirmCode(e.target.value)}
                  className="w-full text-xs px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-center tracking-widest text-lg font-mono font-bold"
                />
                <span className="text-[11px] text-slate-400 mt-1 block">Check your inbox for the code sent by AWS Cognito.</span>
              </div>
            )}

            <button
              type="submit"
              disabled={actionLoading}
              className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-md transition active:scale-[0.99] flex items-center justify-center gap-1.5 disabled:opacity-60"
            >
              {actionLoading ? (
                'Processing...'
              ) : (
                <>
                  <span>
                    {authMode === 'login'
                      ? 'Sign In to Dashboard'
                      : authMode === 'signup'
                      ? 'Create My Account'
                      : 'Verify & Continue'}
                  </span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Access */}
          <div className="mt-6 pt-5 border-t border-slate-200 text-center">
            <button
              type="button"
              onClick={loginAsDemo}
              className="w-full py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl border border-slate-300/80 transition flex items-center justify-center gap-2"
            >
              <Zap className="w-4 h-4 text-amber-500" />
              <span>Continue as Demo User (Instant)</span>
            </button>
          </div>
        </div>

        <div className="mt-8 text-center text-xs text-slate-500 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Secured with AWS Cognito & AWS Cedar Policy Authorization</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
      {/* ====================================================================
       * FULL-WIDTH TOP BAR
       * ==================================================================== */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Brand Left */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-sm shadow-emerald-500/20">
              <Compass className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-extrabold text-slate-900 tracking-tight">Life Dashboard</h1>
                <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <ShieldCheck className="w-3 h-3 text-emerald-600" />
                  Cedar Secured
                </span>
              </div>
              <p className="text-[11px] text-slate-500 hidden sm:block">Unified Daily Management System</p>
            </div>
          </div>

          {/* User Profile + Logout Right */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 pl-2">
              <div className="w-9 h-9 rounded-full bg-emerald-100 border border-emerald-300 text-emerald-800 flex items-center justify-center font-bold text-xs">
                {(user?.name || user?.email || 'U').charAt(0).toUpperCase()}
              </div>
              <div className="hidden md:block text-left">
                <p className="text-xs font-bold text-slate-900 leading-none">{user?.name || 'User'}</p>
                <p className="text-[10px] text-slate-400 mt-0.5">{user?.email || 'authenticated'}</p>
              </div>
            </div>

            <button
              onClick={logout}
              className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* ====================================================================
       * MAIN CONTENT CONTAINER
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
      <footer className="border-t border-slate-200/80 bg-white py-6 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>AWS Serverless Production Architecture</span>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-[11px]">
            <span className="px-2 py-0.5 bg-slate-100 rounded-md text-slate-600 font-medium">Lambda</span>
            <span className="px-2 py-0.5 bg-slate-100 rounded-md text-slate-600 font-medium">API Gateway</span>
            <span className="px-2 py-0.5 bg-slate-100 rounded-md text-slate-600 font-medium">DynamoDB</span>
            <span className="px-2 py-0.5 bg-slate-100 rounded-md text-slate-600 font-medium">Amazon S3</span>
            <span className="px-2 py-0.5 bg-slate-100 rounded-md text-slate-600 font-medium">EventBridge</span>
            <span className="px-2 py-0.5 bg-slate-100 rounded-md text-slate-600 font-medium">Claude 3.5 Sonnet</span>
            <span className="px-2 py-0.5 bg-slate-100 rounded-md text-slate-600 font-medium">AWS Cedar</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
