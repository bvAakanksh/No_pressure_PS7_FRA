import React, { useState } from 'react';
import { Search, Sparkles, X, ArrowRight } from 'lucide-react';

interface SearchBarProps {
  onSearch: (query: string) => void;
  placeholder?: string;
  isNlpMode?: boolean;
}

export default function SearchBar({
  onSearch,
  placeholder = 'Ask AI or type query (e.g. "Show high-risk claims in Bastar")...',
  isNlpMode = true,
}: SearchBarProps) {
  const [query, setQuery] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      onSearch(query.trim());
    }
  };

  const handleClear = () => {
    setQuery('');
    onSearch('');
  };

  const sampleQueries = [
    'Show high-risk claims in Bastar',
    'Show districts with rejection rate above 25%',
    'Show pending claims in Chhattisgarh',
  ];

  return (
    <div className="w-full space-y-2">
      <form onSubmit={handleSubmit} className="relative flex items-center">
        <div className="absolute left-3.5 flex items-center gap-1 text-indigo-600 pointer-events-none">
          {isNlpMode ? <Sparkles className="size-4" /> : <Search className="size-4 text-slate-400" />}
        </div>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder}
          className="w-full pl-10 pr-20 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent shadow-xs transition"
        />
        {query && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-12 text-slate-400 hover:text-slate-600 p-1 rounded-full cursor-pointer"
          >
            <X className="size-3.5" />
          </button>
        )}
        <button
          type="submit"
          className="absolute right-2 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg flex items-center gap-1 shadow-xs transition cursor-pointer"
        >
          <span>Search</span>
          <ArrowRight className="size-3" />
        </button>
      </form>

      {/* Suggested Queries */}
      {isNlpMode && (
        <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-slate-500">
          <span className="font-medium text-slate-400">Try AI Prompts:</span>
          {sampleQueries.map((q, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => {
                setQuery(q);
                onSearch(q);
              }}
              className="px-2 py-0.5 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 text-slate-600 rounded-md border border-slate-200 transition cursor-pointer"
            >
              "{q}"
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
