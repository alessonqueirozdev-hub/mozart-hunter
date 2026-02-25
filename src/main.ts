import { NOTES, GW, GH } from './constants';
import { G, resetState, setBestScore, bestScore } from './state/gameState';
import { bgSky, bgCastle, bgFloor, drawTorches } from './graphics/backgrounds';
import { drawStaff } from './graphics/staff';
import { drawMozart } from './graphics/mozart';
import { Monster } from './entities/Monster';
import { PlayerProjectile, MonsterProjectile } from './entities/Projectiles';
import { FloatText } from './entities/FloatText';
import { burst, noteExplosion, mozartHitEffect } from './entities/Particle';
import { updateHUD, showWaveAnnounce, triggerDanger, triggerHitFlash, triggerPerfect, showStartOverlay, showGameOverOverlay } from './ui/hud';
import { createButtons, setButtonResult, setButtonActive, clearButtons } from './ui/buttons';
import { initInputHandlers } from './input';
import { piano, errorSound, hitSound, comboSound, gameOverSound, levelUpSound, whooshSound, monsterShootSound, resumeAudioContext } from './audio/engine';

const gc = (document.getElementById('gc') as HTMLCanvasElement).getContext('2d')!;
const sc = (document.getElementById('sc') as HTMLCanvasElement).getContext('2d')!;

function nextNote() {
  G.currentNote = NOTES[Math.floor(Math.random() * NOTES.length)];
  G.staffAnim = 0;
  G.timerLeft = G.timerMax;
  document.getElementById('note-name-display')!.textContent = '';
  document.getElementById('note-name-display')!.className = 'note-name-display';
}

function handleInput(idx: number) {
  if (!G.running || G.waitAns || !G.monster || G.monster.dying || !G.currentNote) return;
  resumeAudioContext();
  
  const targetIdx = NOTES.indexOf(G.currentNote);
  setButtonActive(idx);
  
  if (idx === targetIdx) {
    hitSound();
    G.streak++;
    if (G.streak % 5 === 0) { G.combo++; comboSound(G.combo); triggerPerfect(); }
    const pts = 10 * (1 + G.combo);
    G.score += pts;
    G.floats.push(new FloatText(145, GH * .55, `+${pts}`, '#44ee88', 24));
    
    if (G.combo > 1) {
      document.getElementById('note-name-display')!.innerHTML = `CORRETO! <span style="color:#ffcc00">COMBO x${G.combo}</span>`;
      document.getElementById('note-name-display')!.className = 'note-name-display success';
    } else {
      document.getElementById('note-name-display')!.innerHTML = `CORRETO: <span style="color:#44aaee">${G.currentNote.name}</span>`;
      document.getElementById('note-name-display')!.className = 'note-name-display success';
    }
    
    setButtonResult(idx, 'correct');
    const noteFreq = NOTES[idx].freq;
    piano(noteFreq);
    G.playerProjectiles.push(new PlayerProjectile(G.monster.x, G.monster.y, noteFreq));
    
    // Instantly load the next note so the player can fire rapidly
    nextNote();
    
  } else {
    // Wrong Note
    errorSound();
    G.waitAns = true;
    G.timerRunning = false;
    G.streak = 0;
    G.combo = 0;
    
    document.getElementById('note-name-display')!.innerHTML = `ERROU! Era <span style="color:#ff4444">${G.currentNote.name}</span>`;
    document.getElementById('note-name-display')!.className = 'note-name-display fail';
    
    setButtonResult(idx, 'wrong');
    setTimeout(() => { setButtonResult(targetIdx, 'correct'); }, 150);
    
    burst(130, GH * .60, '#ffbbbb', 12, { spd: 5 });
    G.shake = { x: (Math.random() - .5) * 8, y: (Math.random() - .5) * 8, pow: 6 };
    
    setTimeout(() => {
      clearButtons();
      nextNote();
      G.waitAns = false;
      G.timerRunning = true;
    }, 1200);
  }
}

function updateShake() {
  if (G.shake.pow > 0) {
    G.shake.x = (Math.random() - .5) * G.shake.pow;
    G.shake.y = (Math.random() - .5) * G.shake.pow;
    G.shake.pow *= .85;
    if (G.shake.pow < .5) { G.shake.x = 0; G.shake.y = 0; G.shake.pow = 0; }
  } else {
    G.shake.x = 0; G.shake.y = 0;
  }
}

function checkWave() {
  if (G.score > [0, 800, 2500, 5000, 10000][G.wave]) {
    G.wave++;
    G.phase++;
    levelUpSound();
    G.timerMax = Math.max(300, 700 - G.wave * 80);
    showWaveAnnounce();
    G.stars.forEach(s => s.t += Math.PI);
    for (let i = 0; i < 20; i++) G.particles.push({ update: () => {}, draw: () => {}, life: 0 } as any); // Force GC somewhat or just visual filler
    burst(GW / 2, GH / 4, '#ffffff', 40, { spd: 12, r: 6 });
  }
}

function processHits() {
  // Check projectile vs projectile neutralization
  G.playerProjectiles.forEach(pp => {
    if (!pp.alive) return;
    G.monsterProjectiles.forEach(mp => {
      if (!mp.alive) return;
      const dx = pp.x - mp.x, dy = pp.y - mp.y;
      if (Math.sqrt(dx * dx + dy * dy) < 35) {
        pp.alive = false;
        mp.alive = false;
        noteExplosion(mp.x, mp.y); // Visual effect
        
        G.score += 5; // Bonus for intercepting
        G.floats.push(new FloatText(mp.x, mp.y, "+5", "#aaaaff", 16));
      }
    });
  });

  // Check player projectile vs monster
  G.playerProjectiles.forEach(p => {
    if (!p.alive || !G.monster || G.monster.dying) return;
    const dx = p.x - G.monster.x, dy = p.y - G.monster.y;
    if (Math.sqrt(dx * dx + dy * dy) < 72) {
      p.alive = false;
      noteExplosion(p.x, p.y);
      
      const killed = G.monster.takeDamage();
      if (killed) {
        whooshSound();
        G.floats.push(new FloatText(G.monster.x, G.monster.y - 40, `DESTRUÍDO!`, '#ffaa00', 26));
        triggerDanger();
        G.shake = { x: 12, y: 12, pow: 12 };
      }
    }
  });
  
  // Monster hit Mozart
  if (G.monster && !G.monster.dying && G.monster.x < 180) {
    if (G.monster.hp > 0) loseLife();
    if (G.monster) G.monster.die();
  }
}

function loseLife() {
  triggerHitFlash();
  G.lives--;
  G.streak = 0;
  G.combo = 0;
  errorSound();
  mozartHitEffect(130, GH * .60);
  G.shake = { x: (Math.random() - .5) * 15, y: (Math.random() - .5) * 15, pow: 10 };
  if (G.lives <= 0) {
    G.running = false;
    gameOverSound();
    clearButtons();
    setTimeout(() => { showGameOverOverlay(startGame); }, 1500);
  }
}

let lastTs = 0;

function loop(ts: number) {
  Math.min(ts - lastTs, 50); lastTs = ts;
  G.frame++;
  G.bgScroll += .35;
  
  G.stars.forEach(s => s.t += s.ts);
  G.clouds.forEach(c => { c.x -= c.speed; if (c.x + c.w < 0) c.x = GW + 20; });
  
  updateShake();
  
  gc.clearRect(0, 0, GW, GH);
  gc.save();
  gc.translate(G.shake.x, G.shake.y);

  // Background
  gc.drawImage(bgSky, 0, 0);
  
  gc.save();
  gc.globalAlpha = .8;
  gc.drawImage(bgCastle, -(G.bgScroll * .2) % GW, GH * .2);
  gc.drawImage(bgCastle, -(G.bgScroll * .2) % GW + GW, GH * .2);
  gc.restore();

  gc.drawImage(bgFloor, 0, 0);

  // Stars
  gc.save();
  G.stars.forEach(s => {
    gc.globalAlpha = (Math.sin(s.t) * .5 + .5) * s.a;
    gc.fillStyle = `hsl(${200 + Math.sin(s.t) * 40},80%,85%)`;
    gc.beginPath(); gc.arc(s.x, s.y, s.r, 0, Math.PI * 2); gc.fill();
  });
  gc.restore();
  
  // Clouds
  G.clouds.forEach(c => {
    gc.fillStyle = `rgba(180,200,240,${c.alpha})`;
    gc.beginPath(); gc.ellipse(c.x, c.y, c.w, c.h, 0, 0, Math.PI * 2); gc.fill();
    gc.fillStyle = `rgba(220,230,255,${c.alpha * .3})`;
    gc.beginPath(); gc.ellipse(c.x + c.w * .1, c.y - c.h * .2, c.w * .8, c.h * .6, 0, 0, Math.PI * 2); gc.fill();
  });
  
  drawTorches(gc, G.torches);

  if (G.running) {
    if (G.staffAnim > 0) G.staffAnim *= .85; else G.staffAnim += .05;
    if (G.staffAnim > 1) G.staffAnim = 1;
    
    if (G.timerRunning) {
      G.timerLeft -= .8;
      if (G.timerLeft <= 0) {
        G.timerRunning = false;
        G.waitAns = true;
        setButtonResult(NOTES.indexOf(G.currentNote!), 'miss');
        document.getElementById('note-name-display')!.innerHTML = `Teeempo esgotado! A nota era: <span style="color:#ffcc00">${G.currentNote!.name}</span>`;
        document.getElementById('note-name-display')!.className = 'note-name-display fail';
        errorSound();
        loseLife();
        setTimeout(() => {
          clearButtons();
          nextNote();
          G.waitAns = false;
          G.timerRunning = true;
        }, 1200);
      }
    }
    
    if (!G.monster && G.spawnDelay-- <= 0) {
      G.monster = new Monster(G.phase);
      G.timerRunning = true;
    }
    
    if (G.monster) {
      const mh = G.monster.update();
      if (mh === 'shoot') {
        monsterShootSound();
        const numProj = 1 + Math.min(Math.floor(G.phase / 2), 2);
        for (let i = 0; i < numProj; i++) {
          setTimeout(() => {
            G.monsterProjectiles.push(new MonsterProjectile(G.monster!.x, G.monster!.y - 20, G.monster!.type));
          }, i * 200);
        }
      }
      if (G.monster.dying && G.monster.dyingT >= G.monster.dyingDur) {
        G.monster = null;
        G.spawnDelay = 80;
        checkWave();
        if (G.timerRunning) G.timerLeft += Math.min(G.timerMax - G.timerLeft, 100);
      }
    }
    
    processHits();
    
    const updDraw = (arr: any[]) => {
      for (let i = arr.length - 1; i >= 0; i--) {
        if ('alive' in arr[i] && !arr[i].alive) {
          arr.splice(i, 1);
          continue;
        }
        const h = arr[i].update();
        if (h === 'hit') loseLife();
        if ('alive' in arr[i] && !arr[i].alive) arr.splice(i, 1);
        else if ('life' in arr[i] && arr[i].life <= 0) arr.splice(i, 1);
        else arr[i].draw(gc);
      }
    };
    
    updDraw(G.playerProjectiles);
    if (G.monster) G.monster.draw(gc);
    updDraw(G.monsterProjectiles);
    updDraw(G.particles);
    updDraw(G.floats);
    
    updateHUD();
    drawStaff(sc, 380, G.staffAnim, G.currentNote);
  }

  drawMozart(gc, 115, GH * .60, G.monster?.dangerRatio || 0, G.monster?.hitFlash || 0, G.frame);
  
  gc.restore();
  requestAnimationFrame(loop);
}

function startGame() {
  if (G.score > G.sessionBest) {
    G.sessionBest = G.score;
    if (G.score > bestScore) setBestScore(G.score);
  }
  resetState();
  G.running = true;
  G.waitAns = false;
  G.timerRunning = false;
  G.spawnDelay = 60;
  clearButtons();
  nextNote();
  showWaveAnnounce();
  updateHUD();
}

// Initialization Code
createButtons(handleInput);
initInputHandlers(handleInput);
updateHUD();

// Pre-render staff
const ssc = document.createElement('canvas'); ssc.width=380; ssc.height=148;
drawStaff(ssc.getContext('2d')!, 380, 0, null);

showStartOverlay(startGame);

requestAnimationFrame((ts) => {
  lastTs = ts;
  loop(ts);
});
