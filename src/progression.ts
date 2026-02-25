import { NOTES } from './constants';

export interface LevelConfig {
  id: number;
  stage: number;
  stageLevel: number;
  label: string;
  unlockedNotes: number;
  durationMs: number;
  monsterSpeed: number;
  projectileSpeed: number;
  fireRate: number;
  spawnDelay: number;
  backgroundId: number;
}

const UNLOCK_STEPS = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 15];
const LEVELS_PER_STAGE = 3;

export const LEVELS: LevelConfig[] = UNLOCK_STEPS.map((unlockedNotes, index) => {
  const stage = Math.floor(index / LEVELS_PER_STAGE) + 1;
  const stageLevel = (index % LEVELS_PER_STAGE) + 1;
  const levelFactor = index;

  return {
    id: index + 1,
    stage,
    stageLevel,
    label: `Estagio ${stage} - Nivel ${stageLevel}`,
    unlockedNotes,
    durationMs: 30000 + stageLevel * 5000,
    monsterSpeed: 1 + levelFactor * 0.06,
    projectileSpeed: 1 + levelFactor * 0.05,
    fireRate: 1 + levelFactor * 0.045,
    spawnDelay: Math.max(36, 72 - levelFactor * 3),
    backgroundId: index % 4,
  };
});

export const LAST_LEVEL_INDEX = LEVELS.length - 1;

export function clampLevelIndex(index: number): number {
  if (!Number.isFinite(index)) return 0;
  if (index < 0) return 0;
  if (index > LAST_LEVEL_INDEX) return LAST_LEVEL_INDEX;
  return Math.floor(index);
}

export function getLevelConfig(levelIndex: number): LevelConfig {
  return LEVELS[clampLevelIndex(levelIndex)];
}

export function getUnlockedNoteIndices(unlockedCount: number): number[] {
  const safeCount = Math.max(2, Math.min(NOTES.length, Math.floor(unlockedCount)));
  return Array.from({ length: safeCount }, (_, idx) => idx);
}

export function computeRampRatio(levelElapsedMs: number, durationMs: number): number {
  if (durationMs <= 0) return 0;
  const ratio = levelElapsedMs / durationMs;
  return Math.max(0, Math.min(0.65, ratio * 0.65));
}
