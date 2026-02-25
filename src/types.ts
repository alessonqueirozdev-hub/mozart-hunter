// ─── Domain Types ────────────────────────────────────────────────────────────

export interface Note {
  name: string;
  freq: number;
  /** Staff position: 0 = middle E4, cada +1 sobe uma linha/espaço */
  sp: number;
  key: string;
}

export type ClefType = 'treble' | 'bass' | 'alto' | 'tenor';

// ─── Particle ────────────────────────────────────────────────────────────────

export type ParticleType = 'circle' | 'star' | 'note' | 'ring' | 'ember';

export interface ParticleOptions {
  ang?: number;
  spd?: number;
  up?: number;
  decay?: number;
  r?: number;
  color?: string;
  type?: ParticleType;
  gravity?: number;
  glow?: boolean;
}

// ─── Drawable / Updatable contract ───────────────────────────────────────────

export interface Drawable {
  draw(ctx: CanvasRenderingContext2D): void;
}

export interface Updatable {
  /** Retorna um evento opcional para o caller tratar */
  update(): EntityEvent | null;
}

export type EntityEvent = 'shoot' | 'hit' | null;

// ─── Alive-tracked entities ──────────────────────────────────────────────────

export interface AliveEntity extends Drawable, Updatable {
  alive: boolean;
}

export interface LiveEntity extends Drawable {
  life: number;
  update(): void;
}

// ─── Scene objects ────────────────────────────────────────────────────────────

export interface Star {
  x: number;
  y: number;
  r: number;
  a: number;
  t: number;
  ts: number;
}

export interface Cloud {
  x: number;
  y: number;
  w: number;
  h: number;
  speed: number;
  alpha: number;
}

export interface Torch {
  x: number;
  y: number;
  flicker: number;
  flickerSpeed: number;
  size: number;
}

// ─── Core state ──────────────────────────────────────────────────────────────

export interface ShakeState {
  x: number;
  y: number;
  pow: number;
}

export interface GameState {
  lives: number;
  score: number;
  wave: number;
  stage: number;
  stageLevel: number;
  levelIndex: number;
  phase: number;
  combo: number;
  streak: number;
  sessionBest: number;
  champion: boolean;
  running: boolean;
  waitAns: boolean;
  /** Monstro atual na tela, ou null se não houver */
  monster: import('./entities/Monster').Monster | null;
  playerProjectiles: import('./entities/Projectiles').PlayerProjectile[];
  monsterProjectiles: import('./entities/Projectiles').MonsterProjectile[];
  particles: import('./entities/Particle').Particle[];
  floats: import('./entities/FloatText').FloatText[];
  shake: ShakeState;
  spawnDelay: number;
  currentNote: Note | null;
  staffAnim: number;
  bgScroll: number;
  frame: number;
  timerMax: number;
  timerLeft: number;
  timerRunning: boolean;
  levelElapsedMs: number;
  totalElapsedMs: number;
  unlockedNoteCount: number;
  availableNoteIndices: number[];
  difficulty: {
    monsterSpeed: number;
    projectileSpeed: number;
    fireRate: number;
    spawnDelay: number;
  };
  backgroundId: number;
  clef: ClefType;
  stars: Star[];
  clouds: Cloud[];
  torches: Torch[];
}
