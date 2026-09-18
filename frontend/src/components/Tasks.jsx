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
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200 shadow-xs">
          <Flame className="w-3 h-3 text-rose-600 animate-pulse" />
          AI #1
        </span>
      );
    }
    if (rank <= 3) {
      return (
        <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-800 border border-amber-200">
          AI #{rank}
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-medium bg-zinc-100 text-zinc-700 border border-zinc-200">
        AI #{rank}
      </span>
    );
  };

  return (
    <div className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-zinc-100">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-accent-50 border border-accent-200 text-accent-700 flex items-center justify-center shadow-xs">
            <CheckSquare className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-black text-base tracking-tight">Tasks</h3>
            <p className="text-xs text-zinc-500">AI re-ranked daily by urgency</p>
          </div>
        </div>

        {!isAdding && !editingId && (
          <button
            onClick={() => setIsAdding(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-accent-600 hover:bg-accent-700 shadow-sm transition-all hover:scale-105"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add</span>
          </button>
        )}
      </div>

      {/* Tally Metric Bar */}
      <div className="mt-4 p-3.5 bg-zinc-50 border border-zinc-100 rounded-xl flex items-center justify-between">
        <div>
          <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider block">Pending Tasks</span>
          <span className="text-2xl font-extrabold text-black tracking-tight">{summary.pendingCount}</span>
        </div>
        <div className="flex items-center gap-3 text-right">
          {summary.highPriorityCount > 0 && (
            <div>
              <span className="text-[11px] font-semibold text-rose-600 block">High Priority</span>
              <span className="text-sm text-rose-700 font-bold">{summary.highPriorityCount}</span>
            </div>
          )}
          <div>
            <span className="text-[11px] font-semibold text-accent-700 block">Completed</span>
            <span className="text-sm text-accent-800 font-bold">{summary.completedCount}</span>
          </div>
        </div>
      </div>

      {/* Inline Add Form */}
      {isAdding && (
        <form onSubmit={handleCreateSubmit} className="mt-4 p-4 bg-zinc-50 rounded-xl border border-zinc-200 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-black">Add New Task</span>
            <button type="button" onClick={resetForm} className="text-zinc-400 hover:text-black transition">
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
              className="w-full text-xs px-3 py-2 bg-white border border-zinc-300 text-black placeholder-zinc-400 rounded-lg focus:outline-none focus:border-accent-600 focus:ring-1 focus:ring-accent-600 transition"
            />
          </div>
          <div>
            <textarea
              placeholder="Description or notes (optional)"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={2}
              className="w-full text-xs px-3 py-2 bg-white border border-zinc-300 text-black placeholder-zinc-400 rounded-lg focus:outline-none focus:border-accent-600 focus:ring-1 focus:ring-accent-600 resize-none transition"
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <input
                type="date"
                value={formData.dueDate}
                onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                className="w-full text-xs px-3 py-2 bg-white border border-zinc-300 text-black rounded-lg focus:outline-none focus:border-accent-600 focus:ring-1 focus:ring-accent-600"
              />
            </div>
            <div>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                className="w-full text-xs px-3 py-2 bg-white border border-zinc-300 text-black rounded-lg focus:outline-none focus:border-accent-600 focus:ring-1 focus:ring-accent-600"
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
              className="px-3 py-1.5 rounded-lg text-xs font-medium text-zinc-600 hover:text-black hover:bg-zinc-200 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createMutation.isPending}
              className="px-3.5 py-1.5 rounded-lg text-xs font-semibold text-white bg-accent-600 hover:bg-accent-700 shadow-sm transition"
            >
              {createMutation.isPending ? 'Saving...' : 'Save Task'}
            </button>
          </div>
        </form>
      )}

      {/* Task List */}
      <div className="mt-4 flex-1 overflow-y-auto space-y-2.5 max-h-[420px] pr-0.5">
        {isLoading ? (
          <div className="space-y-2.5 animate-pulse">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-zinc-100 rounded-xl" />
            ))}
          </div>
        ) : isError ? (
          <p className="text-xs text-rose-600 p-2">Error loading tasks: {error.message}</p>
        ) : localItems.length === 0 ? (
          <div className="text-center py-8 text-zinc-400">
            <CheckSquare className="w-8 h-8 mx-auto mb-2 opacity-30 text-zinc-400" />
            <p className="text-xs font-medium text-zinc-600">No tasks recorded.</p>
            <p className="text-[11px] text-zinc-400 mt-0.5">Add tasks and let Bedrock organize by urgency.</p>
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
                  ? 'bg-zinc-50 border-zinc-200 opacity-60'
                  : task.priority === 'high'
                  ? 'bg-rose-50/50 border-rose-200 hover:border-rose-300'
                  : 'bg-white border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50/50'
              } ${draggedIndex === index ? 'opacity-40 border-dashed border-accent-600' : ''}`}
            >
              {editingId === task.id ? (
                <form onSubmit={(e) => handleUpdateSubmit(e, task.id)} className="space-y-2">
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    required
                    className="w-full text-xs px-2.5 py-1.5 bg-white border border-zinc-300 text-black rounded focus:outline-none focus:border-accent-600"
                  />
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={2}
                    className="w-full text-xs px-2.5 py-1.5 bg-white border border-zinc-300 text-black rounded resize-none focus:outline-none focus:border-accent-600"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="date"
                      value={formData.dueDate}
                      onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                      className="w-full text-xs px-2 py-1 bg-white border border-zinc-300 text-black rounded"
                    />
                    <select
                      value={formData.priority}
                      onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                      className="w-full text-xs px-2 py-1 bg-white border border-zinc-300 text-black rounded"
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
                      className="px-2.5 py-1 text-xs text-zinc-500 hover:text-black transition"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={updateMutation.isPending}
                      className="px-3 py-1 text-xs font-semibold bg-accent-600 hover:bg-accent-700 text-white rounded shadow-sm transition"
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
                      className="cursor-grab active:cursor-grabbing text-zinc-400 hover:text-black pt-0.5 transition"
                      title="Drag to reorder urgency override"
                    >
                      <GripVertical className="w-3.5 h-3.5" />
                    </div>
                  )}

                  {/* Complete Checkbox */}
                  <button
                    onClick={() => toggleComplete(task)}
                    className="pt-0.5 text-zinc-400 hover:text-accent-600 transition flex-shrink-0"
                    title={task.isCompleted ? 'Mark incomplete' : 'Mark complete'}
                  >
                    {task.isCompleted ? (
                      <CheckCircle2 className="w-4 h-4 text-accent-600" />
                    ) : (
                      <Circle className="w-4 h-4 text-zinc-400 hover:text-accent-600" />
                    )}
                  </button>

                  {/* Task Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4
                        className={`text-xs font-bold transition-all duration-300 ${
                          task.isCompleted ? 'line-through text-zinc-400' : 'text-black'
                        }`}
                      >
                        {task.title}
                      </h4>
                      {!task.isCompleted && getAiRankBadge(task.aiRank)}
                    </div>
                    {task.description && (
                      <p className={`text-[11px] mt-0.5 line-clamp-2 ${task.isCompleted ? 'line-through text-zinc-400' : 'text-zinc-600'}`}>
                        {task.description}
                      </p>
                    )}
                    <div className="flex items-center gap-2 mt-1.5 text-[10px] text-zinc-500">
                      {task.dueDate && (
                        <span className="flex items-center gap-1 text-zinc-500">
                          <Calendar className="w-2.5 h-2.5 text-zinc-400" />
                          {task.dueDate}
                        </span>
                      )}
                      <span
                        className={`px-1.5 py-0.5 rounded font-semibold text-[9px] uppercase tracking-wider ${
                          task.priority === 'high'
                            ? 'text-rose-700 bg-rose-50 border border-rose-200'
                            : task.priority === 'medium'
                            ? 'text-amber-800 bg-amber-50 border border-amber-200'
                            : 'text-zinc-600 bg-zinc-100 border border-zinc-200'
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
                      className="p-1 text-zinc-400 hover:text-black rounded transition"
                      title="Edit"
                    >
                      <Edit2 className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => deleteMutation.mutate(task.id)}
                      className="p-1 text-zinc-400 hover:text-rose-600 rounded transition"
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
