import { NOTES, GW, GH, MOZART_X, MOZART_Y } from './constants';
import { G, resetState, setBestScore, bestScore } from './state/gameState';
import { bgSky, bgCastle, bgFloor, drawTorches } from './graphics/backgrounds';
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

const BG_THEMES = [
  {
    skyTint: 'rgba(40, 20, 70, 0.12)',
    floorTint: 'rgba(70, 30, 80, 0.1)',
    starShift: 0,
  },
  {
    skyTint: 'rgba(20, 55, 90, 0.16)',
    floorTint: 'rgba(20, 80, 110, 0.1)',
    starShift: 25,
  },
  {
    skyTint: 'rgba(80, 25, 25, 0.14)',
    floorTint: 'rgba(120, 40, 20, 0.09)',
    starShift: -35,
  },
  {
    skyTint: 'rgba(45, 75, 30, 0.12)',
    floorTint: 'rgba(35, 90, 45, 0.1)',
    starShift: 50,
  },
] as const;

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
  G.staffAnim = 0;
  G.timerLeft = G.timerMax;

  const display = document.getElementById('note-name-display')!;
  display.textContent = '';
  display.className = 'note-name-display';
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
  G.playerProjectiles.push(
    new PlayerProjectile(G.monster!.x, G.monster!.y, NOTES[idx].freq, tip.x, tip.y),
  );

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
  const theme = BG_THEMES[G.backgroundId % BG_THEMES.length];

  ctx.save();
  ctx.fillStyle = theme.skyTint;
  ctx.fillRect(0, 0, GW, GH * 0.7);

  const floorGrad = ctx.createLinearGradient(0, GH * 0.55, 0, GH);
  floorGrad.addColorStop(0, 'transparent');
  floorGrad.addColorStop(1, theme.floorTint);
  ctx.fillStyle = floorGrad;
  ctx.fillRect(0, GH * 0.45, GW, GH * 0.55);
  ctx.restore();

  ctx.save();
  G.stars.forEach(s => {
    ctx.globalAlpha = (Math.sin(s.t) * 0.5 + 0.5) * s.a;
    ctx.fillStyle = `hsl(${200 + theme.starShift + Math.sin(s.t) * 40},80%,85%)`;
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.restore();
}

let lastTs = 0;

function loop(ts: number): void {
  const dt = Math.min(ts - lastTs, 50);
  lastTs = ts;

  G.frame++;
  G.bgScroll += (dt / 16.6667) * 0.35;

  G.stars.forEach(s => (s.t += s.ts));
  G.clouds.forEach(c => {
    c.x -= c.speed;
    if (c.x + c.w < 0) c.x = GW + 20;
  });

  updateShake();

  gc.clearRect(0, 0, GW, GH);
  gc.save();
  gc.translate(G.shake.x, G.shake.y);

  gc.drawImage(bgSky, 0, 0);

  gc.save();
  gc.globalAlpha = 0.8;
  const castleOffset = -(G.bgScroll * 0.2) % GW;
  gc.drawImage(bgCastle, castleOffset, GH * 0.2);
  gc.drawImage(bgCastle, castleOffset + GW, GH * 0.2);
  gc.restore();

  gc.drawImage(bgFloor, 0, 0);

  drawStageAtmosphere(gc);

  G.clouds.forEach(c => {
    gc.fillStyle = `rgba(180,200,240,${c.alpha})`;
    gc.beginPath();
    gc.ellipse(c.x, c.y, c.w, c.h, 0, 0, Math.PI * 2);
    gc.fill();
    gc.fillStyle = `rgba(220,230,255,${c.alpha * 0.3})`;
    gc.beginPath();
    gc.ellipse(c.x + c.w * 0.1, c.y - c.h * 0.2, c.w * 0.8, c.h * 0.6, 0, 0, Math.PI * 2);
    gc.fill();
  });

  drawTorches(gc, G.torches);

  if (G.running) {
    G.levelElapsedMs += dt;
    G.totalElapsedMs += dt;

    const cfg = getLevelConfig(G.levelIndex);
    const ramp = computeRampRatio(G.levelElapsedMs, cfg.durationMs);
    G.difficulty.monsterSpeed = cfg.monsterSpeed * (1 + ramp * 0.85);
    G.difficulty.projectileSpeed = cfg.projectileSpeed * (1 + ramp);
    G.difficulty.fireRate = cfg.fireRate * (1 + ramp * 0.9);
    G.difficulty.spawnDelay = Math.max(24, cfg.spawnDelay * (1 - ramp * 0.35));

    G.staffAnim = G.staffAnim > 0 ? G.staffAnim * 0.85 : Math.min(G.staffAnim + 0.05, 1);

    if (G.timerRunning) {
      G.timerLeft -= 0.8 * (1 + ramp * 0.35);
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
        const numProj = Math.min(3, 1 + Math.floor(G.levelIndex / 4));
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
}

window.addEventListener('beforeunload', () => {
  saveProgressSnapshot();
});

createButtons([0, 1], handleInput);
initInputHandlers(handleInput);
updateHUD();
showStartOverlay(startGame);

requestAnimationFrame(ts => {
  lastTs = ts;
  loop(ts);
});
