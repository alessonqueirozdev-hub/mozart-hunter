import type { Note } from './types';

// Dimensions
export const GW = 960;
export const GH = 340;
export const MOZART_X = 115;
export const MOZART_Y = GH * 0.63;
export const PROJECTILE_LANE_Y = MOZART_Y - 25;

// Notes Configuration: C4 to C6 (15 white keys)
export const NOTES: Note[] = [
  { name: 'Dó₄', freq: 261.63, sp: -2, key: 'q' },
  { name: 'Ré₄', freq: 293.66, sp: -1, key: 'w' },
  { name: 'Mi₄', freq: 329.63, sp: 0,  key: 'e' },
  { name: 'Fá₄', freq: 349.23, sp: 1,  key: 'r' },
  { name: 'Sol₄',freq: 392.00, sp: 2,  key: 't' },
  { name: 'Lá₄', freq: 440.00, sp: 3,  key: 'y' },
  { name: 'Si₄', freq: 493.88, sp: 4,  key: 'u' },
  { name: 'Dó₅', freq: 523.25, sp: 5,  key: 'i' },
  { name: 'Ré₅', freq: 587.33, sp: 6,  key: 'o' },
  { name: 'Mi₅', freq: 659.25, sp: 7,  key: 'p' },
  { name: 'Fá₅', freq: 698.46, sp: 8,  key: 'a' },
  { name: 'Sol₅',freq: 783.99, sp: 9,  key: 's' },
  { name: 'Lá₅', freq: 880.00, sp: 10, key: 'd' },
  { name: 'Si₅', freq: 987.77, sp: 11, key: 'f' },
  { name: 'Dó₆', freq: 1046.5, sp: 12, key: 'g' },
];

export const WAVE_SUBS = [
  'O reino desperta',
  'A dissonância avança',
  'Harmonia em perigo',
  'O caos absoluto',
  'A batalha final'
];

export const ROMAN = ['I', 'II', 'III', 'IV', 'V'];

// Canvas Layout Constants
export const LS = 16;
export const STAFF_TOP = 28;
export const STAFF_X_NOTE = 240;
export const CLEF_X = 22;
export const CLEF_Y_BL = STAFF_TOP + 4 * LS + 56;
