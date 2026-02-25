import type { GameState } from '../types';
import { GW, GH } from '../constants';

function genStars() {
  return Array.from({ length: 220 }, () => ({
    x: Math.random() * GW,
    y: Math.random() * GH * .72,
    r: Math.random() * 1.6 + .28,
    a: Math.random() * .72 + .2,
    t: Math.random() * Math.PI * 2,
    ts: Math.random() * .035 + .008
  }));
}

function genClouds() {
  return Array.from({ length: 7 }, (_, i) => ({
    x: i * 155 + Math.random() * 70,
    y: 12 + Math.random() * 60,
    w: 110 + Math.random() * 100,
    h: 22 + Math.random() * 20,
    speed: .055 + Math.random() * .045,
    alpha: .04 + Math.random() * .038
  }));
}

function genTorches() {
  const positions = [GW * .12, GW * .3, GW * .55, GW * .72, GW * .9];
  return positions.map(x => ({
    x,
    y: GH * .62,
    flicker: Math.random() * Math.PI * 2,
    flickerSpeed: .08 + Math.random() * .06,
    size: 1
  }));
}

export const G: GameState = {
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

export function resetState() {
  G.lives = 5;
  G.score = 0;
  G.wave = 1;
  G.phase = 0;
  G.combo = 0;
  G.streak = 0;
  G.sessionBest = 0;
  G.running = false;
  G.waitAns = false;
  G.monster = null;
  G.playerProjectiles = [];
  G.monsterProjectiles = [];
  G.particles = [];
  G.floats = [];
  G.shake = { x: 0, y: 0, pow: 0 };
  G.spawnDelay = 0;
  G.currentNote = null;
  G.staffAnim = 0;
  G.bgScroll = 0;
  G.frame = 0;
  G.timerMax = 700;
  G.timerLeft = 700;
  G.timerRunning = false;
  G.stars = genStars();
  G.clouds = genClouds();
  G.torches = genTorches();
}

export let bestScore = parseInt(localStorage.getItem('mz_best') || '0');

export function setBestScore(score: number) {
  bestScore = score;
  localStorage.setItem('mz_best', bestScore.toString());
}
