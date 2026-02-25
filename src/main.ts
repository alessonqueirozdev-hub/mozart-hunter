import { NOTES, GW, GH, MOZART_X, MOZART_Y } from './constants';
import { G, resetState, setBestScore, bestScore } from './state/gameState';
import { drawStaff } from './graphics/staff';
import { drawMozart, getMozartBatonTip, triggerMozartShoot } from './graphics/mozart';
import { Monster } from './entities/Monster';
import { PlayerProjectile, MonsterProjectile } from './entities/Projectiles';
import { FloatText } from './entities/FloatText';
import { burst, noteExplosion, mozartHitEffect } from './entities/Particle';
import {
  updateHUD,
  showWaveAnnounce,
  triggerDanger,
  triggerHitFlash,
  triggerPerfect,
  showStartOverlay,
  showGameOverOverlay,
  setStartOverlayResumeStatus,
} from './ui/hud';
import { createButtons, setButtonResult, setButtonActive, clearButtons } from './ui/buttons';
import { initInputHandlers } from './input';
import type { ClefType } from './types';
import {
  piano,
  errorSound,
  hitSound,
  comboSound,
  gameOverSound,
  levelUpSound,
  whooshSound,
  monsterShootSound,
} from './audio/engine';
import {
  computeRampRatio,
  getLevelConfig,
  getUnlockedNoteIndices,
  LAST_LEVEL_INDEX,
  clampLevelIndex,
} from './progression';
import { browserProgressStore, formatElapsedSince } from './state/progressStore';

const gc = (document.getElementById('gc') as HTMLCanvasElement).getContext('2d')!;
const sc = (document.getElementById('sc') as HTMLCanvasElement).getContext('2d')!;

function isMobileViewport(): boolean {
  return window.matchMedia('(max-width: 1024px)').matches;
}

function isPortrait(): boolean {
  return window.matchMedia('(orientation: portrait)').matches;
}

function updateLandscapeRequirement(): void {
  const mustRotate = isMobileViewport() && isPortrait();
  document.body.classList.toggle('require-landscape', mustRotate);
}

async function tryLockLandscape(): Promise<void> {
  const orientationApi = screen.orientation as ScreenOrientation & {
    lock?: (orientation: 'landscape' | 'landscape-primary' | 'landscape-secondary') => Promise<void>;
  };
  if (!isMobileViewport()) return;
  if (!orientationApi?.lock) return;
  try {
    await orientationApi.lock('landscape');
  } catch {
    // Alguns navegadores bloqueiam lock fora de fullscreen ou sem gesto.
  }
}

const DAY_CYCLE_SECONDS = 110;
const HORIZON_Y = GH * 0.67;

function smoothstep(v: number): number {
  return v * v * (3 - 2 * v);
}

function clamp01(v: number): number {
  return Math.max(0, Math.min(1, v));
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

type ColorTriplet = [number, number, number];

function mixColor(a: ColorTriplet, b: ColorTriplet, t: number): ColorTriplet {
  return [
    Math.round(lerp(a[0], b[0], t)),
    Math.round(lerp(a[1], b[1], t)),
    Math.round(lerp(a[2], b[2], t)),
  ];
}

function rgba(color: ColorTriplet, alpha: number): string {
  return `rgba(${color[0]},${color[1]},${color[2]},${alpha})`;
}

function drawCelestialBody(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
  coreColor: string,
  auraColor: string,
  alpha: number,
): void {
  if (alpha <= 0) return;
  ctx.save();
  ctx.globalAlpha = alpha;

  const aura = ctx.createRadialGradient(x, y, 0, x, y, radius * 4);
  aura.addColorStop(0, auraColor);
  aura.addColorStop(0.5, auraColor);
  aura.addColorStop(1, 'transparent');
  ctx.fillStyle = aura;
  ctx.fillRect(x - radius * 4, y - radius * 4, radius * 8, radius * 8);

  const core = ctx.createRadialGradient(x, y, 2, x, y, radius);
  core.addColorStop(0, '#ffffff');
  core.addColorStop(0.35, coreColor);
  core.addColorStop(1, 'transparent');
  ctx.fillStyle = core;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

function drawClassicalClouds(ctx: CanvasRenderingContext2D, daylight: number): void {
  const cloudAlphaScale = 0.18 + daylight * 0.52;
  G.clouds.forEach(c => {
    const base = Math.min(1, c.alpha * 9 * cloudAlphaScale);
    ctx.fillStyle = `rgba(244,246,255,${base})`;
    ctx.beginPath();
    ctx.ellipse(c.x, c.y, c.w * 0.85, c.h * 0.72, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = `rgba(255,255,255,${base * 0.58})`;
    ctx.beginPath();
    ctx.ellipse(c.x - c.w * 0.15, c.y - c.h * 0.2, c.w * 0.42, c.h * 0.46, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.beginPath();
    ctx.ellipse(c.x + c.w * 0.2, c.y - c.h * 0.18, c.w * 0.38, c.h * 0.4, 0, 0, Math.PI * 2);
    ctx.fill();
  });
}

function drawMoonBody(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
  alpha: number,
  cycleT: number,
): void {
  if (alpha <= 0) return;
  ctx.save();
  ctx.globalAlpha = alpha;

  const aura = ctx.createRadialGradient(x, y, 0, x, y, radius * 4.2);
  aura.addColorStop(0, 'rgba(168,196,255,0.32)');
  aura.addColorStop(1, 'transparent');
  ctx.fillStyle = aura;
  ctx.fillRect(x - radius * 5, y - radius * 5, radius * 10, radius * 10);

  const moon = ctx.createRadialGradient(x - radius * 0.25, y - radius * 0.35, 1, x, y, radius);
  moon.addColorStop(0, 'rgba(246,250,255,0.98)');
  moon.addColorStop(1, 'rgba(190,212,250,0.95)');
  ctx.fillStyle = moon;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fill();

  // Crateras suaves para destacar movimento da lua.
  ctx.fillStyle = 'rgba(130,160,210,0.28)';
  const craters = [
    { ox: -0.32, oy: -0.14, r: 0.15 },
    { ox: 0.22, oy: -0.06, r: 0.11 },
    { ox: -0.08, oy: 0.21, r: 0.13 },
  ];
  craters.forEach(c => {
    ctx.beginPath();
    ctx.arc(x + radius * c.ox, y + radius * c.oy, radius * c.r, 0, Math.PI * 2);
    ctx.fill();
  });

  // Fase lunar variando com o ciclo.
  const phase = Math.cos(cycleT * Math.PI * 2);
  const shadowOffset = phase * radius * 0.65;
  ctx.globalCompositeOperation = 'multiply';
  ctx.fillStyle = 'rgba(20,26,48,0.55)';
  ctx.beginPath();
  ctx.arc(x + shadowOffset, y, radius * 0.98, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

function drawBaroqueCastle(ctx: CanvasRenderingContext2D, daylight: number, night: number): void {
  const baseY = GH * 0.68;
  const farColor = rgba(mixColor([26, 24, 52], [94, 106, 140], daylight), 0.86 + night * 0.08);
  const nearColor = rgba(mixColor([20, 16, 40], [70, 78, 112], daylight), 0.95);
  const trimColor = rgba(mixColor([160, 140, 110], [236, 224, 190], daylight), 0.45);

  ctx.save();
  ctx.fillStyle = farColor;
  const farTowers = [
    { x: 40, w: 78, h: 110, dome: 30 },
    { x: 164, w: 96, h: 86, dome: 18 },
    { x: 300, w: 88, h: 118, dome: 34 },
    { x: 426, w: 106, h: 90, dome: 22 },
    { x: 576, w: 86, h: 114, dome: 32 },
    { x: 702, w: 100, h: 92, dome: 22 },
    { x: 836, w: 84, h: 104, dome: 28 },
  ];
  farTowers.forEach(t => {
    ctx.fillRect(t.x, baseY - t.h, t.w, t.h);
    ctx.beginPath();
    ctx.moveTo(t.x + t.w * 0.2, baseY - t.h);
    ctx.lineTo(t.x + t.w * 0.8, baseY - t.h);
    ctx.lineTo(t.x + t.w * 0.5, baseY - t.h - t.dome);
    ctx.closePath();
    ctx.fill();
  });
  ctx.restore();

  ctx.save();
  ctx.fillStyle = nearColor;
  const bodyY = GH * 0.76;
  ctx.fillRect(0, bodyY - 74, GW, 74);

  const bastions = [
    { x: 66, w: 138, h: 126 },
    { x: 252, w: 176, h: 112 },
    { x: 472, w: 188, h: 120 },
    { x: 706, w: 168, h: 116 },
  ];
  bastions.forEach(b => {
    ctx.fillRect(b.x, bodyY - b.h, b.w, b.h);
    const cx = b.x + b.w * 0.5;
    ctx.beginPath();
    ctx.moveTo(cx - 22, bodyY - b.h);
    ctx.lineTo(cx + 22, bodyY - b.h);
    ctx.lineTo(cx + 22, bodyY - b.h - 62);
    ctx.lineTo(cx, bodyY - b.h - 76);
    ctx.lineTo(cx - 22, bodyY - b.h - 62);
    ctx.closePath();
    ctx.fill();
  });

  ctx.strokeStyle = trimColor;
  ctx.lineWidth = 1.3;
  ctx.beginPath();
  ctx.moveTo(0, bodyY - 74.5);
  ctx.lineTo(GW, bodyY - 74.5);
  ctx.stroke();

  // Arcadas barrocas
  ctx.fillStyle = rgba([12, 10, 24], 0.72);
  for (let i = 0; i < 22; i++) {
    const ax = 12 + i * 43;
    const ay = bodyY;
    ctx.beginPath();
    ctx.moveTo(ax, ay);
    ctx.lineTo(ax + 26, ay);
    ctx.lineTo(ax + 26, ay - 22);
    ctx.arc(ax + 13, ay - 22, 13, 0, Math.PI, true);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
}

function drawCobblestoneGround(ctx: CanvasRenderingContext2D, daylight: number, night: number): void {
  const yStart = HORIZON_Y + 6;
  const yEnd = GH;
  const baseColor = mixColor([36, 30, 46], [142, 128, 116], daylight);
  const edgeColor = mixColor([20, 18, 30], [96, 90, 86], daylight);

  const floorGrad = ctx.createLinearGradient(0, yStart, 0, yEnd);
  floorGrad.addColorStop(0, rgba(baseColor, 0.78 + night * 0.12));
  floorGrad.addColorStop(1, rgba(edgeColor, 0.95));
  ctx.fillStyle = floorGrad;
  ctx.fillRect(0, yStart, GW, yEnd - yStart);

  // Linhas de perspectiva do calcamento.
  ctx.strokeStyle = rgba(mixColor([18, 16, 28], [108, 102, 94], daylight), 0.34);
  ctx.lineWidth = 1;
  for (let i = -12; i <= 12; i++) {
    const xBottom = GW * 0.5 + i * 48;
    ctx.beginPath();
    ctx.moveTo(xBottom, GH);
    ctx.lineTo(GW * 0.5 + i * 8, yStart);
    ctx.stroke();
  }

  // Fileiras de paralelepipedos.
  let y = yStart;
  let row = 0;
  while (y < yEnd) {
    const t = (y - yStart) / (yEnd - yStart);
    const rowH = 6 + t * 12;
    const halfWidth = 70 + t * (GW * 0.52);
    const left = GW * 0.5 - halfWidth;
    const right = GW * 0.5 + halfWidth;
    const cols = Math.max(8, Math.floor((right - left) / (16 + t * 24)));
    const cellW = (right - left) / cols;

    for (let c = 0; c < cols; c++) {
      const x = left + c * cellW;
      const seed = Math.sin((row + 1) * 91.2 + c * 37.7) * 43758.5453;
      const noise = seed - Math.floor(seed);
      const stoneColor = mixColor(
        [Math.round(baseColor[0] * 0.72), Math.round(baseColor[1] * 0.72), Math.round(baseColor[2] * 0.72)],
        [Math.round(baseColor[0] * 1.15), Math.round(baseColor[1] * 1.15), Math.round(baseColor[2] * 1.12)],
        noise,
      );
      ctx.fillStyle = rgba(stoneColor, 0.52);
      ctx.fillRect(x + 0.6, y + 0.6, Math.max(1, cellW - 1.2), Math.max(1, rowH - 1.2));
    }

    y += rowH;
    row++;
  }
}

const progressCache = browserProgressStore.load();
const initialResumeLevelIndex = clampLevelIndex(progressCache?.levelIndex ?? 0);
const initialResumeChampion = progressCache?.champion ?? false;
const resumeMessage = progressCache
  ? `Progresso carregado: estagio salvo ha ${formatElapsedSince(progressCache.savedAt)}.`
  : 'Sem progresso salvo no navegador.';
setStartOverlayResumeStatus(resumeMessage);

let nextAutoSaveTs = 0;

function resolveInitialClef(): ClefType {
  const raw = new URLSearchParams(window.location.search).get('clef')?.toLowerCase();
  if (!raw) return 'treble';
  if (raw === 'bass' || raw === 'fa') return 'bass';
  if (raw === 'alto' || raw === 'do') return 'alto';
  if (raw === 'tenor') return 'tenor';
  return 'treble';
}

function saveProgressSnapshot(): void {
  browserProgressStore.save({
    levelIndex: G.levelIndex,
    champion: G.champion,
    savedAt: Date.now(),
  });
}

function applyLevelState(levelIndex: number, announce = false): void {
  const cfg = getLevelConfig(levelIndex);
  G.levelIndex = levelIndex;
  G.stage = cfg.stage;
  G.stageLevel = cfg.stageLevel;
  G.wave = cfg.stage;
  G.phase = cfg.id - 1;
  G.unlockedNoteCount = cfg.unlockedNotes;
  G.availableNoteIndices = getUnlockedNoteIndices(cfg.unlockedNotes);
  G.backgroundId = cfg.backgroundId;

  G.difficulty.monsterSpeed = cfg.monsterSpeed;
  G.difficulty.projectileSpeed = cfg.projectileSpeed;
  G.difficulty.fireRate = cfg.fireRate;
  G.difficulty.spawnDelay = cfg.spawnDelay;

  G.timerMax = Math.max(260, 700 - cfg.id * 22);
  if (cfg.unlockedNotes <= 8) {
    G.timerMax = Math.max(G.timerMax, 620);
  }
  G.timerLeft = G.timerMax;
  G.levelElapsedMs = 0;

  createButtons(G.availableNoteIndices, handleInput);

  if (G.currentNote && !G.availableNoteIndices.includes(NOTES.indexOf(G.currentNote))) {
    G.currentNote = null;
  }

  if (announce) {
    showWaveAnnounce();
    burst(GW / 2, GH * 0.23, '#ffffff', 34, { spd: 10, r: 6 });
  }
}

function nextNote(): void {
  const noteIdx = G.availableNoteIndices[Math.floor(Math.random() * G.availableNoteIndices.length)] ?? 0;
  G.currentNote = NOTES[noteIdx];
  G.staffAnim = 1;
  G.timerLeft = G.timerMax;

  const display = document.getElementById('note-name-display')!;
  display.textContent = '';
  display.className = 'note-name-display';

  // Render imediato da nova nota para evitar atraso visual entre disparos.
  drawStaff(sc, 960, G.staffAnim, G.currentNote, G.clef);
}

function handleInput(idx: number): void {
  if (!G.availableNoteIndices.includes(idx)) return;
  if (!G.running || G.waitAns || !G.monster || G.monster.dying || !G.currentNote) return;

  const targetIdx = NOTES.indexOf(G.currentNote);
  setButtonActive(idx);

  if (idx === targetIdx) {
    handleCorrectAnswer(idx);
  } else {
    handleWrongAnswer(idx, targetIdx);
  }
}

function handleCorrectAnswer(idx: number): void {
  hitSound();
  G.streak++;

  const isPerfect = G.streak % 5 === 0;
  if (isPerfect) {
    G.combo++;
    comboSound(G.combo);
    triggerPerfect();
  }

  const pts = 10 * (1 + G.combo);
  G.score += pts;
  G.floats.push(new FloatText(MOZART_X + 30, MOZART_Y - 25, `+${pts}`, '#44ee88', 24));

  const display = document.getElementById('note-name-display')!;
  if (G.combo > 1) {
    display.innerHTML = `CORRETO! <span style="color:#ffcc00">COMBO x${G.combo}</span>`;
  } else {
    display.innerHTML = `CORRETO: <span style="color:#44aaee">${G.currentNote!.name}</span>`;
  }
  display.className = 'note-name-display success';

  setButtonResult(idx, 'correct');
  piano(NOTES[idx].freq);

  triggerMozartShoot();
  const tip = getMozartBatonTip();
  const burstCount =
    G.unlockedNoteCount >= 12 ? 3
    : G.unlockedNoteCount >= 9 ? 2
    : 1;

  for (let shot = 0; shot < burstCount; shot++) {
    const offsetY = burstCount === 1 ? 0 : (shot - (burstCount - 1) / 2) * 8;
    setTimeout(() => {
      if (!G.running || !G.monster || G.monster.dying) return;
      G.playerProjectiles.push(
        new PlayerProjectile(G.monster.x, G.monster.y, NOTES[idx].freq, tip.x, tip.y + offsetY),
      );
    }, shot * 45);
  }

  nextNote();
}

function handleWrongAnswer(idx: number, targetIdx: number): void {
  errorSound();
  G.waitAns = true;
  G.timerRunning = false;
  G.streak = 0;
  G.combo = 0;

  const display = document.getElementById('note-name-display')!;
  display.innerHTML = `ERROU! Era <span style="color:#ff4444">${G.currentNote!.name}</span>`;
  display.className = 'note-name-display fail';

  setButtonResult(idx, 'wrong');
  setTimeout(() => setButtonResult(targetIdx, 'correct'), 150);

  burst(MOZART_X + 15, MOZART_Y, '#ffbbbb', 12, { spd: 5 });
  applyShake(6);

  setTimeout(() => {
    clearButtons();
    nextNote();
    G.waitAns = false;
    G.timerRunning = true;
  }, 1200);
}

function handleTimerExpired(): void {
  G.timerRunning = false;
  G.waitAns = true;

  const noteIndex = G.currentNote ? NOTES.indexOf(G.currentNote) : -1;
  if (noteIndex >= 0) setButtonResult(noteIndex, 'miss');

  const display = document.getElementById('note-name-display')!;
  display.innerHTML = `Tempo esgotado! A nota era: <span style="color:#ffcc00">${G.currentNote!.name}</span>`;
  display.className = 'note-name-display fail';

  errorSound();
  loseLife();

  setTimeout(() => {
    clearButtons();
    nextNote();
    G.waitAns = false;
    G.timerRunning = true;
  }, 1200);
}

function applyShake(power: number): void {
  G.shake.pow = power;
  G.shake.x = (Math.random() - 0.5) * power;
  G.shake.y = (Math.random() - 0.5) * power;
}

function updateShake(): void {
  if (G.shake.pow <= 0) {
    G.shake.x = 0;
    G.shake.y = 0;
    return;
  }
  G.shake.pow *= 0.85;
  if (G.shake.pow < 0.5) {
    G.shake.x = 0;
    G.shake.y = 0;
    G.shake.pow = 0;
    return;
  }
  G.shake.x = (Math.random() - 0.5) * G.shake.pow;
  G.shake.y = (Math.random() - 0.5) * G.shake.pow;
}

function tryAdvanceLevel(): void {
  if (G.champion) return;
  if (G.levelElapsedMs < getLevelConfig(G.levelIndex).durationMs) return;

  if (G.levelIndex >= LAST_LEVEL_INDEX) {
    G.champion = true;
    G.floats.push(new FloatText(GW / 2, GH * 0.18, 'CAMPEAO DA HARMONIA!', '#88ff66', 34));
    showWaveAnnounce();
    saveProgressSnapshot();
    return;
  }

  levelUpSound();
  applyLevelState(G.levelIndex + 1, true);
  G.spawnDelay = G.difficulty.spawnDelay;
  saveProgressSnapshot();
}

function processHits(): void {
  const interceptRadius = G.difficulty.projectileSpeed > 1.7 ? 56 : 50;
  const INTERCEPT_R2 = interceptRadius * interceptRadius;

  for (let pi = G.playerProjectiles.length - 1; pi >= 0; pi--) {
    const pp = G.playerProjectiles[pi];
    if (!pp.alive) continue;

    for (let mi = G.monsterProjectiles.length - 1; mi >= 0; mi--) {
      const mp = G.monsterProjectiles[mi];
      if (!mp.alive) continue;

      const dx = pp.x - mp.x;
      const dy = pp.y - mp.y;

      if (dx * dx + dy * dy < INTERCEPT_R2) {
        pp.alive = false;
        mp.alive = false;
        noteExplosion(mp.x, mp.y);
        G.score += 5;
        G.floats.push(new FloatText(mp.x, mp.y, '+5 INTERCEPTADO!', '#aaddff', 18));
        break;
      }
    }
  }

  if (G.monster && !G.monster.dying) {
    for (const p of G.playerProjectiles) {
      if (!p.alive) continue;
      const dx = p.x - G.monster.x;
      const dy = p.y - G.monster.y;
      if (dx * dx + dy * dy < 72 * 72) {
        p.alive = false;
        noteExplosion(p.x, p.y);

        const killed = G.monster.takeDamage();
        if (killed) {
          whooshSound();
          G.floats.push(new FloatText(G.monster.x, G.monster.y - 40, 'DESTRUIDO!', '#ffaa00', 26));
          triggerDanger();
          applyShake(12);
        }
      }
    }
  }

  const MONSTER_CONTACT_X = MOZART_X + 95;
  if (G.monster && !G.monster.dying && G.monster.x <= MONSTER_CONTACT_X) {
    loseLife();
    G.monster.die();
  }
}

function loseLife(): void {
  triggerHitFlash();
  G.lives--;
  G.streak = 0;
  G.combo = 0;
  errorSound();
  mozartHitEffect(MOZART_X + 15, MOZART_Y);
  applyShake(10);

  if (G.lives <= 0) {
    G.running = false;
    gameOverSound();
    clearButtons();
    saveProgressSnapshot();
    setTimeout(() => showGameOverOverlay(startGame), 1500);
  }
}

function updateDrawAlive(
  ctx: CanvasRenderingContext2D,
  arr: Array<{ alive: boolean; update(): unknown; draw(ctx: CanvasRenderingContext2D): void }>,
  onHit?: () => void,
): void {
  for (let i = arr.length - 1; i >= 0; i--) {
    const e = arr[i];
    if (!e.alive) {
      arr.splice(i, 1);
      continue;
    }

    const result = e.update();
    if (result === 'hit' && onHit) onHit();

    if (!e.alive) {
      arr.splice(i, 1);
      continue;
    }
    e.draw(ctx);
  }
}

function updateDrawLive(
  ctx: CanvasRenderingContext2D,
  arr: Array<{ life: number; update(): void; draw(ctx: CanvasRenderingContext2D): void }>,
): void {
  for (let i = arr.length - 1; i >= 0; i--) {
    const e = arr[i];
    e.update();
    if (e.life <= 0) {
      arr.splice(i, 1);
      continue;
    }
    e.draw(ctx);
  }
}

function drawStageAtmosphere(ctx: CanvasRenderingContext2D): void {
  const cycleT = ((G.totalElapsedMs / 1000) % DAY_CYCLE_SECONDS) / DAY_CYCLE_SECONDS;
  const orbitAngle = cycleT * Math.PI * 2 - Math.PI * 0.5;

  // Sol sobe no amanhecer, cruza o ceu e se poe; lua faz o inverso.
  const sunX = lerp(-GW * 0.14, GW * 1.14, cycleT);
  const sunY = HORIZON_Y - Math.sin(orbitAngle) * GH * 0.63;
  const sunHeight = clamp01((HORIZON_Y - sunY) / (GH * 0.62));
  const dayLight = smoothstep(sunHeight);

  const moonX = lerp(GW * 1.14, -GW * 0.14, cycleT);
  const moonY = HORIZON_Y - Math.sin(orbitAngle + Math.PI) * GH * 0.58;
  const moonHeight = clamp01((HORIZON_Y - moonY) / (GH * 0.58));
  const moonLight = smoothstep(moonHeight) * (0.2 + (1 - dayLight * 0.8));

  const dawn = clamp01(1 - Math.abs(cycleT - 0.02) / 0.11);
  const dusk = clamp01(1 - Math.abs(cycleT - 0.52) / 0.12);
  const twilight = Math.max(dawn, dusk);
  const night = clamp01(1 - dayLight);

  ctx.save();
  const skyTop = mixColor([11, 14, 34], [116, 184, 246], dayLight);
  const skyBottom = mixColor([34, 20, 48], [238, 203, 163], twilight * 0.7 + dayLight * 0.3);
  const skyGrad = ctx.createLinearGradient(0, 0, 0, GH * 0.84);
  skyGrad.addColorStop(0, rgba(skyTop, 1));
  skyGrad.addColorStop(1, rgba(skyBottom, 1));
  ctx.fillStyle = skyGrad;
  ctx.fillRect(0, 0, GW, GH);
  ctx.restore();

  const starVisibility = clamp01(0.04 + night * 1.08 + moonLight * 0.16 - dayLight * 0.24);
  ctx.save();
  G.stars.forEach(s => {
    ctx.globalAlpha = (Math.sin(s.t) * 0.5 + 0.5) * s.a * starVisibility;
    ctx.fillStyle = `hsl(${206 + Math.sin(s.t) * 18},78%,88%)`;
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.restore();

  drawClassicalClouds(ctx, dayLight);

  // Disco solar e lunar com orbitas opostas.
  drawCelestialBody(
    ctx,
    sunX,
    sunY,
    34 + dayLight * 10,
    'rgba(255,235,170,0.98)',
    `rgba(255,188,120,${0.22 + dayLight * 0.22})`,
    dayLight,
  );
  drawMoonBody(ctx, moonX, moonY, 25 + moonLight * 10, Math.min(1, moonLight + 0.14), cycleT);

  // Horizonte aquece no amanhecer/entardecer.
  if (twilight > 0.01) {
    ctx.save();
    const horizonGlow = ctx.createLinearGradient(0, GH * 0.37, 0, GH * 0.78);
    horizonGlow.addColorStop(0, 'transparent');
    horizonGlow.addColorStop(1, `rgba(255,150,95,${0.1 + twilight * 0.25})`);
    ctx.fillStyle = horizonGlow;
    ctx.fillRect(0, GH * 0.36, GW, GH * 0.42);
    ctx.restore();
  }

  // Clareamento real do mundo durante o dia (sem trocar assets).
  if (dayLight > 0.01) {
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    ctx.fillStyle = `rgba(210,235,255,${0.18 + dayLight * 0.36})`;
    ctx.fillRect(0, 0, GW, GH);
    ctx.restore();
  }

  // Escurecimento progressivo no por do sol e noite.
  if (night > 0.01) {
    ctx.save();
    ctx.fillStyle = `rgba(5,8,20,${0.1 + night * 0.55})`;
    ctx.fillRect(0, 0, GW, GH);
    ctx.restore();
  }

  // Skyline classico permanente (independente de dia/noite).
  drawBaroqueCastle(ctx, dayLight, night);
  drawCobblestoneGround(ctx, dayLight, night);

  if (night > 0.15) {
    ctx.save();
    ctx.fillStyle = `rgba(8,10,20,${0.1 + night * 0.14})`;
    ctx.fillRect(0, GH * 0.62, GW, GH * 0.16);
    ctx.restore();
  }
}

let lastTs = 0;

function loop(ts: number): void {
  const dt = Math.min(ts - lastTs, 50);
  lastTs = ts;

  G.frame++;

  G.stars.forEach(s => (s.t += s.ts));
  G.clouds.forEach(c => {
    c.x -= c.speed;
    if (c.x + c.w < 0) c.x = GW + 20;
  });

  updateShake();

  gc.clearRect(0, 0, GW, GH);
  gc.save();
  gc.translate(G.shake.x, G.shake.y);

  drawStageAtmosphere(gc);

  if (G.running && !document.body.classList.contains('require-landscape')) {
    G.levelElapsedMs += dt;
    G.totalElapsedMs += dt;

    const cfg = getLevelConfig(G.levelIndex);
    const ramp = computeRampRatio(G.levelElapsedMs, cfg.durationMs);
    const learningBand = G.unlockedNoteCount <= 8;
    const speedRamp = learningBand ? ramp * 0.35 : ramp * 0.9;
    const projectileRamp = learningBand ? ramp * 0.42 : ramp;
    const fireRamp = learningBand ? ramp * 0.45 : ramp * 0.95;
    const spawnRamp = learningBand ? ramp * 0.2 : ramp * 0.4;

    G.difficulty.monsterSpeed = cfg.monsterSpeed * (1 + speedRamp);
    G.difficulty.projectileSpeed = cfg.projectileSpeed * (1 + projectileRamp);
    G.difficulty.fireRate = cfg.fireRate * (1 + fireRamp);
    G.difficulty.spawnDelay = Math.max(24, cfg.spawnDelay * (1 - spawnRamp));

    G.staffAnim = G.staffAnim > 0 ? G.staffAnim * 0.85 : Math.min(G.staffAnim + 0.05, 1);

    if (G.timerRunning) {
      const timerPressure = learningBand ? 1 + ramp * 0.12 : 1 + ramp * 0.32;
      G.timerLeft -= 0.8 * timerPressure;
      if (G.timerLeft <= 0) handleTimerExpired();
    }

    if (!G.monster) {
      G.spawnDelay--;
      if (G.spawnDelay <= 0) {
        G.monster = new Monster(G.phase);
        G.timerRunning = true;
      }
    }

    if (G.monster) {
      const event = G.monster.update();

      if (event === 'shoot') {
        monsterShootSound();
        const targetTip = getMozartBatonTip();
        const laneY = targetTip.y;
        const extraWaves = Math.max(0, G.unlockedNoteCount - 8);
        const numProj = Math.min(3, 1 + Math.floor(extraWaves / 3));
        const shotDelay = Math.max(70, Math.floor(200 / Math.max(1, G.difficulty.fireRate)));

        for (let i = 0; i < numProj; i++) {
          setTimeout(() => {
            if (G.monster && !G.monster.dying) {
              const origin = G.monster.getProjectileOrigin(laneY);
              G.monsterProjectiles.push(
                new MonsterProjectile(origin.x, origin.y, G.monster.type, laneY),
              );
            }
          }, i * shotDelay);
        }
      }

      if (G.monster.dying && G.monster.dyingT >= G.monster.dyingDur) {
        G.monster = null;
        G.spawnDelay = G.difficulty.spawnDelay;

        if (G.timerRunning) G.timerLeft = Math.min(G.timerLeft + 100, G.timerMax);
        tryAdvanceLevel();
      }
    }

    processHits();

    updateDrawAlive(gc, G.playerProjectiles);
    if (G.monster) G.monster.draw(gc);
    updateDrawAlive(gc, G.monsterProjectiles, loseLife);
    updateDrawLive(gc, G.particles);
    updateDrawLive(gc, G.floats);

    if (ts >= nextAutoSaveTs) {
      saveProgressSnapshot();
      nextAutoSaveTs = ts + 9000;
    }

    updateHUD();
    drawStaff(sc, 960, G.staffAnim, G.currentNote, G.clef);
  }

  drawMozart(gc, MOZART_X, MOZART_Y, G.monster?.dangerRatio ?? 0, G.monster?.hitFlash ?? 0, G.frame);

  gc.restore();
  requestAnimationFrame(loop);
}

function startGame(): void {
  if (G.score > G.sessionBest) {
    G.sessionBest = G.score;
    if (G.score > bestScore) setBestScore(G.score);
  }

  resetState();
  G.clef = resolveInitialClef();
  G.running = true;
  G.waitAns = false;
  G.timerRunning = false;

  const latestProgress = browserProgressStore.load();
  const resumeLevel = clampLevelIndex(latestProgress?.levelIndex ?? initialResumeLevelIndex);
  G.champion = latestProgress?.champion ?? initialResumeChampion;

  applyLevelState(resumeLevel, true);
  G.spawnDelay = G.difficulty.spawnDelay;

  clearButtons();
  nextNote();
  updateHUD();
  void tryLockLandscape();
}

window.addEventListener('beforeunload', () => {
  saveProgressSnapshot();
});

createButtons([0, 1], handleInput);
initInputHandlers(handleInput);
updateHUD();
showStartOverlay(startGame);
updateLandscapeRequirement();

window.addEventListener('resize', updateLandscapeRequirement);
window.addEventListener('orientationchange', updateLandscapeRequirement);

requestAnimationFrame(ts => {
  lastTs = ts;
  loop(ts);
});
