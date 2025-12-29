
import React, { useState, useEffect } from 'react';
import { Slot, Task } from '../types';
import { STATE_CONFIG } from '../constants';
import { getDriftReminder } from '../services/geminiService';

interface ActiveSlotProps {
  slot: Slot;
  task: Task;
  onComplete: (intentional: boolean) => void;
  onExitEarly: () => void;
}

const ActiveSlot: React.FC<ActiveSlotProps> = ({ slot, task, onComplete, onExitEarly }) => {
  const [secondsRemaining, setSecondsRemaining] = useState(slot.durationMinutes * 60);
  const [showExitFriction, setShowExitFriction] = useState(false);
  const [driftMessage, setDriftMessage] = useState<string | null>(null);
  const [lastActiveTime, setLastActiveTime] = useState(Date.now());

  const config = STATE_CONFIG[slot.state];

  useEffect(() => {
    const interval = setInterval(() => {
      setSecondsRemaining(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        setLastActiveTime(Date.now());
      } else {
        const timeAway = Date.now() - lastActiveTime;
        if (timeAway > 10000) { // 10 seconds for simulation
            fetchDriftMessage();
        }
      }
    };
    const fetchDriftMessage = async () => {
      const msg = await getDriftReminder(config.label);
      setDriftMessage(msg);
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [lastActiveTime, config.label]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const progress = ((slot.durationMinutes * 60 - secondsRemaining) / (slot.durationMinutes * 60)) * 100;

  return (
    <div className="flex flex-col items-center justify-center space-y-12 animate-fade-in py-16">
      <div className={`text-8xl font-bold font-mono tracking-tighter transition-colors duration-1000 ${secondsRemaining === 0 ? 'text-amber-400' : 'text-white'}`}>
        {formatTime(secondsRemaining)}
      </div>

      <div className="w-full max-w-lg px-4">
        <div className="flex justify-between items-center mb-3 px-1">
          <span className="text-[10px] uppercase tracking-[0.3em] font-bold text-stone-600">This verse is active</span>
          <span className="text-[10px] uppercase tracking-[0.3em] font-bold text-stone-600">{Math.round(progress)}%</span>
        </div>
        <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
          <div 
            className="h-full bg-amber-600 shadow-[0_0_10px_rgba(217,119,6,0.5)] transition-all duration-1000 ease-linear" 
            style={{ width: `${progress}%` }} 
          />
        </div>
      </div>

      <div className="text-center space-y-4">
        <div className="flex items-center justify-center gap-2 mb-2">
            <span className="text-4xl">{config.icon}</span>
        </div>
        <h2 className="text-4xl font-bold serif text-white tracking-tight">{task.name}</h2>
        <p className="text-stone-500 italic text-lg">“The song continues in your focus.”</p>
      </div>

      {driftMessage && (
        <div className="glass border border-amber-500/30 p-6 rounded-2xl max-w-sm text-center shadow-2xl animate-bounce">
          <p className="text-amber-200 font-serif italic text-lg mb-4">"{driftMessage}"</p>
          <button 
            onClick={() => setDriftMessage(null)}
            className="text-[10px] font-bold uppercase tracking-[0.3em] text-amber-500 hover:text-amber-400"
          >
            I am here
          </button>
        </div>
      )}

      <div className="flex gap-6">
        {secondsRemaining === 0 ? (
          <button 
            onClick={() => onComplete(true)}
            className="px-12 py-4 bg-amber-600 text-white rounded-full hover:bg-amber-500 transition-all shadow-2xl font-bold tracking-[0.2em] uppercase text-xs"
          >
            Complete the Verse
          </button>
        ) : (
          <button 
            onClick={() => setShowExitFriction(true)}
            className="px-8 py-3 border border-white/10 text-stone-500 rounded-full hover:bg-white/5 transition-all font-bold tracking-widest uppercase text-[10px]"
          >
            End Early
          </button>
        )}
      </div>

      {showExitFriction && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="glass p-10 rounded-3xl max-w-md w-full shadow-2xl border border-white/10 text-center">
            <h3 className="text-2xl font-bold serif mb-6 text-white">A Moment of Decision</h3>
            <p className="text-stone-400 mb-10 leading-relaxed italic">
              "This verse has only just begun. Leaving now means this Day won’t be kept with the same intention. Shall we stay?"
            </p>
            <div className="flex flex-col gap-4">
              <button 
                onClick={() => setShowExitFriction(false)}
                className="w-full py-4 bg-white text-stone-900 rounded-xl hover:bg-stone-200 font-bold tracking-[0.2em] transition-all uppercase text-xs"
              >
                Stay and finish
              </button>
              <button 
                onClick={onExitEarly}
                className="w-full py-3 text-red-400/60 hover:text-red-400 text-[10px] font-bold uppercase tracking-widest transition-colors"
              >
                Exit intentionally
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ActiveSlot;
