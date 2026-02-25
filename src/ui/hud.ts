import { G, bestScore } from '../state/gameState';

// ─── DOM refs cacheados ───────────────────────────────────────────────────────
// getElementById é barato mas chamar 10x por frame (60fps) é desnecessário.
// Cacheamos uma vez ao carregar o módulo.

const el = {
  lv:          document.getElementById('lv')!,
  scoreVal:    document.getElementById('score-val')!,
  comboBadge:  document.getElementById('combo-badge')!,
  comboNum:    document.getElementById('combo-num')!,
  streakVal:   document.getElementById('streak-val')!,
  bestVal:     document.getElementById('best-val')!,
  timerBar:    document.getElementById('timer-bar')!,
  waveAnnounce:document.getElementById('wave-announce')!,
  waveMainText:document.getElementById('wave-main-text')!,
  waveSubText: document.getElementById('wave-sub-text')!,
  dangerVig:   document.getElementById('danger-vignette')!,
  perfectFlash:document.getElementById('perfect-flash')!,
  hitFlash:    document.getElementById('hit-flash')!,
  ovStart:     document.getElementById('ov-start')!,
  btnStart:    document.getElementById('btn-start')!,
  ovOver:      document.getElementById('ov-over')!,
  ovScore:     document.getElementById('ov-score')!,
  ovStreak:    document.getElementById('ov-streak')!,
  ovWave:      document.getElementById('ov-wave')!,
  ovBest:      document.getElementById('ov-best')!,
  ovTitle:     document.getElementById('ov-title')!,
  ovSub:       document.getElementById('ov-sub')!,
  btnRestart:  document.getElementById('btn-restart')!,
};

// ─── Constantes de texto ──────────────────────────────────────────────────────

const ROMAN = ['I', 'II', 'III', 'IV', 'V'] as const;
const WAVE_MAINS = ['⚔ Fase I ⚔', '⚔ Fase II ⚔', '⚔ Fase III ⚔', '⚔ Fase IV ⚔', '⚔ Fase V ⚔'];
const WAVE_SUBS = [
  'O reino desperta',
  'A dissonância avança',
  'Harmonia em perigo',
  'O caos absoluto',
  'A batalha final',
];

// ─── Corações cacheados ───────────────────────────────────────────────────────
// Só regera o HTML de corações quando o número de vidas mudar,
// em vez de toda frame.

let _lastLives = -1;

function updateHearts(): void {
  if (G.lives === _lastLives) return;
  _lastLives = G.lives;
  el.lv.innerHTML = Array.from({ length: 5 }, (_, i) =>
    `<span class="heart ${i < G.lives ? 'active' : 'lost'}">&#9829;</span>`,
  ).join('');
}

// ─── HUD principal (chamado todo frame) ──────────────────────────────────────

export function updateHUD(): void {
  updateHearts();

  el.scoreVal.textContent = G.score.toString();

  if (G.combo > 1) {
    el.comboBadge.style.opacity = '1';
    el.comboBadge.style.transform = `scale(${1 + G.combo * 0.05})`;
    el.comboNum.textContent = G.combo.toString();
  } else {
    el.comboBadge.style.opacity = '0';
    el.comboBadge.style.transform = 'scale(0.8)';
  }

  el.streakVal.textContent = G.streak.toString();
  el.streakVal.style.color =
    G.streak > 15 ? '#ffcc00' : G.streak > 5 ? '#ff8800' : '#eeddcc';

  el.bestVal.textContent = bestScore.toString();

  if (G.timerRunning) {
    const pct = (G.timerLeft / G.timerMax) * 100;
    el.timerBar.style.width = `${pct}%`;

    if (G.timerLeft < G.timerMax * 0.25) {
      el.timerBar.style.background = '#ff2a00';
      el.timerBar.style.boxShadow = '0 0 15px #ff2a00, inset 0 0 10px #ff2a00';
    } else if (G.timerLeft < G.timerMax * 0.5) {
      el.timerBar.style.background = '#ffaa00';
      el.timerBar.style.boxShadow = 'none';
    } else {
      el.timerBar.style.background = '#ffea00';
      el.timerBar.style.boxShadow = 'none';
    }
  } else {
    el.timerBar.style.width = '0';
  }
}

// ─── Anúncio de fase ──────────────────────────────────────────────────────────

export function showWaveAnnounce(): void {
  const idx = Math.min(G.wave - 1, 4);
  el.waveMainText.textContent = WAVE_MAINS[idx];
  el.waveSubText.textContent = WAVE_SUBS[idx];
  el.waveAnnounce.className = 'show';
  setTimeout(() => { el.waveAnnounce.className = ''; }, 2600);
}

// ─── Flash effects ────────────────────────────────────────────────────────────

function flashElement(elem: HTMLElement, duration: number): void {
  elem.style.opacity = '1';
  setTimeout(() => { elem.style.opacity = '0'; }, duration);
}

export function triggerDanger(): void  { flashElement(el.dangerVig,   300); }
export function triggerPerfect(): void { flashElement(el.perfectFlash, 150); }
export function triggerHitFlash(): void { flashElement(el.hitFlash,   200); }

// ─── Overlays ─────────────────────────────────────────────────────────────────

export function showStartOverlay(handleStart: () => void): void {
  el.ovStart.classList.add('show');
  el.btnStart.onclick = () => {
    el.ovStart.classList.remove('show');
    handleStart();
  };
}

export function showGameOverOverlay(handleRestart: () => void): void {
  el.ovOver.classList.add('show');
  el.ovScore.textContent = G.score.toString();
  el.ovStreak.textContent = G.sessionBest.toString();
  el.ovWave.textContent = ROMAN[Math.min(G.wave - 1, 4)];
  el.ovBest.textContent = bestScore.toString();

  const isNewRecord = G.score > bestScore;
  el.ovTitle.textContent  = isNewRecord ? '🏆 Novo Recorde!' : '💀 Derrota';
  el.ovTitle.style.color  = isNewRecord ? '#ffcc00' : '#ff4444';
  el.ovSub.textContent    = isNewRecord
    ? 'Mozart triunfou maravilhosamente!'
    : 'Os demônios tomaram o reino da harmonia...';

  el.btnRestart.onclick = () => {
    el.ovOver.classList.remove('show');
    handleRestart();
  };
}
