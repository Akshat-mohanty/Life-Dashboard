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
      return <Pill className="w-4 h-4 text-accent-600" />;
    }
    return <Activity className="w-4 h-4 text-accent-700" />;
  };

  return (
    <div className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-zinc-100">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-accent-50 border border-accent-200 text-accent-700 flex items-center justify-center shadow-xs">
            <HeartPulse className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-black text-base tracking-tight">Health Reminders</h3>
            <p className="text-xs text-zinc-500">Medicines, habits & SMS alerts</p>
          </div>
        </div>

        {!isAdding && (
          <button
            onClick={() => setIsAdding(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-accent-600 hover:bg-accent-700 shadow-sm transition-all hover:scale-105"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add</span>
          </button>
        )}
      </div>

      {/* Summary Chips */}
      <div className="mt-4 p-3.5 bg-zinc-50 border border-zinc-100 rounded-xl flex items-center justify-between">
        <div>
          <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider block">Active Habits</span>
          <span className="text-2xl font-extrabold text-black tracking-tight">{summary.totalCount}</span>
        </div>
        <div className="text-right">
          <span className="text-xs font-semibold text-accent-700 block flex items-center gap-1 justify-end">
            <Repeat className="w-3 h-3" /> {summary.dailyCount} Daily
          </span>
          {summary.smsAlertsEnabledCount > 0 && (
            <span className="text-[11px] text-zinc-500 font-medium flex items-center gap-1 justify-end mt-0.5">
              <Smartphone className="w-3 h-3 text-accent-600" /> {summary.smsAlertsEnabledCount} SMS active
            </span>
          )}
        </div>
      </div>

      {/* Inline Add Form */}
      {isAdding && (
        <form onSubmit={handleCreateSubmit} className="mt-4 p-4 bg-zinc-50 rounded-xl border border-zinc-200 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-black">Add Health Habit</span>
            <button type="button" onClick={resetForm} className="text-zinc-400 hover:text-black transition">
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
              className="w-full text-xs px-3 py-2 bg-white border border-zinc-300 text-black placeholder-zinc-400 rounded-lg focus:outline-none focus:border-accent-600 focus:ring-1 focus:ring-accent-600 transition"
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <select
                value={formData.frequency}
                onChange={(e) => setFormData({ ...formData, frequency: e.target.value })}
                className="w-full text-xs px-3 py-2 bg-white border border-zinc-300 text-black rounded-lg focus:outline-none focus:border-accent-600 focus:ring-1 focus:ring-accent-600"
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
                className="w-full text-xs px-3 py-2 bg-white border border-zinc-300 text-black rounded-lg focus:outline-none focus:border-accent-600 focus:ring-1 focus:ring-accent-600"
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
                className="w-full text-xs px-3 py-2 pl-8 bg-white border border-zinc-300 text-black placeholder-zinc-400 rounded-lg focus:outline-none focus:border-accent-600 focus:ring-1 focus:ring-accent-600 transition"
              />
              <Smartphone className="w-3.5 h-3.5 text-zinc-400 absolute left-2.5 top-2.5" />
            </div>
            <span className="text-[10px] text-zinc-500 mt-1 block">Optional: Triggers SMS reminder via Amazon SNS</span>
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={resetForm}
              className="px-3 py-1.5 rounded-lg text-xs font-medium text-zinc-600 hover:text-black hover:bg-zinc-200 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createMutation.isPending}
              className="px-3.5 py-1.5 rounded-lg text-xs font-semibold text-white bg-accent-600 hover:bg-accent-700 shadow-sm transition"
            >
              {createMutation.isPending ? 'Saving...' : 'Save Habit'}
            </button>
          </div>
        </form>
      )}

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
          <div className="text-center py-8 text-zinc-400">
            <HeartPulse className="w-8 h-8 mx-auto mb-2 opacity-30 text-zinc-400" />
            <p className="text-xs font-medium text-zinc-600">No health reminders added.</p>
            <p className="text-[11px] text-zinc-400 mt-0.5">Schedule daily water, vitamins, or walking habits.</p>
          </div>
        ) : (
          reminders.map((reminder) => (
            <div
              key={reminder.id}
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
            </div>
          ))
        )}
      </div>
    </div>
  );
}
