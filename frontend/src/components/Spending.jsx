/**
 * Spending Component
 * Features Donut Chart category breakdown (Recharts), monthly history selector,
 * running total against soft monthly budget, and inline expense logging.
 */

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  PieChart as PieChartIcon,
  Plus,
  X,
  Calendar,
  Utensils,
  Car,
  Receipt,
  HeartPulse,
  Film,
  MoreHorizontal,
  TrendingUp,
  TrendingDown,
  ChevronDown,
} from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { spendingApi } from '../api/client';

const CATEGORY_COLORS = {
  food: '#10b981', // emerald-500
  transport: '#38bdf8', // sky-400
  bills: '#818cf8', // accent-400 (electric indigo)
  health: '#f43f5e', // rose-500
  entertainment: '#a855f7', // purple-500
  other: '#fbbf24', // amber-400
};

export default function Spending() {
  const queryClient = useQueryClient();
  const [isAdding, setIsAdding] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
  });

  // Form State
  const [formData, setFormData] = useState({
    amount: '',
    category: 'food',
    description: '',
    date: new Date().toISOString().split('T')[0],
  });

  // Query spending summary & chart data
  const {
    data: summaryData,
    isLoading: isSummaryLoading,
    isError: isSummaryError,
  } = useQuery({
    queryKey: ['spending', 'summary', selectedMonth],
    queryFn: async () => {
      const res = await spendingApi.summary(selectedMonth);
      return res;
    },
  });

  // Query spending item list
  const {
    data: listData,
    isLoading: isListLoading,
  } = useQuery({
    queryKey: ['spending', 'list', selectedMonth],
    queryFn: async () => {
      const res = await spendingApi.list({ month: selectedMonth });
      return res;
    },
  });

  const summary = summaryData?.summary || {
    currentMonthTotal: 0,
    lastMonthTotal: 0,
    monthOverMonthPctChange: 0,
    softMonthlyBudget: 50000,
    budgetRemaining: 50000,
    budgetConsumedPercentage: 0,
    byCategory: [],
    availableMonths: [selectedMonth],
  };

  const items = listData?.items || [];

  // Create Mutation
  const createMutation = useMutation({
    mutationFn: (newExpense) => spendingApi.create(newExpense),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['spending'] });
      resetForm();
    },
  });

  const resetForm = () => {
    setFormData({
      amount: '',
      category: 'food',
      description: '',
      date: new Date().toISOString().split('T')[0],
    });
    setIsAdding(false);
  };

  const handleCreateSubmit = (e) => {
    e.preventDefault();
    if (!formData.amount || !formData.description.trim()) return;

    createMutation.mutate({
      amount: Number(formData.amount),
      category: formData.category,
      description: formData.description.trim(),
      date: formData.date,
    });
  };

  const getCategoryIcon = (category) => {
    switch (category) {
      case 'food':
        return <Utensils className="w-3.5 h-3.5 text-emerald-400" />;
      case 'transport':
        return <Car className="w-3.5 h-3.5 text-sky-400" />;
      case 'bills':
        return <Receipt className="w-3.5 h-3.5 text-accent-400" />;
      case 'health':
        return <HeartPulse className="w-3.5 h-3.5 text-rose-400" />;
      case 'entertainment':
        return <Film className="w-3.5 h-3.5 text-purple-400" />;
      default:
        return <MoreHorizontal className="w-3.5 h-3.5 text-amber-400" />;
    }
  };

  // Filter chart data for categories with positive amounts
  const chartData = (summary.byCategory || [])
    .filter((cat) => cat.amount > 0)
    .map((cat) => ({
      name: cat.category.charAt(0).toUpperCase() + cat.category.slice(1),
      value: cat.amount,
      percentage: cat.percentage,
      categoryKey: cat.category,
    }));

  return (
    <div className="bg-[#0E1017]/90 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-xl flex flex-col h-full relative overflow-hidden group/card hover:border-white/15 transition-all">
      {/* Subtle top glow */}
      <div className="absolute top-0 right-1/4 w-40 h-20 bg-accent-500/10 blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-white/[0.08] relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-accent-500/10 border border-accent-500/20 text-accent-400 flex items-center justify-center shadow-glow-sm">
            <PieChartIcon className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-white text-base tracking-tight">Spending</h3>
            <p className="text-xs text-slate-400">Expenses & Budget Trends</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Month Selector */}
          <div className="relative">
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="text-xs font-semibold pl-2.5 pr-7 py-1.5 bg-[#141722] text-white hover:bg-white/[0.08] border border-white/10 rounded-lg appearance-none cursor-pointer focus:outline-none focus:border-accent-400 transition"
            >
              {(summary.availableMonths || [selectedMonth]).map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
            <ChevronDown className="w-3 h-3 text-slate-400 absolute right-2 top-2.5 pointer-events-none" />
          </div>

          {!isAdding && (
            <button
              onClick={() => setIsAdding(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-accent-600 hover:bg-accent-500 shadow-glow-sm border border-accent-400/30 transition-all hover:scale-105"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Log</span>
            </button>
          )}
        </div>
      </div>

      {/* Budget & Running Total Metric Bar */}
      <div className="mt-4 p-4 bg-white/[0.03] border border-white/[0.06] rounded-xl relative z-10">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider block">Total Spent</span>
            <span className="text-2xl font-extrabold text-white tracking-tight">
              ₹{summary.currentMonthTotal?.toLocaleString('en-IN')}
            </span>
          </div>

          <div className="text-right">
            <span className="text-[11px] font-medium text-slate-400 block">
              Budget: ₹{summary.softMonthlyBudget?.toLocaleString('en-IN')}
            </span>
            {summary.monthOverMonthPctChange !== 0 && (
              <span
                className={`text-xs font-semibold inline-flex items-center gap-0.5 ${
                  summary.monthOverMonthPctChange > 0 ? 'text-rose-400' : 'text-emerald-400'
                }`}
              >
                {summary.monthOverMonthPctChange > 0 ? (
                  <TrendingUp className="w-3 h-3" />
                ) : (
                  <TrendingDown className="w-3 h-3" />
                )}
                {Math.abs(summary.monthOverMonthPctChange)}% vs last mo
              </span>
            )}
          </div>
        </div>

        {/* Budget Progress Bar */}
        <div className="mt-3">
          <div className="w-full h-2 bg-white/[0.06] rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-500 ${
                summary.budgetConsumedPercentage > 90
                  ? 'bg-rose-500'
                  : summary.budgetConsumedPercentage > 75
                  ? 'bg-amber-500'
                  : 'bg-emerald-500'
              }`}
              style={{ width: `${Math.min(100, summary.budgetConsumedPercentage || 0)}%` }}
            />
          </div>
          <div className="flex justify-between text-[10px] text-slate-400 mt-1.5">
            <span>{summary.budgetConsumedPercentage}% consumed</span>
            <span>₹{Math.max(0, summary.budgetRemaining)?.toLocaleString('en-IN')} remaining</span>
          </div>
        </div>
      </div>

      {/* Donut Chart Breakdown */}
      {chartData.length > 0 && (
        <div className="mt-4 pt-2 pb-2 border-b border-white/[0.08] flex flex-col sm:flex-row items-center justify-center gap-4 relative z-10">
          <div className="w-36 h-36">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={36}
                  outerRadius={56}
                  paddingAngle={3}
                  dataKey="value"
                  stroke="none"
                >
                  {chartData.map((entry) => (
                    <Cell key={entry.name} fill={CATEGORY_COLORS[entry.categoryKey] || '#94a3b8'} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value) => [`₹${value.toLocaleString('en-IN')}`, 'Spent']}
                  contentStyle={{
                    backgroundColor: '#0E1017',
                    borderRadius: '12px',
                    fontSize: '11px',
                    color: '#fff',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.6)',
                  }}
                  itemStyle={{ color: '#fff' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Legend Grid */}
          <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
            {chartData.map((cat) => (
              <div key={cat.name} className="flex items-center gap-1.5">
                <span
                  className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                  style={{ backgroundColor: CATEGORY_COLORS[cat.categoryKey] || '#94a3b8' }}
                />
                <span className="text-slate-400 font-medium truncate">{cat.name}:</span>
                <span className="text-white font-bold">₹{cat.value.toLocaleString('en-IN')}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Inline Add Expense Form */}
      {isAdding && (
        <form onSubmit={handleCreateSubmit} className="mt-4 p-4 bg-white/[0.03] rounded-xl border border-white/10 space-y-3 relative z-10">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-white">Log New Expense</span>
            <button type="button" onClick={resetForm} className="text-slate-400 hover:text-white transition">
              <X className="w-4 h-4" />
            </button>
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
                className="w-full text-xs px-3 py-2 bg-white/[0.04] border border-white/10 text-white placeholder-slate-500 rounded-lg focus:outline-none focus:border-accent-400 focus:ring-1 focus:ring-accent-400 transition"
              />
            </div>
            <div>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full text-xs px-3 py-2 bg-[#141722] border border-white/10 text-white rounded-lg focus:outline-none focus:border-accent-400 focus:ring-1 focus:ring-accent-400"
              >
                <option value="food">Food & Dining</option>
                <option value="transport">Transport / Cab</option>
                <option value="bills">Bills & Utilities</option>
                <option value="health">Health & Medical</option>
                <option value="entertainment">Entertainment</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>

          <div>
            <input
              type="text"
              placeholder="Description (e.g. Weekly Organic Produce)"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              required
              className="w-full text-xs px-3 py-2 bg-white/[0.04] border border-white/10 text-white placeholder-slate-500 rounded-lg focus:outline-none focus:border-accent-400 focus:ring-1 focus:ring-accent-400 transition"
            />
          </div>

          <div>
            <input
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              required
              className="w-full text-xs px-3 py-2 bg-white/[0.04] border border-white/10 text-white rounded-lg focus:outline-none focus:border-accent-400 focus:ring-1 focus:ring-accent-400"
            />
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
              {createMutation.isPending ? 'Logging...' : 'Log Expense'}
            </button>
          </div>
        </form>
      )}

      {/* Expense Item List */}
      <div className="mt-4 flex-1 overflow-y-auto space-y-2.5 max-h-[300px] pr-0.5 relative z-10">
        {isListLoading ? (
          <div className="space-y-2.5 animate-pulse">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-12 bg-white/[0.03] border border-white/[0.06] rounded-xl" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-6 text-slate-500">
            <Receipt className="w-7 h-7 mx-auto mb-1.5 opacity-30 text-slate-400" />
            <p className="text-xs font-medium text-slate-300">No expenses logged for {selectedMonth}.</p>
          </div>
        ) : (
          items.map((item) => (
            <div
              key={item.id}
              className="p-3 rounded-xl border border-white/[0.08] bg-white/[0.03] hover:border-white/15 hover:bg-white/[0.05] transition-all flex items-center justify-between gap-3"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-7 h-7 rounded-lg bg-white/[0.04] border border-white/[0.06] flex items-center justify-center flex-shrink-0">
                  {getCategoryIcon(item.category)}
                </div>
                <div className="min-w-0">
                  <h4 className="text-xs font-bold text-white truncate">{item.description}</h4>
                  <div className="flex items-center gap-1.5 text-[10px] text-slate-400 mt-0.5">
                    <span className="capitalize">{item.category}</span>
                    <span>•</span>
                    <span>{item.date}</span>
                  </div>
                </div>
              </div>

              <div className="text-right flex-shrink-0">
                <span className="text-xs font-bold text-white">₹{item.amount?.toLocaleString('en-IN')}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
