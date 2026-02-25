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
  updateHUD, showWaveAnnounce, triggerDanger,
  triggerHitFlash, triggerPerfect, showStartOverlay, showGameOverOverlay,
} from './ui/hud';
import { createButtons, setButtonResult, setButtonActive, clearButtons } from './ui/buttons';
import { initInputHandlers } from './input';
import type { ClefType } from './types';
import {
  piano, errorSound, hitSound, comboSound,
  gameOverSound, levelUpSound, whooshSound, monsterShootSound,
} from './audio/engine';

// ─── Canvas contexts ─────────────────────────────────────────────────────────

const gc = (document.getElementById('gc') as HTMLCanvasElement).getContext('2d')!;
const sc = (document.getElementById('sc') as HTMLCanvasElement).getContext('2d')!;

function resolveInitialClef(): ClefType {
  const raw = new URLSearchParams(window.location.search).get('clef')?.toLowerCase();
  if (!raw) return 'treble';
  if (raw === 'bass' || raw === 'fa') return 'bass';
  if (raw === 'alto' || raw === 'do') return 'alto';
  if (raw === 'tenor') return 'tenor';
  return 'treble';
}

// ─── Note management ─────────────────────────────────────────────────────────

function nextNote(): void {
  G.currentNote = NOTES[Math.floor(Math.random() * NOTES.length)];
  G.staffAnim = 0;
  G.timerLeft = G.timerMax;

  const display = document.getElementById('note-name-display')!;
  display.textContent = '';
  display.className = 'note-name-display';
}

// ─── Input handling ──────────────────────────────────────────────────────────

function handleInput(idx: number): void {
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

  // Disparo nasce na ponta da batuta de Mozart
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

// ─── Timer timeout ────────────────────────────────────────────────────────────

function handleTimerExpired(): void {
  G.timerRunning = false;
  G.waitAns = true;

  setButtonResult(NOTES.indexOf(G.currentNote!), 'miss');

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

// ─── Screen shake ─────────────────────────────────────────────────────────────

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

// ─── Wave progression ────────────────────────────────────────────────────────

const WAVE_SCORE_THRESHOLDS = [0, 800, 2500, 5000, 10000];

function checkWave(): void {
  if (G.wave >= WAVE_SCORE_THRESHOLDS.length) return;
  if (G.score <= WAVE_SCORE_THRESHOLDS[G.wave]) return;

  G.wave++;
  G.phase++;
  levelUpSound();
  G.timerMax = Math.max(300, 700 - G.wave * 80);
  showWaveAnnounce();

  G.stars.forEach(s => (s.t += Math.PI));
  burst(GW / 2, GH / 4, '#ffffff', 40, { spd: 12, r: 6 });
}

// ─── Collision detection ──────────────────────────────────────────────────────

function processHits(): void {
  // ── Projéteis do jogador vs projéteis do monstro (NEUTRALIZAÇÃO) ──────────
  // Raio grande (50px) para garantir colisão mesmo com projéteis rápidos.
  // Usamos "sweep": checamos posição atual E posição do frame anterior
  // para não perder colisões quando ambos se movem rápido.
  const INTERCEPT_R2 = 50 * 50;

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
        break; // este pp já colidiu, passa para o próximo
      }
    }
  }

  // ── Projéteis do jogador vs monstro ───────────────────────────────────────
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
          G.floats.push(new FloatText(G.monster.x, G.monster.y - 40, 'DESTRUÍDO!', '#ffaa00', 26));
          triggerDanger();
          applyShake(12);
        }
      }
    }
  }

  // ── Monstro chegou até Mozart ─────────────────────────────────────────────
  const MONSTER_CONTACT_X = MOZART_X + 95;
  if (G.monster && !G.monster.dying && G.monster.x <= MONSTER_CONTACT_X) {
    loseLife();
    G.monster.die();
  }
}

// ─── Life loss / Game over ────────────────────────────────────────────────────

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
    setTimeout(() => showGameOverOverlay(startGame), 1500);
  }
}

// ─── Entity update/draw loops ─────────────────────────────────────────────────

/**
 * Atualiza e renderiza entidades com `alive`.
 * onHit é chamado quando update() retorna 'hit' — usado para mp atingir Mozart.
 * NOTA: projéteis já mortos (alive=false) são removidos SEM chamar update().
 */
function updateDrawAlive(
  ctx: CanvasRenderingContext2D,
  arr: Array<{ alive: boolean; update(): any; draw(ctx: CanvasRenderingContext2D): void }>,
  onHit?: () => void,
): void {
  for (let i = arr.length - 1; i >= 0; i--) {
    const e = arr[i];
    // Projétil já morto (neutralizado por processHits) → só remove, não processa
    if (!e.alive) { arr.splice(i, 1); continue; }

    const result = e.update();
    // Projétil atingiu Mozart via detecção interna do mp.update()
    if (result === 'hit' && onHit) onHit();

    if (!e.alive) { arr.splice(i, 1); continue; }
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
    if (e.life <= 0) { arr.splice(i, 1); continue; }
    e.draw(ctx);
  }
}

// ─── Game loop ────────────────────────────────────────────────────────────────

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

  // ── Render ──────────────────────────────────────────────────────────────────
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

  // Estrelas cintilantes
  gc.save();
  G.stars.forEach(s => {
    gc.globalAlpha = (Math.sin(s.t) * 0.5 + 0.5) * s.a;
    gc.fillStyle = `hsl(${200 + Math.sin(s.t) * 40},80%,85%)`;
    gc.beginPath(); gc.arc(s.x, s.y, s.r, 0, Math.PI * 2); gc.fill();
  });
  gc.restore();

  // Nuvens
  G.clouds.forEach(c => {
    gc.fillStyle = `rgba(180,200,240,${c.alpha})`;
    gc.beginPath(); gc.ellipse(c.x, c.y, c.w, c.h, 0, 0, Math.PI * 2); gc.fill();
    gc.fillStyle = `rgba(220,230,255,${c.alpha * 0.3})`;
    gc.beginPath(); gc.ellipse(c.x + c.w * 0.1, c.y - c.h * 0.2, c.w * 0.8, c.h * 0.6, 0, 0, Math.PI * 2); gc.fill();
  });

  drawTorches(gc, G.torches);

  // ── Lógica de jogo ──────────────────────────────────────────────────────────
  if (G.running) {
    G.staffAnim = G.staffAnim > 0
      ? G.staffAnim * 0.85
      : Math.min(G.staffAnim + 0.05, 1);

    if (G.timerRunning) {
      G.timerLeft -= 0.8;
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
        const numProj = 1 + Math.min(Math.floor(G.phase / 2), 2);
        for (let i = 0; i < numProj; i++) {
          setTimeout(() => {
            if (G.monster && !G.monster.dying) {
              const origin = G.monster.getProjectileOrigin(laneY);
              G.monsterProjectiles.push(
                new MonsterProjectile(origin.x, origin.y, G.monster.type, laneY),
              );
            }
          }, i * 200);
        }
      }

      if (G.monster.dying && G.monster.dyingT >= G.monster.dyingDur) {
        G.monster = null;
        G.spawnDelay = 80;
        checkWave();
        if (G.timerRunning) G.timerLeft = Math.min(G.timerLeft + 100, G.timerMax);
      }
    }

    // processHits ANTES dos updates — marca projéteis como mortos
    // antes que updateDrawAlive os processe
    processHits();

    updateDrawAlive(gc, G.playerProjectiles);
    if (G.monster) G.monster.draw(gc);
    // onHit só é chamado se mp.update() retorna 'hit' (mp chegou a Mozart sem ser interceptado)
    updateDrawAlive(gc, G.monsterProjectiles, loseLife);
    updateDrawLive(gc, G.particles);
    updateDrawLive(gc, G.floats);

    updateHUD();
    drawStaff(sc, 960, G.staffAnim, G.currentNote, G.clef);
  }

  // Mozart sempre visível
  drawMozart(gc, MOZART_X, MOZART_Y, G.monster?.dangerRatio ?? 0, G.monster?.hitFlash ?? 0, G.frame);

  gc.restore();
  requestAnimationFrame(loop);
}

// ─── Start / Restart ─────────────────────────────────────────────────────────

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
  G.spawnDelay = 60;

  clearButtons();
  nextNote();
  showWaveAnnounce();
  updateHUD();
}

// ─── Bootstrap ───────────────────────────────────────────────────────────────

createButtons(handleInput);
initInputHandlers(handleInput);
updateHUD();
showStartOverlay(startGame);

requestAnimationFrame(ts => {
  lastTs = ts;
  loop(ts);
});
