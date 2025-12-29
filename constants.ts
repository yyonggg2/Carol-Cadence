
import { MentalState } from './types';

export const STATE_CONFIG = {
  [MentalState.SOFT]: {
    label: 'Soft Mode',
    description: 'Intentional rest or low-pressure activity',
    minMinutes: 30,
    maxMinutes: 45,
    color: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    icon: '🎶'
  },
  [MentalState.FOCUS]: {
    label: 'Focus Mode',
    description: 'Sustained cognitive work',
    minMinutes: 45,
    maxMinutes: 60,
    color: 'bg-indigo-100 text-indigo-800 border-indigo-200',
    icon: '📖'
  },
  [MentalState.SPRINT]: {
    label: 'Sprint Mode',
    description: 'Short, energetic effort',
    minMinutes: 25,
    maxMinutes: 40,
    color: 'bg-rose-100 text-rose-800 border-rose-200',
    icon: '⚡'
  }
};

export const TOTAL_DAYS = 12;

export const CAROL_VERSES = [
  "A Partridge in a Pear Tree",
  "Two Turtle Doves",
  "Three French Hens",
  "Four Calling Birds",
  "Five Gold Rings",
  "Six Geese a-Laying",
  "Seven Swans a-Swimming",
  "Eight Maids a-Milking",
  "Nine Ladies Dancing",
  "Ten Lords a-Leaping",
  "Eleven Pipers Piping",
  "Twelve Drummers Drumming"
];
