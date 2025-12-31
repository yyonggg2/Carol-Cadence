
import React, { useState } from 'react';
import { Task, MentalState } from '../types';
import { STATE_CONFIG } from '../constants';

interface TaskPoolProps {
  tasks: Task[];
  onAddTask: (task: Omit<Task, 'id' | 'completed' | 'timeSpent'>) => void;
  onRemoveTask: (id: string) => void;
}

const TaskPool: React.FC<TaskPoolProps> = ({ tasks, onAddTask, onRemoveTask }) => {
  const [name, setName] = useState('');
  const [category, setCategory] = useState<MentalState>(MentalState.SOFT);
  const [hours, setHours] = useState<number>(0);
  const [minutes, setMinutes] = useState<number>(30);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    
    // Calculate total minutes, ensuring values are non-negative
    const totalMinutes = Math.max(1, (Math.max(0, hours) * 60) + Math.max(0, minutes));
    
    onAddTask({ 
        name, 
        category, 
        estimatedMinutes: totalMinutes 
    });
    
    setName('');
    setHours(0);
    setMinutes(30);
  };

  const formatTimeDisplay = (totalMins: number) => {
    const h = Math.floor(totalMins / 60);
    const m = totalMins % 60;
    if (h > 0) return `${h}h ${m}m`;
    return `${m}m`;
  };

  return (
    <div className="glass p-8 rounded-2xl shadow-xl text-left">
      <h3 className="text-2xl font-bold mb-2 serif text-white">The Task Pool</h3>
      <p className="text-sm text-stone-300 mb-8 italic opacity-80">Assign your tasks to the mental states they resonate with.</p>
      
      <form onSubmit={handleSubmit} className="space-y-6 mb-10">
        <div>
          <label className="block text-[10px] font-bold text-stone-400 uppercase tracking-[0.2em] mb-2">Task Name</label>
          <input 
            type="text" 
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., Reading 'A Christmas Carol'"
            className="w-full px-5 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500/50 transition-all placeholder:text-stone-600"
          />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-[10px] font-bold text-stone-400 uppercase tracking-[0.2em] mb-2">Mental Mode</label>
            <select 
              value={category}
              onChange={(e) => setCategory(e.target.value as MentalState)}
              className="w-full px-5 py-3 rounded-xl bg-[#0e1116] border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-amber-500/30 transition-all appearance-none"
            >
              <option value={MentalState.SOFT}>🎶 Soft Mode</option>
              <option value={MentalState.FOCUS}>📖 Focus Mode</option>
              <option value={MentalState.SPRINT}>⚡ Sprint Mode</option>
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-bold text-stone-400 uppercase tracking-[0.2em] mb-2">Commitment</label>
            <div className="flex items-center gap-3">
                <div className="relative flex-1">
                    <input 
                        type="number" 
                        min="0"
                        value={hours}
                        onChange={(e) => setHours(Math.max(0, parseInt(e.target.value) || 0))}
                        className="w-full pr-10 pl-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-amber-500/30 transition-all"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-stone-500 uppercase">h</span>
                </div>
                <div className="relative flex-1">
                    <input 
                        type="number" 
                        min="0"
                        max="59"
                        value={minutes}
                        onChange={(e) => setMinutes(Math.max(0, Math.min(59, parseInt(e.target.value) || 0)))}
                        className="w-full pr-10 pl-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-amber-500/30 transition-all"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-stone-500 uppercase">m</span>
                </div>
            </div>
          </div>
        </div>
        
        <button 
          type="submit"
          className="w-full py-4 bg-amber-600 text-white rounded-xl hover:bg-amber-500 transition-all font-bold tracking-[0.3em] text-xs uppercase shadow-xl shadow-amber-950/20 active:scale-95"
        >
          Add to Pool
        </button>
      </form>

      <div className="space-y-3 max-h-[350px] overflow-y-auto pr-3 custom-scrollbar">
        {tasks.length === 0 && (
          <div className="text-center py-12 text-stone-500 italic text-sm border-2 border-dashed border-white/5 rounded-2xl">
            The pool is empty. Add your first intention above.
          </div>
        )}
        {tasks.map(task => (
          <div key={task.id} className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/5 group hover:bg-white/10 transition-all">
            <div className="text-left">
              <div className="font-semibold text-stone-200 serif text-lg">{task.name}</div>
              <div className="text-[10px] text-stone-500 uppercase tracking-[0.15em] flex items-center gap-2 mt-1 font-bold">
                <span className="opacity-80">{STATE_CONFIG[task.category].icon}</span>
                {STATE_CONFIG[task.category].label} • {formatTimeDisplay(task.estimatedMinutes)}
              </div>
            </div>
            <button 
              onClick={() => onRemoveTask(task.id)}
              className="p-2 text-stone-600 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TaskPool;
