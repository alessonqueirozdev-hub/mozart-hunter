export interface ProgressSnapshot {
  levelIndex: number;
  champion: boolean;
  savedAt: number;
}

export interface ProgressStore {
  load(): ProgressSnapshot | null;
  save(snapshot: ProgressSnapshot): void;
  clear(): void;
}

const STORAGE_KEY = 'mz_progress_v1';

function sanitize(snapshot: unknown): ProgressSnapshot | null {
  if (!snapshot || typeof snapshot !== 'object') return null;
  const data = snapshot as Partial<ProgressSnapshot>;
  if (typeof data.levelIndex !== 'number' || !Number.isFinite(data.levelIndex)) return null;
  if (typeof data.champion !== 'boolean') return null;
  if (typeof data.savedAt !== 'number' || !Number.isFinite(data.savedAt)) return null;
  return {
    levelIndex: Math.max(0, Math.floor(data.levelIndex)),
    champion: data.champion,
    savedAt: Math.floor(data.savedAt),
  };
}

export const browserProgressStore: ProgressStore = {
  load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      return sanitize(JSON.parse(raw));
    } catch {
      return null;
    }
  },
  save(snapshot) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
  },
  clear() {
    localStorage.removeItem(STORAGE_KEY);
  },
};

export function formatElapsedSince(timestamp: number): string {
  const delta = Math.max(0, Date.now() - timestamp);
  const min = Math.floor(delta / 60000);
  if (min < 1) return 'menos de 1 minuto';
  if (min < 60) return `${min} minuto${min > 1 ? 's' : ''}`;

  const hours = Math.floor(min / 60);
  if (hours < 24) return `${hours} hora${hours > 1 ? 's' : ''}`;

  const days = Math.floor(hours / 24);
  return `${days} dia${days > 1 ? 's' : ''}`;
}
