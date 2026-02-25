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

const DAY_CYCLE_SECONDS = 220;
const HORIZON_Y = GH * 0.67;
const ART = {
  skyNightTop: [12, 16, 36] as ColorTriplet,
  skyDayTop: [128, 182, 228] as ColorTriplet,
  skyNightBottom: [40, 26, 54] as ColorTriplet,
  skyWarmBottom: [224, 188, 146] as ColorTriplet,
  starBase: [221, 224, 234] as ColorTriplet,
  cloudBase: [236, 238, 244] as ColorTriplet,
  fogBase: [176, 182, 196] as ColorTriplet,
  castleFarNight: [30, 28, 50] as ColorTriplet,
  castleFarDay: [112, 116, 134] as ColorTriplet,
  castleNearNight: [24, 20, 42] as ColorTriplet,
  castleNearDay: [84, 86, 106] as ColorTriplet,
  trimNight: [148, 126, 98] as ColorTriplet,
  trimDay: [216, 200, 170] as ColorTriplet,
  groundBaseNight: [44, 38, 52] as ColorTriplet,
  groundBaseDay: [136, 122, 104] as ColorTriplet,
  groundEdgeNight: [26, 24, 36] as ColorTriplet,
  groundEdgeDay: [94, 88, 80] as ColorTriplet,
  moonCore: [238, 240, 248] as ColorTriplet,
  moonEdge: [186, 192, 208] as ColorTriplet,
  sunCore: [252, 230, 186] as ColorTriplet,
  sunAura: [224, 170, 112] as ColorTriplet,
} as const;

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
    ctx.fillStyle = rgba(ART.cloudBase, base);
    ctx.beginPath();
    ctx.ellipse(c.x, c.y, c.w * 0.85, c.h * 0.72, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = rgba([255, 255, 255], base * 0.58);
    ctx.beginPath();
    ctx.ellipse(c.x - c.w * 0.15, c.y - c.h * 0.2, c.w * 0.42, c.h * 0.46, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.beginPath();
    ctx.ellipse(c.x + c.w * 0.2, c.y - c.h * 0.18, c.w * 0.38, c.h * 0.4, 0, 0, Math.PI * 2);
    ctx.fill();
  });
}

function drawAtmosphericFog(
  ctx: CanvasRenderingContext2D,
  daylight: number,
  night: number,
  timeSec: number,
): void {
  const baseAlpha = 0.08 + night * 0.1 + (1 - daylight) * 0.06;

  for (let layer = 0; layer < 2; layer++) {
    const phase = timeSec * (0.03 + layer * 0.018);
    const drift = Math.sin(phase) * (40 + layer * 25);
    const y = GH * (0.5 + layer * 0.16);
    const h = GH * (0.12 + layer * 0.05);

    const grad = ctx.createLinearGradient(0, y, 0, y + h);
    grad.addColorStop(0, 'transparent');
    grad.addColorStop(0.45, rgba(ART.fogBase, baseAlpha * (1 - layer * 0.2)));
    grad.addColorStop(1, 'transparent');
    ctx.fillStyle = grad;
    ctx.fillRect(-80 + drift, y, GW + 160, h);
  }
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
  aura.addColorStop(0, rgba(ART.moonEdge, 0.32));
  aura.addColorStop(1, 'transparent');
  ctx.fillStyle = aura;
  ctx.fillRect(x - radius * 5, y - radius * 5, radius * 10, radius * 10);

  const moon = ctx.createRadialGradient(x - radius * 0.25, y - radius * 0.35, 1, x, y, radius);
  moon.addColorStop(0, rgba(ART.moonCore, 0.98));
  moon.addColorStop(1, rgba(ART.moonEdge, 0.95));
  ctx.fillStyle = moon;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fill();

  // Crateras suaves para destacar movimento da lua.
  ctx.fillStyle = rgba([124, 134, 158], 0.3);
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
  ctx.fillStyle = rgba(ART.skyNightTop, 0.55);
  ctx.beginPath();
  ctx.arc(x + shadowOffset, y, radius * 0.98, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

function drawBaroqueCastle(ctx: CanvasRenderingContext2D, daylight: number, night: number): void {
  const baseY = GH * 0.68;
  // Castelo com mesma familia cromatica acinzentada do calcamento.
  const stoneBase = mixColor(ART.groundBaseNight, ART.groundBaseDay, daylight);
  const farStone = mixColor(
    [Math.round(stoneBase[0] * 0.82), Math.round(stoneBase[1] * 0.82), Math.round(stoneBase[2] * 0.82)],
    [Math.round(stoneBase[0] * 0.9), Math.round(stoneBase[1] * 0.9), Math.round(stoneBase[2] * 0.9)],
    night * 0.4,
  );
  const nearStone = mixColor(
    [Math.round(stoneBase[0] * 0.94), Math.round(stoneBase[1] * 0.94), Math.round(stoneBase[2] * 0.94)],
    stoneBase,
    daylight,
  );
  const farColor = rgba(farStone, 0.88 + night * 0.08);
  const nearColor = rgba(nearStone, 0.96);
  const trimColor = rgba(mixColor([110, 102, 92], [168, 156, 138], daylight), 0.42);
  const stoneLine = rgba(mixColor([56, 50, 46], [112, 104, 92], daylight), 0.44 + night * 0.07);

  const drawStoneBlocks = (x: number, y: number, w: number, h: number, rowH = 14) => {
    ctx.strokeStyle = stoneLine;
    ctx.lineWidth = 0.8;
    let ry = y;
    let row = 0;
    while (ry < y + h - 2) {
      const rh = Math.min(rowH, y + h - ry);
      const cols = Math.max(3, Math.floor(w / (26 + (row % 2) * 4)));
      const cw = w / cols;
      for (let c = 0; c < cols; c++) {
        const ox = (row % 2) * (cw * 0.35);
        const bx = x + c * cw - ox;
        ctx.strokeRect(bx, ry, cw + 1.2, rh);
      }
      ry += rh;
      row++;
    }
  };

  const drawFlag = (x: number, y: number, size: number, color: ColorTriplet) => {
    ctx.strokeStyle = rgba([44, 34, 22], 0.9);
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x, y - size * 1.5);
    ctx.stroke();

    const flutter = Math.sin(G.frame * 0.06 + x * 0.01) * 0.35;
    ctx.fillStyle = rgba(color, 0.9);
    ctx.beginPath();
    ctx.moveTo(x, y - size * 1.45);
    ctx.lineTo(x + size * (1.2 + flutter), y - size * 1.2);
    ctx.lineTo(x, y - size * 0.95);
    ctx.closePath();
    ctx.fill();
  };

  ctx.save();
  ctx.fillStyle = farColor;
  const farTowers = [
    { x: 42, w: 84, h: 118, roof: 24, flag: [82, 82, 92] as ColorTriplet },
    { x: 174, w: 94, h: 94, roof: 16, flag: [76, 76, 88] as ColorTriplet },
    { x: 320, w: 92, h: 124, roof: 26, flag: [88, 88, 98] as ColorTriplet },
    { x: 454, w: 100, h: 98, roof: 18, flag: [72, 72, 84] as ColorTriplet },
    { x: 602, w: 90, h: 120, roof: 24, flag: [84, 84, 94] as ColorTriplet },
    { x: 732, w: 104, h: 102, roof: 18, flag: [78, 78, 90] as ColorTriplet },
    { x: 858, w: 82, h: 112, roof: 22, flag: [86, 86, 96] as ColorTriplet },
  ];
  farTowers.forEach(t => {
    ctx.fillRect(t.x, baseY - t.h, t.w, t.h);
    drawStoneBlocks(t.x, baseY - t.h, t.w, t.h, 12);
    ctx.beginPath();
    ctx.moveTo(t.x + t.w * 0.16, baseY - t.h);
    ctx.lineTo(t.x + t.w * 0.84, baseY - t.h);
    ctx.lineTo(t.x + t.w * 0.5, baseY - t.h - t.roof);
    ctx.closePath();
    ctx.fill();
    drawFlag(t.x + t.w * 0.5, baseY - t.h - t.roof + 2, 8, t.flag);
  });
  ctx.restore();

  ctx.save();
  ctx.fillStyle = nearColor;
  const bodyY = GH * 0.76;
  ctx.fillRect(0, bodyY - 74, GW, 74);
  drawStoneBlocks(0, bodyY - 74, GW, 74, 13);

  const bastions = [
    { x: 62, w: 148, h: 132, flag: [84, 84, 94] as ColorTriplet },
    { x: 250, w: 182, h: 116, flag: [80, 80, 92] as ColorTriplet },
    { x: 468, w: 194, h: 124, flag: [88, 88, 98] as ColorTriplet },
    { x: 704, w: 174, h: 120, flag: [78, 78, 90] as ColorTriplet },
  ];
  bastions.forEach(b => {
    ctx.fillRect(b.x, bodyY - b.h, b.w, b.h);
    drawStoneBlocks(b.x, bodyY - b.h, b.w, b.h, 14);
    const cx = b.x + b.w * 0.5;
    ctx.beginPath();
    ctx.moveTo(cx - 21, bodyY - b.h);
    ctx.lineTo(cx + 21, bodyY - b.h);
    ctx.lineTo(cx + 21, bodyY - b.h - 64);
    ctx.lineTo(cx, bodyY - b.h - 80);
    ctx.lineTo(cx - 21, bodyY - b.h - 64);
    ctx.closePath();
    ctx.fill();
    drawFlag(cx, bodyY - b.h - 78, 9, b.flag);
  });

  ctx.strokeStyle = trimColor;
  ctx.lineWidth = 1.3;
  ctx.beginPath();
  ctx.moveTo(0, bodyY - 74.5);
  ctx.lineTo(GW, bodyY - 74.5);
  ctx.stroke();

  // Arcadas barrocas
  ctx.fillStyle = rgba(ART.groundEdgeNight, 0.72);
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

  // Poucas janelas, apenas em pontos nobres.
  const windowAlpha = 0.04 + night * 0.34;
  ctx.fillStyle = rgba([255, 214, 146], windowAlpha);
  const windows = [
    { x: 128, y: bodyY - 86 },
    { x: 186, y: bodyY - 94 },
    { x: 320, y: bodyY - 80 },
    { x: 396, y: bodyY - 88 },
    { x: 546, y: bodyY - 92 },
    { x: 626, y: bodyY - 84 },
    { x: 760, y: bodyY - 86 },
    { x: 836, y: bodyY - 90 },
  ];
  windows.forEach(w => ctx.fillRect(w.x, w.y, 5, 7));

  // Ameias para leitura clara de "castelo".
  const crenelY = bodyY - 74;
  ctx.fillStyle = rgba(mixColor([34, 32, 42], [120, 114, 102], daylight), 0.9);
  for (let x = 0; x < GW; x += 22) {
    ctx.fillRect(x, crenelY - 8, 13, 8);
  }
  ctx.restore();
}

function drawCobblestoneGround(
  ctx: CanvasRenderingContext2D,
  daylight: number,
  night: number,
  sunX: number,
  moonX: number,
  moonLight: number,
): void {
  const yStart = HORIZON_Y + 6;
  const yEnd = GH;
  const baseColor = mixColor(ART.groundBaseNight, ART.groundBaseDay, daylight);
  const edgeColor = mixColor(ART.groundEdgeNight, ART.groundEdgeDay, daylight);

  const floorGrad = ctx.createLinearGradient(0, yStart, 0, yEnd);
  floorGrad.addColorStop(0, rgba(baseColor, 0.78 + night * 0.12));
  floorGrad.addColorStop(1, rgba(edgeColor, 0.95));
  ctx.fillStyle = floorGrad;
  ctx.fillRect(0, yStart, GW, yEnd - yStart);

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
      const mortar = rgba(mixColor(ART.groundEdgeNight, ART.groundEdgeDay, daylight), 0.22);
      ctx.fillStyle = mortar;
      ctx.fillRect(x, y, Math.ceil(cellW) + 1, Math.ceil(rowH) + 1);

      ctx.fillStyle = rgba(stoneColor, 0.9);
      ctx.fillRect(x + 0.7, y + 0.7, Math.max(1, Math.ceil(cellW) - 1.4), Math.max(1, Math.ceil(rowH) - 1.4));
    }

    y += rowH;
    row++;
  }

  // Reflexo central no calcamento (sol de dia, lua de noite).
  const reflectedX = daylight > moonLight ? sunX : moonX;
  const lightStrength = Math.max(daylight * 0.55, moonLight * 0.42);
  if (lightStrength > 0.02) {
    const reflGrad = ctx.createRadialGradient(
      reflectedX,
      GH * 0.83,
      6,
      reflectedX,
      GH * 0.84,
      GW * 0.18,
    );
    reflGrad.addColorStop(0, rgba(ART.trimDay, 0.18 * lightStrength));
    reflGrad.addColorStop(0.4, rgba(mixColor(ART.trimNight, ART.trimDay, 0.7), 0.1 * lightStrength));
    reflGrad.addColorStop(1, 'transparent');
    ctx.fillStyle = reflGrad;
    ctx.beginPath();
    ctx.ellipse(reflectedX, GH * 0.86, GW * 0.2, GH * 0.08, 0, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawCastleShadowProjection(
  ctx: CanvasRenderingContext2D,
  daylight: number,
  sunX: number,
): void {
  if (daylight <= 0.08) return;

  const horizon = GH * 0.69;
  const groundY = GH * 0.9;
  const dir = sunX < GW * 0.5 ? 1 : -1;
  const strength = daylight * 0.28;
  const spread = 110 + daylight * 90;

  ctx.save();
  ctx.fillStyle = rgba(ART.groundEdgeNight, strength);
  for (let i = 0; i < 5; i++) {
    const bx = 90 + i * 180;
    ctx.beginPath();
    ctx.moveTo(bx, horizon);
    ctx.lineTo(bx + 110, horizon);
    ctx.lineTo(bx + 110 + dir * spread, groundY);
    ctx.lineTo(bx + dir * spread, groundY);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
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
  const dawnExtended = clamp01(1 - Math.abs(cycleT - 0.05) / 0.17);
  const duskExtended = clamp01(1 - Math.abs(cycleT - 0.55) / 0.17);
  const twilight = Math.max(dawn, dusk);
  const cinematicTwilight = Math.max(dawnExtended, duskExtended);
  const night = clamp01(1 - dayLight);

  ctx.save();
  const skyTop = mixColor(ART.skyNightTop, ART.skyDayTop, dayLight);
  const skyBottom = mixColor(ART.skyNightBottom, ART.skyWarmBottom, cinematicTwilight * 0.72 + dayLight * 0.28);
  const skyGrad = ctx.createLinearGradient(0, 0, 0, GH * 0.84);
  skyGrad.addColorStop(0, rgba(skyTop, 1));
  skyGrad.addColorStop(1, rgba(skyBottom, 1));
  ctx.fillStyle = skyGrad;
  ctx.fillRect(0, 0, GW, GH);
  ctx.restore();

  const starVisibility = clamp01(0.03 + night * 1.15 + moonLight * 0.2 - dayLight * 0.28);
  ctx.save();
  G.stars.forEach(s => {
    ctx.globalAlpha = (Math.sin(s.t) * 0.5 + 0.5) * s.a * starVisibility;
    const sparkle = Math.round(ART.starBase[2] + Math.sin(s.t) * 9);
    ctx.fillStyle = `rgb(${ART.starBase[0]},${ART.starBase[1]},${sparkle})`;
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
    rgba(ART.sunCore, 0.98),
    rgba(ART.sunAura, 0.22 + dayLight * 0.22),
    dayLight,
  );
  drawMoonBody(ctx, moonX, moonY, 25 + moonLight * 10, Math.min(1, moonLight + 0.14), cycleT);

  // Horizonte aquece no amanhecer/entardecer.
  if (twilight > 0.01) {
    ctx.save();
    const horizonGlow = ctx.createLinearGradient(0, GH * 0.37, 0, GH * 0.78);
    horizonGlow.addColorStop(0, 'transparent');
    horizonGlow.addColorStop(1, rgba([214, 152, 118], 0.1 + twilight * 0.25));
    ctx.fillStyle = horizonGlow;
    ctx.fillRect(0, GH * 0.36, GW, GH * 0.42);
    ctx.restore();
  }

  // Neblina atmosférica em duas camadas com movimento suave.
  drawAtmosphericFog(ctx, dayLight, night, G.totalElapsedMs / 1000);

  // Clareamento real do mundo durante o dia (sem trocar assets).
  if (dayLight > 0.01) {
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    ctx.fillStyle = rgba([200, 214, 230], 0.18 + dayLight * 0.36);
    ctx.fillRect(0, 0, GW, GH);
    ctx.restore();
  }

  // Escurecimento progressivo no por do sol e noite.
  if (night > 0.01) {
    ctx.save();
    ctx.fillStyle = rgba(ART.skyNightTop, 0.1 + night * 0.55);
    ctx.fillRect(0, 0, GW, GH);
    ctx.restore();
  }

  // Skyline classico permanente (independente de dia/noite).
  drawBaroqueCastle(ctx, dayLight, night);
  drawCastleShadowProjection(ctx, dayLight, sunX);
  drawCobblestoneGround(ctx, dayLight, night, sunX, moonX, moonLight);

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
