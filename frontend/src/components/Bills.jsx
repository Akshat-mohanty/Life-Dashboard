/**
 * Bills & Payments Component
 * Redesigned in Obsidian Black, Pure White & Electric Indigo
 */

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  CreditCard,
  Plus,
  CheckCircle,
  Clock,
  AlertTriangle,
  Trash2,
  Edit2,
  X,
  Calendar,
  Repeat,
} from 'lucide-react';
import { billsApi } from '../api/client';

export default function Bills() {
  const queryClient = useQueryClient();
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    amount: '',
    dueDate: '',
    isRecurring: false,
    frequency: 'monthly',
  });

  // Query bills
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['bills'],
    queryFn: async () => {
      const res = await billsApi.list();
      return res;
    },
  });

  const bills = data?.items || [];
  const summary = data?.summary || {
    totalUnpaidAmount: 0,
    totalPaidAmount: 0,
    totalOverdueAmount: 0,
    unpaidCount: 0,
    overdueCount: 0,
  };

  // Create Mutation
  const createMutation = useMutation({
    mutationFn: (newBill) => billsApi.create(newBill),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bills'] });
      queryClient.invalidateQueries({ queryKey: ['spending', 'summary'] });
      resetForm();
    },
  });

  // Update Mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, updates }) => billsApi.update(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bills'] });
      setEditingId(null);
    },
  });

  // Delete Mutation
  const deleteMutation = useMutation({
    mutationFn: (id) => billsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bills'] });
    },
  });

  const resetForm = () => {
    setFormData({
      name: '',
      amount: '',
      dueDate: '',
      isRecurring: false,
      frequency: 'monthly',
    });
    setIsAdding(false);
    setEditingId(null);
  };

  const handleCreateSubmit = (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.amount || !formData.dueDate) return;

    createMutation.mutate({
      name: formData.name.trim(),
      amount: Number(formData.amount),
      dueDate: formData.dueDate,
      isRecurring: formData.isRecurring,
      frequency: formData.isRecurring ? formData.frequency : null,
      isPaid: false,
    });
  };

  const startEdit = (bill) => {
    setEditingId(bill.id);
    setFormData({
      name: bill.name,
      amount: bill.amount,
      dueDate: bill.dueDate,
      isRecurring: bill.isRecurring || false,
      frequency: bill.frequency || 'monthly',
    });
  };

  const handleUpdateSubmit = (e, id) => {
    e.preventDefault();
    updateMutation.mutate({
      id,
      updates: {
        name: formData.name.trim(),
        amount: Number(formData.amount),
        dueDate: formData.dueDate,
        isRecurring: formData.isRecurring,
        frequency: formData.isRecurring ? formData.frequency : null,
      },
    });
  };

  const togglePaid = (bill) => {
    updateMutation.mutate({
      id: bill.id,
      updates: {
        isPaid: !bill.isPaid,
      },
    });
  };

  // Color-coded badge helper for dark mode
  const getStatusBadge = (status) => {
    switch (status) {
      case 'overdue':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/15 text-rose-300 border border-rose-500/30">
            <AlertTriangle className="w-3 h-3 text-rose-400" />
            Overdue
          </span>
        );
      case 'due_soon':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30">
            <Clock className="w-3 h-3 text-amber-400" />
            Due Soon
          </span>
        );
      case 'paid':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
            <CheckCircle className="w-3 h-3 text-emerald-400" />
            Paid
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-white/[0.05] text-slate-400 border border-white/10">
            Upcoming
          </span>
        );
    }
  };

  return (
    <div className="bg-[#0E1017]/90 backdrop-blur-xl rounded-2xl border border-white/10 p-6 shadow-xl flex flex-col h-full transition-all">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-white/[0.08]">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center">
            <CreditCard className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-white text-base">Bills & Payments</h3>
            <p className="text-xs text-slate-400">Track due dates & expenses</p>
          </div>
        </div>

        {!isAdding && !editingId && (
          <button
            onClick={() => setIsAdding(true)}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold text-accent-300 bg-accent-500/10 hover:bg-accent-500/20 border border-accent-500/20 transition active:scale-95"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add</span>
          </button>
        )}
      </div>

      {/* Unpaid Tally Metric Bar */}
      <div className="mt-4 p-3.5 bg-white/[0.03] border border-white/[0.06] rounded-xl flex items-center justify-between">
        <div>
          <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block">Total Unpaid</span>
          <span className="text-xl font-extrabold text-white tracking-tight">
            ₹{summary.totalUnpaidAmount.toLocaleString('en-IN')}
          </span>
        </div>
        {summary.overdueCount > 0 && (
          <div className="text-right">
            <span className="text-xs font-medium text-rose-400 block flex items-center gap-1 justify-end">
              <AlertTriangle className="w-3 h-3 text-rose-400" /> {summary.overdueCount} Overdue
            </span>
            <span className="text-xs text-rose-300 font-bold">
              ₹{summary.totalOverdueAmount.toLocaleString('en-IN')}
            </span>
          </div>
        )}
      </div>

      {/* Inline Add Form */}
      {isAdding && (
        <form onSubmit={handleCreateSubmit} className="mt-4 p-4 bg-white/[0.03] rounded-xl border border-white/10 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-white">Add New Bill</span>
            <button type="button" onClick={resetForm} className="text-slate-400 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div>
            <input
              type="text"
              placeholder="Bill Name (e.g. WiFi Broadband)"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              className="w-full text-xs px-3 py-2 bg-white/[0.04] border border-white/10 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-accent-400 focus:ring-1 focus:ring-accent-400"
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <input
                type="number"
                placeholder="Amount (₹)"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                required
                min="1"
                step="any"
                className="w-full text-xs px-3 py-2 bg-white/[0.04] border border-white/10 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-accent-400 focus:ring-1 focus:ring-accent-400"
              />
            </div>
            <div>
              <input
                type="date"
                value={formData.dueDate}
                onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                required
                className="w-full text-xs px-3 py-2 bg-white/[0.04] border border-white/10 rounded-lg text-white focus:outline-none focus:border-accent-400 focus:ring-1 focus:ring-accent-400"
              />
            </div>
          </div>
          <div className="flex items-center justify-between pt-1">
            <label className="flex items-center gap-1.5 text-xs text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.isRecurring}
                onChange={(e) => setFormData({ ...formData, isRecurring: e.target.checked })}
                className="rounded bg-white/10 border-white/20 text-accent-500 focus:ring-accent-500"
              />
              <span>Recurring</span>
            </label>
            {formData.isRecurring && (
              <select
                value={formData.frequency}
                onChange={(e) => setFormData({ ...formData, frequency: e.target.value })}
                className="text-xs px-2.5 py-1 bg-white/[0.06] border border-white/10 text-white rounded-lg focus:outline-none"
              >
                <option value="monthly" className="bg-[#0e1017]">Monthly</option>
                <option value="weekly" className="bg-[#0e1017]">Weekly</option>
                <option value="yearly" className="bg-[#0e1017]">Yearly</option>
              </select>
            )}
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={resetForm}
              className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createMutation.isPending}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-accent-600 hover:bg-accent-500 transition active:scale-95"
            >
              {createMutation.isPending ? 'Saving...' : 'Save Bill'}
            </button>
          </div>
        </form>
      )}

      {/* Bill List */}
      <div className="mt-4 flex-1 overflow-y-auto space-y-2.5 max-h-[420px] pr-0.5">
        {isLoading ? (
          <div className="space-y-2.5 animate-pulse">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-white/[0.04] rounded-xl" />
            ))}
          </div>
        ) : isError ? (
          <p className="text-xs text-rose-400 p-2">Error loading bills: {error.message}</p>
        ) : bills.length === 0 ? (
          <div className="text-center py-8 text-slate-500">
            <CreditCard className="w-8 h-8 mx-auto mb-2 opacity-30" />
            <p className="text-xs font-medium text-slate-400">No bills added yet.</p>
            <p className="text-[11px] text-slate-500 mt-0.5">Add subscriptions, utilities, and rent.</p>
          </div>
        ) : (
          bills.map((bill) => (
            <div
              key={bill.id}
              className={`p-3.5 rounded-xl border transition-all ${
                bill.status === 'overdue'
                  ? 'bg-rose-500/[0.06] border-rose-500/30'
                  : bill.status === 'due_soon'
                  ? 'bg-amber-500/[0.06] border-amber-500/30'
                  : bill.isPaid
                  ? 'bg-white/[0.01] border-white/[0.04] opacity-55'
                  : 'bg-white/[0.03] border-white/[0.07] hover:border-white/15'
              }`}
            >
              {editingId === bill.id ? (
                <form onSubmit={(e) => handleUpdateSubmit(e, bill.id)} className="space-y-2">
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    className="w-full text-xs px-2 py-1 bg-white/[0.06] border border-white/10 rounded text-white"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="number"
                      value={formData.amount}
                      onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                      required
                      className="w-full text-xs px-2 py-1 bg-white/[0.06] border border-white/10 rounded text-white"
                    />
                    <input
                      type="date"
                      value={formData.dueDate}
                      onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                      required
                      className="w-full text-xs px-2 py-1 bg-white/[0.06] border border-white/10 rounded text-white"
                    />
                  </div>
                  <div className="flex justify-end gap-1 pt-1">
                    <button
                      type="button"
                      onClick={() => setEditingId(null)}
                      className="px-2 py-1 text-xs text-slate-400"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={updateMutation.isPending}
                      className="px-2.5 py-1 text-xs font-semibold bg-accent-600 text-white rounded"
                    >
                      Save
                    </button>
                  </div>
                </form>
              ) : (
                <div className="flex items-center justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className={`text-sm font-bold truncate ${bill.isPaid ? 'line-through text-slate-500' : 'text-white'}`}>
                        {bill.name}
                      </h4>
                      {bill.isRecurring && (
                        <span className="text-[10px] text-slate-400 flex items-center gap-0.5" title={`Recurring ${bill.frequency || 'monthly'}`}>
                          <Repeat className="w-2.5 h-2.5" />
                          {bill.frequency || 'monthly'}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-1 text-xs text-slate-400">
                      <span className="font-extrabold text-white">₹{bill.amount?.toLocaleString('en-IN')}</span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-slate-500" />
                        {bill.dueDate}
                      </span>
                      <span>•</span>
                      {getStatusBadge(bill.status)}
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <button
                      onClick={() => togglePaid(bill)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
                        bill.isPaid
                          ? 'bg-white/[0.04] text-slate-400 hover:text-white'
                          : 'bg-accent-500/15 text-accent-300 hover:bg-accent-500/25 border border-accent-500/30 shadow-glow-sm'
                      }`}
                    >
                      {bill.isPaid ? 'Unmark' : 'Mark Paid'}
                    </button>
                    <button
                      onClick={() => startEdit(bill)}
                      className="p-1 text-slate-400 hover:text-white rounded transition"
                      title="Edit"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => deleteMutation.mutate(bill.id)}
                      className="p-1 text-slate-400 hover:text-rose-400 rounded transition"
                      title="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
