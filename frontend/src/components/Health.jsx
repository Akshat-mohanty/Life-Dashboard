/**
 * Health Reminders Component
 * Tracks daily/weekly wellness habits (medicines, water, stretching) with optional Amazon SNS SMS alerts.
 */

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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
      return <Pill className="w-4 h-4 text-emerald-500" />;
    }
    return <Activity className="w-4 h-4 text-teal-500" />;
  };

  return (
    <div className="bg-[#0E1017]/90 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-xl flex flex-col h-full relative overflow-hidden group/card hover:border-white/15 transition-all">
      {/* Subtle top glow */}
      <div className="absolute top-0 right-1/4 w-40 h-20 bg-accent-500/10 blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-white/[0.08] relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-accent-500/10 border border-accent-500/20 text-accent-400 flex items-center justify-center shadow-glow-sm">
            <HeartPulse className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-white text-base tracking-tight">Health Reminders</h3>
            <p className="text-xs text-slate-400">Medicines, habits & SMS alerts</p>
          </div>
        </div>

        {!isAdding && (
          <button
            onClick={() => setIsAdding(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-accent-600 hover:bg-accent-500 shadow-glow-sm border border-accent-400/30 transition-all hover:scale-105"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add</span>
          </button>
        )}
      </div>

      {/* Summary Chips */}
      <div className="mt-4 p-3.5 bg-white/[0.03] border border-white/[0.06] rounded-xl flex items-center justify-between relative z-10">
        <div>
          <span className="text-xs font-medium text-slate-400 uppercase tracking-wider block">Active Habits</span>
          <span className="text-2xl font-extrabold text-white tracking-tight">{summary.totalCount}</span>
        </div>
        <div className="text-right">
          <span className="text-xs font-medium text-accent-400 block flex items-center gap-1 justify-end">
            <Repeat className="w-3 h-3" /> {summary.dailyCount} Daily
          </span>
          {summary.smsAlertsEnabledCount > 0 && (
            <span className="text-[11px] text-slate-400 font-medium flex items-center gap-1 justify-end mt-0.5">
              <Smartphone className="w-3 h-3 text-accent-300" /> {summary.smsAlertsEnabledCount} SMS active
            </span>
          )}
        </div>
      </div>

      {/* Inline Add Form */}
      {isAdding && (
        <form onSubmit={handleCreateSubmit} className="mt-4 p-4 bg-white/[0.03] rounded-xl border border-white/10 space-y-3 relative z-10">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-white">Add Health Habit</span>
            <button type="button" onClick={resetForm} className="text-slate-400 hover:text-white transition">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div>
            <input
              type="text"
              placeholder="Habit / Medicine Name (e.g. Take Vitamin D3)"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              className="w-full text-xs px-3 py-2 bg-white/[0.04] border border-white/10 text-white placeholder-slate-500 rounded-lg focus:outline-none focus:border-accent-400 focus:ring-1 focus:ring-accent-400 transition"
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <select
                value={formData.frequency}
                onChange={(e) => setFormData({ ...formData, frequency: e.target.value })}
                className="w-full text-xs px-3 py-2 bg-[#141722] border border-white/10 text-white rounded-lg focus:outline-none focus:border-accent-400 focus:ring-1 focus:ring-accent-400"
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="custom">Custom</option>
              </select>
            </div>
            <div>
              <input
                type="time"
                value={formData.time}
                onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                required
                className="w-full text-xs px-3 py-2 bg-white/[0.04] border border-white/10 text-white rounded-lg focus:outline-none focus:border-accent-400 focus:ring-1 focus:ring-accent-400"
              />
            </div>
          </div>
          <div>
            <div className="relative">
              <input
                type="tel"
                placeholder="Phone for SMS Alerts (e.g. +919876543210)"
                value={formData.phoneNumber}
                onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                className="w-full text-xs px-3 py-2 pl-8 bg-white/[0.04] border border-white/10 text-white placeholder-slate-500 rounded-lg focus:outline-none focus:border-accent-400 focus:ring-1 focus:ring-accent-400 transition"
              />
              <Smartphone className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5" />
            </div>
            <span className="text-[10px] text-slate-400 mt-1 block">Optional: Triggers SMS reminder via Amazon SNS</span>
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={resetForm}
              className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-white hover:bg-white/[0.06] transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createMutation.isPending}
              className="px-3.5 py-1.5 rounded-lg text-xs font-semibold text-white bg-accent-600 hover:bg-accent-500 shadow-glow-sm transition"
            >
              {createMutation.isPending ? 'Saving...' : 'Save Habit'}
            </button>
          </div>
        </form>
      )}

      {/* Reminder List */}
      <div className="mt-4 flex-1 overflow-y-auto space-y-2.5 max-h-[420px] pr-0.5 relative z-10">
        {isLoading ? (
          <div className="space-y-2.5 animate-pulse">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-14 bg-white/[0.03] border border-white/[0.06] rounded-xl" />
            ))}
          </div>
        ) : isError ? (
          <p className="text-xs text-rose-400 p-2">Error loading health habits: {error.message}</p>
        ) : reminders.length === 0 ? (
          <div className="text-center py-8 text-slate-500">
            <HeartPulse className="w-8 h-8 mx-auto mb-2 opacity-30 text-slate-400" />
            <p className="text-xs font-medium text-slate-300">No health reminders added.</p>
            <p className="text-[11px] text-slate-500 mt-0.5">Schedule daily water, vitamins, or walking habits.</p>
          </div>
        ) : (
          reminders.map((reminder) => (
            <div
              key={reminder.id}
              className="p-3.5 rounded-xl border border-white/[0.08] bg-white/[0.03] hover:border-white/15 hover:bg-white/[0.05] transition-all flex items-center justify-between gap-3"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-white/[0.04] border border-white/[0.08] flex items-center justify-center flex-shrink-0">
                  {getReminderIcon(reminder.name)}
                </div>
                <div className="min-w-0">
                  <h4 className="text-xs font-bold text-white truncate">{reminder.name}</h4>
                  <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-400">
                    <span className="font-semibold text-slate-300 flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-500" />
                      {reminder.time}
                    </span>
                    <span>•</span>
                    <span className="capitalize">{reminder.frequency}</span>
                    {reminder.phoneNumber && (
                      <>
                        <span>•</span>
                        <span className="text-[10px] text-accent-300 font-medium flex items-center gap-0.5 bg-accent-500/10 px-1.5 py-0.5 rounded border border-accent-500/20" title={`SMS active to ${reminder.phoneNumber}`}>
                          <Smartphone className="w-2.5 h-2.5" />
                          SMS
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <button
                onClick={() => deleteMutation.mutate(reminder.id)}
                className="p-1 text-slate-500 hover:text-rose-400 rounded transition flex-shrink-0"
                title="Delete Reminder"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
