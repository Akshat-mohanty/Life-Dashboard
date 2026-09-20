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
  Trash2,
} from 'lucide-react';
import { archiveApi, briefingApi } from '../api/client';
import { useCurrency } from '../hooks/useCurrency';

export default function HistoryArchiveModal({
  isOpen,
  onClose,
  user,
  selectedDate,
  onSelectDate,
}) {
  const { formatAmount } = useCurrency();
  const getTodayStr = () => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  const shiftDay = (dateStr, deltaDays) => {
    const base = dateStr || getTodayStr();
    const [year, month, day] = base.split('-').map(Number);
    const date = new Date(Date.UTC(year, month - 1, day + deltaDays));
    return date.toISOString().split('T')[0];
  };

  const todayStr = getTodayStr();
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

  // Trigger to delete briefing for viewDate
  const deleteBriefingMutation = useMutation({
    mutationFn: async () => {
      return await briefingApi.delete({ date: viewDate });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['archive', 'daily', user?.userId, viewDate] });
      queryClient.invalidateQueries({ queryKey: ['briefing'] });
    },
  });

  if (!isOpen || typeof document === 'undefined') return null;

  const dateObj = new Date(viewDate + 'T12:00:00');
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
    setViewDate(shiftDay(todayStr, -days));
  };

  const isJumpSelected = (days) => {
    return viewDate === shiftDay(todayStr, -days);
  };

  const handlePrevDay = () => {
    setViewDate((prev) => shiftDay(prev || todayStr, -1));
  };

  const handleNextDay = () => {
    setViewDate((prev) => shiftDay(prev || todayStr, 1));
  };

  const briefingRaw = archiveData?.briefing;
  const briefing =
    briefingRaw &&
    !briefingRaw.content?.includes('Completed task reviews and scheduled agenda items') &&
    !briefingRaw.content?.includes('Personal workspace and health goals logged') &&
    !briefingRaw.content?.includes('No value is entered')
      ? briefingRaw
      : null;
  const tasks = archiveData?.tasks || [];
  const spending = archiveData?.spending || [];
  const calendar = archiveData?.calendar || [];
  const bills = archiveData?.bills || [];
  const spendingTotal = archiveData?.spendingTotal || 0;

  const completedTasks = tasks.filter((t) => t.completed);

  const hasData =
    Boolean(briefing) ||
    tasks.length > 0 ||
    spending.length > 0 ||
    calendar.length > 0 ||
    bills.length > 0;

  const totalEntries = hasData ? 1 : 0;

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
                    Archive
                  </h3>
                </div>
              </div>
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
                className="p-1.5 rounded-lg border border-zinc-200 bg-white hover:bg-zinc-100 text-zinc-700 transition cursor-pointer active:scale-95 shadow-2xs"
                title="Previous Day"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-2 px-3 py-1.5 bg-white border border-zinc-200 rounded-xl shadow-2xs">
                <CalendarIcon className="w-4 h-4 text-indigo-600" />
                <input
                  type="date"
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
                className="p-1.5 rounded-lg border border-zinc-200 bg-white hover:bg-zinc-100 text-zinc-700 transition cursor-pointer active:scale-95 shadow-2xs"
                title="Next Day"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

          </div>

          {/* Metric Pills Bar: Only show if data is provided and not empty */}
          {hasData && (
            <div className="px-6 py-2 bg-white border-b border-zinc-100 flex items-center justify-between text-xs text-zinc-600 overflow-x-auto">
              <div className="flex items-center gap-4">
                <span className="font-semibold text-zinc-800">
                  Summary for {formattedDateTitle}:
                </span>
                {tasks.length > 0 && (
                  <span className="flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                    {completedTasks.length} completed / {tasks.length} tasks
                  </span>
                )}
                {spending.length > 0 && (
                  <span className="flex items-center gap-1">
                    <Receipt className="w-3.5 h-3.5 text-amber-500" />
                    {formatAmount(spendingTotal, { decimals: 2 })} spent ({spending.length} transactions)
                  </span>
                )}
                {calendar.length > 0 && (
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-sky-500" />
                    {calendar.length} events
                  </span>
                )}
              </div>

              {isFetching && (
                <span className="text-[11px] text-zinc-400 animate-pulse">Syncing partition...</span>
              )}
            </div>
          )}

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
              <div className="py-12 flex items-center justify-center">
                <div className="w-full max-w-lg bg-zinc-50 border border-zinc-200/80 rounded-2xl p-8 text-center">
                  <p className="text-sm font-medium text-zinc-500">
                    No value is entered.
                  </p>
                </div>
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
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] text-zinc-400 font-mono">{viewDate}</span>
                        {briefing && (
                          <button
                            type="button"
                            onClick={() => deleteBriefingMutation.mutate()}
                            disabled={deleteBriefingMutation.isPending}
                            className="p-1 rounded-md text-zinc-400 hover:text-rose-400 hover:bg-zinc-800 transition cursor-pointer"
                            title="Delete this briefing"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
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
                        No value is entered.
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
                        {formatAmount(spendingTotal, { decimals: 2 })}
                      </span>
                    </div>

                    {spending.length === 0 ? (
                      <p className="text-xs text-zinc-400 italic py-2">
                        No value is entered.
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
                                -{formatAmount(Number(s.amount || 0), { decimals: 2 })}
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
                        No value is entered.
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

          <div className="px-6 py-4 bg-zinc-50 border-t border-zinc-100 flex flex-wrap items-center justify-end gap-3">

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
