/**
 * LandingPage.jsx
 * Pixel-perfect editorial landing page inspired by reference design.
 * Features:
 * - Editorial typography & soft linen off-white palette (#f5f3ef / #faf9f6)
 * - Hero headline ("Unwind. Kick Back. Recharge.") & email capture bar
 * - Serene nature landscape hero banner in its dedicated place
 * - 3D angled iPhone device mockup displaying the actual mobile Life Dashboard UI
 * - Floating black feature badge pills (Daily AI Briefing, Smart Bill Alerts, etc.)
 * - "Why join?" editorial value proposition section
 * - Interactive Auth Modal supporting Email, Google OAuth, and Instant Demo Access
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Menu,
  X,
  Sparkles,
  Check,
  Lock,
  Mail,
  User,
  Eye,
  EyeOff,
  Zap,
  Key,
  Calendar,
  CreditCard,
  PieChart as PieChartIcon,
  CheckSquare,
  ArrowRight,
  ChevronRight,
} from 'lucide-react';

export default function LandingPage({
  onLogin,
  onSignup,
  onConfirmSignup,
  onForgotPassword,
  onLoginAsDemo,
  onLoginWithGoogle,
  authError,
  actionLoading,
}) {
  // Hero email input & terms checkbox state
  const [heroEmail, setHeroEmail] = useState('');
  const [agreedToTerms, setAgreedToTerms] = useState(true);

  // Auth modal state
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState('signup'); // 'signup' | 'login' | 'confirm'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [confirmCode, setConfirmCode] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [localError, setLocalError] = useState('');
  const [infoMessage, setInfoMessage] = useState('');

  // Mobile navigation drawer state
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Trigger auth modal with prefilled email
  const openAuthWithEmail = (defaultMode = 'signup') => {
    setAuthMode(defaultMode);
    if (heroEmail.trim()) {
      setEmail(heroEmail.trim());
    }
    setLocalError('');
    setInfoMessage('');
    setIsAuthModalOpen(true);
  };

  const handleHeroSubmit = (e) => {
    e.preventDefault();
    if (!agreedToTerms) {
      alert('Please accept the Privacy Policy and Terms and Conditions to proceed.');
      return;
    }
    openAuthWithEmail('signup');
  };

  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    setLocalError('');
    setInfoMessage('');

    try {
      if (authMode === 'login') {
        await onLogin(email, password);
      } else if (authMode === 'signup') {
        const res = await onSignup(email, password, name);
        if (res?.isConfirmed) {
          setInfoMessage('Account created! Logging in...');
        } else {
          setAuthMode('confirm');
          setInfoMessage(`Verification code sent to ${email}.`);
        }
      } else if (authMode === 'confirm') {
        await onConfirmSignup(email, confirmCode);
        setInfoMessage('Account confirmed! Logging in...');
        await onLogin(email, password);
      }
    } catch (err) {
      setLocalError(err.message || 'Authentication failed. Please check your credentials.');
    }
  };

  return (
    <div className="min-h-screen bg-white text-zinc-900 font-sans selection:bg-zinc-900 selection:text-white relative overflow-x-hidden">
      {/* =====================================================================
          TOP NAVIGATION BAR
          ===================================================================== */}
      <header className="w-full border-b border-black/5 bg-[#dad9de]/60 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-5 sm:px-8 h-20 flex items-center justify-between">
          {/* Left: Menu Button */}
          <button
            type="button"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-zinc-800 hover:text-black transition cursor-pointer p-1 rounded-lg"
          >
            <div className="w-4 h-3 flex flex-col justify-between">
              <span className="w-full h-0.5 bg-zinc-900 rounded-full" />
              <span className="w-full h-0.5 bg-zinc-900 rounded-full" />
              <span className="w-3/4 h-0.5 bg-zinc-900 rounded-full" />
            </div>
            <span>Menu</span>
          </button>

          {/* Center: Brand Logo */}
          <div className="flex items-center gap-1">
            <span className="text-xl sm:text-2xl font-black tracking-tight uppercase text-zinc-950 font-serif">
              EBOLT
            </span>
            <span className="text-[10px] font-bold text-zinc-500 align-super">®</span>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onLoginAsDemo}
              className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-2 rounded-[3px] text-xs font-medium text-zinc-700 hover:text-black hover:bg-black/5 transition cursor-pointer"
            >
              <Zap className="w-3.5 h-3.5 text-amber-500" />
              <span>Instant Demo</span>
            </button>

            <button
              type="button"
              onClick={() => openAuthWithEmail('login')}
              className="px-5 py-2.5 bg-zinc-900 hover:bg-black text-white text-xs font-semibold rounded-[3px] shadow-2xs hover:shadow-xs transition-all active:scale-95 cursor-pointer whitespace-nowrap tracking-normal"
            >
              Get Started
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Menu Dropdown */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-white border-b border-zinc-200 px-6 py-4 space-y-3 z-30 shadow-md relative"
          >
            <div className="flex flex-col gap-2.5 text-sm font-semibold text-zinc-700">
              <button
                type="button"
                onClick={() => {
                  setIsMenuOpen(false);
                  openAuthWithEmail('signup');
                }}
                className="text-left py-1 hover:text-zinc-950 cursor-pointer"
              >
                Sign up with Email
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsMenuOpen(false);
                  openAuthWithEmail('login');
                }}
                className="text-left py-1 hover:text-zinc-950 cursor-pointer"
              >
                Sign in to Existing Account
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsMenuOpen(false);
                  onLoginAsDemo();
                }}
                className="text-left py-1 text-indigo-600 font-bold flex items-center gap-1.5 cursor-pointer"
              >
                <Zap className="w-4 h-4 text-amber-500" />
                <span>Try Demo Mode!</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* =====================================================================
          HERO SECTION (Full-Bleed Nature Landscape with Centered Headline & Email Bar)
          ===================================================================== */}
      <section className="relative w-full overflow-hidden bg-[#dad9de]">
        {/* Full Nature Landscape Background Image */}
        <img
          src="/nature-hero.png"
          alt="Tranquil countryside landscape with fire pit and lounge chairs"
          className="w-full h-full object-cover object-bottom absolute inset-0 z-0 pointer-events-none select-none"
        />

        {/* Hero Interactive Content Layer */}
        <div className="relative z-10 max-w-4xl mx-auto px-5 sm:px-8 pt-10 sm:pt-14 md:pt-18 pb-64 sm:pb-76 md:pb-[340px] lg:pb-[390px] text-center">
          {/* Editorial Headline matching reference style */}
          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-4xl sm:text-6xl md:text-[68px] font-black tracking-tight text-zinc-950 leading-[1.08]"
          >
            Unwind. Kick Back.
            <br />
            Recharge.
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-sm sm:text-base text-zinc-700 max-w-lg mx-auto mt-4 sm:mt-5 leading-relaxed font-normal"
          >
            We unify your daily tasks, bills, schedule & documents,
            <br className="hidden sm:inline" />
            so you receive autonomous morning AI clarity for free.
          </motion.p>

          {/* Email Signup Bar matching reference */}
          <motion.form
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            onSubmit={handleHeroSubmit}
            className="mt-6 sm:mt-8 max-w-md mx-auto"
          >
            <div className="flex items-center bg-white rounded-full p-1.5 border border-black/10 shadow-[0_4px_24px_rgba(0,0,0,0.08)] focus-within:border-zinc-500 focus-within:ring-2 focus-within:ring-zinc-900/10 transition">
              <input
                type="email"
                required
                placeholder="Your email"
                value={heroEmail}
                onChange={(e) => setHeroEmail(e.target.value)}
                className="w-full px-5 py-2.5 bg-transparent text-xs sm:text-sm text-zinc-900 placeholder-zinc-400 focus:outline-none"
              />
              <button
                type="submit"
                className="px-6 py-2.5 bg-zinc-900 hover:bg-black text-white text-xs sm:text-sm font-bold rounded-full shadow-xs transition-all active:scale-95 cursor-pointer shrink-0"
              >
                Join
              </button>
            </div>

            {/* Agreement Checkbox */}
            <div className="flex items-center justify-center gap-2 mt-3.5 text-[11px] text-zinc-600 font-medium">
              <input
                type="checkbox"
                id="terms-check"
                checked={agreedToTerms}
                onChange={(e) => setAgreedToTerms(e.target.checked)}
                className="rounded border-zinc-300 text-zinc-900 focus:ring-zinc-900 cursor-pointer"
              />
              <label htmlFor="terms-check" className="cursor-pointer select-none">
                I agree to the{' '}
                <span className="underline hover:text-zinc-900">Privacy Policy</span> and{' '}
                <span className="underline hover:text-zinc-900">Terms and Conditions</span>
              </label>
            </div>
          </motion.form>
        </div>
      </section>

      {/* =====================================================================
          "WHY JOIN?" SECTION WITH 3D TILTED IPHONE (MOBILE LIFE DASHBOARD)
          ===================================================================== */}
      <section className="w-full bg-white py-12 sm:py-20 border-t border-zinc-100">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          {/* Left: 3D Angled iPhone Device Mockup with Floating Feature Badges */}
          <div className="lg:col-span-7 flex items-center justify-center relative py-6">
            {/* Background ambient glow behind device */}
            <div className="absolute w-72 h-72 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />

            {/* Sleek Floating App Window & Interactive Showcase */}
            <div className="relative w-full max-w-[480px]">
              {/* Background ambient lighting */}
              <div className="absolute -inset-4 bg-gradient-to-tr from-cyan-500/10 via-indigo-500/10 to-emerald-500/10 rounded-3xl blur-2xl pointer-events-none" />

              {/* Main Application Window */}
              <div className="relative bg-white rounded-2xl border border-zinc-200/90 shadow-[0_24px_60px_-15px_rgba(0,0,0,0.12),0_4px_16px_-4px_rgba(0,0,0,0.06)] overflow-hidden select-none">
                {/* Window Chrome / Title Bar */}
                <div className="px-4 py-3 bg-zinc-50/90 border-b border-zinc-100 flex items-center justify-between">
                  {/* Traffic Light Dots */}
                  <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-rose-400/80" />
                    <div className="w-2.5 h-2.5 rounded-full bg-amber-400/80" />
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-400/80" />
                  </div>

                  {/* Window Title & URL Badge */}
                  <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-zinc-200/70 text-[10px] font-semibold text-zinc-700 shadow-2xs">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span>ebolt.app/dashboard</span>
                  </div>

                  {/* Date Badge */}
                  <span className="text-[10px] font-semibold text-zinc-500">
                    Today • Sep 19
                  </span>
                </div>

                {/* Window Body: Real Life Dashboard Widgets */}
                <div className="p-4 sm:p-5 space-y-3.5 bg-[#f8f9fb]">
                  {/* 1. Today's AI Morning Briefing Card */}
                  <div className="bg-zinc-950 text-white rounded-xl p-4 border border-zinc-800 shadow-md">
                    <div className="flex items-center justify-between pb-2 border-b border-zinc-800/80 mb-2.5">
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-cyan-300" />
                        <span className="text-xs font-bold tracking-tight">
                          Your Briefing!
                        </span>
                      </div>
                      <span className="text-[9px] uppercase tracking-wider font-bold text-emerald-400 bg-emerald-500/20 px-2 py-0.5 rounded-md">
                        Synthesized
                      </span>
                    </div>
                    <p className="text-xs text-zinc-300 leading-relaxed font-normal">
                      You have 2 tasks remaining for today!
                    </p>
                  </div>

                  {/* 2. Tasks Widget */}
                  <div className="bg-white rounded-xl p-3.5 border border-zinc-200/90 shadow-2xs">
                    <div className="flex items-center justify-between mb-2.5">
                      <div className="flex items-center gap-2">
                        <CheckSquare className="w-4 h-4 text-cyan-600" />
                        <span className="text-xs font-bold text-zinc-900">Today's Tasks</span>
                      </div>
                      <span className="text-[10px] font-semibold text-zinc-400">2 pending</span>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2.5 p-2 rounded-lg bg-zinc-50 border border-zinc-100 text-xs text-zinc-800">
                        <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0" />
                        <span className="font-medium truncate">Review AWS Bedrock architecture</span>
                      </div>
                      <div className="flex items-center gap-2.5 p-2 rounded-lg bg-zinc-50 border border-zinc-100 text-xs text-zinc-800">
                        <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
                        <span className="font-medium truncate">Pay electricity & utilities</span>
                      </div>
                    </div>
                  </div>

                  {/* 3. Bills & Spending Mini Grid */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-white rounded-xl p-3 border border-zinc-200/90 shadow-2xs">
                      <div className="flex items-center gap-1.5 text-[10px] font-bold text-zinc-500">
                        <CreditCard className="w-3.5 h-3.5 text-cyan-600" />
                        <span>Bills</span>
                      </div>
                      <p className="text-base font-black text-zinc-900 mt-1">₹2,450</p>
                      <p className="text-[10px] text-zinc-400 mt-0.5 font-medium">Due in 3 days</p>
                    </div>

                    <div className="bg-white rounded-xl p-3 border border-zinc-200/90 shadow-2xs">
                      <div className="flex items-center gap-1.5 text-[10px] font-bold text-zinc-500">
                        <PieChartIcon className="w-3.5 h-3.5 text-indigo-600" />
                        <span>Spending</span>
                      </div>
                      <p className="text-base font-black text-zinc-900 mt-1">₹14,200</p>
                      <p className="text-[10px] text-emerald-600 font-semibold mt-0.5">28% of budget</p>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </div>

          {/* Right: "Why join?" Editorial Copy matching reference style */}
          <div className="lg:col-span-5 text-left space-y-5 lg:pl-6">
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-zinc-950">
              Why join?
            </h2>

            <p className="text-sm text-zinc-700 leading-relaxed font-normal">
              Ebolt forms seamless autonomous partnerships with your daily schedule, tasks, bills, and documents—synthesizing them into clear morning intelligence briefings.
            </p>

            <p className="text-sm text-zinc-700 leading-relaxed font-normal">
              What does this mean for you as a user? You will have immediate clarity on urgent obligations, total visibility over your monthly expenses, and full access to your lifetime archive.
            </p>

            <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <button
                type="button"
                onClick={() => openAuthWithEmail('signup')}
                className="px-6 py-3 bg-zinc-900 hover:bg-black text-white text-xs sm:text-sm font-semibold rounded-[3px] shadow-xs hover:shadow-sm transition active:scale-95 cursor-pointer text-center"
              >
                Become a Member
              </button>

              <button
                type="button"
                onClick={onLoginAsDemo}
                className="px-5 py-3 bg-white hover:bg-zinc-100 text-zinc-900 text-xs sm:text-sm font-semibold rounded-[3px] border border-zinc-300 shadow-2xs transition active:scale-95 cursor-pointer text-center flex items-center justify-center gap-2"
              >
                <Zap className="w-3.5 h-3.5 text-amber-500" />
                <span>Try Live Demo</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================================
          FOOTER
          ===================================================================== */}
      <footer className="border-t border-zinc-300/80 py-8 px-6 text-center text-xs text-zinc-500 bg-[#f5f3ef]">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 font-serif font-black text-sm text-zinc-900">
            <span>EBOLT</span>
          </div>
          <p>© 2026 Ebolt; Built with ❤️ by Akshat Mohanty</p>
        </div>
      </footer>

      {/* =====================================================================
          AUTH MODAL POPUP (Sign Up / Login / Google OAuth / Demo)
          ===================================================================== */}
      <AnimatePresence>
        {isAuthModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
            onClick={() => setIsAuthModalOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-white rounded-[28px] border border-zinc-200 shadow-2xl p-6 sm:p-8 max-w-[420px] w-full relative my-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close Button */}
              <button
                type="button"
                onClick={() => setIsAuthModalOpen(false)}
                className="absolute top-4 right-4 w-7 h-7 rounded-full bg-zinc-100 hover:bg-zinc-200 text-zinc-600 flex items-center justify-center transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>

              {/* Heading */}
              <h3 className="text-xl font-bold text-zinc-900 text-center tracking-tight pt-1">
                {authMode === 'login'
                  ? 'Sign in with email'
                  : authMode === 'signup'
                  ? 'Sign up with email'
                  : 'Confirm your email'}
              </h3>
              <p className="text-xs text-zinc-500 text-center mt-1.5 mb-5">
                {authMode === 'confirm'
                  ? `Enter code sent to ${email}`
                  : 'Access your AI intelligence briefing and personal partition.'}
              </p>

              {/* Errors & Info messages */}
              {(localError || authError) && (
                <div className="p-2.5 mb-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
                  {localError || authError}
                </div>
              )}
              {infoMessage && (
                <div className="p-2.5 mb-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium">
                  {infoMessage}
                </div>
              )}

              {/* Form */}
              <form onSubmit={handleAuthSubmit} className="space-y-3.5">
                {authMode === 'signup' && (
                  <div className="relative flex items-center bg-zinc-50 border border-zinc-200 rounded-xl px-3.5 py-3 focus-within:border-zinc-400 transition">
                    <User className="w-4 h-4 text-zinc-400 mr-2 shrink-0" />
                    <input
                      type="text"
                      required
                      placeholder="Your Name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full bg-transparent text-xs sm:text-sm text-zinc-900 focus:outline-none"
                    />
                  </div>
                )}

                {authMode !== 'confirm' ? (
                  <>
                    <div className="relative flex items-center bg-zinc-50 border border-zinc-200 rounded-xl px-3.5 py-3 focus-within:border-zinc-400 transition">
                      <Mail className="w-4 h-4 text-zinc-400 mr-2 shrink-0" />
                      <input
                        type="email"
                        required
                        placeholder="Email address"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full bg-transparent text-xs sm:text-sm text-zinc-900 focus:outline-none"
                      />
                    </div>

                    <div className="relative flex items-center bg-zinc-50 border border-zinc-200 rounded-xl px-3.5 py-3 focus-within:border-zinc-400 transition">
                      <Lock className="w-4 h-4 text-zinc-400 mr-2 shrink-0" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full bg-transparent text-xs sm:text-sm text-zinc-900 focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="text-zinc-400 hover:text-zinc-600 focus:outline-none cursor-pointer"
                      >
                        {showPassword ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="relative flex items-center bg-zinc-50 border border-zinc-200 rounded-xl px-3.5 py-3 focus-within:border-zinc-400 transition">
                    <Key className="w-4 h-4 text-zinc-400 mr-2 shrink-0" />
                    <input
                      type="text"
                      required
                      placeholder="6-digit verification code"
                      value={confirmCode}
                      onChange={(e) => setConfirmCode(e.target.value)}
                      className="w-full bg-transparent text-xs sm:text-sm text-zinc-900 focus:outline-none font-mono tracking-widest"
                    />
                  </div>
                )}

                {authMode === 'login' && (
                  <div className="flex justify-end pt-1">
                    <button
                      type="button"
                      onClick={() => onForgotPassword(email)}
                      className="text-xs text-zinc-500 hover:text-zinc-900 cursor-pointer"
                    >
                      Forgot password?
                    </button>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={actionLoading}
                  className="w-full py-3 px-4 bg-zinc-900 hover:bg-black text-white text-xs sm:text-sm font-semibold rounded-xl shadow-xs transition active:scale-95 disabled:opacity-60 cursor-pointer mt-2"
                >
                  {actionLoading
                    ? 'Processing...'
                    : authMode === 'login'
                    ? 'Sign In'
                    : authMode === 'signup'
                    ? 'Create Account'
                    : 'Verify Code'}
                </button>
              </form>

              {/* Divider */}
              <div className="relative flex items-center justify-center my-5 sm:my-6">
                <div className="border-t border-zinc-200 flex-1" />
                <span className="bg-white px-3.5 text-xs text-zinc-400 whitespace-nowrap shrink-0 font-medium">
                  Or continue with
                </span>
                <div className="border-t border-zinc-200 flex-1" />
              </div>

              {/* Social OAuth */}
              <button
                type="button"
                onClick={async () => {
                  setLocalError('');
                  try {
                    await onLoginWithGoogle();
                  } catch (err) {
                    setLocalError(err.message || 'Google OAuth is not configured yet.');
                  }
                }}
                className="w-full py-3 px-4 bg-white hover:bg-zinc-50 border border-zinc-200 hover:border-zinc-300 rounded-xl flex items-center justify-center gap-2.5 text-xs sm:text-sm font-semibold text-zinc-800 transition active:scale-95 cursor-pointer shadow-2xs hover:shadow-xs"
              >
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
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

              {/* Mode switch & Demo */}
              <div className="mt-5 sm:mt-6 text-center space-y-3">
                <p className="text-xs sm:text-[13px] text-zinc-500">
                  {authMode === 'login' ? "Don't have an account? " : 'Already have an account? '}
                  <button
                    type="button"
                    onClick={() => setAuthMode(authMode === 'login' ? 'signup' : 'login')}
                    className="text-zinc-950 font-bold hover:underline cursor-pointer ml-1"
                  >
                    {authMode === 'login' ? 'Sign up' : 'Sign in'}
                  </button>
                </p>

                <button
                  type="button"
                  onClick={() => {
                    setIsAuthModalOpen(false);
                    onLoginAsDemo();
                  }}
                  className="text-xs text-zinc-400 hover:text-zinc-800 transition cursor-pointer inline-flex items-center gap-1.5 mx-auto pt-0.5"
                >
                  <Zap className="w-3.5 h-3.5 text-amber-500" />
                  <span>Instant Demo Access</span>
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
