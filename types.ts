
export enum MentalState {
  SOFT = 'SOFT',
  FOCUS = 'FOCUS',
  SPRINT = 'SPRINT'
}

export type TaskCategory = MentalState;

export enum DayChapter {
  MORNING = 'Morning',
  AFTERNOON = 'Afternoon',
  EVENING = 'Evening'
}

export interface Task {
  id: string;
  name: string;
  category: TaskCategory;
  estimatedMinutes: number;
  completed: boolean;
  timeSpent: number; // minutes
}

export interface Slot {
  id: string;
  state: MentalState;
  taskId: string;
  startTime: number; // timestamp
  durationMinutes: number;
  completed: boolean;
}

export interface DayProgress {
  dayIndex: number; // 0 to 11
  isIntentional: boolean;
  slots: Slot[];
}

export interface AppState {
  tasks: Task[];
  days: DayProgress[];
  currentSlot: Slot | null;
  setupComplete: boolean;
}
