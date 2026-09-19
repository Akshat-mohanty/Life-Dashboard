/**
 * Health Reminders Component
 * Tracks daily/weekly wellness habits (medicines, water, stretching) with optional Amazon SNS SMS alerts.
 */

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  HeartPulse,
  Plus,
  Trash2,
  X,
  Clock,
  Smartphone,
  Repeat,
  Pill,
  Droplets,
  Activity,
} from 'lucide-react';
import { healthApi } from '../api/client';

export default function Health() {
  const queryClient = useQueryClient();
  const [isAdding, setIsAdding] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    frequency: 'daily',
    time: '08:30',
    phoneNumber: '',
  });

  // Query reminders
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['health'],
    queryFn: async () => {
      const res = await healthApi.list();
      return res;
    },
  });

  const reminders = data?.items || [];
  const summary = data?.summary || {
    totalCount: 0,
    dailyCount: 0,
    weeklyCount: 0,
    smsAlertsEnabledCount: 0,
  };

  // Create Mutation
  const createMutation = useMutation({
    mutationFn: (newReminder) => healthApi.create(newReminder),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['health'] });
      resetForm();
    },
  });

  // Delete Mutation
  const deleteMutation = useMutation({
    mutationFn: (id) => healthApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['health'] });
    },
  });

  const resetForm = () => {
    setFormData({
      name: '',
      frequency: 'daily',
      time: '08:30',
      phoneNumber: '',
    });
    setIsAdding(false);
  };

  const handleCreateSubmit = (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.time) return;

    createMutation.mutate({
      name: formData.name.trim(),
      frequency: formData.frequency,
      time: formData.time,
      phoneNumber: formData.phoneNumber.trim() ? formData.phoneNumber.trim() : null,
    });
  };

  // Heuristic icon based on reminder name
  const getReminderIcon = (name = '') => {
    const lower = name.toLowerCase();
    if (lower.includes('water') || lower.includes('hydrat')) {
      return <Droplets className="w-4 h-4 text-sky-500" />;
    }
    if (lower.includes('vitamin') || lower.includes('pill') || lower.includes('med') || lower.includes('tablet')) {
      return <Pill className="w-4 h-4 text-accent-600" />;
    }
    return <Activity className="w-4 h-4 text-accent-700" />;
  };

  return (
    <div className="bg-white/95 border border-zinc-200/90 rounded-2xl p-4 sm:p-5 shadow-xs hover:shadow-sm transition-all flex flex-col h-full">
      {/* Sleek Header */}
      <div className="flex items-center justify-between pb-3 mb-1 border-b border-zinc-100">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-zinc-900 text-white flex items-center justify-center shadow-xs">
            <HeartPulse className="w-4 h-4 text-cyan-300" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-zinc-900 text-sm tracking-tight">Health & Habits</h3>
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-700 border border-zinc-200">
                {summary.totalCount} active
              </span>
              {summary.smsAlertsEnabledCount > 0 && (
                <span className="text-[10px] text-zinc-400 font-medium hidden sm:inline">
                  • {summary.smsAlertsEnabledCount} SMS
                </span>
              )}
            </div>
            <p className="text-[11px] text-zinc-400">Medicines, daily habits & SMS alerts</p>
          </div>
        </div>

        {!isAdding && (
          <button
            onClick={() => setIsAdding(true)}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold text-zinc-900 bg-white hover:bg-zinc-50 border border-zinc-200 shadow-2xs hover:border-zinc-300 transition active:scale-95 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 text-zinc-700" />
            <span>Add</span>
          </button>
        )}
      </div>

      {/* Add Health Habit Modal Popup */}
      <AnimatePresence>
        {isAdding && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex items-center justify-center p-4"
            onClick={resetForm}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.93, y: 14 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.93, y: 14 }}
              transition={{ type: 'spring', stiffness: 420, damping: 32 }}
              className="bg-white rounded-3xl border border-zinc-200 shadow-2xl p-6 max-w-md w-full relative"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between pb-4 border-b border-zinc-100 mb-4">
                <div>
                  <h3 className="text-base font-bold text-black tracking-tight">Add Health Habit</h3>
                  <p className="text-xs text-zinc-500">Track medication, workouts, or daily routines</p>
                </div>
                <button
                  type="button"
                  onClick={resetForm}
                  className="p-1.5 text-zinc-400 hover:text-black hover:bg-zinc-100 rounded-xl transition cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleCreateSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1.5">
                    Habit / Medicine Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Take Vitamin D3, 30m Jogging, Drink 2L Water"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    className="w-full text-xs px-3.5 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-black placeholder-zinc-400 focus:outline-none focus:bg-white focus:border-accent-400 focus:ring-2 focus:ring-accent-100 transition"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1.5">
                      Frequency
                    </label>
                    <select
                      value={formData.frequency}
                      onChange={(e) => setFormData({ ...formData, frequency: e.target.value })}
                      className="w-full text-xs px-3.5 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-black focus:outline-none focus:bg-white focus:border-accent-400 focus:ring-2 focus:ring-accent-100 transition cursor-pointer"
                    >
                      <option value="daily">Daily</option>
                      <option value="weekly">Weekly</option>
                      <option value="custom">Custom</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1.5">
                      Target Time
                    </label>
                    <input
                      type="time"
                      value={formData.time}
                      onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                      required
                      className="w-full text-xs px-3.5 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-black focus:outline-none focus:bg-white focus:border-accent-400 focus:ring-2 focus:ring-accent-100 transition cursor-pointer"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1.5">
                    SMS Reminder (Optional)
                  </label>
                  <div className="relative">
                    <input
                      type="tel"
                      placeholder="+919876543210"
                      value={formData.phoneNumber}
                      onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                      className="w-full text-xs px-3.5 py-2.5 pl-9 bg-zinc-50 border border-zinc-200 rounded-xl text-black placeholder-zinc-400 focus:outline-none focus:bg-white focus:border-accent-400 focus:ring-2 focus:ring-accent-100 transition"
                    />
                    <Smartphone className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-3" />
                  </div>
                  <span className="text-[10px] text-zinc-500 mt-1 block">Sends automated alerts using Amazon SNS</span>
                </div>

                <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-zinc-100">
                  <button
                    type="button"
                    onClick={resetForm}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-600 hover:text-black hover:bg-zinc-100 transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={createMutation.isPending}
                    className="px-5 py-2 rounded-xl text-xs font-bold text-black bg-white hover:bg-zinc-50 border border-zinc-300 hover:border-zinc-400 shadow-xs transition active:scale-95 disabled:opacity-50 cursor-pointer"
                  >
                    {createMutation.isPending ? 'Saving...' : 'Save Habit'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Reminder List */}
      <div className="mt-4 flex-1 overflow-y-auto space-y-2.5 max-h-[420px] pr-0.5">
        {isLoading ? (
          <div className="space-y-2.5 animate-pulse">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-14 bg-zinc-100 rounded-xl" />
            ))}
          </div>
        ) : isError ? (
          <p className="text-xs text-rose-600 p-2">Error loading health habits: {error.message}</p>
        ) : reminders.length === 0 ? (
          <div className="text-center py-6 px-4 bg-zinc-50/50 rounded-xl border border-dashed border-zinc-200">
            <HeartPulse className="w-5 h-5 mx-auto mb-1.5 text-zinc-300" />
            <p className="text-xs font-semibold text-zinc-700">No active habits</p>
            <p className="text-[11px] text-zinc-400 mt-0.5">Schedule hydration, vitamins, exercise, or medicines</p>
          </div>
        ) : (
          <AnimatePresence initial={false}>
            {reminders.map((reminder) => (
              <motion.div
                key={reminder.id}
                layout
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className="p-3.5 rounded-xl border border-zinc-200 bg-white hover:border-zinc-300 hover:bg-zinc-50/50 transition-all flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-zinc-50 border border-zinc-200 flex items-center justify-center flex-shrink-0">
                    {getReminderIcon(reminder.name)}
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-xs font-bold text-black truncate">{reminder.name}</h4>
                    <div className="flex items-center gap-2 mt-0.5 text-[11px] text-zinc-500">
                      <span className="font-semibold text-zinc-700 flex items-center gap-1">
                        <Clock className="w-3 h-3 text-zinc-400" />
                        {reminder.time}
                      </span>
                      <span>•</span>
                      <span className="capitalize">{reminder.frequency}</span>
                      {reminder.phoneNumber && (
                        <>
                          <span>•</span>
                          <span className="text-[10px] text-accent-800 font-semibold flex items-center gap-0.5 bg-accent-50 px-1.5 py-0.5 rounded border border-accent-200" title={`SMS active to ${reminder.phoneNumber}`}>
                            <Smartphone className="w-2.5 h-2.5 text-accent-700" />
                            SMS
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => deleteMutation.mutate(reminder.id)}
                  className="p-1 text-zinc-400 hover:text-rose-600 rounded transition flex-shrink-0"
                  title="Delete Reminder"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}
