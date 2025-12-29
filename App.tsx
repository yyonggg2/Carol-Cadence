
import React, { useState, useEffect, useMemo } from 'react';
import { AppState, Task, Slot, MentalState, DayProgress, DayChapter } from './types';
import { STATE_CONFIG, TOTAL_DAYS, CAROL_VERSES } from './constants';
import CandleDisplay from './components/CandleDisplay';
import TaskPool from './components/TaskPool';
import ActiveSlot from './components/ActiveSlot';
import { getReflectionMessage } from './services/geminiService';

const INITIAL_STATE: AppState = {
  tasks: [],
  days: Array.from({ length: TOTAL_DAYS }, (_, i) => ({
    dayIndex: i,
    isIntentional: false,
    slots: []
  })),
  currentSlot: null,
  setupComplete: false
};

const App: React.FC = () => {
  const [state, setState] = useState<AppState>(INITIAL_STATE);
  const [currentDayIndex, setCurrentDayIndex] = useState(0);
  const [selectedTask, setSelectedTask] = useState<string>('');
  const [selectedMode, setSelectedMode] = useState<MentalState | null>(null);
  const [showEntryFriction, setShowEntryFriction] = useState(false);
  const [reflection, setReflection] = useState<string | null>(null);
  const [demoHour, setDemoHour] = useState<number | null>(null);
  const [showNavFriction, setShowNavFriction] = useState<null | 'chapter' | 'day'>(null);

  const currentChapter = useMemo(() => {
    const hour = demoHour ?? new Date().getHours();
    if (hour < 12) return DayChapter.MORNING;
    if (hour < 18) return DayChapter.AFTERNOON;
    return DayChapter.EVENING;
  }, [demoHour]);

  const addTask = (task: Omit<Task, 'id' | 'completed' | 'timeSpent'>) => {
    const newTask: Task = {
      ...task,
      id: Math.random().toString(36).substr(2, 9),
      completed: false,
      timeSpent: 0
    };
    setState(prev => ({ ...prev, tasks: [...prev.tasks, newTask] }));
  };

  const removeTask = (id: string) => {
    setState(prev => ({ ...prev, tasks: prev.tasks.filter(t => t.id !== id) }));
  };

  const seedDemoData = () => {
    const now = Date.now();

    const demoTasks: Task[] = [
      // ---------- SOFT (3) ----------
      {
        id: 'soft-avatar2',
        name: 'Watch Avatar 2',
        category: MentalState.SOFT,
        estimatedMinutes: 180,
        completed: false,
        timeSpent: 95,
      },
      {
        id: 'soft-novel',
        name: 'Read novel before bed',
        category: MentalState.SOFT,
        estimatedMinutes: 45,
        completed: false,
        timeSpent: 15,
      },
      {
        id: 'soft-journal',
        name: 'Christmas music + journaling',
        category: MentalState.SOFT,
        estimatedMinutes: 30,
        completed: false,
        timeSpent: 0,
      },

      // ---------- FOCUS (2) ----------
      {
        id: 'focus-missing',
        name: 'Finish one Missing Semester lecture',
        category: MentalState.FOCUS,
        estimatedMinutes: 90,
        completed: false,
        timeSpent: 60,
      },
      {
        id: 'focus-outline',
        name: 'Draft application essay outline',
        category: MentalState.FOCUS,
        estimatedMinutes: 60,
        completed: false,
        timeSpent: 10,
      },

      // ---------- SPRINT (2) ----------
      {
        id: 'sprint-workout',
        name: '15-min workout / walk',
        category: MentalState.SPRINT,
        estimatedMinutes: 20,
        completed: true,
        timeSpent: 20,
      },
      {
        id: 'sprint-desk',
        name: 'Tidy desk',
        category: MentalState.SPRINT,
        estimatedMinutes: 10,
        completed: false,
        timeSpent: 0,
      },
    ];

    // Days 1–6 lit, Day 7 current, 8–12 unlit
    const demoDays = Array.from({ length: TOTAL_DAYS }, (_, i) => {
      const isLit = i < 6;

      const slotState =
        i % 3 === 0 ? MentalState.FOCUS :
        i % 3 === 1 ? MentalState.SOFT :
        MentalState.SPRINT;

      const slotTaskId =
        slotState === MentalState.FOCUS ? 'focus-missing' :
        slotState === MentalState.SOFT ? 'soft-avatar2' :
        'sprint-workout';

      return {
        dayIndex: i,
        isIntentional: isLit,
        slots: isLit
          ? [
              {
                id: `slot-${i}`,
                state: slotState,
                taskId: slotTaskId,
                startTime: now - (i + 1) * 3600_000,
                durationMinutes: 30,
                completed: true,
              },
            ]
          : [],
      };
    });

    setState(prev => ({
      ...prev,
      setupComplete: true,
      tasks: demoTasks,
      days: demoDays,
      currentSlot: null,
    }));

    setCurrentDayIndex(6); // show Day 7 (index 6)
    setDemoHour(13); // afternoon for stable chapter label
    setSelectedMode(null);
    setSelectedTask('');
    setReflection(null);
  };

  const advanceDemoChapter = () => {
    const hour = demoHour ?? new Date().getHours();

    const nextHour =
      hour < 12 ? 13 :   // morning -> afternoon
      hour < 18 ? 19 :   // afternoon -> evening
      9;                 // evening -> next day morning

    if (hour >= 18) {
      setCurrentDayIndex(prev => Math.min(prev + 1, TOTAL_DAYS - 1));
    }

    setDemoHour(nextHour);
  };

  const startSlot = () => {
    if (!selectedTask) return;
    setShowEntryFriction(true);
  };

  const confirmStartSlot = () => {
    if (!selectedMode) return;
    const config = STATE_CONFIG[selectedMode];
    const newSlot: Slot = {
      id: Math.random().toString(36).substr(2, 9),
      state: selectedMode,
      taskId: selectedTask,
      startTime: Date.now(),
      durationMinutes: config.minMinutes,
      completed: false
    };
    setState(prev => ({ ...prev, currentSlot: newSlot }));
    setShowEntryFriction(false);
  };

  const completeSlot = async (intentional: boolean) => {
    if (!state.currentSlot) return;

    const updatedDays = [...state.days];
    const day = updatedDays[currentDayIndex];
    
    if (intentional) {
      day.isIntentional = true;
      day.slots.push({ ...state.currentSlot, completed: true });
      
      const updatedTasks = state.tasks.map(t => 
        t.id === state.currentSlot?.taskId 
          ? { ...t, timeSpent: t.timeSpent + (state.currentSlot?.durationMinutes || 0) } 
          : t
      );
      
      setState(prev => ({ 
        ...prev, 
        days: updatedDays, 
        tasks: updatedTasks, 
        currentSlot: null 
      }));

      const counts = day.slots.reduce((acc, s) => {
        acc[s.state] = (acc[s.state] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      
      const msg = await getReflectionMessage(currentDayIndex, updatedTasks.filter(t => t.completed).length, counts);
      setReflection(msg);
      setSelectedTask('');
      setSelectedMode(null);
    } else {
      setState(prev => ({ ...prev, currentSlot: null }));
    }
  };

  // Filter tasks based on selected mode
  const filteredTasks = useMemo(() => {
    if (!selectedMode) return [];
    return state.tasks.filter(t => t.category === selectedMode && !t.completed);
  }, [state.tasks, selectedMode]);

  if (!state.setupComplete) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 relative">
        <div className="max-w-2xl w-full space-y-12 animate-fade-in text-center">
          <header className="space-y-4">
            <div className="text-amber-500 text-6xl mb-4">🕯️</div>
            <h1 className="text-6xl font-bold text-white serif tracking-tight">Twelve Days</h1>
            <p className="text-stone-400 italic text-lg max-w-md mx-auto">“A Partridge in a Pear Tree” begins the song of your intentions.</p>
          </header>

          <TaskPool tasks={state.tasks} onAddTask={addTask} onRemoveTask={removeTask} />

          <div className="flex justify-center pt-8">
            <button 
              disabled={state.tasks.length === 0}
              onClick={() => setState(prev => ({ ...prev, setupComplete: true }))}
              className={`px-16 py-5 rounded-full font-bold tracking-[0.2em] transition-all shadow-2xl uppercase text-sm
                ${state.tasks.length > 0 
                  ? 'bg-amber-600 text-white hover:bg-amber-500 hover:scale-105 active:scale-95' 
                  : 'bg-white/5 text-stone-600 cursor-not-allowed border border-white/5'
                }`}
            >
              Begin the Journey
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-24 text-stone-200">
      <header className="sticky top-0 z-40 bg-black/40 backdrop-blur-xl border-b border-white/5 px-6 py-5">
        <div className="max-w-6xl mx-auto flex justify-between items-end">
          <div>
            <h1 className="text-2xl font-bold text-white serif">Day {currentDayIndex + 1}: {CAROL_VERSES[currentDayIndex]}</h1>
            <p className="text-[10px] uppercase tracking-[0.3em] font-bold text-amber-500/80">{currentChapter} Chapter</p>
          </div>
          <button 
            onClick={() => setState(prev => ({ ...prev, setupComplete: false }))}
            className="text-[10px] font-bold text-stone-500 hover:text-stone-300 uppercase tracking-widest transition-colors"
          >
            Adjust Task Pool
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 pt-8">
        <CandleDisplay days={state.days} currentDayIndex={currentDayIndex} />

        {state.currentSlot ? (
          <ActiveSlot 
            slot={state.currentSlot} 
            task={state.tasks.find(t => t.id === state.currentSlot?.taskId)!} 
            onComplete={completeSlot}
            onExitEarly={() => completeSlot(false)}
          />
        ) : (
          <div className="max-w-4xl mx-auto mt-12 space-y-16">
            
            {/* 1. Mode Selection */}
            <section className="animate-fade-in">
              <h3 className="text-xs font-bold uppercase tracking-[0.3em] text-stone-500 mb-8 text-center">First, choose your mental state</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {(Object.keys(STATE_CONFIG) as MentalState[]).map(mode => {
                  const cfg = STATE_CONFIG[mode];
                  const isSelected = selectedMode === mode;
                  return (
                    <button 
                      key={mode}
                      onClick={() => {
                        setSelectedMode(mode);
                        setSelectedTask('');
                      }}
                      className={`p-8 rounded-2xl border-2 text-center transition-all group glass
                        ${isSelected 
                          ? 'border-amber-500 bg-amber-500/10 scale-[1.05] ring-4 ring-amber-500/5' 
                          : 'border-white/5 hover:border-white/20'}
                      `}
                    >
                      <div className="text-4xl mb-4 grayscale group-hover:grayscale-0 transition-all">{cfg.icon}</div>
                      <div className={`font-bold text-xl serif mb-2 ${isSelected ? 'text-white' : 'text-stone-400'}`}>{cfg.label}</div>
                      <p className="text-xs text-stone-500 leading-relaxed">{cfg.description}</p>
                    </button>
                  );
                })}
              </div>
            </section>

            {/* 2. Task Selection (Visible only after mode selected) */}
            {selectedMode && (
              <section className="animate-fade-in space-y-8 pb-12">
                <div className="h-px bg-white/5 w-1/3 mx-auto" />
                <h3 className="text-xs font-bold uppercase tracking-[0.3em] text-stone-500 mb-8 text-center">Then, select a task for {STATE_CONFIG[selectedMode].label}</h3>
                <div className="grid grid-cols-1 gap-4 max-w-2xl mx-auto">
                  {filteredTasks.length === 0 ? (
                    <div className="text-center p-12 glass rounded-2xl border-dashed border-2 border-white/5">
                        <p className="text-stone-500 italic mb-4">No tasks found in your pool for this mode.</p>
                        <button 
                            onClick={() => setState(prev => ({ ...prev, setupComplete: false }))}
                            className="text-amber-500 text-xs font-bold uppercase tracking-widest"
                        >
                            + Add Verses to {STATE_CONFIG[selectedMode].label}
                        </button>
                    </div>
                  ) : (
                    filteredTasks.map(task => (
                      <button 
                        key={task.id}
                        onClick={() => setSelectedTask(task.id)}
                        className={`flex items-center justify-between p-6 rounded-2xl border transition-all glass
                          ${selectedTask === task.id 
                            ? 'border-amber-500/40 bg-amber-500/5' 
                            : 'border-white/5 hover:border-white/10'}
                        `}
                      >
                        <div className="text-left">
                          <div className="font-medium text-lg text-stone-200">{task.name}</div>
                          <div className="mt-2 space-y-2">
                            <div className="flex justify-between text-[10px] uppercase tracking-widest text-stone-500">
                              <span>Progress</span>
                              <span>{task.timeSpent} / {task.estimatedMinutes} mins</span>
                            </div>

                            {(() => {
                              const pct = Math.min(100, Math.round((task.timeSpent / Math.max(1, task.estimatedMinutes)) * 100));
                              return (
                                <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                                  <div
                                    className="h-full rounded-full bg-amber-400 shadow-[0_0_18px_rgba(251,191,36,0.55)] transition-all"
                                    style={{ width: `${pct}%` }}
                                  />
                                </div>
                              );
                            })()}
                          </div>

                        </div>
                        <div className={`w-6 h-6 rounded-full border flex items-center justify-center transition-all
                            ${selectedTask === task.id ? 'bg-amber-500 border-amber-500' : 'border-white/10'}
                        `}>
                            {selectedTask === task.id && <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                        </div>
                      </button>
                    ))
                  )}
                </div>

                {/* 3. Final Start Button */}
                {selectedTask && (
                    <div className="pt-8 flex justify-center animate-fade-in">
                        <button 
                            onClick={startSlot}
                            className="px-20 py-5 rounded-full bg-white text-stone-900 font-bold tracking-[0.3em] transition-all shadow-[0_0_30px_rgba(255,255,255,0.2)] hover:scale-105 active:scale-95 uppercase text-xs"
                        >
                            Start the Verse
                        </button>
                    </div>
                )}
              </section>
            )}

            {/* Reflection Overlay */}
            {reflection && (
                <div className="fixed bottom-12 right-12 max-w-sm glass p-6 rounded-2xl border-l-4 border-amber-500 shadow-2xl animate-fade-in z-50">
                    <h4 className="text-amber-500 text-[10px] font-bold uppercase tracking-widest mb-2">Reflections from the Hearth</h4>
                    <p className="text-stone-300 text-sm italic serif leading-relaxed">"{reflection}"</p>
                    <button 
                        onClick={() => setReflection(null)}
                        className="mt-4 text-[10px] text-stone-500 hover:text-white uppercase tracking-widest font-bold"
                    >
                        Dismiss
                    </button>
                </div>
            )}
          </div>
        )}
      </main>

      {/* Entry Friction Modal */}
      {showEntryFriction && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="glass p-12 rounded-3xl max-w-md w-full shadow-2xl text-center border border-white/10">
            <div className="text-6xl mb-8 animate-pulse">🕯️</div>
            <h3 className="text-3xl font-bold serif mb-6 text-white">Ready to begin?</h3>
            <p className="text-stone-400 mb-12 leading-relaxed italic text-lg">
              "You’re about to begin this verse. Are you ready to stay with it for a while?"
            </p>
            <div className="flex flex-col gap-4">
              <button 
                onClick={confirmStartSlot}
                className="w-full py-5 bg-amber-600 text-white rounded-xl hover:bg-amber-500 font-bold tracking-[0.2em] transition-all active:scale-95 uppercase text-xs"
              >
                Yes, I am present
              </button>
              <button 
                onClick={() => setShowEntryFriction(false)}
                className="w-full py-3 text-stone-600 hover:text-stone-400 text-[10px] font-bold uppercase tracking-widest transition-colors"
              >
                Wait, I need a moment
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Simulation Trigger (Visible only in non-active slot) */}
      {!state.currentSlot && (
        <div className="fixed bottom-8 left-8 flex gap-3">
          <button
            onClick={() => setCurrentDayIndex(prev => (prev + 1) % TOTAL_DAYS)}
            className="px-4 py-2 text-stone-600 hover:text-stone-400 text-[9px] uppercase font-bold tracking-[0.3em] glass rounded-full"
          >
            Next Day
          </button>

          <button
            onClick={advanceDemoChapter}
            className="px-4 py-2 text-stone-600 hover:text-stone-400 text-[9px] uppercase font-bold tracking-[0.3em] glass rounded-full"
          >
            Next Chapter
          </button>

          <button
            onClick={seedDemoData}
            className="px-4 py-2 text-stone-600 hover:text-stone-400 text-[9px] uppercase font-bold tracking-[0.3em] glass rounded-full"
          >
            Seed Demo
          </button>

        </div>
      )}
    </div>
  );
};


export default App;
