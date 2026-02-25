export interface Note {
  name: string;
  freq: number;
  sp: number;
  key: string;
}

export type MonsterPhase = number;

export interface ParticleOptions {
  ang?: number;
  spd?: number;
  up?: number;
  decay?: number;
  r?: number;
  color?: string;
  type?: 'circle' | 'star' | 'note' | 'ring' | 'ember';
  gravity?: number;
  glow?: boolean;
}

export interface ShakeState {
  x: number;
  y: number;
  pow: number;
}

export interface GameState {
  lives: number;
  score: number;
  wave: number;
  phase: number;
  combo: number;
  streak: number;
  sessionBest: number;
  running: boolean;
  waitAns: boolean;
  monster: any | null; // Will type properly later
  playerProjectiles: any[];
  monsterProjectiles: any[];
  particles: any[];
  floats: any[];
  shake: ShakeState;
  spawnDelay: number;
  currentNote: Note | null;
  staffAnim: number;
  bgScroll: number;
  frame: number;
  timerMax: number;
  timerLeft: number;
  timerRunning: boolean;
  stars: any[];
  clouds: any[];
  torches: any[];
}
