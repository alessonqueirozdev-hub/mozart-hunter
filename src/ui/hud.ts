import { G, bestScore } from '../state/gameState';

const el = {
  lv: document.getElementById('lv')!,
  stageVal: document.getElementById('stage-val')!,
  levelVal: document.getElementById('level-val')!,
  notesVal: document.getElementById('notes-val')!,
  scoreVal: document.getElementById('score-val')!,
  comboBadge: document.getElementById('combo-badge')!,
  comboNum: document.getElementById('combo-num')!,
  streakVal: document.getElementById('streak-val')!,
  bestVal: document.getElementById('best-val')!,
  timerBar: document.getElementById('timer-bar')!,
  waveAnnounce: document.getElementById('wave-announce')!,
  waveMainText: document.getElementById('wave-main-text')!,
  waveSubText: document.getElementById('wave-sub-text')!,
  dangerVig: document.getElementById('danger-vignette')!,
  perfectFlash: document.getElementById('perfect-flash')!,
  hitFlash: document.getElementById('hit-flash')!,
  ovStart: document.getElementById('ov-start')!,
  btnStart: document.getElementById('btn-start')!,
  ovOver: document.getElementById('ov-over')!,
  ovScore: document.getElementById('ov-score')!,
  ovStreak: document.getElementById('ov-streak')!,
  ovWave: document.getElementById('ov-wave')!,
  ovBest: document.getElementById('ov-best')!,
  ovTitle: document.getElementById('ov-title')!,
  ovSub: document.getElementById('ov-sub')!,
  btnRestart: document.getElementById('btn-restart')!,
  startResumeStatus: document.getElementById('start-resume-status')!,
};

const ROMAN = ['I', 'II', 'III', 'IV', 'V'] as const;
const WAVE_SUBS = [
  'O reino desperta',
  'A dissonancia avanca',
  'Harmonia em perigo',
  'O caos absoluto',
  'A batalha final',
];

let lastLives = -1;

function updateHearts(): void {
  if (G.lives === lastLives) return;
  lastLives = G.lives;
  el.lv.innerHTML = Array.from({ length: 5 }, (_, i) =>
    `<span class="heart ${i < G.lives ? 'active' : 'lost'}">&#9829;</span>`,
  ).join('');
}

export function updateHUD(): void {
  updateHearts();

  el.stageVal.textContent = ROMAN[Math.max(0, Math.min(ROMAN.length - 1, G.stage - 1))] ?? 'I';
  el.levelVal.textContent = G.stageLevel.toString();
  el.notesVal.textContent = G.unlockedNoteCount.toString();
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

export function showWaveAnnounce(): void {
  const idx = Math.min(G.stage - 1, 4);
  el.waveMainText.textContent = `Estagio ${G.stage} - Nivel ${G.stageLevel}`;
  el.waveSubText.textContent = G.champion ? 'CAMPEAO DA HARMONIA' : WAVE_SUBS[idx];
  el.waveAnnounce.className = 'show';
  setTimeout(() => {
    el.waveAnnounce.className = '';
  }, 2600);
}

function flashElement(elem: HTMLElement, duration: number): void {
  elem.style.opacity = '1';
  setTimeout(() => {
    elem.style.opacity = '0';
  }, duration);
}

export function triggerDanger(): void {
  flashElement(el.dangerVig, 300);
}

export function triggerPerfect(): void {
  flashElement(el.perfectFlash, 150);
}

export function triggerHitFlash(): void {
  flashElement(el.hitFlash, 200);
}

export function showStartOverlay(handleStart: () => void): void {
  el.ovStart.classList.add('show');
  el.btnStart.onclick = () => {
    el.ovStart.classList.remove('show');
    handleStart();
  };
}

export function setStartOverlayResumeStatus(message: string): void {
  el.startResumeStatus.textContent = message;
}

export function showGameOverOverlay(handleRestart: () => void): void {
  el.ovOver.classList.add('show');
  el.ovScore.textContent = G.score.toString();
  el.ovStreak.textContent = G.sessionBest.toString();
  el.ovWave.textContent = `${G.stage}.${G.stageLevel}`;
  el.ovBest.textContent = bestScore.toString();

  const isNewRecord = G.score > bestScore;
  const isChampion = G.champion;

  el.ovTitle.textContent = isChampion ? 'Campeao!' : isNewRecord ? 'Novo Recorde!' : 'Derrota';
  el.ovTitle.style.color = isChampion ? '#88ff66' : isNewRecord ? '#ffcc00' : '#ff4444';
  el.ovSub.textContent = isChampion
    ? 'Voce completou todos os estagios e virou campeao da harmonia.'
    : isNewRecord
      ? 'Mozart triunfou maravilhosamente!'
      : 'Os demonios tomaram o reino da harmonia...';

  el.btnRestart.onclick = () => {
    el.ovOver.classList.remove('show');
    handleRestart();
  };
}
