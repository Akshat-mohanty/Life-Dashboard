/**
 * Bills & Payments Component
 * Redesigned in Obsidian Black, Pure White & Electric Indigo
 */

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
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
import { useCurrency } from '../hooks/useCurrency';

export default function Bills() {
  const queryClient = useQueryClient();
  const { formatAmount, currencySymbol } = useCurrency();
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

  // Color-coded badge helper for light mode
  const getStatusBadge = (status) => {
    switch (status) {
      case 'overdue':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
            <AlertTriangle className="w-3 h-3 text-rose-600" />
            Overdue
          </span>
        );
      case 'due_soon':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
            <Clock className="w-3 h-3 text-amber-600" />
            Due Soon
          </span>
        );
      case 'paid':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-accent-50 text-accent-800 border border-accent-200">
            <CheckCircle className="w-3 h-3 text-accent-600" />
            Paid
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-zinc-100 text-zinc-700 border border-zinc-200">
            Upcoming
          </span>
        );
    }
  };

  return (
    <div className="bg-white/95 border border-zinc-200/90 rounded-2xl p-3.5 sm:p-4 shadow-xs hover:shadow-sm transition-all flex flex-col h-full">
      {/* Sleek Header */}
      <div className="flex items-center justify-between pb-3 border-b border-zinc-100 gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-7 h-7 rounded-lg bg-zinc-900 text-white flex items-center justify-center shadow-xs flex-shrink-0">
            <CreditCard className="w-3.5 h-3.5 text-cyan-300" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <h3 className="font-bold text-zinc-900 text-sm tracking-tight whitespace-nowrap">Bills & Payments</h3>
              <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-zinc-100 text-zinc-700 border border-zinc-200 whitespace-nowrap">
                {formatAmount(summary.totalUnpaidAmount)} due
              </span>
              {summary.overdueCount > 0 && (
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200 whitespace-nowrap">
                  {summary.overdueCount} overdue
                </span>
              )}
            </div>
          </div>
        </div>

        {!isAdding && (
          <button
            onClick={() => {
              setEditingId(null);
              setFormData({
                name: '',
                amount: '',
                dueDate: '',
                isRecurring: false,
                frequency: 'monthly',
              });
              setIsAdding(true);
            }}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold text-zinc-900 bg-white hover:bg-zinc-50 border border-zinc-200 shadow-2xs hover:border-zinc-300 transition active:scale-95 cursor-pointer flex-shrink-0"
          >
            <Plus className="w-3.5 h-3.5 text-zinc-700" />
            <span>Add</span>
          </button>
        )}
      </div>

      {/* Add Bill Modal Popup */}
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
                  <h3 className="text-base font-bold text-black tracking-tight">
                    {editingId ? 'Edit Bill' : 'Add New Bill'}
                  </h3>
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
                    Bill Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. WiFi Broadband, Electric Bill, Rent"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    className="w-full text-xs px-3.5 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-black placeholder-zinc-400 focus:outline-none focus:bg-white focus:border-accent-400 focus:ring-2 focus:ring-accent-100 transition"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1.5">
                      Amount ({currencySymbol})
                    </label>
                    <input
                      type="number"
                      placeholder="1500"
                      value={formData.amount}
                      onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                      required
                      min="1"
                      step="any"
                      className="w-full text-xs px-3.5 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-black placeholder-zinc-400 focus:outline-none focus:bg-white focus:border-accent-400 focus:ring-2 focus:ring-accent-100 transition"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1.5">
                      Due Date
                    </label>
                    <input
                      type="date"
                      value={formData.dueDate}
                      onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                      required
                      className="w-full text-xs px-3.5 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-black focus:outline-none focus:bg-white focus:border-accent-400 focus:ring-2 focus:ring-accent-100 transition"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 bg-zinc-50 border border-zinc-200 rounded-xl">
                  <label className="flex items-center gap-2 text-xs font-medium text-zinc-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.isRecurring}
                      onChange={(e) => setFormData({ ...formData, isRecurring: e.target.checked })}
                      className="rounded border-zinc-300 text-accent-600 focus:ring-accent-500 w-4 h-4"
                    />
                    <span>Recurring Obligation</span>
                  </label>
                  {formData.isRecurring && (
                    <select
                      value={formData.frequency}
                      onChange={(e) => setFormData({ ...formData, frequency: e.target.value })}
                      className="text-xs px-3 py-1.5 bg-white border border-zinc-200 text-black font-semibold rounded-lg focus:outline-none focus:border-accent-400"
                    >
                      <option value="monthly">Monthly</option>
                      <option value="weekly">Weekly</option>
                      <option value="yearly">Yearly</option>
                    </select>
                  )}
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
                    {createMutation.isPending ? 'Saving...' : 'Save Bill'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bill List */}
      <div className="mt-4 flex-1 overflow-y-auto space-y-2.5 max-h-[420px] pr-0.5">
        {isLoading ? (
          <div className="space-y-2.5 animate-pulse">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-zinc-100 rounded-xl" />
            ))}
          </div>
        ) : isError ? (
          <p className="text-xs text-rose-600 p-2">Error loading bills: {error.message}</p>
        ) : bills.length === 0 ? (
          <div className="text-center py-6 px-4 bg-zinc-50/50 rounded-xl border border-dashed border-zinc-200">
            <CreditCard className="w-5 h-5 mx-auto mb-1.5 text-zinc-300" />
            <p className="text-xs font-semibold text-zinc-700">No bills recorded</p>
          </div>
        ) : (
          <AnimatePresence initial={false}>
            {bills.map((bill) => (
              <motion.div
                key={bill.id}
                layout
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className={`p-3.5 rounded-xl border transition-all ${
                  bill.status === 'overdue'
                    ? 'bg-rose-50/40 border-rose-200'
                    : bill.status === 'due_soon'
                    ? 'bg-amber-50/40 border-amber-200'
                    : bill.isPaid
                    ? 'bg-zinc-50/50 border-zinc-200/60 opacity-60'
                    : 'bg-white border-zinc-200 hover:border-zinc-300'
                }`}
              >
                {editingId === bill.id ? (
                  <form onSubmit={(e) => handleUpdateSubmit(e, bill.id)} className="space-y-2">
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                      className="w-full text-xs px-2.5 py-1.5 bg-white border border-zinc-300 rounded text-black focus:outline-none focus:border-accent-600"
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="number"
                        value={formData.amount}
                        onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                        required
                        className="w-full text-xs px-2.5 py-1.5 bg-white border border-zinc-300 rounded text-black focus:outline-none focus:border-accent-600"
                      />
                      <input
                        type="date"
                        value={formData.dueDate}
                        onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                        required
                        className="w-full text-xs px-2.5 py-1.5 bg-white border border-zinc-300 rounded text-black focus:outline-none focus:border-accent-600"
                      />
                    </div>
                    <div className="flex justify-end gap-1.5 pt-1">
                      <button
                        type="button"
                        onClick={() => setEditingId(null)}
                        className="px-2.5 py-1 text-xs text-zinc-600 hover:text-black"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={updateMutation.isPending}
                        className="px-3 py-1 text-xs font-bold bg-white hover:bg-zinc-50 text-black border border-zinc-300 hover:border-zinc-400 rounded-lg shadow-xs cursor-pointer"
                      >
                        Save
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className={`text-sm font-bold truncate ${bill.isPaid ? 'line-through text-zinc-400' : 'text-black'}`}>
                          {bill.name}
                        </h4>
                        {bill.isRecurring && (
                          <span className="text-[10px] text-zinc-500 flex items-center gap-0.5" title={`Recurring ${bill.frequency || 'monthly'}`}>
                            <Repeat className="w-2.5 h-2.5" />
                            {bill.frequency || 'monthly'}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-1 text-xs text-zinc-500">
                        <span className="font-extrabold text-black">{formatAmount(bill.amount)}</span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-zinc-400" />
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
                            ? 'bg-zinc-100 text-zinc-600 hover:text-black border border-zinc-200'
                            : 'bg-accent-50 text-accent-800 hover:bg-accent-100 border border-accent-200 shadow-xs'
                        }`}
                      >
                        {bill.isPaid ? 'Unmark' : 'Mark Paid'}
                      </button>
                      <button
                        onClick={() => startEdit(bill)}
                        className="p-1 text-zinc-400 hover:text-black rounded transition"
                        title="Edit"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => deleteMutation.mutate(bill.id)}
                        className="p-1 text-zinc-400 hover:text-rose-600 rounded transition"
                        title="Delete"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}
