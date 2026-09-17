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
  transport: '#0284c7', // sky-600
  bills: '#6366f1', // indigo-500
  health: '#f43f5e', // rose-500
  entertainment: '#8b5cf6', // violet-500
  other: '#f59e0b', // amber-500
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
        return <Utensils className="w-3.5 h-3.5 text-emerald-600" />;
      case 'transport':
        return <Car className="w-3.5 h-3.5 text-sky-600" />;
      case 'bills':
        return <Receipt className="w-3.5 h-3.5 text-indigo-600" />;
      case 'health':
        return <HeartPulse className="w-3.5 h-3.5 text-rose-600" />;
      case 'entertainment':
        return <Film className="w-3.5 h-3.5 text-violet-600" />;
      default:
        return <MoreHorizontal className="w-3.5 h-3.5 text-amber-600" />;
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
    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center">
            <PieChartIcon className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 text-base">Spending</h3>
            <p className="text-xs text-slate-500">Expenses & Budget Trends</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Month Selector */}
          <div className="relative">
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="text-xs font-semibold pl-2 pr-6 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg appearance-none cursor-pointer focus:outline-none"
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
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-teal-700 bg-teal-50 hover:bg-teal-100 border border-teal-200 transition"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Log</span>
            </button>
          )}
        </div>
      </div>

      {/* Budget & Running Total Metric Bar */}
      <div className="mt-4 p-4 bg-slate-50 rounded-xl">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider block">Total Spent</span>
            <span className="text-2xl font-extrabold text-slate-900">
              ₹{summary.currentMonthTotal?.toLocaleString('en-IN')}
            </span>
          </div>

          <div className="text-right">
            <span className="text-[11px] font-medium text-slate-500 block">
              Budget: ₹{summary.softMonthlyBudget?.toLocaleString('en-IN')}
            </span>
            {summary.monthOverMonthPctChange !== 0 && (
              <span
                className={`text-xs font-semibold inline-flex items-center gap-0.5 ${
                  summary.monthOverMonthPctChange > 0 ? 'text-rose-600' : 'text-emerald-600'
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
          <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
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
          <div className="flex justify-between text-[10px] text-slate-500 mt-1">
            <span>{summary.budgetConsumedPercentage}% consumed</span>
            <span>₹{Math.max(0, summary.budgetRemaining)?.toLocaleString('en-IN')} remaining</span>
          </div>
        </div>
      </div>

      {/* Donut Chart Breakdown */}
      {chartData.length > 0 && (
        <div className="mt-4 pt-2 pb-1 border-b border-slate-100 flex flex-col sm:flex-row items-center justify-center gap-4">
          <div className="w-40 h-40">
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
                >
                  {chartData.map((entry) => (
                    <Cell key={entry.name} fill={CATEGORY_COLORS[entry.categoryKey] || '#94a3b8'} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value) => [`₹${value.toLocaleString('en-IN')}`, 'Spent']}
                  contentStyle={{
                    backgroundColor: '#1e293b',
                    borderRadius: '8px',
                    fontSize: '11px',
                    color: '#fff',
                    border: 'none',
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
                <span className="text-slate-600 font-medium truncate">{cat.name}:</span>
                <span className="text-slate-900 font-bold">₹{cat.value.toLocaleString('en-IN')}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Inline Add Expense Form */}
      {isAdding && (
        <form onSubmit={handleCreateSubmit} className="mt-4 p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700">Log New Expense</span>
            <button type="button" onClick={resetForm} className="text-slate-400 hover:text-slate-600">
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
                className="w-full text-xs px-3 py-2 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
            <div>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full text-xs px-3 py-2 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
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
              className="w-full text-xs px-3 py-2 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <div>
            <input
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              required
              className="w-full text-xs px-3 py-2 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
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
              className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 transition"
            >
              {createMutation.isPending ? 'Logging...' : 'Log Expense'}
            </button>
          </div>
        </form>
      )}

      {/* Expense Item List */}
      <div className="mt-4 flex-1 overflow-y-auto space-y-2.5 max-h-[300px] pr-0.5">
        {isListLoading ? (
          <div className="space-y-2.5 animate-pulse">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-12 bg-slate-100 rounded-xl" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-6 text-slate-400">
            <Receipt className="w-7 h-7 mx-auto mb-1.5 opacity-40" />
            <p className="text-xs font-medium">No expenses logged for {selectedMonth}.</p>
          </div>
        ) : (
          items.map((item) => (
            <div
              key={item.id}
              className="p-3 rounded-xl border border-slate-200 bg-white hover:border-slate-300 transition-all flex items-center justify-between gap-3"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-7 h-7 rounded-lg bg-slate-50 flex items-center justify-center flex-shrink-0">
                  {getCategoryIcon(item.category)}
                </div>
                <div className="min-w-0">
                  <h4 className="text-xs font-bold text-slate-900 truncate">{item.description}</h4>
                  <div className="flex items-center gap-1.5 text-[10px] text-slate-400 mt-0.5">
                    <span className="capitalize">{item.category}</span>
                    <span>•</span>
                    <span>{item.date}</span>
                  </div>
                </div>
              </div>

              <div className="text-right flex-shrink-0">
                <span className="text-xs font-bold text-slate-900">₹{item.amount?.toLocaleString('en-IN')}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
