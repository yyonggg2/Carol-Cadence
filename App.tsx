
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

const formatHM = (totalMinutes: number) => {
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
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

  const filteredTasks = useMemo(() => {
    if (!selectedMode) return [];
    return state.tasks.filter(t => t.category === selectedMode && !t.completed);
  }, [state.tasks, selectedMode]);

  if (!state.setupComplete) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-8 relative">
        <div className="max-w-3xl w-full space-y-16 animate-fade-in text-center pb-20">
          <header className="space-y-6">
            <div className="text-amber-500 text-7xl mb-4 drop-shadow-[0_0_20px_rgba(245,158,11,0.3)]">🕯️</div>
            <h1 className="text-7xl font-bold text-white serif tracking-tight">Christmas Cadence</h1>
            <p className="text-stone-300 italic text-xl max-w-lg mx-auto opacity-90">An Intentional Holiday Assistant</p>
          </header>

          <TaskPool tasks={state.tasks} onAddTask={addTask} onRemoveTask={removeTask} />

          <div className="flex justify-center pt-8">
            <button 
              disabled={state.tasks.length === 0}
              onClick={() => setState(prev => ({ ...prev, setupComplete: true }))}
              className={`px-24 py-6 rounded-full font-bold tracking-[0.4em] transition-all shadow-2xl uppercase text-sm
                ${state.tasks.length > 0 
                  ? 'bg-amber-600 text-white hover:bg-amber-500 hover:scale-105 active:scale-95 shadow-amber-900/40' 
                  : 'bg-white/5 text-stone-700 cursor-not-allowed border border-white/5'
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
    <div className="min-h-screen pb-32 text-stone-200">
      <header className="sticky top-0 z-40 bg-black/40 backdrop-blur-2xl border-b border-white/10 px-8 py-6">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-6">
            <div className="w-12 h-12 glass rounded-xl flex items-center justify-center text-2xl border-white/10">🕯️</div>
            <div>
              <h1 className="text-2xl font-bold text-white serif tracking-tight">Day {currentDayIndex + 1}: {CAROL_VERSES[currentDayIndex]}</h1>
              <p className="text-[10px] uppercase tracking-[0.4em] font-bold text-amber-500/90">{currentChapter} Chapter</p>
            </div>
          </div>
          <button 
            onClick={() => setState(prev => ({ ...prev, setupComplete: false }))}
            className="px-6 py-2.5 text-[10px] font-bold text-stone-400 hover:text-white uppercase tracking-widest transition-all glass rounded-full border-white/10"
          >
            Adjust Tasks
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-8 pt-10">
        <CandleDisplay days={state.days} currentDayIndex={currentDayIndex} />

        {state.currentSlot ? (
          <ActiveSlot 
            slot={state.currentSlot} 
            task={state.tasks.find(t => t.id === state.currentSlot?.taskId)!} 
            onComplete={completeSlot}
            onExitEarly={() => completeSlot(false)}
          />
        ) : (
          <div className="max-w-4xl mx-auto mt-16 space-y-24">
            
            {/* STEP 1: CHOOSE MODE */}
            <section className="animate-fade-in text-center">
              <h3 className="text-[11px] font-bold uppercase tracking-[0.5em] text-stone-500 mb-10">I. Choose your mental state</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
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
                      className={`p-10 rounded-[2.5rem] border-2 text-center transition-all group glass
                        ${isSelected 
                          ? 'border-amber-500 bg-amber-500/10 scale-[1.05] ring-8 ring-amber-500/5 shadow-2xl' 
                          : 'border-white/5 hover:border-white/20'}
                      `}
                    >
                      <div className="text-5xl mb-6 grayscale-50 group-hover:grayscale-0 transition-all drop-shadow-lg">{cfg.icon}</div>
                      <div className={`font-bold text-2xl serif mb-3 ${isSelected ? 'text-white' : 'text-stone-400'}`}>{cfg.label}</div>
                      <p className="text-xs text-stone-500 leading-relaxed max-w-[160px] mx-auto italic">"{cfg.description}"</p>
                    </button>
                  );
                })}
              </div>
            </section>

            {/* STEP 2: CHOOSE TASK (Visible only after mode selected) */}
            {selectedMode && (
              <section className="animate-in fade-in zoom-in duration-500 space-y-12 pb-20">
                <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent w-full" />
                <div className="text-center">
                    <h3 className="text-[11px] font-bold uppercase tracking-[0.5em] text-stone-500 mb-4">II. Select a verse for {STATE_CONFIG[selectedMode].label}</h3>
                    <p className="text-xs text-stone-600 italic">Singing the song of your focus...</p>
                </div>
                
                <div className="grid grid-cols-1 gap-5 max-w-2xl mx-auto">
                  {filteredTasks.length === 0 ? (
                    <div className="text-center p-16 glass rounded-[2.5rem] border-dashed border-2 border-white/10">
                        <p className="text-stone-500 italic mb-6">Your library has no verses prepared for this state.</p>
                        <button 
                            onClick={() => setState(prev => ({ ...prev, setupComplete: false }))}
                            className="px-8 py-3 bg-white/5 text-amber-500 text-[10px] font-bold uppercase tracking-widest rounded-full border border-amber-500/20 hover:bg-amber-500/10 transition-all"
                        >
                            + Add to {STATE_CONFIG[selectedMode].label}
                        </button>
                    </div>
                  ) : (
                    filteredTasks.map(task => (
                      <button 
                        key={task.id}
                        onClick={() => setSelectedTask(task.id)}
                        className={`flex items-center justify-between p-8 rounded-[2rem] border transition-all glass group
                          ${selectedTask === task.id 
                            ? 'border-amber-500/40 bg-amber-500/5 shadow-xl' 
                            : 'border-white/5 hover:border-white/10'}
                        `}
                      >
                        <div className="text-left flex-1">
                          <div className={`font-semibold text-2xl serif transition-colors ${selectedTask === task.id ? 'text-white' : 'text-stone-300'}`}>{task.name}</div>
                          <div className="mt-4 space-y-3">
                            <div className="flex justify-between text-[10px] uppercase tracking-[0.3em] text-stone-500 font-bold">
                              <span>SINGING PROGRESS</span>
                              <span>{formatHM(task.timeSpent)} / {formatHM(task.estimatedMinutes)}</span>
                            </div>
                            {(() => {
                              const pct = Math.min(100, Math.round((task.timeSpent / Math.max(1, task.estimatedMinutes)) * 100));
                              return (
                                <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                                  <div
                                    className="h-full rounded-full bg-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.6)] transition-all duration-700"
                                    style={{ width: `${pct}%` }}
                                  />
                                </div>
                              );
                            })()}
                          </div>
                        </div>
                        <div className={`ml-8 w-12 h-12 rounded-full border-2 flex items-center justify-center transition-all
                            ${selectedTask === task.id ? 'bg-amber-500 border-amber-500 shadow-[0_0_20px_rgba(245,158,11,0.4)]' : 'border-white/10 group-hover:border-white/30'}
                        `}>
                            {selectedTask === task.id && <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                        </div>
                      </button>
                    ))
                  )}
                </div>

                {/* STEP 3: START */}
                {selectedTask && (
                    <div className="pt-12 flex justify-center animate-fade-in">
                        <button 
                            onClick={startSlot}
                            className="px-24 py-7 rounded-full bg-white text-stone-900 font-bold tracking-[0.5em] transition-all shadow-[0_0_50px_rgba(255,255,255,0.2)] hover:scale-105 active:scale-95 uppercase text-xs"
                        >
                            Begin the Verse
                        </button>
                    </div>
                )}
              </section>
            )}

            {/* Reflection Notification */}
            {reflection && (
                <div className="fixed bottom-12 right-12 max-w-sm glass p-8 rounded-3xl border-l-4 border-amber-500 shadow-[0_30px_60px_rgba(0,0,0,0.5)] animate-fade-in z-50">
                    <h4 className="text-amber-500 text-[10px] font-bold uppercase tracking-[0.4em] mb-3">Reflections from the Hearth</h4>
                    <p className="text-stone-300 text-lg italic serif leading-relaxed">"{reflection}"</p>
                    <button 
                        onClick={() => setReflection(null)}
                        className="mt-6 text-[10px] text-stone-500 hover:text-white uppercase tracking-widest font-bold transition-colors"
                    >
                        Dismiss
                    </button>
                </div>
            )}
          </div>
        )}
      </main>

      {/* Confirmation Friction Modal */}
      {showEntryFriction && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-3xl flex items-center justify-center p-8 z-50">
          <div className="glass p-16 rounded-[3rem] max-w-xl w-full shadow-2xl text-center border border-white/20">
            <div className="text-8xl mb-10 animate-pulse drop-shadow-[0_0_25px_rgba(245,158,11,0.5)]">🕯️</div>
            <h3 className="text-4xl font-bold serif mb-8 text-white tracking-tight">Are you ready to stay?</h3>
            <p className="text-stone-400 mb-16 leading-relaxed italic text-xl">
              "This verse requires your presence. Take a deep breath and prepare to sing your intention."
            </p>
            <div className="flex flex-col gap-5">
              <button 
                onClick={confirmStartSlot}
                className="w-full py-6 bg-amber-600 text-white rounded-2xl hover:bg-amber-500 font-bold tracking-[0.4em] transition-all active:scale-95 uppercase text-sm shadow-xl shadow-amber-950/40"
              >
                I am present
              </button>
              <button 
                onClick={() => setShowEntryFriction(false)}
                className="w-full py-4 text-stone-600 hover:text-stone-300 text-[11px] font-bold uppercase tracking-[0.3em] transition-colors"
              >
                I need a moment more
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Simulation Trigger */}
      {!state.currentSlot && (
        <div className="fixed bottom-10 left-10">
          <button
            onClick={advanceDemoChapter}
            className="px-4 py-2 text-stone-600 hover:text-stone-400 text-[9px] uppercase font-bold tracking-[0.3em] glass rounded-full"
          >
            Next Chapter Demo
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
