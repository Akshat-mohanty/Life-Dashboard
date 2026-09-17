/**
 * CalendarView Component
 * Displays events for today and the next 7 days with inline creation and date chips.
 */

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Calendar as CalendarIcon,
  Plus,
  Trash2,
  X,
  Clock,
  MapPin,
  FileText,
  CalendarCheck,
} from 'lucide-react';
import { calendarApi } from '../api/client';

export default function CalendarView() {
  const queryClient = useQueryClient();
  const [isAdding, setIsAdding] = useState(false);

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

  const events = data?.items || [];
  const summary = data?.summary || {
    todayCount: 0,
    next7DaysCount: 0,
    totalCount: 0,
    todayStr: new Date().toISOString().split('T')[0],
  };

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
    const todayStr = summary.todayStr || new Date().toISOString().split('T')[0];
    if (dateStr === todayStr) return 'Today';

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];
    if (dateStr === tomorrowStr) return 'Tomorrow';

    const eventDate = new Date(dateStr + 'T00:00:00');
    return eventDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <CalendarIcon className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 text-base">Calendar</h3>
            <p className="text-xs text-slate-500">Today & next 7 days</p>
          </div>
        </div>

        {!isAdding && (
          <button
            onClick={() => setIsAdding(true)}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 transition"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add</span>
          </button>
        )}
      </div>

      {/* Summary Chips */}
      <div className="mt-4 p-3 bg-slate-50 rounded-xl flex items-center justify-between">
        <div>
          <span className="text-xs font-medium text-slate-500 uppercase tracking-wider block">Today's Schedule</span>
          <span className="text-xl font-extrabold text-slate-900">{summary.todayCount} Events</span>
        </div>
        <div className="text-right">
          <span className="text-xs font-medium text-indigo-600 block">Next 7 Days</span>
          <span className="text-xs font-bold text-slate-700">{summary.next7DaysCount} Total</span>
        </div>
      </div>

      {/* Inline Add Form */}
      {isAdding && (
        <form onSubmit={handleCreateSubmit} className="mt-4 p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700">Add Calendar Event</span>
            <button type="button" onClick={resetForm} className="text-slate-400 hover:text-slate-600">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div>
            <input
              type="text"
              placeholder="Event Title (e.g. Team Standup)"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
              className="w-full text-xs px-3 py-2 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                required
                className="w-full text-xs px-3 py-2 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <input
                type="time"
                value={formData.time}
                onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                className="w-full text-xs px-3 py-2 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>
          <div>
            <input
              type="text"
              placeholder="Location or link (e.g. Zoom / Clinic)"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              className="w-full text-xs px-3 py-2 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <input
              type="text"
              placeholder="Notes or agenda (optional)"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full text-xs px-3 py-2 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={resetForm}
              className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createMutation.isPending}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 transition"
            >
              {createMutation.isPending ? 'Saving...' : 'Save Event'}
            </button>
          </div>
        </form>
      )}

      {/* Event List */}
      <div className="mt-4 flex-1 overflow-y-auto space-y-2.5 max-h-[420px] pr-0.5">
        {isLoading ? (
          <div className="space-y-2.5 animate-pulse">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-slate-100 rounded-xl" />
            ))}
          </div>
        ) : isError ? (
          <p className="text-xs text-rose-600 p-2">Error loading calendar: {error.message}</p>
        ) : events.length === 0 ? (
          <div className="text-center py-8 text-slate-400">
            <CalendarCheck className="w-8 h-8 mx-auto mb-2 opacity-40" />
            <p className="text-xs font-medium">No events for the next 7 days.</p>
            <p className="text-[11px] text-slate-400 mt-0.5">Add meetings, doctors, or reminders.</p>
          </div>
        ) : (
          events.map((event) => {
            const isToday = event.date === summary.todayStr;
            return (
              <div
                key={event.id}
                className={`p-3.5 rounded-xl border transition-all ${
                  isToday
                    ? 'bg-indigo-50/40 border-indigo-200 shadow-xs'
                    : 'bg-white border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          isToday
                            ? 'bg-indigo-600 text-white'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {getDayLabel(event.date)}
                      </span>
                      {event.time && (
                        <span className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                          <Clock className="w-3 h-3 text-slate-400" />
                          {event.time}
                        </span>
                      )}
                    </div>
                    <h4 className="text-xs font-bold text-slate-900 mt-1 truncate">{event.title}</h4>
                    {event.location && (
                      <p className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-1 truncate">
                        <MapPin className="w-3 h-3 text-slate-400 flex-shrink-0" />
                        {event.location}
                      </p>
                    )}
                    {event.notes && (
                      <p className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-1 line-clamp-1">
                        <FileText className="w-3 h-3 flex-shrink-0" />
                        {event.notes}
                      </p>
                    )}
                  </div>

                  <button
                    onClick={() => deleteMutation.mutate(event.id)}
                    className="p-1 text-slate-300 hover:text-rose-600 rounded transition flex-shrink-0"
                    title="Delete Event"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
