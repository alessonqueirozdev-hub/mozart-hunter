import type { GameState, Star, Cloud, Torch } from '../types';
import { GW, GH } from '../constants';

// ─── Scene generators ────────────────────────────────────────────────────────

function genStars(): Star[] {
  return Array.from({ length: 220 }, () => ({
    x: Math.random() * GW,
    y: Math.random() * GH * 0.72,
    r: Math.random() * 1.6 + 0.28,
    a: Math.random() * 0.72 + 0.2,
    t: Math.random() * Math.PI * 2,
    ts: Math.random() * 0.035 + 0.008,
  }));
}

function genClouds(): Cloud[] {
  return Array.from({ length: 7 }, (_, i) => ({
    x: i * 155 + Math.random() * 70,
    y: 12 + Math.random() * 60,
    w: 110 + Math.random() * 100,
    h: 22 + Math.random() * 20,
    speed: 0.055 + Math.random() * 0.045,
    alpha: 0.04 + Math.random() * 0.038,
  }));
}

function genTorches(): Torch[] {
  const positions = [GW * 0.12, GW * 0.3, GW * 0.55, GW * 0.72, GW * 0.9];
  return positions.map(x => ({
    x,
    y: GH * 0.62,
    flicker: Math.random() * Math.PI * 2,
    flickerSpeed: 0.08 + Math.random() * 0.06,
    size: 1,
  }));
}

// ─── Estado inicial como factory ─────────────────────────────────────────────
// Usar uma factory em vez de duplicar os valores em resetState()
// garante que adicionar um campo novo só precisa ser feito aqui.

function createInitialState(): GameState {
  return {
    lives: 5,
    score: 0,
    wave: 1,
    phase: 0,
    combo: 0,
    streak: 0,
    sessionBest: 0,
    running: false,
    waitAns: false,
    monster: null,
    playerProjectiles: [],
    monsterProjectiles: [],
    particles: [],
    floats: [],
    shake: { x: 0, y: 0, pow: 0 },
    spawnDelay: 0,
    currentNote: null,
    staffAnim: 0,
    bgScroll: 0,
    frame: 0,
    timerMax: 700,
    timerLeft: 700,
    timerRunning: false,
    stars: genStars(),
    clouds: genClouds(),
    torches: genTorches(),
  };
}

// Estado global mutável — exportado para acesso direto pelos sistemas
export const G: GameState = createInitialState();

/**
 * Restaura todo o estado para os valores iniciais.
 * Preserva `sessionBest` antes de resetar para compará-lo depois.
 */
export function resetState(): void {
  const prevSessionBest = G.sessionBest;
  Object.assign(G, createInitialState());
  // sessionBest sobrevive entre partidas dentro da mesma sessão
  G.sessionBest = prevSessionBest;
}

// ─── High score persistido ────────────────────────────────────────────────────

export let bestScore = parseInt(localStorage.getItem('mz_best') ?? '0', 10);

export function setBestScore(score: number): void {
  bestScore = score;
  localStorage.setItem('mz_best', score.toString());
}