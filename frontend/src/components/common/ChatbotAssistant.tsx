import React, { useState, useRef, useEffect } from 'react';
import { Bot, Send, Sparkles, RefreshCw, CheckCircle2, ChevronDown, ChevronUp, Compass } from 'lucide-react';

interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  filters?: Record<string, any>;
  metrics?: {
    totalClaims: number;
    pendingClaims: number;
    approvedClaims: number;
    rejectedClaims: number;
    highRiskClaims: number;
  } | null;
  matchedCount?: number;
}

interface ChatbotAssistantProps {
  onExecuteQuery: (query: string) => Promise<void>;
  onClearQuery: () => void;
  isLoading: boolean;
  activeQuery: string | null;
  activeSummary: string | null;
  activeMetrics?: {
    totalClaims: number;
    pendingClaims: number;
    approvedClaims: number;
    rejectedClaims: number;
    highRiskClaims: number;
  } | null;
  activeFilters?: Record<string, any> | null;
  matchedCount?: number | null;
}

export default function ChatbotAssistant({
  onExecuteQuery,
  onClearQuery,
  isLoading,
  activeQuery,
  activeSummary,
  activeMetrics,
  activeFilters,
  matchedCount,
}: ChatbotAssistantProps) {
  const [input, setInput] = useState('');
  const [isExpanded, setIsExpanded] = useState(true);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  const suggestedPrompts = [
    { label: '🚨 High-Risk in Bastar', query: 'Show high risk claims in Bastar' },
    { label: '⏳ Pending in South India', query: 'Show pending claims in South India' },
    { label: '🌲 Boundary Overlaps', query: 'Show boundary overlap claims' },
    { label: '📑 Land Area Mismatches', query: 'Show claims with land mismatch' },
    { label: '✅ Approved in MP 2024', query: 'Show approved claims in MP in 2024' },
    { label: '❓ How many pending in Bastar?', query: 'How many pending claims in Bastar?' },
    { label: '📊 Dataset Overview', query: 'How many claims are in the dataset?' },
  ];

  // Whenever activeSummary or activeQuery changes, add to chat history if not already present
  useEffect(() => {
    if (activeQuery && activeSummary) {
      const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      setMessages((prev) => {
        const lastMsg = prev[prev.length - 1];
        if (lastMsg && lastMsg.sender === 'assistant' && lastMsg.text === activeSummary) {
          return prev;
        }
        return [
          ...prev,
          { id: `user-${Date.now()}`, sender: 'user', text: activeQuery, timestamp: now },
          {
            id: `assistant-${Date.now() + 1}`,
            sender: 'assistant',
            text: activeSummary,
            timestamp: now,
            filters: activeFilters || undefined,
            metrics: activeMetrics || undefined,
            matchedCount: matchedCount ?? undefined,
          },
        ];
      });
    }
  }, [activeQuery, activeSummary, activeFilters, activeMetrics, matchedCount]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !isLoading) {
      const q = input.trim();
      setInput('');
      onExecuteQuery(q);
    }
  };

  const handlePromptClick = (q: string) => {
    if (!isLoading) {
      setInput('');
      onExecuteQuery(q);
    }
  };

  const handleReset = () => {
    setInput('');
    setMessages([]);
    onClearQuery();
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs overflow-hidden transition-all">
      {/* Header Bar */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="size-8 rounded-lg bg-indigo-600/80 border border-indigo-400/40 flex items-center justify-center text-white shadow-xs">
            <Bot className="size-4.5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xs font-bold tracking-wide">FRA AI Decision Chatbot</h2>
              <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-mono px-2 py-0.5 rounded-full flex items-center gap-1">
                <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                Connected to KPIs & Map
              </span>
            </div>
            <p className="text-[11px] text-slate-300">
              Ask questions to filter claims, recalculate KPI cards, and update GIS map markers in real-time
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {activeQuery && (
            <button
              onClick={handleReset}
              className="text-[11px] text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 px-2.5 py-1 rounded-lg flex items-center gap-1 transition cursor-pointer"
              title="Reset AI filter to all India"
            >
              <RefreshCw className="size-3" />
              <span>Reset to National</span>
            </button>
          )}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition cursor-pointer"
            title={isExpanded ? 'Collapse chatbot' : 'Expand chatbot'}
          >
            {isExpanded ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="p-4 space-y-3">
          {/* Active Synced Notification Banner when query is active */}
          {activeQuery && (
            <div className="p-2.5 bg-indigo-50/90 border border-indigo-200/80 rounded-lg flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2 text-indigo-950">
                <Sparkles className="size-4 text-indigo-600 shrink-0" />
                <span>
                  Active Scope: <strong className="text-indigo-900">"{activeQuery}"</strong>
                </span>
                {matchedCount !== undefined && matchedCount !== null && (
                  <span className="bg-indigo-200 text-indigo-800 font-semibold px-2 py-0.5 rounded-md text-[11px]">
                    {matchedCount.toLocaleString()} {matchedCount === 1 ? 'claim' : 'claims'} matched
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1.5 text-[11px] text-indigo-700">
                <CheckCircle2 className="size-3.5 text-emerald-600" />
                <span>Reflected on KPI Cards & Map</span>
              </div>
            </div>
          )}

          {/* Chat History Thread */}
          {messages.length > 0 && (
            <div
              ref={scrollRef}
              className="max-h-56 overflow-y-auto space-y-2.5 p-3 bg-slate-50/80 border border-slate-100 rounded-lg text-xs"
            >
              {messages.map((m) => (
                <div
                  key={m.id}
                  className={`flex flex-col ${m.sender === 'user' ? 'items-end' : 'items-start'}`}
                >
                  <div
                    className={`max-w-[88%] rounded-xl px-3.5 py-2 space-y-1.5 shadow-2xs ${
                      m.sender === 'user'
                        ? 'bg-slate-900 text-white rounded-br-none'
                        : 'bg-white border border-indigo-100 text-slate-800 rounded-bl-none'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3 text-[10px] opacity-75">
                      <span className="font-semibold flex items-center gap-1">
                        {m.sender === 'user' ? (
                          'You'
                        ) : (
                          <>
                            <Bot className="size-3 text-indigo-600" />
                            <span>FRA Assistant</span>
                          </>
                        )}
                      </span>
                      <span>{m.timestamp}</span>
                    </div>
                    <p className="leading-relaxed text-[12px]">{m.text}</p>

                    {/* Assistant Metrics Summary Pills */}
                    {m.metrics && (
                      <div className="pt-1 border-t border-indigo-50 flex flex-wrap items-center gap-1.5 text-[10px]">
                        <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 font-medium">
                          Total: {m.metrics.totalClaims.toLocaleString()}
                        </span>
                        <span className="px-1.5 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200">
                          Pending: {m.metrics.pendingClaims.toLocaleString()}
                        </span>
                        <span className="px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">
                          Approved: {m.metrics.approvedClaims.toLocaleString()}
                        </span>
                        <span className="px-1.5 py-0.5 rounded bg-rose-50 text-rose-800 border border-rose-200">
                          Rejected: {m.metrics.rejectedClaims.toLocaleString()}
                        </span>
                        <span className="px-1.5 py-0.5 rounded bg-purple-50 text-purple-800 border border-purple-200 font-semibold">
                          High Risk: {m.metrics.highRiskClaims.toLocaleString()}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex items-center gap-2 text-xs text-indigo-600 bg-white border border-indigo-100 px-3 py-2 rounded-lg w-fit">
                  <span className="size-2 rounded-full bg-indigo-500 animate-ping"></span>
                  <span>Analyzing FRA records, calculating metrics, and synchronizing map markers…</span>
                </div>
              )}
            </div>
          )}

          {/* Chat Input Form */}
          <form onSubmit={handleSubmit} className="relative flex items-center">
            <div className="absolute left-3.5 flex items-center gap-1 text-indigo-600 pointer-events-none">
              <Sparkles className="size-4" />
            </div>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask anything (e.g., 'Show high risk claims in Bastar', 'Pending claims in South India', 'Boundary overlap claims')..."
              className="w-full pl-10 pr-24 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent shadow-2xs transition"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="absolute right-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 text-white text-xs font-semibold rounded-lg flex items-center gap-1 shadow-xs transition cursor-pointer disabled:cursor-not-allowed"
            >
              <span>Ask AI</span>
              <Send className="size-3" />
            </button>
          </form>

          {/* Quick AI Prompts */}
          <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-slate-500">
            <span className="font-semibold text-slate-400 flex items-center gap-1">
              <Compass className="size-3 text-indigo-500" />
              Suggested Prompts:
            </span>
            {suggestedPrompts.map((item, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handlePromptClick(item.query)}
                className="px-2 py-1 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-200 text-slate-700 rounded-md border border-slate-200 transition cursor-pointer text-[11px] font-medium"
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
