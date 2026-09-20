/**
 * Meridian — Main Application
 * Redesigned with Obsidian Black (#090A0F), Pure White, and Electric Indigo (#6366F1).
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  LogOut,
  User,
  Lock,
  Mail,
  ArrowRight,
  Zap,
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
  FolderArchive,
  Compass,
  ShieldCheck,
  History,
  ChevronDown,
  ChevronUp,
  CheckCircle,
  Clock,
  AlertCircle,
} from 'lucide-react';
import MeridianLogo from './components/MeridianLogo';
import { useAuth } from './hooks/useAuth';
import { useCurrency } from './hooks/useCurrency';
import Briefing from './components/Briefing';
import Bills from './components/Bills';
import Tasks from './components/Tasks';
import CalendarView from './components/CalendarView';
import Health from './components/Health';
import Documents from './components/Documents';
import Spending from './components/Spending';
import UserProfileMenu from './components/UserProfileMenu';
import HistoryArchiveModal from './components/HistoryArchiveModal';
import LandingPage from './components/LandingPage';
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
    forgotPassword,
    loading: authLoading,
    error: authError,
  } = useAuth();

  // Auth screen mode: 'signup' | 'login' | 'confirm' (defaults to 'signup')
  const [authMode, setAuthMode] = useState('signup');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [name, setName] = useState('');
  const [confirmCode, setConfirmCode] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [localError, setLocalError] = useState('');
  const [infoMessage, setInfoMessage] = useState('');

  const handleForgotPassword = async () => {
    setLocalError('');
    setInfoMessage('');

    if (!email || !email.trim()) {
      setLocalError('Please enter your email address.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setLocalError('Please enter a valid email address.');
      return;
    }

    try {
      const res = await forgotPassword(email.trim());
      setInfoMessage(res.message || 'Password reset email has been sent to your email.');
    } catch (err) {
      setLocalError(err.message || 'Password reset request failed.');
    }
  };

  const queryClient = useQueryClient();
  const { formatAmount } = useCurrency();

  // Historical Archive / Time Machine state (defaults to today YYYY-MM-DD)
  const [isArchiveModalOpen, setIsArchiveModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split('T')[0]);

  // Reset or invalidate queries when switching users so no cached data leaks across accounts
  useEffect(() => {
    if (user?.userId) {
      queryClient.invalidateQueries();
    } else {
      queryClient.clear();
    }
  }, [user?.userId, queryClient]);

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

  const todayStr = new Date().toISOString().split('T')[0];
  const sevenDaysLater = new Date();
  sevenDaysLater.setDate(sevenDaysLater.getDate() + 7);
  const maxDateStr = sevenDaysLater.toISOString().split('T')[0];

  const pendingTasksList = (tasksData?.items || []).filter((t) => !t.isCompleted);
  const pendingTasksCount = pendingTasksList.length;

  const unpaidBillsList = (billsData?.items || []).filter((b) => !b.isPaid);
  const unpaidBillsCount = unpaidBillsList.length;
  const unpaidBillsNext7Days = unpaidBillsList.filter(
    (b) => !b.dueDate || b.dueDate <= maxDateStr
  );
  const unpaidBillsNext7DaysCount = unpaidBillsNext7Days.length;

  const calendarEventsList = calendarData?.items || [];
  const calendarEvents7Days = calendarEventsList.filter((e) => !e.date || e.date <= maxDateStr);
  const calendarEvents7DaysCount = calendarEvents7Days.length;

  const activeHealthList = (healthData?.items || []).filter((h) => h.status !== 'completed');
  const pendingHealthCount = activeHealthList.length;

  const next7DaysTotalCount =
    calendarEvents7DaysCount + unpaidBillsNext7DaysCount + pendingHealthCount;

  const totalPendingObligations =
    pendingTasksCount + unpaidBillsCount + calendarEvents7DaysCount + pendingHealthCount;

  // Track user-expanded accordion categories in Overview
  const [expandedCategory, setExpandedCategory] = useState(null); // 'tasks' | 'calendar' | 'bills' | 'health' | null
  const [showAllWorkspaceTiles, setShowAllWorkspaceTiles] = useState(false);

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

  // 1. Loading state while checking authentication credentials
  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#fafbfc] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-medium text-zinc-400">Verifying session...</p>
        </div>
      </div>
    );
  }

  // =========================================================================
  // UNAUTHENTICATED: EDITORIAL REFERENCE-MATCHED LANDING PAGE
  // =========================================================================
  if (!isAuthenticated) {
    return (
      <LandingPage
        onLogin={login}
        onSignup={signup}
        onConfirmSignup={confirmSignup}
        onForgotPassword={handleForgotPassword}
        onLoginAsDemo={loginAsDemo}
        onLoginWithGoogle={loginWithGoogle}
        authError={authError}
        actionLoading={actionLoading}
      />
    );
  }

  // =========================================================================
  // AUTHENTICATED: EXECUTIVE DASHBOARD (NON-BULKY BENTO WORKSPACE)
  // =========================================================================
  const displayName = user?.name || (user?.email ? user.email.split('@')[0] : 'Akshat');
  const todayIso = new Date().toISOString().split('T')[0];
  const isTimeTravelActive = Boolean(selectedDate && selectedDate !== todayIso);
  const activeDateObj = new Date((selectedDate || todayIso) + 'T00:00:00');
  const activeDateFormattedHeader = activeDateObj.toLocaleDateString('en-US', {
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
            <UserProfileMenu />
          </div>
        </div>
      </motion.header>

      {/* ====================================================================
       * MAIN EXECUTIVE WORKSPACE CANVAS
       * ==================================================================== */}
      <main className="relative z-10 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-5 sm:py-6 flex-1">
        {/* Time-Travel Historical Banner */}
        {isTimeTravelActive && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-5 p-3.5 sm:p-4 rounded-2xl bg-gradient-to-r from-amber-50 to-orange-50/80 border border-amber-200/90 flex flex-wrap items-center justify-between gap-3 text-amber-900 text-xs shadow-2xs"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-amber-200 text-amber-900 flex items-center justify-center font-bold shadow-2xs">
                <Compass className="w-4 h-4 text-amber-900" />
              </div>
              <div>
                <div className="font-bold text-amber-950 flex items-center gap-2">
                  <span>Historical Life Archive Active:</span>
                  <span className="underline decoration-amber-400 font-extrabold">{activeDateFormattedHeader}</span>
                </div>
                <p className="text-[11px] text-amber-800 mt-0.5">
                  Browsing saved past records strictly isolated to your account ({user?.name || user?.email} • <code className="font-mono font-semibold">{user?.userId}</code>).
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsArchiveModalOpen(true)}
                className="px-3 py-1.5 rounded-xl bg-white border border-amber-300 font-semibold hover:bg-amber-100 text-amber-900 transition cursor-pointer shadow-2xs"
              >
                Change Date
              </button>
              <button
                type="button"
                onClick={() => setSelectedDate(todayIso)}
                className="px-3.5 py-1.5 rounded-xl bg-amber-600 text-white font-bold hover:bg-amber-700 shadow-2xs transition cursor-pointer"
              >
                Return to Today
              </button>
            </div>
          </motion.div>
        )}
        {/* 1. Executive Horizon Pulse Ribbon */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.05 }}
          className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-5"
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
                {formatAmount(billsSummary.totalUnpaidAmount || 0)}
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
                {formatAmount(spendingSummary.currentMonthTotal || 0)}
              </span>
            </div>
          </button>



          {/* Habits & Vault Pulse */}
          <button
            type="button"
            onClick={() => setActiveTab('life')}
            className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
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

          {/* Interactive Date & Historical Life Archive Launcher */}
          <button
            type="button"
            onClick={() => setIsArchiveModalOpen(true)}
            className={`group flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer shadow-2xs ${
              isTimeTravelActive
                ? 'bg-amber-50 text-amber-900 border-amber-300 ring-2 ring-amber-400/20'
                : 'bg-white hover:bg-zinc-50 text-zinc-700 hover:text-zinc-900 border-zinc-200/90'
            }`}
            title="Click to browse your past saved data & historical life archive"
          >
            <Calendar className="w-3.5 h-3.5 text-indigo-600 group-hover:scale-110 transition-transform" />
            <span>{activeDateFormattedHeader}</span>
            {isTimeTravelActive && (
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-200 text-amber-800">
                Historical
              </span>
            )}
          </button>
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
              className="space-y-5"
            >
              {/* Sleek Intelligence Banner */}
              <Briefing
                selectedDate={selectedDate}
                onOpenArchive={() => setIsArchiveModalOpen(true)}
              />

              {/* Status Header: Automatically states if tasks/obligations are pending */}
              <div className="bg-white border border-zinc-200/90 rounded-2xl p-5 shadow-2xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-start sm:items-center gap-3.5">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                        totalPendingObligations > 0
                          ? 'bg-amber-500/10 text-amber-600 border border-amber-500/20'
                          : 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20'
                      }`}
                    >
                      {totalPendingObligations > 0 ? (
                        <AlertCircle className="w-5 h-5" />
                      ) : (
                        <CheckCircle className="w-5 h-5" />
                      )}
                    </div>
                    <div>
                      <h2 className="text-base sm:text-lg font-bold text-zinc-900 tracking-tight flex items-center gap-2">
                        {totalPendingObligations > 0 ? (
                          <>
                            <span>You have {totalPendingObligations} pending items</span>
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-100 text-amber-800">
                              Action Required
                            </span>
                          </>
                        ) : (
                          <>
                            <span>All caught up! No pending obligations</span>
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-800">
                              Clear Horizon
                            </span>
                          </>
                        )}
                      </h2>
                      <p className="text-xs text-zinc-500 mt-0.5">
                        {totalPendingObligations > 0
                          ? 'Click on any category below to inspect specific pending items or view schedule.'
                          : 'Everything is in order. You can open any category or expand all tiles whenever needed.'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-start sm:self-auto">
                    <button
                      type="button"
                      onClick={() => setShowAllWorkspaceTiles((prev) => !prev)}
                      className="px-3 py-1.5 rounded-xl border border-zinc-200 text-xs font-semibold text-zinc-700 hover:text-zinc-900 hover:bg-zinc-50 transition cursor-pointer flex items-center gap-1.5"
                    >
                      <LayoutGrid className="w-3.5 h-3.5 text-zinc-500" />
                      <span>{showAllWorkspaceTiles ? 'Hide All Tiles' : 'Show All Tiles'}</span>
                    </button>
                  </div>
                </div>

                {/* Categories Breakdown Dropdowns */}
                <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {/* Category 1: Tasks */}
                  <div className="border border-zinc-200/80 rounded-xl overflow-hidden bg-zinc-50/50">
                    <button
                      type="button"
                      onClick={() =>
                        setExpandedCategory(expandedCategory === 'tasks' ? null : 'tasks')
                      }
                      className="w-full px-3.5 py-3 flex items-center justify-between text-left hover:bg-zinc-100/60 transition cursor-pointer"
                    >
                      <div className="flex items-center gap-2.5">
                        <CheckSquare className="w-4 h-4 text-indigo-600" />
                        <div>
                          <p className="text-xs font-bold text-zinc-900">Tasks</p>
                          <p className="text-[11px] text-zinc-500 font-medium">
                            {pendingTasksCount} pending
                          </p>
                        </div>
                      </div>
                      {expandedCategory === 'tasks' ? (
                        <ChevronUp className="w-4 h-4 text-zinc-400" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-zinc-400" />
                      )}
                    </button>

                    <AnimatePresence>
                      {expandedCategory === 'tasks' && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="border-t border-zinc-200 bg-white p-3 space-y-2 text-xs"
                        >
                          {pendingTasksList.length === 0 ? (
                            <p className="text-zinc-400 text-center py-2 text-[11px]">
                              No pending tasks.
                            </p>
                          ) : (
                            pendingTasksList.slice(0, 5).map((task) => (
                              <div
                                key={task.taskId || task.id}
                                className="flex items-center justify-between gap-2 p-2 rounded-lg bg-zinc-50 border border-zinc-200/60"
                              >
                                <span className="font-medium text-zinc-800 truncate">
                                  {task.title}
                                </span>
                                {task.priority && (
                                  <span
                                    className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded ${
                                      task.priority === 'high'
                                        ? 'bg-rose-100 text-rose-700'
                                        : task.priority === 'urgent'
                                        ? 'bg-amber-100 text-amber-700'
                                        : 'bg-zinc-200 text-zinc-700'
                                    }`}
                                  >
                                    {task.priority}
                                  </span>
                                )}
                              </div>
                            ))
                          )}
                          <button
                            type="button"
                            onClick={() => setActiveTab('focus')}
                            className="w-full text-center text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 pt-1 cursor-pointer"
                          >
                            Open Tasks Workspace →
                          </button>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Category 2: Calendar & Schedule */}
                  <div className="border border-zinc-200/80 rounded-xl overflow-hidden bg-zinc-50/50">
                    <button
                      type="button"
                      onClick={() =>
                        setExpandedCategory(expandedCategory === 'calendar' ? null : 'calendar')
                      }
                      className="w-full px-3.5 py-3 flex items-center justify-between text-left hover:bg-zinc-100/60 transition cursor-pointer"
                    >
                      <div className="flex items-center gap-2.5">
                        <Calendar className="w-4 h-4 text-emerald-600" />
                        <div>
                          <p className="text-xs font-bold text-zinc-900">Calendar & Schedule</p>
                          <p className="text-[11px] text-zinc-500 font-medium">
                            {calendarEvents7DaysCount} in next 7d
                          </p>
                        </div>
                      </div>
                      {expandedCategory === 'calendar' ? (
                        <ChevronUp className="w-4 h-4 text-zinc-400" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-zinc-400" />
                      )}
                    </button>

                    <AnimatePresence>
                      {expandedCategory === 'calendar' && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="border-t border-zinc-200 bg-white p-3 space-y-2 text-xs"
                        >
                          {calendarEvents7Days.length === 0 ? (
                            <p className="text-zinc-400 text-center py-2 text-[11px]">
                              No events scheduled in the next 7 days.
                            </p>
                          ) : (
                            calendarEvents7Days.slice(0, 5).map((evt) => (
                              <div
                                key={evt.eventId || evt.id}
                                className="flex items-center justify-between gap-2 p-2 rounded-lg bg-zinc-50 border border-zinc-200/60"
                              >
                                <div>
                                  <p className="font-semibold text-zinc-800 text-[11px] truncate">
                                    {evt.title}
                                  </p>
                                  <p className="text-[10px] text-zinc-500">
                                    {evt.date} {evt.time ? `• ${evt.time}` : ''}
                                  </p>
                                </div>
                              </div>
                            ))
                          )}
                          <button
                            type="button"
                            onClick={() => setActiveTab('focus')}
                            className="w-full text-center text-[11px] font-semibold text-emerald-600 hover:text-emerald-800 pt-1 cursor-pointer"
                          >
                            Open Full Calendar →
                          </button>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Category 3: Bills & Payments */}
                  <div className="border border-zinc-200/80 rounded-xl overflow-hidden bg-zinc-50/50">
                    <button
                      type="button"
                      onClick={() =>
                        setExpandedCategory(expandedCategory === 'bills' ? null : 'bills')
                      }
                      className="w-full px-3.5 py-3 flex items-center justify-between text-left hover:bg-zinc-100/60 transition cursor-pointer"
                    >
                      <div className="flex items-center gap-2.5">
                        <CreditCard className="w-4 h-4 text-violet-600" />
                        <div>
                          <p className="text-xs font-bold text-zinc-900">Bills & Payments</p>
                          <p className="text-[11px] text-zinc-500 font-medium">
                            {unpaidBillsCount} unpaid ({formatAmount(billsSummary.totalUnpaidAmount || 0)})
                          </p>
                        </div>
                      </div>
                      {expandedCategory === 'bills' ? (
                        <ChevronUp className="w-4 h-4 text-zinc-400" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-zinc-400" />
                      )}
                    </button>

                    <AnimatePresence>
                      {expandedCategory === 'bills' && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="border-t border-zinc-200 bg-white p-3 space-y-2 text-xs"
                        >
                          {unpaidBillsList.length === 0 ? (
                            <p className="text-zinc-400 text-center py-2 text-[11px]">
                              No unpaid bills.
                            </p>
                          ) : (
                            unpaidBillsList.slice(0, 5).map((bill) => (
                              <div
                                key={bill.billId || bill.id}
                                className="flex items-center justify-between gap-2 p-2 rounded-lg bg-zinc-50 border border-zinc-200/60"
                              >
                                <div>
                                  <p className="font-semibold text-zinc-800 text-[11px] truncate">
                                    {bill.title || bill.name}
                                  </p>
                                  <p className="text-[10px] text-zinc-500">
                                    Due: {bill.dueDate || 'Flexible'}
                                  </p>
                                </div>
                                <span className="font-bold text-zinc-900 text-xs">
                                  {formatAmount(bill.amount || 0)}
                                </span>
                              </div>
                            ))
                          )}
                          <button
                            type="button"
                            onClick={() => setActiveTab('finances')}
                            className="w-full text-center text-[11px] font-semibold text-violet-600 hover:text-violet-800 pt-1 cursor-pointer"
                          >
                            Open Finances & Bills →
                          </button>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Category 4: Health & Habits */}
                  <div className="border border-zinc-200/80 rounded-xl overflow-hidden bg-zinc-50/50">
                    <button
                      type="button"
                      onClick={() =>
                        setExpandedCategory(expandedCategory === 'health' ? null : 'health')
                      }
                      className="w-full px-3.5 py-3 flex items-center justify-between text-left hover:bg-zinc-100/60 transition cursor-pointer"
                    >
                      <div className="flex items-center gap-2.5">
                        <HeartPulse className="w-4 h-4 text-rose-600" />
                        <div>
                          <p className="text-xs font-bold text-zinc-900">Health & Habits</p>
                          <p className="text-[11px] text-zinc-500 font-medium">
                            {pendingHealthCount} active
                          </p>
                        </div>
                      </div>
                      {expandedCategory === 'health' ? (
                        <ChevronUp className="w-4 h-4 text-zinc-400" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-zinc-400" />
                      )}
                    </button>

                    <AnimatePresence>
                      {expandedCategory === 'health' && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="border-t border-zinc-200 bg-white p-3 space-y-2 text-xs"
                        >
                          {activeHealthList.length === 0 ? (
                            <p className="text-zinc-400 text-center py-2 text-[11px]">
                              No active health reminders or habits.
                            </p>
                          ) : (
                            activeHealthList.slice(0, 5).map((item) => (
                              <div
                                key={item.habitId || item.id}
                                className="flex items-center justify-between gap-2 p-2 rounded-lg bg-zinc-50 border border-zinc-200/60"
                              >
                                <span className="font-medium text-zinc-800 truncate">
                                  {item.title || item.name}
                                </span>
                                <span className="text-[10px] text-zinc-500">
                                  {item.frequency || item.category || 'Daily'}
                                </span>
                              </div>
                            ))
                          )}
                          <button
                            type="button"
                            onClick={() => setActiveTab('life')}
                            className="w-full text-center text-[11px] font-semibold text-rose-600 hover:text-rose-800 pt-1 cursor-pointer"
                          >
                            Open Health & Documents →
                          </button>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </div>

              {/* Bento Grid Architecture: only visible if user explicitly chooses to expand all tiles */}
              <AnimatePresence>
                {showAllWorkspaceTiles && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start pt-2"
                  >
                    {/* Left Column (7 cols / ~58%) */}
                    <div className="lg:col-span-7 space-y-5">
                      <Tasks />
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}

          {activeTab === 'focus' && (
            <motion.div
              key="focus"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="space-y-5"
            >
              <Briefing
                selectedDate={selectedDate}
                onOpenArchive={() => setIsArchiveModalOpen(true)}
              />
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-start">
                <div className="space-y-5">
                  <Tasks />
                  <Bills />
                </div>
                <div className="space-y-5">
                  <CalendarView />
                  <Health />
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
        © 2026 Akshat Mohanty. Built with ❤️
      </footer>

      {/* Historical Life Archive & Time Machine Modal */}
      <HistoryArchiveModal
        isOpen={isArchiveModalOpen}
        onClose={() => setIsArchiveModalOpen(false)}
        user={user}
        selectedDate={selectedDate}
        onSelectDate={(newDate) => setSelectedDate(newDate)}
      />
    </div>
  );
}
