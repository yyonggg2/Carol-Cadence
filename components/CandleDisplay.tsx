
import React from 'react';
import { TOTAL_DAYS, CAROL_VERSES } from '../constants';
import { DayProgress } from '../types';

interface CandleDisplayProps {
  days: DayProgress[];
  currentDayIndex: number;
}

const CandleDisplay: React.FC<CandleDisplayProps> = ({ days, currentDayIndex }) => {
  return (
    <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-12 gap-4 my-8">
      {Array.from({ length: TOTAL_DAYS }).map((_, i) => {
        const day = days.find(d => d.dayIndex === i);
        const isLit = day?.isIntentional;
        const isToday = currentDayIndex === i;

        return (
          <div 
            key={i} 
            className={`flex flex-col items-center transition-all duration-700 ${isToday ? 'scale-110' : 'opacity-80'}`}
          >
            <div className="relative group">
              {/* Flame */}
              {isLit ? (
                <div className="absolute -top-6 left-1/2 -translate-x-1/2 animate-pulse">
                  <div className="w-4 h-6 bg-orange-400 rounded-full blur-[2px] opacity-80" />
                  <div className="absolute top-1 left-1 w-2 h-4 bg-yellow-200 rounded-full" />
                </div>
              ) : (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-1 h-3 bg-gray-400 rounded-full opacity-40" />
              )}
              
              {/* Candle Body */}
              <div 
                className={`w-8 h-20 rounded-t-sm rounded-b-lg border-x border-b shadow-sm transition-colors duration-500
                  ${isLit
                    ? 'bg-[#F5F0E6] border-[#E6DDCF] shadow-[0_0_12px_rgba(245,240,230,0.6)]'
                    : 'bg-gray-100 border-gray-300'
                     }
                  ${isToday ? 'border-amber-400 ring-2 ring-amber-100 ring-offset-2' : ''}
                `}
              >
                <div className="w-full h-full flex flex-col items-center justify-end pb-2">
                  <span className={`text-[10px] font-bold ${isLit ? 'text-red-100' : 'text-gray-400'}`}>
                    {i + 1}
                  </span>
                </div>
              </div>
              
              {/* Tooltip */}
              <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 hidden group-hover:block w-32 bg-gray-900 text-white text-[10px] py-1 px-2 rounded z-50 pointer-events-none text-center">
                Day {i + 1}: {CAROL_VERSES[i]}
              </div>
            </div>
            {isToday && <div className="mt-2 text-[10px] uppercase tracking-widest font-bold text-amber-600">Today</div>}
          </div>
        );
      })}
    </div>
  );
};

export default CandleDisplay;
