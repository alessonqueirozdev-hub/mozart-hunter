import { G, bestScore } from '../state/gameState';

export function updateHUD() {
  const lvRow = document.getElementById('lv')!;
  lvRow.innerHTML = Array(10).fill(0).map((_, i) => `<span class="heart ${i < G.lives ? 'active' : 'empty'}">♥</span>`).join('');
  
  const scoreEl = document.getElementById('score-val')!;
  scoreEl.textContent = G.score.toString();
  scoreEl.classList.remove('pulse');
  void scoreEl.offsetWidth; // trigger reflow
  if (G.score > 0) scoreEl.classList.add('pulse');
  
  const cb = document.getElementById('combo-badge')!;
  if (G.combo > 1) {
    cb.style.opacity = '1';
    cb.style.transform = `scale(${1 + G.combo * 0.05})`;
    document.getElementById('combo-num')!.textContent = G.combo.toString();
  } else {
    cb.style.opacity = '0';
    cb.style.transform = 'scale(0.8)';
  }
  
  const str = document.getElementById('streak-val')!;
  str.textContent = G.streak.toString();
  str.style.color = G.streak > 15 ? '#ffcc00' : G.streak > 5 ? '#ff8800' : '#eeddcc';
  
  document.getElementById('best-val')!.textContent = bestScore.toString();
  
  const bar = document.getElementById('timer-bar')!;
  bar.style.width = G.timerRunning ? `${(G.timerLeft / G.timerMax) * 100}%` : '0';
  bar.style.background = G.timerLeft < G.timerMax * 0.25 ? '#ff2a00' : G.timerLeft < G.timerMax * 0.5 ? '#ffaa00' : '#ffea00';
  bar.style.boxShadow = G.timerLeft < G.timerMax * 0.25 ? '0 0 15px #ff2a00, inset 0 0 10px #ff2a00' : 'none';
}

export function showWaveAnnounce() {
  const wa = document.getElementById('wave-announce')!;
  document.getElementById('wave-main-text')!.textContent = `⚔ Fase ${['I', 'II', 'III', 'IV', 'V'][Math.min(G.wave - 1, 4)]} ⚔`;
  document.getElementById('wave-sub-text')!.textContent = ['O reino desperta', 'A dissonância avança', 'Harmonia em perigo', 'O caos absoluto', 'A batalha final'][Math.min(G.wave - 1, 4)];
  wa.className = 'show';
  setTimeout(() => { wa.className = ''; }, 2600);
}

export function triggerDanger() {
  const dv = document.getElementById('danger-vignette')!;
  dv.style.opacity = '1';
  setTimeout(() => { dv.style.opacity = '0'; }, 300);
}

export function triggerPerfect() {
  const pf = document.getElementById('perfect-flash')!;
  pf.style.opacity = '1';
  setTimeout(() => { pf.style.opacity = '0'; }, 150);
}

export function triggerHitFlash() {
  const hf = document.getElementById('hit-flash')!;
  hf.style.opacity = '1';
  setTimeout(() => { hf.style.opacity = '0'; }, 200);
}

export function showStartOverlay(handleStart: () => void) {
  document.getElementById('ov-start')!.classList.add('show');
  document.getElementById('btn-start')!.onclick = () => {
    document.getElementById('ov-start')!.classList.remove('show');
    handleStart();
  };
}

export function showGameOverOverlay(handleRestart: () => void) {
  document.getElementById('ov-over')!.classList.add('show');
  document.getElementById('ov-score')!.textContent = G.score.toString();
  document.getElementById('ov-streak')!.textContent = G.sessionBest.toString();
  document.getElementById('ov-wave')!.textContent = ['I', 'II', 'III', 'IV', 'V'][Math.min(G.wave - 1, 4)];
  document.getElementById('ov-best')!.textContent = bestScore.toString();
  
  if (G.score > bestScore) {
    document.getElementById('ov-title')!.textContent = '🏆 Novo Recorde!';
    document.getElementById('ov-title')!.style.color = '#ffcc00';
    document.getElementById('ov-sub')!.textContent = 'Mozart triunfou maravilhosamente!';
  } else {
    document.getElementById('ov-title')!.textContent = '💀 Derrota';
    document.getElementById('ov-title')!.style.color = '#ff4444';
    document.getElementById('ov-sub')!.textContent = 'Os demônios tomaram o reino da harmonia...';
  }
  
  document.getElementById('btn-restart')!.onclick = () => {
    document.getElementById('ov-over')!.classList.remove('show');
    handleRestart();
  };
}
