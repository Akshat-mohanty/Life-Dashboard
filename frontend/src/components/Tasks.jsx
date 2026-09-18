/**
 * Tasks Component
 * Features AI Rank badges (1 = most urgent), manual drag-and-drop reorder overrides,
 * strike-through completion animations, and inline creation/editing.
 */

import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  CheckSquare,
  Plus,
  Trash2,
  Edit2,
  X,
  Calendar,
  GripVertical,
  Flame,
  CheckCircle2,
  Circle,
} from 'lucide-react';
import { tasksApi } from '../api/client';

export default function Tasks() {
  const queryClient = useQueryClient();
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [draggedIndex, setDraggedIndex] = useState(null);
  const [localItems, setLocalItems] = useState([]);

  // Form State
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    dueDate: '',
    priority: 'medium',
  });

  // Query tasks
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['tasks'],
    queryFn: async () => {
      const res = await tasksApi.list();
      return res;
    },
  });

  const remoteItems = data?.items || [];
  const summary = data?.summary || {
    totalCount: 0,
    completedCount: 0,
    pendingCount: 0,
    highPriorityCount: 0,
  };

  // Sync remote items to local items for drag-and-drop
  useEffect(() => {
    setLocalItems(remoteItems);
  }, [remoteItems]);

  // Create Mutation
  const createMutation = useMutation({
    mutationFn: (newTask) => tasksApi.create(newTask),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      resetForm();
    },
  });

  // Update Mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, updates }) => tasksApi.update(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      setEditingId(null);
    },
  });

  // Delete Mutation
  const deleteMutation = useMutation({
    mutationFn: (id) => tasksApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      dueDate: '',
      priority: 'medium',
    });
    setIsAdding(false);
    setEditingId(null);
  };

  const handleCreateSubmit = (e) => {
    e.preventDefault();
    if (!formData.title.trim()) return;

    createMutation.mutate({
      title: formData.title.trim(),
      description: formData.description.trim(),
      dueDate: formData.dueDate ? formData.dueDate : null,
      priority: formData.priority,
      isCompleted: false,
    });
  };

  const startEdit = (task) => {
    setEditingId(task.id);
    setFormData({
      title: task.title,
      description: task.description || '',
      dueDate: task.dueDate || '',
      priority: task.priority || 'medium',
    });
  };

  const handleUpdateSubmit = (e, id) => {
    e.preventDefault();
    updateMutation.mutate({
      id,
      updates: {
        title: formData.title.trim(),
        description: formData.description.trim(),
        dueDate: formData.dueDate ? formData.dueDate : null,
        priority: formData.priority,
      },
    });
  };

  const toggleComplete = (task) => {
    updateMutation.mutate({
      id: task.id,
      updates: {
        isCompleted: !task.isCompleted,
      },
    });
  };

  // Drag and drop reordering
  const handleDragStart = (e, index) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = async (e, targetIndex) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === targetIndex) return;

    const reordered = [...localItems];
    const [movedItem] = reordered.splice(draggedIndex, 0); // Re-slice correctly
    const [draggedItem] = reordered.splice(draggedIndex, 1);
    reordered.splice(targetIndex, 0, draggedItem);

    // Re-assign sequential aiRank to incomplete tasks
    const updated = reordered.map((item, idx) => {
      if (!item.isCompleted) {
        return { ...item, aiRank: Math.min(10, idx + 1) };
      }
      return item;
    });

    setLocalItems(updated);
    setDraggedIndex(null);

    // Persist new aiRank override for the moved item
    const newRank = Math.min(10, targetIndex + 1);
    updateMutation.mutate({
      id: draggedItem.id,
      updates: { aiRank: newRank },
    });
  };

  // Badge for AI urgency ranking (1 = most urgent)
  const getAiRankBadge = (rank) => {
    if (!rank) return null;
    if (rank === 1) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-rose-500/15 text-rose-300 border border-rose-500/30 shadow-xs">
          <Flame className="w-3 h-3 text-rose-400 animate-pulse" />
          AI #1
        </span>
      );
    }
    if (rank <= 3) {
      return (
        <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-500/15 text-amber-300 border border-amber-500/30">
          AI #{rank}
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-medium bg-white/[0.06] text-slate-300 border border-white/10">
        AI #{rank}
      </span>
    );
  };

  return (
    <div className="bg-[#0E1017]/90 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-xl flex flex-col h-full relative overflow-hidden group/card hover:border-white/15 transition-all">
      {/* Subtle top glow */}
      <div className="absolute top-0 right-1/4 w-40 h-20 bg-accent-500/10 blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-white/[0.08] relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-accent-500/10 border border-accent-500/20 text-accent-400 flex items-center justify-center shadow-glow-sm">
            <CheckSquare className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-white text-base tracking-tight">Tasks</h3>
            <p className="text-xs text-slate-400">AI re-ranked daily by urgency</p>
          </div>
        </div>

        {!isAdding && !editingId && (
          <button
            onClick={() => setIsAdding(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-accent-600 hover:bg-accent-500 shadow-glow-sm border border-accent-400/30 transition-all hover:scale-105"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add</span>
          </button>
        )}
      </div>

      {/* Tally Metric Bar */}
      <div className="mt-4 p-3.5 bg-white/[0.03] border border-white/[0.06] rounded-xl flex items-center justify-between relative z-10">
        <div>
          <span className="text-xs font-medium text-slate-400 uppercase tracking-wider block">Pending Tasks</span>
          <span className="text-2xl font-extrabold text-white tracking-tight">{summary.pendingCount}</span>
        </div>
        <div className="flex items-center gap-3 text-right">
          {summary.highPriorityCount > 0 && (
            <div>
              <span className="text-[11px] font-medium text-rose-400 block">High Priority</span>
              <span className="text-sm text-rose-300 font-bold">{summary.highPriorityCount}</span>
            </div>
          )}
          <div>
            <span className="text-[11px] font-medium text-emerald-400 block">Completed</span>
            <span className="text-sm text-emerald-300 font-bold">{summary.completedCount}</span>
          </div>
        </div>
      </div>

      {/* Inline Add Form */}
      {isAdding && (
        <form onSubmit={handleCreateSubmit} className="mt-4 p-4 bg-white/[0.03] rounded-xl border border-white/10 space-y-3 relative z-10">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-white">Add New Task</span>
            <button type="button" onClick={resetForm} className="text-slate-400 hover:text-white transition">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div>
            <input
              type="text"
              placeholder="Task Title (e.g. Submit Q3 Tax Filings)"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
              className="w-full text-xs px-3 py-2 bg-white/[0.04] border border-white/10 text-white placeholder-slate-500 rounded-lg focus:outline-none focus:border-accent-400 focus:ring-1 focus:ring-accent-400 transition"
            />
          </div>
          <div>
            <textarea
              placeholder="Description or notes (optional)"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={2}
              className="w-full text-xs px-3 py-2 bg-white/[0.04] border border-white/10 text-white placeholder-slate-500 rounded-lg focus:outline-none focus:border-accent-400 focus:ring-1 focus:ring-accent-400 resize-none transition"
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <input
                type="date"
                value={formData.dueDate}
                onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                className="w-full text-xs px-3 py-2 bg-white/[0.04] border border-white/10 text-white rounded-lg focus:outline-none focus:border-accent-400 focus:ring-1 focus:ring-accent-400"
              />
            </div>
            <div>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                className="w-full text-xs px-3 py-2 bg-[#141722] border border-white/10 text-white rounded-lg focus:outline-none focus:border-accent-400 focus:ring-1 focus:ring-accent-400"
              >
                <option value="high">High Priority</option>
                <option value="medium">Medium Priority</option>
                <option value="low">Low Priority</option>
              </select>
            </div>
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
              {createMutation.isPending ? 'Saving...' : 'Save Task'}
            </button>
          </div>
        </form>
      )}

      {/* Task List */}
      <div className="mt-4 flex-1 overflow-y-auto space-y-2.5 max-h-[420px] pr-0.5 relative z-10">
        {isLoading ? (
          <div className="space-y-2.5 animate-pulse">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-white/[0.03] border border-white/[0.06] rounded-xl" />
            ))}
          </div>
        ) : isError ? (
          <p className="text-xs text-rose-400 p-2">Error loading tasks: {error.message}</p>
        ) : localItems.length === 0 ? (
          <div className="text-center py-8 text-slate-500">
            <CheckSquare className="w-8 h-8 mx-auto mb-2 opacity-30 text-slate-400" />
            <p className="text-xs font-medium text-slate-300">No tasks recorded.</p>
            <p className="text-[11px] text-slate-500 mt-0.5">Add tasks and let Bedrock organize by urgency.</p>
          </div>
        ) : (
          localItems.map((task, index) => (
            <div
              key={task.id}
              draggable={!task.isCompleted}
              onDragStart={(e) => handleDragStart(e, index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDrop={(e) => handleDrop(e, index)}
              className={`group p-3 rounded-xl border transition-all ${
                task.isCompleted
                  ? 'bg-white/[0.01] border-white/[0.04] opacity-50'
                  : task.priority === 'high'
                  ? 'bg-rose-500/[0.04] border-rose-500/20 hover:border-rose-500/40'
                  : 'bg-white/[0.03] border-white/[0.08] hover:border-accent-500/40 hover:bg-white/[0.05]'
              } ${draggedIndex === index ? 'opacity-40 border-dashed border-accent-400' : ''}`}
            >
              {editingId === task.id ? (
                <form onSubmit={(e) => handleUpdateSubmit(e, task.id)} className="space-y-2">
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    required
                    className="w-full text-xs px-2.5 py-1.5 bg-white/[0.06] border border-white/15 text-white rounded focus:outline-none focus:border-accent-400"
                  />
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={2}
                    className="w-full text-xs px-2.5 py-1.5 bg-white/[0.06] border border-white/15 text-white rounded resize-none focus:outline-none focus:border-accent-400"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="date"
                      value={formData.dueDate}
                      onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                      className="w-full text-xs px-2 py-1 bg-white/[0.06] border border-white/15 text-white rounded"
                    />
                    <select
                      value={formData.priority}
                      onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                      className="w-full text-xs px-2 py-1 bg-[#141722] border border-white/15 text-white rounded"
                    >
                      <option value="high">High</option>
                      <option value="medium">Medium</option>
                      <option value="low">Low</option>
                    </select>
                  </div>
                  <div className="flex justify-end gap-1.5 pt-1">
                    <button
                      type="button"
                      onClick={() => setEditingId(null)}
                      className="px-2.5 py-1 text-xs text-slate-400 hover:text-white transition"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={updateMutation.isPending}
                      className="px-3 py-1 text-xs font-semibold bg-accent-600 hover:bg-accent-500 text-white rounded shadow-glow-sm transition"
                    >
                      Save
                    </button>
                  </div>
                </form>
              ) : (
                <div className="flex items-start justify-between gap-2.5">
                  {/* Grip Handle for drag */}
                  {!task.isCompleted && (
                    <div
                      className="cursor-grab active:cursor-grabbing text-slate-500 hover:text-slate-300 pt-0.5 transition"
                      title="Drag to reorder urgency override"
                    >
                      <GripVertical className="w-3.5 h-3.5" />
                    </div>
                  )}

                  {/* Complete Checkbox */}
                  <button
                    onClick={() => toggleComplete(task)}
                    className="pt-0.5 text-slate-500 hover:text-emerald-400 transition flex-shrink-0"
                    title={task.isCompleted ? 'Mark incomplete' : 'Mark complete'}
                  >
                    {task.isCompleted ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <Circle className="w-4 h-4 text-slate-500 hover:text-emerald-400" />
                    )}
                  </button>

                  {/* Task Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4
                        className={`text-xs font-bold transition-all duration-300 ${
                          task.isCompleted ? 'line-through text-slate-500' : 'text-white'
                        }`}
                      >
                        {task.title}
                      </h4>
                      {!task.isCompleted && getAiRankBadge(task.aiRank)}
                    </div>
                    {task.description && (
                      <p className={`text-[11px] mt-0.5 line-clamp-2 ${task.isCompleted ? 'line-through text-slate-600' : 'text-slate-400'}`}>
                        {task.description}
                      </p>
                    )}
                    <div className="flex items-center gap-2 mt-1.5 text-[10px] text-slate-400">
                      {task.dueDate && (
                        <span className="flex items-center gap-1 text-slate-400">
                          <Calendar className="w-2.5 h-2.5 text-slate-500" />
                          {task.dueDate}
                        </span>
                      )}
                      <span
                        className={`px-1.5 py-0.5 rounded font-semibold text-[9px] uppercase tracking-wider ${
                          task.priority === 'high'
                            ? 'text-rose-400 bg-rose-500/15 border border-rose-500/20'
                            : task.priority === 'medium'
                            ? 'text-amber-400 bg-amber-500/15 border border-amber-500/20'
                            : 'text-slate-400 bg-white/[0.05] border border-white/10'
                        }`}
                      >
                        {task.priority}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                    <button
                      onClick={() => startEdit(task)}
                      className="p-1 text-slate-400 hover:text-white rounded transition"
                      title="Edit"
                    >
                      <Edit2 className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => deleteMutation.mutate(task.id)}
                      className="p-1 text-slate-400 hover:text-rose-400 rounded transition"
                      title="Delete"
                    >
                      <Trash2 className="w-3 h-3" />
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
