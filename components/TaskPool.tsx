
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
  const [estimate, setEstimate] = useState(30);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onAddTask({ name, category, estimatedMinutes: estimate });
    setName('');
  };

  return (
    <div className="glass p-6 rounded-xl shadow-sm">
      <h3 className="text-xl font-semibold mb-2 serif text-white">The Task Pool</h3>
      <p className="text-sm text-stone-400 mb-6">Assign your verses to the mental states they resonate with.</p>
      
      <form onSubmit={handleSubmit} className="space-y-4 mb-8">
        <div>
          <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-widest mb-1">Task Name</label>
          <input 
            type="text" 
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., Read Part 1 of Middlemarch"
            className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
          />
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-widest mb-1">Target Mode</label>
            <select 
              value={category}
              onChange={(e) => setCategory(e.target.value as MentalState)}
              className="w-full px-4 py-2 rounded-lg bg-white/5 backdrop-blur-md border border-white/10 text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all appearance-none"
            >
              <option value={MentalState.SOFT}>Soft Mode</option>
              <option value={MentalState.FOCUS}>Focus Mode</option>
              <option value={MentalState.SPRINT}>Sprint Mode</option>
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-widest mb-1">Time (mins)</label>
            <input 
              type="number" 
              value={estimate}
              onChange={(e) => setEstimate(Number(e.target.value))}
              className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
            />
          </div>
        </div>
        
        <button 
          type="submit"
          className="w-full py-3 bg-amber-600 text-white rounded-lg hover:bg-amber-500 transition-colors font-bold tracking-widest text-xs uppercase"
        >
          Add to Pool
        </button>
      </form>

      <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
        {tasks.length === 0 && (
          <div className="text-center py-8 text-stone-500 italic text-sm border-2 border-dashed border-white/5 rounded-lg">
            No tasks gathered yet.
          </div>
        )}
        {tasks.map(task => (
          <div key={task.id} className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/10 group">
            <div>
              <div className="font-medium text-stone-200">{task.name}</div>
              <div className="text-[10px] text-stone-500 uppercase tracking-widest flex items-center gap-2">
                <span className="opacity-70">{STATE_CONFIG[task.category].icon}</span>
                {STATE_CONFIG[task.category].label} • {task.estimatedMinutes} mins
              </div>
            </div>
            <button 
              onClick={() => onRemoveTask(task.id)}
              className="p-1 text-stone-600 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
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
