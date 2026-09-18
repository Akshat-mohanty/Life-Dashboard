/**
 * Briefing Component — AI Morning Briefing Card
 * Redesigned in Obsidian Black, Pure White & Electric Indigo
 * Loads today's cached Bedrock briefing or streams newly generated briefing character-by-character.
 */

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Sparkles, RefreshCw, AlertCircle, Clock, CheckCircle2, ChevronRight } from 'lucide-react';
import { briefingApi } from '../api/client';

export default function Briefing() {
  const queryClient = useQueryClient();
  const [streamedContent, setStreamedContent] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);

  const todayFormatted = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  // Query today's briefing
  const {
    data: briefingData,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ['briefing', 'today'],
    queryFn: async () => {
      const res = await briefingApi.getToday();
      return res;
    },
  });

  const briefing = briefingData?.item;
  const exists = briefingData?.exists;

  // Stream text character-by-character using ReadableStream
  const streamText = async (fullText) => {
    setIsStreaming(true);
    setStreamedContent('');

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
        const delay = text[i] === '\n' ? 28 : text[i] === '.' ? 22 : 10;
        await new Promise((r) => setTimeout(r, delay));
      }
    }
    setIsStreaming(false);
  };

  // Mutation to trigger manual briefing generation
  const generateMutation = useMutation({
    mutationFn: async () => {
      const res = await briefingApi.generateNow();
      return res;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['briefing', 'today'] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] }); // Refresh re-ranked tasks
      if (data?.item?.content) {
        streamText(data.item.content);
      }
    },
  });

  const handleGenerate = () => {
    generateMutation.mutate();
  };

  const displayContent = isStreaming ? streamedContent : briefing?.content || '';

  return (
    <div className="w-full bg-white border border-zinc-200 rounded-2xl p-6 sm:p-8 shadow-sm hover:shadow-md relative overflow-hidden mb-8 transition-all">
      {/* Header */}
      <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-zinc-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-accent-50 text-accent-700 border border-accent-200/80 flex items-center justify-center shadow-xs">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="text-lg font-bold text-black tracking-tight">AI Morning Briefing</h2>
            </div>
            <p className="text-xs sm:text-sm text-zinc-500 font-medium mt-0.5">{todayFormatted}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {briefing && (
            <button
              onClick={handleGenerate}
              disabled={generateMutation.isPending || isStreaming}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold text-zinc-700 bg-zinc-50 hover:bg-zinc-100 border border-zinc-200 shadow-xs transition active:scale-95 disabled:opacity-50"
              title="Regenerate briefing"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-accent-600 ${generateMutation.isPending || isStreaming ? 'animate-spin' : ''}`} />
              <span>Regenerate</span>
            </button>
          )}
        </div>
      </div>

      {/* Content Area */}
      <div className="relative z-10 pt-5">
        {isLoading ? (
          // Loading Skeleton
          <div className="space-y-3 animate-pulse">
            <div className="h-4 bg-zinc-100 rounded-md w-3/4"></div>
            <div className="h-4 bg-zinc-100 rounded-md w-5/6"></div>
            <div className="h-4 bg-zinc-100 rounded-md w-2/3"></div>
            <div className="h-4 bg-zinc-100 rounded-md w-4/5"></div>
          </div>
        ) : isError ? (
          <div className="flex items-center gap-3 p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-sm">
            <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose-500" />
            <div className="flex-1">
              <p className="font-semibold text-rose-900">Could not load today's briefing.</p>
              <p className="text-xs text-rose-600 mt-0.5">{error?.message || 'Connection error'}</p>
            </div>
            <button
              onClick={() => refetch()}
              className="px-3 py-1 bg-white border border-rose-300 rounded-lg text-xs font-semibold hover:bg-rose-100 text-rose-800"
            >
              Retry
            </button>
          </div>
        ) : !exists && !isStreaming && !displayContent ? (
          // Empty State — Ready to generate
          <div className="text-center py-7 sm:py-9 px-4 bg-zinc-50/60 rounded-2xl border border-zinc-200/80">
            <div className="w-12 h-12 rounded-2xl bg-accent-50 border border-accent-200 text-accent-700 flex items-center justify-center mx-auto mb-3 shadow-xs">
              <Clock className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-black">Your morning briefing is ready to synthesize</h3>
            <p className="text-sm text-zinc-500 max-w-md mx-auto mt-1 mb-5">
              Read across all unpaid bills, urgency-ranked tasks, 7-day events, and spending in seconds.
            </p>
            <button
              onClick={handleGenerate}
              disabled={generateMutation.isPending}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-accent-600 hover:bg-accent-700 shadow-sm hover:shadow transition active:scale-95 disabled:opacity-60"
            >
              {generateMutation.isPending ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Synthesizing your life data...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Generate Today's Briefing</span>
                  <ChevronRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        ) : (
          // Formatted Briefing Text Display
          <div>
            <div className="bg-zinc-50/70 border border-zinc-200/80 rounded-xl p-5 sm:p-6 leading-relaxed text-zinc-800 text-sm sm:text-base font-normal whitespace-pre-line">
              {displayContent}
              {isStreaming && (
                <span className="inline-block w-2 h-4 bg-accent-600 ml-1 animate-pulse align-middle" />
              )}
            </div>
            {briefing?.generatedAt && !isStreaming && (
              <div className="flex items-center justify-end gap-1.5 mt-2.5 text-xs text-zinc-500 font-medium">
                <CheckCircle2 className="w-3.5 h-3.5 text-accent-600" />
                <span>Generated at {new Date(briefing.generatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
