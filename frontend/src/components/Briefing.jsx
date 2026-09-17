/**
 * Briefing Component — AI Morning Briefing Card
 * Loads today's cached Bedrock briefing or streams a newly generated briefing live.
 */

import React, { useState, useEffect } from 'react';
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

      // Character-by-character reveal for authentic live feeling
      for (let i = 0; i < text.length; i++) {
        accumulated += text[i];
        setStreamedContent(accumulated);
        // Vary typing speed slightly for natural sensation
        const delay = text[i] === '\n' ? 30 : text[i] === '.' ? 25 : 12;
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

  const displayContent = isStreaming
    ? streamedContent
    : briefing?.content || '';

  return (
    <div className="w-full bg-gradient-to-br from-amber-50/80 via-emerald-50/60 to-sky-50/80 border border-slate-200/80 rounded-2xl p-6 sm:p-8 shadow-sm transition-all mb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-200/60">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-sm shadow-emerald-500/20">
            <Sparkles className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-slate-900 tracking-tight">AI Morning Briefing</h2>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200/60">
                Claude 3.5 Sonnet
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">{todayFormatted}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {briefing && (
            <button
              onClick={handleGenerate}
              disabled={generateMutation.isPending || isStreaming}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold text-slate-700 bg-white/90 hover:bg-white border border-slate-200 shadow-sm transition active:scale-95 disabled:opacity-50"
              title="Regenerate briefing"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${generateMutation.isPending || isStreaming ? 'animate-spin' : ''}`} />
              <span>Regenerate</span>
            </button>
          )}
        </div>
      </div>

      {/* Content Area */}
      <div className="pt-5">
        {isLoading ? (
          // Loading Skeleton
          <div className="space-y-3 animate-pulse">
            <div className="h-4 bg-slate-200/80 rounded-md w-3/4"></div>
            <div className="h-4 bg-slate-200/80 rounded-md w-5/6"></div>
            <div className="h-4 bg-slate-200/80 rounded-md w-2/3"></div>
            <div className="h-4 bg-slate-200/80 rounded-md w-4/5"></div>
          </div>
        ) : isError ? (
          <div className="flex items-center gap-3 p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-sm">
            <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose-600" />
            <div className="flex-1">
              <p className="font-medium">Could not load today's briefing.</p>
              <p className="text-xs text-rose-600 mt-0.5">{error?.message || 'Connection error'}</p>
            </div>
            <button
              onClick={() => refetch()}
              className="px-3 py-1 bg-white border border-rose-300 rounded-lg text-xs font-semibold hover:bg-rose-100/50"
            >
              Retry
            </button>
          </div>
        ) : !exists && !isStreaming && !displayContent ? (
          // No briefing exists yet
          <div className="text-center py-6 sm:py-8 px-4 bg-white/60 backdrop-blur-sm rounded-xl border border-slate-200/60">
            <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center mx-auto mb-3">
              <Clock className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-800">Your morning briefing isn't ready yet</h3>
            <p className="text-sm text-slate-600 max-w-md mx-auto mt-1 mb-5">
              The automated daily briefing triggers at 7:00 AM IST. You can generate your personalized plan right now.
            </p>
            <button
              onClick={handleGenerate}
              disabled={generateMutation.isPending}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 shadow-sm shadow-emerald-600/30 transition active:scale-95 disabled:opacity-60"
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
          // Display Briefing Text (Formatted Markdown Style)
          <div className="prose prose-slate max-w-none">
            <div className="bg-white/80 backdrop-blur-sm border border-slate-200/70 rounded-xl p-5 sm:p-6 shadow-xs leading-relaxed text-slate-800 text-sm sm:text-base font-normal whitespace-pre-line">
              {displayContent}
              {isStreaming && (
                <span className="inline-block w-2 h-4 bg-emerald-600 ml-1 animate-pulse align-middle" />
              )}
            </div>
            {briefing?.generatedAt && !isStreaming && (
              <div className="flex items-center justify-end gap-1.5 mt-2.5 text-xs text-slate-400 font-medium">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                <span>Generated at {new Date(briefing.generatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
