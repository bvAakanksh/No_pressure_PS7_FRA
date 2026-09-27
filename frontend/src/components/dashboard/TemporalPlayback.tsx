import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, SkipBack, SkipForward, Clock } from 'lucide-react';

interface TemporalPlaybackProps {
  startDate: string;
  endDate: string;
  currentDate: string;
  onChange: (date: string) => void;
  isPlaying: boolean;
  onPlayPause: (playing: boolean) => void;
}

export default function TemporalPlayback({
  startDate,
  endDate,
  currentDate,
  onChange,
  isPlaying,
  onPlayPause,
}: TemporalPlaybackProps) {
  const [progress, setProgress] = useState(100);
  
  const start = new Date(startDate).getTime();
  const end = new Date(endDate).getTime();
  
  // Calculate progress %
  useEffect(() => {
    const curr = new Date(currentDate).getTime();
    const pct = Math.max(0, Math.min(100, ((curr - start) / (end - start)) * 100));
    setProgress(pct);
  }, [currentDate, start, end]);

  // Handle manual slider scrub
  const handleScrub = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    const newTime = start + (val / 100) * (end - start);
    onChange(new Date(newTime).toISOString().split('T')[0]);
  };

  const handleStep = (direction: 'fwd' | 'back') => {
    const curr = new Date(currentDate).getTime();
    // Step by 30 days
    const step = 30 * 24 * 60 * 60 * 1000;
    const newTime = direction === 'fwd' ? curr + step : curr - step;
    const clamped = Math.max(start, Math.min(end, newTime));
    onChange(new Date(clamped).toISOString().split('T')[0]);
  };

  return (
    <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-700/50 rounded-xl p-4 flex flex-col sm:flex-row items-center gap-4 shadow-lg text-slate-200">
      <div className="flex items-center gap-3 shrink-0">
        <button
          onClick={() => handleStep('back')}
          className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
          title="Step back 1 month"
        >
          <SkipBack className="size-4" />
        </button>
        <button
          onClick={() => onPlayPause(!isPlaying)}
          className="p-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-full transition shadow-lg shadow-indigo-900/20"
          title={isPlaying ? "Pause" : "Play Timeline"}
        >
          {isPlaying ? <Pause className="size-4" /> : <Play className="size-4 ml-0.5" />}
        </button>
        <button
          onClick={() => handleStep('fwd')}
          className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
          title="Step forward 1 month"
        >
          <SkipForward className="size-4" />
        </button>
      </div>

      <div className="flex-1 w-full flex flex-col gap-2 relative">
        <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
          <span>{startDate}</span>
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-800 rounded-full border border-slate-700 font-bold text-indigo-300">
            <Clock className="size-3" />
            <span>{currentDate}</span>
          </div>
          <span>{endDate}</span>
        </div>
        
        <input
          type="range"
          min="0"
          max="100"
          step="0.1"
          value={progress}
          onChange={handleScrub}
          className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-500 focus:outline-none"
        />
      </div>
    </div>
  );
}
