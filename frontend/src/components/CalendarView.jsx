/**
 * CalendarView Component
 * Displays events for today and the next 7 days with inline creation and date chips.
 */

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar as CalendarIcon,
  Plus,
  Trash2,
  X,
  Clock,
  MapPin,
  FileText,
  CalendarCheck,
  CreditCard,
  HeartPulse,
  AlertCircle,
  Check,
} from 'lucide-react';
import { calendarApi, billsApi, healthApi } from '../api/client';
import { useCurrency } from '../hooks/useCurrency';

export default function CalendarView() {
  const queryClient = useQueryClient();
  const { formatAmount } = useCurrency();
  const [isAdding, setIsAdding] = useState(false);
  const [filter, setFilter] = useState('all'); // 'all' | 'events' | 'bills' | 'health'

  // Form State
  const [formData, setFormData] = useState({
    title: '',
    date: new Date().toISOString().split('T')[0],
    time: '10:00',
    location: '',
    notes: '',
  });

  // Query events
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['calendar'],
    queryFn: async () => {
      const res = await calendarApi.list();
      return res;
    },
  });

  // Query bills to integrate unpaid bills due in next 7 days
  const { data: billsData } = useQuery({
    queryKey: ['bills'],
    queryFn: billsApi.list,
  });

  // Query health reminders to integrate upcoming health checkups & habits
  const { data: healthData } = useQuery({
    queryKey: ['health'],
    queryFn: healthApi.list,
  });

  const events = data?.items || [];
  const summary = data?.summary || {
    todayCount: 0,
    next7DaysCount: 0,
    totalCount: 0,
    todayStr: new Date().toISOString().split('T')[0],
  };

  const todayStr =
    summary.todayStr || new Date().toISOString().split('T')[0];
  const sevenDaysLater = new Date();
  sevenDaysLater.setDate(sevenDaysLater.getDate() + 7);
  const maxDateStr = sevenDaysLater.toISOString().split('T')[0];

  // Unpaid bills due in 7 days or overdue
  const unpaidBills = (billsData?.items || [])
    .filter((b) => !b.isPaid)
    .filter((b) => !b.dueDate || b.dueDate <= maxDateStr)
    .map((b) => ({
      id: `bill-${b.id}`,
      originalId: b.id,
      type: 'bill',
      title: b.name,
      amount: b.amount,
      date: b.dueDate || todayStr,
      isOverdue: b.dueDate && b.dueDate < todayStr,
      raw: b,
    }));

  // Pending health reminders / checkups
  const pendingHealth = (healthData?.items || []).map((h) => ({
    id: `health-${h.id}`,
    originalId: h.id,
    type: 'health',
    title: h.name,
    frequency: h.frequency,
    time: h.time,
    date: todayStr,
    raw: h,
  }));

  // Calendar events
  const calendarItems = events.map((e) => ({
    id: `event-${e.id}`,
    originalId: e.id,
    type: 'event',
    title: e.title,
    date: e.date,
    time: e.time,
    location: e.location,
    notes: e.notes,
    raw: e,
  }));

  // Combined unified items
  const allItems = [...calendarItems, ...unpaidBills, ...pendingHealth].sort((a, b) => {
    if (a.date !== b.date) return a.date.localeCompare(b.date);
    const timeA = a.time || '23:59';
    const timeB = b.time || '23:59';
    return timeA.localeCompare(timeB);
  });

  const displayedItems = allItems.filter((item) => {
    if (filter === 'events') return item.type === 'event';
    if (filter === 'bills') return item.type === 'bill';
    if (filter === 'health') return item.type === 'health';
    return true;
  });

  // Create Mutation
  const createMutation = useMutation({
    mutationFn: (newEvent) => calendarApi.create(newEvent),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendar'] });
      resetForm();
    },
  });

  // Delete Mutation
  const deleteMutation = useMutation({
    mutationFn: (id) => calendarApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendar'] });
    },
  });

  // Quick Pay Bill Mutation
  const payBillMutation = useMutation({
    mutationFn: (billId) => billsApi.update(billId, { isPaid: true }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bills'] });
    },
  });

  const resetForm = () => {
    setFormData({
      title: '',
      date: new Date().toISOString().split('T')[0],
      time: '10:00',
      location: '',
      notes: '',
    });
    setIsAdding(false);
  };

  const handleCreateSubmit = (e) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.date) return;

    createMutation.mutate({
      title: formData.title.trim(),
      date: formData.date,
      time: formData.time ? formData.time : null,
      location: formData.location.trim() ? formData.location.trim() : null,
      notes: formData.notes.trim() ? formData.notes.trim() : null,
    });
  };

  const getDayLabel = (dateStr) => {
    const now = new Date();
    if (dateStr === todayStr) return 'Today';

    const tm = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    const tomorrowStr = `${tm.getFullYear()}-${String(tm.getMonth() + 1).padStart(2, '0')}-${String(tm.getDate()).padStart(2, '0')}`;
    if (dateStr === tomorrowStr) return 'Tomorrow';

    if (dateStr < todayStr) return 'Overdue';

    const eventDate = new Date(dateStr + 'T12:00:00');
    return eventDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  };

  return (
    <div className="bg-white/95 border border-zinc-200/90 rounded-2xl p-4 sm:p-5 shadow-xs hover:shadow-sm transition-all flex flex-col h-full">
      {/* Sleek Header */}
      <div className="flex items-center justify-between pb-3.5 border-b border-zinc-100 gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-zinc-900 text-white flex items-center justify-center shadow-xs flex-shrink-0">
            <CalendarIcon className="w-4 h-4 text-cyan-300" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-zinc-900 text-sm tracking-tight whitespace-nowrap">Calendar & Schedule</h3>
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-700 border border-zinc-200 whitespace-nowrap">
                {allItems.length} in 7d
              </span>
              {unpaidBills.filter((b) => b.isOverdue).length > 0 && (
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200 whitespace-nowrap">
                  {unpaidBills.filter((b) => b.isOverdue).length} overdue
                </span>
              )}
            </div>
            <p className="text-[11px] text-zinc-400 whitespace-nowrap">Upcoming Events, Bills & Health Reminders</p>
          </div>
        </div>

        {!isAdding && (
          <button
            onClick={() => setIsAdding(true)}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold text-zinc-900 bg-white hover:bg-zinc-50 border border-zinc-200 shadow-2xs hover:border-zinc-300 transition active:scale-95 cursor-pointer flex-shrink-0"
          >
            <Plus className="w-3.5 h-3.5 text-zinc-700" />
            <span>Add</span>
          </button>
        )}
      </div>

      {/* Category Filter Chips */}
      <div className="flex items-center gap-1.5 pt-2.5 pb-2 overflow-x-auto text-[11px] border-b border-zinc-100">
        <button
          type="button"
          onClick={() => setFilter('all')}
          className={`px-2.5 py-1 rounded-lg font-semibold transition cursor-pointer whitespace-nowrap ${
            filter === 'all'
              ? 'bg-zinc-900 text-white shadow-xs'
              : 'bg-zinc-100 hover:bg-zinc-200/80 text-zinc-600'
          }`}
        >
          All ({allItems.length})
        </button>
        <button
          type="button"
          onClick={() => setFilter('events')}
          className={`px-2.5 py-1 rounded-lg font-semibold transition cursor-pointer whitespace-nowrap ${
            filter === 'events'
              ? 'bg-zinc-900 text-white shadow-xs'
              : 'bg-zinc-100 hover:bg-zinc-200/80 text-zinc-600'
          }`}
        >
          Events ({calendarItems.length})
        </button>
        <button
          type="button"
          onClick={() => setFilter('bills')}
          className={`px-2.5 py-1 rounded-lg font-semibold transition cursor-pointer whitespace-nowrap ${
            filter === 'bills'
              ? 'bg-zinc-900 text-white shadow-xs'
              : 'bg-zinc-100 hover:bg-zinc-200/80 text-zinc-600'
          }`}
        >
          Bills Due ({unpaidBills.length})
        </button>
        <button
          type="button"
          onClick={() => setFilter('health')}
          className={`px-2.5 py-1 rounded-lg font-semibold transition cursor-pointer whitespace-nowrap ${
            filter === 'health'
              ? 'bg-zinc-900 text-white shadow-xs'
              : 'bg-zinc-100 hover:bg-zinc-200/80 text-zinc-600'
          }`}
        >
          Health ({pendingHealth.length})
        </button>
      </div>

      {/* Add Calendar Event Modal Popup */}
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
                  <h3 className="text-base font-bold text-black tracking-tight">Add Calendar Event</h3>
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
                    Event Title
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Team Standup, Doctor Appointment, Project Review"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    required
                    className="w-full text-xs px-3.5 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-black placeholder-zinc-400 focus:outline-none focus:bg-white focus:border-accent-400 focus:ring-2 focus:ring-accent-100 transition"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1.5">
                      Date
                    </label>
                    <input
                      type="date"
                      value={formData.date}
                      onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                      required
                      className="w-full text-xs px-3.5 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-black focus:outline-none focus:bg-white focus:border-accent-400 focus:ring-2 focus:ring-accent-100 transition cursor-pointer"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1.5">
                      Time (Optional)
                    </label>
                    <input
                      type="time"
                      value={formData.time}
                      onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                      className="w-full text-xs px-3.5 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-black focus:outline-none focus:bg-white focus:border-accent-400 focus:ring-2 focus:ring-accent-100 transition cursor-pointer"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1.5">
                    Location / Link
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Zoom, Google Meet, City Clinic"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    className="w-full text-xs px-3.5 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-black placeholder-zinc-400 focus:outline-none focus:bg-white focus:border-accent-400 focus:ring-2 focus:ring-accent-100 transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1.5">
                    Notes or Agenda (Optional)
                  </label>
                  <textarea
                    placeholder="Additional event details..."
                    rows={2}
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className="w-full text-xs px-3.5 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-black placeholder-zinc-400 focus:outline-none focus:bg-white focus:border-accent-400 focus:ring-2 focus:ring-accent-100 transition resize-none"
                  />
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
                    {createMutation.isPending ? 'Saving...' : 'Save Event'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Event List */}
      <div className="mt-4 flex-1 overflow-y-auto space-y-2.5 max-h-[420px] pr-0.5">
        {isLoading ? (
          <div className="space-y-2.5 animate-pulse">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-zinc-100 rounded-xl" />
            ))}
          </div>
        ) : isError ? (
          <p className="text-xs text-rose-600 p-2">Error loading calendar: {error.message}</p>
        ) : displayedItems.length === 0 ? (
          <div className="text-center py-6 px-4 bg-zinc-50/50 rounded-xl border border-dashed border-zinc-200">
            <CalendarCheck className="w-5 h-5 mx-auto mb-1.5 text-zinc-300" />
            <p className="text-xs font-semibold text-zinc-700">Clear schedule</p>
            <p className="text-[11px] text-zinc-400 mt-0.5">
              No {filter === 'all' ? 'events, unpaid bills, or health checkups' : filter} scheduled for the next 7 days
            </p>
          </div>
        ) : (
          <AnimatePresence initial={false}>
            {displayedItems.map((item) => {
              const isToday = item.date === todayStr;
              const isBill = item.type === 'bill';
              const isHealth = item.type === 'health';
              const isEvent = item.type === 'event';

              return (
                <motion.div
                  key={item.id}
                  layout
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  className={`p-3.5 rounded-xl border transition-all ${
                    item.isOverdue
                      ? 'bg-rose-50/50 border-rose-200 shadow-2xs'
                      : isToday
                      ? 'bg-accent-50/40 border-accent-200 shadow-2xs'
                      : 'bg-white border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50/50'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            item.isOverdue
                              ? 'bg-rose-600 text-white shadow-xs'
                              : isToday
                              ? 'bg-black text-white shadow-xs'
                              : 'bg-zinc-100 text-zinc-700 border border-zinc-200'
                          }`}
                        >
                          {getDayLabel(item.date)}
                        </span>

                        {isBill && (
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                            item.isOverdue
                              ? 'bg-rose-100 text-rose-700 border border-rose-200'
                              : 'bg-amber-100 text-amber-800 border border-amber-200'
                          }`}>
                            <CreditCard className="w-2.5 h-2.5" />
                            {item.isOverdue ? 'Bill Overdue' : 'Bill Due'}
                          </span>
                        )}

                        {isHealth && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                            <HeartPulse className="w-2.5 h-2.5" />
                            Health Checkup
                          </span>
                        )}

                        {isEvent && (
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-600 border border-zinc-200 flex items-center gap-1">
                            <CalendarIcon className="w-2.5 h-2.5" />
                            Event
                          </span>
                        )}

                        {item.time && (
                          <span className="text-xs font-semibold text-zinc-600 flex items-center gap-1">
                            <Clock className="w-3 h-3 text-zinc-400" />
                            {item.time}
                          </span>
                        )}

                        {isHealth && item.frequency && (
                          <span className="text-[10px] font-medium text-zinc-500 uppercase tracking-wider">
                            • {item.frequency}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                        <h4 className="text-xs font-bold text-black truncate">{item.title}</h4>
                        {isBill && (
                          <span className="text-xs font-extrabold text-black bg-zinc-100 px-1.5 py-0.5 rounded border border-zinc-200">
                            {formatAmount(item.amount)}
                          </span>
                        )}
                      </div>

                      {item.location && (
                        <p className="text-[11px] text-zinc-500 mt-1 flex items-center gap-1.5 truncate">
                          <MapPin className="w-3 h-3 text-zinc-400 flex-shrink-0" />
                          {item.location}
                        </p>
                      )}
                      {item.notes && (
                        <p className="text-[11px] text-zinc-500 mt-1 flex items-center gap-1.5 line-clamp-1">
                          <FileText className="w-3 h-3 text-zinc-400 flex-shrink-0" />
                          {item.notes}
                        </p>
                      )}
                    </div>

                    {isEvent && (
                      <button
                        onClick={() => deleteMutation.mutate(item.originalId)}
                        className="p-1 text-zinc-400 hover:text-rose-600 rounded transition flex-shrink-0 cursor-pointer"
                        title="Delete Event"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}

                    {isBill && (
                      <button
                        type="button"
                        onClick={() => payBillMutation.mutate(item.originalId)}
                        disabled={payBillMutation.isPending}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition cursor-pointer flex-shrink-0"
                        title="Mark Bill as Paid"
                      >
                        <Check className="w-3 h-3" />
                        <span>Pay</span>
                      </button>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}
