/**
 * Spending Component
 * Features Donut Chart category breakdown (Recharts), monthly history selector,
 * running total against soft monthly budget, and inline expense logging.
 */

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
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
import { useCurrency } from '../hooks/useCurrency';

const CATEGORY_COLORS = {
  food: '#237d8d', // accent-600
  transport: '#3faab9', // accent-500
  bills: '#9bdee8', // base accent-300
  health: '#e11d48', // rose-600
  entertainment: '#7c3aed', // purple-600
  other: '#d97706', // amber-600
};

export default function Spending() {
  const queryClient = useQueryClient();
  const { formatAmount, currencySymbol } = useCurrency();
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
        return <Utensils className="w-3.5 h-3.5 text-accent-600" />;
      case 'transport':
        return <Car className="w-3.5 h-3.5 text-teal-600" />;
      case 'bills':
        return <Receipt className="w-3.5 h-3.5 text-accent-700" />;
      case 'health':
        return <HeartPulse className="w-3.5 h-3.5 text-rose-600" />;
      case 'entertainment':
        return <Film className="w-3.5 h-3.5 text-purple-600" />;
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
    <div className="bg-white/95 border border-zinc-200/90 rounded-2xl p-3.5 sm:p-4 shadow-xs hover:shadow-sm transition-all flex flex-col h-full">
      {/* Sleek Header */}
      <div className="flex items-center justify-between pb-3 border-b border-zinc-100 gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-7 h-7 rounded-lg bg-zinc-900 text-white flex items-center justify-center shadow-xs flex-shrink-0">
            <PieChartIcon className="w-3.5 h-3.5 text-cyan-300" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <h3 className="font-bold text-zinc-900 text-sm tracking-tight whitespace-nowrap">Spending</h3>
              <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-zinc-100 text-zinc-700 border border-zinc-200 whitespace-nowrap">
                {formatAmount(summary.currentMonthTotal || 0)}
              </span>
            </div>
            <p className="text-[11px] text-zinc-400 whitespace-nowrap truncate max-w-[150px] sm:max-w-[200px]">
              Expenses & Budget
            </p>
          </div>
        </div>

        {!isAdding && (
          <button
            onClick={() => setIsAdding(true)}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold text-zinc-900 bg-white hover:bg-zinc-50 border border-zinc-200 shadow-2xs hover:border-zinc-300 transition active:scale-95 cursor-pointer flex-shrink-0"
          >
            <Plus className="w-3.5 h-3.5 text-zinc-700" />
            <span>Log</span>
          </button>
        )}
      </div>

      {/* Compact Budget Progress Strip */}
      <div className="mt-3 p-2.5 bg-zinc-50/80 border border-zinc-100 rounded-xl">
        <div className="flex items-center justify-between text-xs mb-1.5 gap-2 flex-wrap">
          {/* Month Selector integrated into budget bar */}
          <div className="relative">
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="text-[10px] font-bold pl-2 pr-5 py-0.5 bg-white text-zinc-800 hover:bg-zinc-50 border border-zinc-200 rounded-md appearance-none cursor-pointer focus:outline-none shadow-2xs transition"
            >
              {(summary.availableMonths || [selectedMonth]).map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
            <ChevronDown className="w-2.5 h-2.5 text-zinc-400 absolute right-1.5 top-1.5 pointer-events-none" />
          </div>

          <div className="flex items-center gap-1.5 text-[11px] text-zinc-500">
            <span className="font-semibold text-zinc-800">
              {formatAmount(summary.currentMonthTotal || 0)}
            </span>
            <span>•</span>
            <span>
              {summary.budgetConsumedPercentage || 0}% of{' '}
              {formatAmount(summary.softMonthlyBudget || 50000)}
            </span>
          </div>
        </div>
        <div className="w-full h-1.5 bg-zinc-200 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-500 ${
              summary.budgetConsumedPercentage > 90
                ? 'bg-rose-500'
                : summary.budgetConsumedPercentage > 75
                ? 'bg-amber-500'
                : 'bg-zinc-900'
            }`}
            style={{ width: `${Math.min(100, summary.budgetConsumedPercentage || 0)}%` }}
          />
        </div>
      </div>

      {/* Donut Chart Breakdown */}
      {chartData.length > 0 && (
        <div className="mt-4 pt-2 pb-2 border-b border-zinc-100 flex flex-col sm:flex-row items-center justify-center gap-4">
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
                    <Cell key={entry.name} fill={CATEGORY_COLORS[entry.categoryKey] || '#71717a'} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value) => [formatAmount(value), 'Spent']}
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    borderRadius: '10px',
                    fontSize: '11px',
                    color: '#000000',
                    border: '1px solid #e4e4e7',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
                  }}
                  itemStyle={{ color: '#000000' }}
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
                  style={{ backgroundColor: CATEGORY_COLORS[cat.categoryKey] || '#71717a' }}
                />
                <span className="text-zinc-500 font-medium truncate">{cat.name}:</span>
                <span className="text-black font-bold">{formatAmount(cat.value)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Log Expense Modal Popup */}
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
                  <h3 className="text-base font-bold text-black tracking-tight">Log Expense</h3>
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
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1.5">
                      Amount ({currencySymbol})
                    </label>
                    <input
                      type="number"
                      placeholder="450"
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
                      Category
                    </label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full text-xs px-3.5 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-black focus:outline-none focus:bg-white focus:border-accent-400 focus:ring-2 focus:ring-accent-100 transition cursor-pointer"
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
                  <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1.5">
                    Description
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Weekly Groceries, Uber to Office, Movie Tickets"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    required
                    className="w-full text-xs px-3.5 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-black placeholder-zinc-400 focus:outline-none focus:bg-white focus:border-accent-400 focus:ring-2 focus:ring-accent-100 transition"
                  />
                </div>

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
                    {createMutation.isPending ? 'Logging...' : 'Log Expense'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Expense Item List */}
      <div className="mt-4 flex-1 overflow-y-auto space-y-2.5 max-h-[300px] pr-0.5">
        {isListLoading ? (
          <div className="space-y-2.5 animate-pulse">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-12 bg-zinc-100 rounded-xl" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-6 px-4 bg-zinc-50/50 rounded-xl border border-dashed border-zinc-200">
            <Receipt className="w-5 h-5 mx-auto mb-1.5 text-zinc-300" />
            <p className="text-xs font-semibold text-zinc-700">No expenses logged</p>
            <p className="text-[11px] text-zinc-400 mt-0.5">Track daily expenses, groceries, and travel</p>
          </div>
        ) : (
          <AnimatePresence initial={false}>
            {items.map((item) => (
              <motion.div
                key={item.id}
                layout
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className="p-3 rounded-xl border border-zinc-200 bg-white hover:border-zinc-300 hover:bg-zinc-50/50 transition-all flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-7 h-7 rounded-lg bg-zinc-50 border border-zinc-200 flex items-center justify-center flex-shrink-0">
                    {getCategoryIcon(item.category)}
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-xs font-bold text-black truncate">{item.description}</h4>
                    <div className="flex items-center gap-1.5 text-[10px] text-zinc-500 mt-0.5">
                      <span className="capitalize">{item.category}</span>
                      <span>•</span>
                      <span>{item.date}</span>
                    </div>
                  </div>
                </div>

                <div className="text-right flex-shrink-0">
                  <span className="text-xs font-bold text-black">{formatAmount(item.amount)}</span>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}
