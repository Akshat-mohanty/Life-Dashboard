/**
 * HistoryArchiveModal.jsx
 * Historical Life Archive & Time Machine Modal
 * Allows users to inspect their past AI briefings, completed tasks,
 * spending records, and calendar events isolated strictly by their userId.
 */

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Calendar as CalendarIcon,
  X,
  Sparkles,
  CheckCircle2,
  Circle,
  Receipt,
  Clock,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  RotateCcw,
  Compass,
  ArrowRight,
  TrendingDown,
  FileText,
  AlertCircle,
  FolderArchive,
  CalendarDays,
} from 'lucide-react';
import { archiveApi, briefingApi } from '../api/client';

export default function HistoryArchiveModal({
  isOpen,
  onClose,
  user,
  selectedDate,
  onSelectDate,
}) {
  const queryClient = useQueryClient();
  const todayStr = new Date().toISOString().split('T')[0];
  const [viewDate, setViewDate] = useState(selectedDate || todayStr);

  // Keep viewDate synced with selectedDate when opened
  useEffect(() => {
    if (isOpen) {
      setViewDate(selectedDate || todayStr);
    }
  }, [isOpen, selectedDate, todayStr]);

  // Handle ESC key to close
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Fetch daily archive strictly for the authenticated user and viewDate
  const {
    data: archiveData,
    isLoading,
    isFetching,
    refetch,
  } = useQuery({
    queryKey: ['archive', 'daily', user?.userId, viewDate],
    queryFn: async () => {
      const res = await archiveApi.getDaily(viewDate);
      return res;
    },
    enabled: Boolean(isOpen && user?.userId && viewDate),
  });

  // Manual trigger to generate briefing for a past date if none exists
  const generateBriefingMutation = useMutation({
    mutationFn: async () => {
      return await briefingApi.generateNow({ date: viewDate });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['archive', 'daily', user?.userId, viewDate] });
      queryClient.invalidateQueries({ queryKey: ['briefing'] });
    },
  });

  if (!isOpen || typeof document === 'undefined') return null;

  const dateObj = new Date(viewDate + 'T00:00:00');
  const formattedDateTitle = dateObj.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  const isToday = viewDate === todayStr;

  // Quick date offsets (in days)
  const quickJumps = [
    { label: 'Today', days: 0 },
    { label: 'Yesterday', days: 1 },
    { label: '3d ago', days: 3 },
    { label: '7d ago', days: 7 },
    { label: '14d ago', days: 14 },
    { label: '30d ago', days: 30 },
  ];

  const handleJumpDays = (days) => {
    const target = new Date();
    target.setDate(target.getDate() - days);
    const dateStr = target.toISOString().split('T')[0];
    setViewDate(dateStr);
  };

  const handlePrevDay = () => {
    const curr = new Date(viewDate + 'T00:00:00');
    curr.setDate(curr.getDate() - 1);
    setViewDate(curr.toISOString().split('T')[0]);
  };

  const handleNextDay = () => {
    const curr = new Date(viewDate + 'T00:00:00');
    curr.setDate(curr.getDate() + 1);
    const nextStr = curr.toISOString().split('T')[0];
    if (nextStr <= todayStr) {
      setViewDate(nextStr);
    }
  };

  const briefing = archiveData?.briefing;
  const tasks = archiveData?.tasks || [];
  const spending = archiveData?.spending || [];
  const calendar = archiveData?.calendar || [];
  const bills = archiveData?.bills || [];
  const spendingTotal = archiveData?.spendingTotal || 0;

  const completedTasks = tasks.filter((t) => t.completed);

  const totalEntries =
    (briefing ? 1 : 0) + tasks.length + spending.length + calendar.length + bills.length;

  return createPortal(
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.15 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-xs z-[9999] flex items-center justify-center p-3 sm:p-6 overflow-y-auto"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 12 }}
          transition={{ type: 'spring', stiffness: 350, damping: 28 }}
          className="bg-white border border-zinc-200/90 rounded-3xl shadow-2xl max-w-4xl w-full max-h-[92vh] flex flex-col relative overflow-hidden my-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Top Header */}
          <div className="px-6 py-5 border-b border-zinc-100 flex items-start justify-between bg-gradient-to-r from-zinc-50 via-white to-indigo-50/20">
            <div className="space-y-1">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-xs">
                  <FolderArchive className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-zinc-900 tracking-tight">
                    Historical Life Archive & Telemetry
                  </h3>
                </div>
              </div>
              <p className="text-xs text-zinc-500">
                Access your past AI briefings, completed tasks, financial outflows, and schedule.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-zinc-100 hover:bg-zinc-200 text-zinc-600 flex items-center justify-center transition cursor-pointer"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Date Navigator Bar */}
          <div className="px-6 py-3.5 bg-zinc-50/80 border-b border-zinc-100 flex flex-wrap items-center justify-between gap-3">
            {/* Prev / Current / Next Controls */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handlePrevDay}
                className="p-1.5 rounded-lg border border-zinc-200 bg-white hover:bg-zinc-100 text-zinc-700 transition cursor-pointer"
                title="Previous Day"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-2 px-3 py-1.5 bg-white border border-zinc-200 rounded-xl shadow-2xs">
                <CalendarIcon className="w-4 h-4 text-indigo-600" />
                <input
                  type="date"
                  max={todayStr}
                  value={viewDate}
                  onChange={(e) => {
                    if (e.target.value) setViewDate(e.target.value);
                  }}
                  className="text-xs font-semibold text-zinc-800 bg-transparent focus:outline-hidden cursor-pointer"
                />
              </div>

              <button
                type="button"
                onClick={handleNextDay}
                disabled={viewDate >= todayStr}
                className={`p-1.5 rounded-lg border border-zinc-200 transition ${
                  viewDate >= todayStr
                    ? 'bg-zinc-100 text-zinc-300 cursor-not-allowed'
                    : 'bg-white hover:bg-zinc-100 text-zinc-700 cursor-pointer'
                }`}
                title="Next Day"
              >
                <ChevronRight className="w-4 h-4" />
              </button>

              <span className="text-xs font-bold text-zinc-700 ml-1 hidden md:inline">
                {formattedDateTitle}
              </span>
              {isToday && (
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-100">
                  Today
                </span>
              )}
            </div>

            {/* Quick offset buttons */}
            <div className="flex items-center gap-1.5 overflow-x-auto py-0.5">
              {quickJumps.map((q) => (
                <button
                  key={q.label}
                  type="button"
                  onClick={() => handleJumpDays(q.days)}
                  className="px-2.5 py-1 text-xs font-medium rounded-lg bg-white hover:bg-zinc-100 border border-zinc-200 text-zinc-700 transition cursor-pointer whitespace-nowrap"
                >
                  {q.label}
                </button>
              ))}

              {/* Time-travel: apply to entire dashboard */}
              <button
                type="button"
                onClick={() => {
                  onSelectDate(viewDate);
                  onClose();
                }}
                className="ml-2 inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white shadow-2xs transition cursor-pointer"
              >
                <Compass className="w-3.5 h-3.5" />
                <span>Filter Dashboard</span>
              </button>
            </div>
          </div>

          {/* Metric Pills Bar */}
          <div className="px-6 py-2 bg-white border-b border-zinc-100 flex items-center justify-between text-xs text-zinc-600 overflow-x-auto">
            <div className="flex items-center gap-4">
              <span className="font-semibold text-zinc-800">
                Summary for {formattedDateTitle}:
              </span>
              <span className="flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                {completedTasks.length} completed / {tasks.length} tasks
              </span>
              <span className="flex items-center gap-1">
                <Receipt className="w-3.5 h-3.5 text-amber-500" />
                ${spendingTotal.toFixed(2)} spent ({spending.length} transactions)
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-sky-500" />
                {calendar.length} events
              </span>
            </div>

            {isFetching && (
              <span className="text-[11px] text-zinc-400 animate-pulse">Syncing partition...</span>
            )}
          </div>

          {/* Main Scrollable Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {isLoading ? (
              <div className="py-16 text-center space-y-3">
                <div className="w-9 h-9 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-xs text-zinc-500 font-medium">
                  Retrieving past records from your user partition...
                </p>
              </div>
            ) : totalEntries === 0 ? (
              <div className="py-12 text-center max-w-md mx-auto space-y-4">
                <div className="w-14 h-14 rounded-3xl bg-zinc-100 text-zinc-400 flex items-center justify-center mx-auto">
                  <CalendarDays className="w-7 h-7" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-zinc-900">
                    No historical logs on {viewDate}
                  </h4>
                  <p className="text-xs text-zinc-500 mt-1 leading-relaxed">
                    There are no tasks, expenses, or calendar entries recorded for your account on
                    this date. All logs saved while you use Meridian will be securely preserved
                    here under your user ID.
                  </p>
                </div>

                {!briefing && (
                  <button
                    type="button"
                    onClick={() => generateBriefingMutation.mutate()}
                    disabled={generateBriefingMutation.isPending}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm transition cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>
                      {generateBriefingMutation.isPending
                        ? 'Synthesizing with Bedrock...'
                        : 'Generate AI Briefing for this Date'}
                    </span>
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
                {/* Left Column: AI Briefing */}
                <div className="md:col-span-7 space-y-6">
                  {/* AI Morning Briefing Card */}
                  <div className="bg-zinc-900 text-white rounded-2xl p-5 border border-zinc-800 shadow-sm relative overflow-hidden">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
                          <Sparkles className="w-3.5 h-3.5" />
                        </div>
                        <span className="text-xs font-bold uppercase tracking-wider text-indigo-300">
                          AI Executive Reflection
                        </span>
                      </div>
                      <span className="text-[11px] text-zinc-400 font-mono">{viewDate}</span>
                    </div>

                    {briefing ? (
                      <div className="space-y-3">
                        {briefing.quote && (
                          <div className="text-xs italic text-zinc-300 border-l-2 border-indigo-400 pl-3">
                            "{briefing.quote}"
                          </div>
                        )}
                        <p className="text-xs text-zinc-200 leading-relaxed">
                          {briefing.summary || briefing.content}
                        </p>
                        {briefing.keyInsights && briefing.keyInsights.length > 0 && (
                          <div className="pt-2 border-t border-zinc-800">
                            <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block mb-1.5">
                              Key Highlights
                            </span>
                            <ul className="space-y-1">
                              {briefing.keyInsights.map((insight, idx) => (
                                <li key={idx} className="text-xs text-zinc-300 flex items-start gap-1.5">
                                  <span className="text-indigo-400 font-bold">•</span>
                                  <span>{insight}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="py-4 text-center space-y-2">
                        <p className="text-xs text-zinc-400">
                          No AI briefing was generated for this specific date yet.
                        </p>
                        <button
                          type="button"
                          onClick={() => generateBriefingMutation.mutate()}
                          disabled={generateBriefingMutation.isPending}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 transition cursor-pointer"
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>
                            {generateBriefingMutation.isPending
                              ? 'Generating...'
                              : 'Generate AI Briefing'}
                          </span>
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Tasks Section */}
                  <div className="bg-white border border-zinc-200/90 rounded-2xl p-5 shadow-xs">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-700">
                          Tasks ({tasks.length})
                        </h4>
                      </div>
                      <span className="text-xs text-zinc-500">
                        {completedTasks.length} Completed
                      </span>
                    </div>

                    {tasks.length === 0 ? (
                      <p className="text-xs text-zinc-400 italic py-2">
                        No tasks scheduled or logged for this date.
                      </p>
                    ) : (
                      <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                        {tasks.map((task) => (
                          <div
                            key={task.taskId || task.id}
                            className={`p-2.5 rounded-xl border text-xs flex items-center justify-between transition ${
                              task.completed
                                ? 'bg-zinc-50/60 border-zinc-200 text-zinc-400 line-through'
                                : 'bg-white border-zinc-200 text-zinc-800'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              {task.completed ? (
                                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                              ) : (
                                <Circle className="w-4 h-4 text-zinc-300 shrink-0" />
                              )}
                              <span className="font-medium">{task.title}</span>
                            </div>
                            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md bg-zinc-100 text-zinc-600">
                              {task.category || 'General'}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Right Column: Spending & Schedule */}
                <div className="md:col-span-5 space-y-6">
                  {/* Financial Outflows */}
                  <div className="bg-white border border-zinc-200/90 rounded-2xl p-5 shadow-xs">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Receipt className="w-4 h-4 text-amber-600" />
                        <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-700">
                          Spending Outflows
                        </h4>
                      </div>
                      <span className="text-xs font-bold text-zinc-900">
                        ${spendingTotal.toFixed(2)}
                      </span>
                    </div>

                    {spending.length === 0 ? (
                      <p className="text-xs text-zinc-400 italic py-2">
                        No transactions recorded on this date.
                      </p>
                    ) : (
                      <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                        {spending.map((s) => (
                          <div
                            key={s.expenseId || s.id}
                            className="p-2.5 rounded-xl border border-zinc-100 bg-zinc-50/50 flex items-center justify-between text-xs"
                          >
                            <span className="font-medium text-zinc-800">{s.title}</span>
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] text-zinc-400 uppercase">
                                {s.category || 'Other'}
                              </span>
                              <span className="font-bold text-zinc-900">
                                -${Number(s.amount || 0).toFixed(2)}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Calendar Events */}
                  <div className="bg-white border border-zinc-200/90 rounded-2xl p-5 shadow-xs">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-sky-600" />
                        <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-700">
                          Schedule & Events ({calendar.length})
                        </h4>
                      </div>
                    </div>

                    {calendar.length === 0 ? (
                      <p className="text-xs text-zinc-400 italic py-2">
                        No events logged on this date.
                      </p>
                    ) : (
                      <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                        {calendar.map((ev) => (
                          <div
                            key={ev.eventId || ev.id}
                            className="p-2.5 rounded-xl border border-zinc-100 bg-zinc-50/50 flex items-center justify-between text-xs"
                          >
                            <div>
                              <p className="font-medium text-zinc-800">{ev.title}</p>
                              {ev.time && <p className="text-[11px] text-zinc-400">{ev.time}</p>}
                            </div>
                            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md bg-sky-50 text-sky-700 border border-sky-100">
                              {ev.category || 'Meeting'}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Bills Due or Paid */}
                  {bills.length > 0 && (
                    <div className="bg-white border border-zinc-200/90 rounded-2xl p-5 shadow-xs">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-700 mb-3">
                        Bills Related to this Date ({bills.length})
                      </h4>
                      <div className="space-y-2">
                        {bills.map((b) => (
                          <div
                            key={b.billId || b.id}
                            className="p-2 rounded-xl border border-zinc-100 flex items-center justify-between text-xs"
                          >
                            <span className="font-medium text-zinc-800">{b.title}</span>
                            <span className="font-bold text-zinc-900">${b.amount}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Modal Footer */}
          <div className="px-6 py-4 bg-zinc-50 border-t border-zinc-100 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-1.5 text-xs text-zinc-500">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>
                Personal data strictly isolated to partition: <code className="font-mono text-zinc-700 font-semibold">{user?.userId}</code>
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  onSelectDate(viewDate);
                  onClose();
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-zinc-900 hover:bg-black shadow-xs transition cursor-pointer"
              >
                <Compass className="w-3.5 h-3.5 text-indigo-400" />
                <span>Travel to this Date</span>
              </button>
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-600 hover:text-zinc-900 hover:bg-zinc-200/60 border border-zinc-200 bg-white transition cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>,
    document.body
  );
}
