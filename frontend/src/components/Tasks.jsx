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
        <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[11px] font-bold bg-rose-100 text-rose-700 border border-rose-200 shadow-xs">
          <Flame className="w-3 h-3 text-rose-600 animate-pulse" />
          AI #1
        </span>
      );
    }
    if (rank <= 3) {
      return (
        <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
          AI #{rank}
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-600 border border-slate-200">
        AI #{rank}
      </span>
    );
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
            <CheckSquare className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 text-base">Tasks</h3>
            <p className="text-xs text-slate-500">AI re-ranked daily by urgency</p>
          </div>
        </div>

        {!isAdding && !editingId && (
          <button
            onClick={() => setIsAdding(true)}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 transition"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add</span>
          </button>
        )}
      </div>

      {/* Tally Metric Bar */}
      <div className="mt-4 p-3 bg-slate-50 rounded-xl flex items-center justify-between">
        <div>
          <span className="text-xs font-medium text-slate-500 uppercase tracking-wider block">Pending Tasks</span>
          <span className="text-xl font-extrabold text-slate-900">{summary.pendingCount}</span>
        </div>
        <div className="flex items-center gap-3 text-right">
          {summary.highPriorityCount > 0 && (
            <div>
              <span className="text-[11px] font-medium text-rose-600 block">High Priority</span>
              <span className="text-xs text-rose-700 font-bold">{summary.highPriorityCount}</span>
            </div>
          )}
          <div>
            <span className="text-[11px] font-medium text-emerald-600 block">Completed</span>
            <span className="text-xs text-emerald-700 font-bold">{summary.completedCount}</span>
          </div>
        </div>
      </div>

      {/* Inline Add Form */}
      {isAdding && (
        <form onSubmit={handleCreateSubmit} className="mt-4 p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700">Add New Task</span>
            <button type="button" onClick={resetForm} className="text-slate-400 hover:text-slate-600">
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
              className="w-full text-xs px-3 py-2 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <textarea
              placeholder="Description or notes (optional)"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={2}
              className="w-full text-xs px-3 py-2 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <input
                type="date"
                value={formData.dueDate}
                onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                className="w-full text-xs px-3 py-2 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                className="w-full text-xs px-3 py-2 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
              className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createMutation.isPending}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 transition"
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
              <div key={i} className="h-16 bg-slate-100 rounded-xl" />
            ))}
          </div>
        ) : isError ? (
          <p className="text-xs text-rose-600 p-2">Error loading tasks: {error.message}</p>
        ) : localItems.length === 0 ? (
          <div className="text-center py-8 text-slate-400">
            <CheckSquare className="w-8 h-8 mx-auto mb-2 opacity-40" />
            <p className="text-xs font-medium">No tasks recorded.</p>
            <p className="text-[11px] text-slate-400 mt-0.5">Add tasks and let Bedrock organize by urgency.</p>
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
                  ? 'bg-slate-50/70 border-slate-200/60 opacity-60'
                  : task.priority === 'high'
                  ? 'bg-rose-50/30 border-rose-200/80 hover:border-rose-300'
                  : 'bg-white border-slate-200 hover:border-slate-300'
              } ${draggedIndex === index ? 'opacity-40 border-dashed border-blue-400' : ''}`}
            >
              {editingId === task.id ? (
                <form onSubmit={(e) => handleUpdateSubmit(e, task.id)} className="space-y-2">
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    required
                    className="w-full text-xs px-2 py-1 bg-white border border-slate-300 rounded"
                  />
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={2}
                    className="w-full text-xs px-2 py-1 bg-white border border-slate-300 rounded resize-none"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="date"
                      value={formData.dueDate}
                      onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                      className="w-full text-xs px-2 py-1 bg-white border border-slate-300 rounded"
                    />
                    <select
                      value={formData.priority}
                      onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                      className="w-full text-xs px-2 py-1 bg-white border border-slate-300 rounded"
                    >
                      <option value="high">High</option>
                      <option value="medium">Medium</option>
                      <option value="low">Low</option>
                    </select>
                  </div>
                  <div className="flex justify-end gap-1 pt-1">
                    <button
                      type="button"
                      onClick={() => setEditingId(null)}
                      className="px-2 py-1 text-xs text-slate-500"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={updateMutation.isPending}
                      className="px-2.5 py-1 text-xs font-semibold bg-blue-600 text-white rounded"
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
                      className="cursor-grab active:cursor-grabbing text-slate-300 hover:text-slate-500 pt-0.5 transition"
                      title="Drag to reorder urgency override"
                    >
                      <GripVertical className="w-3.5 h-3.5" />
                    </div>
                  )}

                  {/* Complete Checkbox */}
                  <button
                    onClick={() => toggleComplete(task)}
                    className="pt-0.5 text-slate-400 hover:text-emerald-600 transition flex-shrink-0"
                    title={task.isCompleted ? 'Mark incomplete' : 'Mark complete'}
                  >
                    {task.isCompleted ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <Circle className="w-4 h-4 text-slate-300 hover:text-emerald-500" />
                    )}
                  </button>

                  {/* Task Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <h4
                        className={`text-xs font-bold transition-all duration-300 ${
                          task.isCompleted ? 'line-through text-slate-400' : 'text-slate-900'
                        }`}
                      >
                        {task.title}
                      </h4>
                      {!task.isCompleted && getAiRankBadge(task.aiRank)}
                    </div>
                    {task.description && (
                      <p className={`text-[11px] mt-0.5 line-clamp-2 ${task.isCompleted ? 'line-through text-slate-400' : 'text-slate-500'}`}>
                        {task.description}
                      </p>
                    )}
                    <div className="flex items-center gap-2 mt-1 text-[10px] text-slate-400">
                      {task.dueDate && (
                        <span className="flex items-center gap-1">
                          <Calendar className="w-2.5 h-2.5" />
                          {task.dueDate}
                        </span>
                      )}
                      <span
                        className={`px-1.5 py-0.2 rounded font-semibold ${
                          task.priority === 'high'
                            ? 'text-rose-600 bg-rose-50'
                            : task.priority === 'medium'
                            ? 'text-amber-600 bg-amber-50'
                            : 'text-slate-500 bg-slate-100'
                        }`}
                      >
                        {task.priority.toUpperCase()}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                    <button
                      onClick={() => startEdit(task)}
                      className="p-1 text-slate-400 hover:text-slate-600 rounded transition"
                      title="Edit"
                    >
                      <Edit2 className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => deleteMutation.mutate(task.id)}
                      className="p-1 text-slate-400 hover:text-rose-600 rounded transition"
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
