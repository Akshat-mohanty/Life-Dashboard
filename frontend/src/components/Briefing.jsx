/**
 * Briefing Component — AI Morning Briefing Card
 * Redesigned in Obsidian Black, Pure White & Electric Indigo
 * Loads today's cached Bedrock briefing or streams newly generated briefing character-by-character.
 */

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  RefreshCw,
  AlertCircle,
  Clock,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  FolderArchive,
  Calendar,
  Trash2,
} from 'lucide-react';
import { briefingApi } from '../api/client';

export default function Briefing({ selectedDate, onOpenArchive }) {
  const queryClient = useQueryClient();
  const [streamedContent, setStreamedContent] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true);

  const todayIso = new Date().toISOString().split('T')[0];
  const effectiveDate = selectedDate || todayIso;
  const isToday = effectiveDate === todayIso;

  const dateObj = new Date(effectiveDate + 'T00:00:00');
  const dateFormatted = dateObj.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });

  // Query briefing for the active date
  const {
    data: briefingData,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ['briefing', effectiveDate],
    queryFn: async () => {
      const res = await briefingApi.getToday({ date: effectiveDate });
      return res;
    },
  });

  const rawBriefing = briefingData?.item;
  const isMock =
    rawBriefing?.content?.includes('Completed task reviews and scheduled agenda items') ||
    rawBriefing?.content?.includes('Personal workspace and health goals logged');
  const briefing = isMock ? null : rawBriefing;
  const exists = Boolean(briefingData?.exists && !isMock && briefing?.content);

  // Stream text character-by-character using ReadableStream
  const streamText = async (fullText) => {
    setIsStreaming(true);
    setStreamedContent('');
    setIsExpanded(true);

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(encoder.encode(fullText));
        controller.close();
      },
    });

    const reader = stream.getReader();
    const decoder = new TextDecoder();
    let accumulated = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const text = decoder.decode(value);

      for (let i = 0; i < text.length; i++) {
        accumulated += text[i];
        setStreamedContent(accumulated);
        const delay = text[i] === '\n' ? 24 : text[i] === '.' ? 18 : 8;
        await new Promise((r) => setTimeout(r, delay));
      }
    }
    setIsStreaming(false);
  };

  // Mutation to trigger manual briefing generation
  const generateMutation = useMutation({
    mutationFn: async () => {
      const res = await briefingApi.generateNow({ date: effectiveDate });
      return res;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['briefing', effectiveDate] });
      queryClient.invalidateQueries({ queryKey: ['archive'] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] }); // Refresh re-ranked tasks
      if (data?.item?.content) {
        streamText(data.item.content);
      }
    },
  });

  // Mutation to delete current briefing
  const deleteMutation = useMutation({
    mutationFn: async () => {
      return await briefingApi.delete({ date: effectiveDate });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['briefing', effectiveDate] });
      queryClient.invalidateQueries({ queryKey: ['archive'] });
    },
  });

  const handleGenerate = () => {
    generateMutation.mutate();
  };

  const handleDelete = () => {
    deleteMutation.mutate();
  };

  const rawContent = isStreaming ? streamedContent : briefing?.content || '';
  const displayContent =
    rawContent.includes('Completed task reviews and scheduled agenda items') ||
    rawContent.includes('Personal workspace and health goals logged')
      ? 'No value is entered.'
      : rawContent;

  // 1. Loading State
  if (isLoading) {
    return (
      <div className="w-full bg-white border border-zinc-200/80 rounded-2xl p-4 shadow-xs mb-6 animate-pulse">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-zinc-100" />
            <div className="space-y-1">
              <div className="h-3.5 bg-zinc-200 rounded w-32" />
              <div className="h-2.5 bg-zinc-100 rounded w-48" />
            </div>
          </div>
          <div className="h-8 bg-zinc-100 rounded-xl w-28" />
        </div>
      </div>
    );
  }

  // 2. Error State
  if (isError) {
    return (
      <div className="w-full bg-rose-50 border border-rose-200 rounded-2xl p-3.5 px-4.5 mb-6 flex items-center justify-between gap-3 text-rose-800 text-xs">
        <div className="flex items-center gap-2.5">
          <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
          <span>Could not load briefing: {error?.message || 'Connection error'}</span>
        </div>
        <button
          onClick={() => refetch()}
          className="px-2.5 py-1 bg-white border border-rose-300 rounded-lg font-semibold hover:bg-rose-100 text-rose-800 cursor-pointer text-xs"
        >
          Retry
        </button>
      </div>
    );
  }

  // 3. Empty State (Ready to generate) — Centered clean button without emoji
  if (!exists && !isStreaming && !displayContent) {
    return (
      <div className="flex items-center justify-center py-6 mb-5">
        <button
          onClick={handleGenerate}
          disabled={generateMutation.isPending}
          className="inline-flex items-center justify-center px-6 py-3 rounded-xl text-sm font-semibold text-white bg-zinc-900 hover:bg-black shadow-sm hover:shadow-md transition-all active:scale-95 disabled:opacity-60 cursor-pointer"
        >
          {generateMutation.isPending ? (
            <span className="flex items-center gap-2">
              <RefreshCw className="w-4 h-4 animate-spin text-white" />
              <span>Synthesizing briefing...</span>
            </span>
          ) : (
            <span>Generate Briefing</span>
          )}
        </button>
      </div>
    );
  }

  // 4. Formatted Active Briefing — Clean Expandable Executive Card
  return (
    <div className="w-full bg-white border border-zinc-200/90 rounded-2xl p-4 sm:p-5 shadow-xs hover:shadow-sm transition-all mb-6 relative overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
        <div className="flex items-center gap-2.5">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-zinc-900 tracking-tight">
                {isToday ? "Today's Briefing" : 'Historical Reflection'}
              </h2>
              <span className="text-[11px] text-zinc-400 font-medium">{dateFormatted}</span>
              {!isToday && (
                <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-amber-100 text-amber-800">
                  Archive
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {onOpenArchive && (
            <button
              type="button"
              onClick={onOpenArchive}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold text-zinc-700 bg-zinc-50 hover:bg-zinc-100 border border-zinc-200 shadow-2xs transition cursor-pointer"
              title="Open Historical Life Archive"
            >
              <FolderArchive className="w-3.5 h-3.5 text-zinc-900" />
              <span className="hidden sm:inline">Archive</span>
            </button>
          )}

          <button
            onClick={handleGenerate}
            disabled={generateMutation.isPending || isStreaming}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold text-zinc-700 bg-zinc-50 hover:bg-zinc-100 border border-zinc-200 shadow-2xs transition active:scale-95 disabled:opacity-50 cursor-pointer"
            title="Regenerate briefing"
          >
            <RefreshCw
              className={`w-3 h-3 text-zinc-600 ${
                generateMutation.isPending || isStreaming ? 'animate-spin' : ''
              }`}
            />
            <span className="hidden sm:inline">Regenerate</span>
          </button>

          <button
            onClick={handleDelete}
            disabled={deleteMutation.isPending}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
            title="Delete briefing"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition cursor-pointer"
            title={isExpanded ? 'Collapse' : 'Expand'}
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Content Area */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25 }}
            className="pt-3.5 overflow-hidden"
          >
            <div className="bg-zinc-50/70 border border-zinc-200/70 rounded-xl p-4 text-xs sm:text-sm text-zinc-700 leading-relaxed font-normal whitespace-pre-line">
              {displayContent}
              {isStreaming && (
                <span className="inline-block w-1.5 h-3.5 bg-zinc-900 ml-1 animate-pulse align-middle" />
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
