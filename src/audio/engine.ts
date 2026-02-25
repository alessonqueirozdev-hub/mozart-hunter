/* ═══════════════════════════════════
   AUDIO ENGINE
═══════════════════════════════════ */
export const AC = new (window.AudioContext || (window as any).webkitAudioContext)();
let globalRev: ConvolverNode | undefined;

(async () => {
  try {
    globalRev = AC.createConvolver();
    const len = AC.sampleRate * 1.8;
    const buf = AC.createBuffer(2, len, AC.sampleRate);
    for (let c = 0; c < 2; c++) {
      const d = buf.getChannelData(c);
      for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.5);
    }
    globalRev.buffer = buf;
    globalRev.connect(AC.destination);
  } catch (e) {
    console.error("Audio engine reverb init failed:", e);
  }
})();

function mkLimiter() {
  const c = AC.createDynamicsCompressor();
  c.threshold.value = -5;
  c.knee.value = 3;
  c.ratio.value = 8;
  c.attack.value = .003;
  c.release.value = .1;
  c.connect(AC.destination);
  return c;
}

const LIM = mkLimiter();

export function resumeAudioContext() {
  if (AC.state === 'suspended') {
    AC.resume();
  }
}

export function piano(freq: number, vol = .42, dur = 1.1) {
  resumeAudioContext();
  const t = AC.currentTime, master = AC.createGain();
  master.connect(LIM);
  if (globalRev) {
    const rg = AC.createGain();
    rg.gain.value = .1;
    master.connect(rg);
    rg.connect(globalRev);
  }
  
  master.gain.setValueAtTime(0, t);
  master.gain.linearRampToValueAtTime(vol, t + .008);
  master.gain.exponentialRampToValueAtTime(vol * .55, t + .06);
  master.gain.exponentialRampToValueAtTime(.001, t + dur);
  
  const harmonics: [number, number, OscillatorType][] = [
    [1, .55, 'triangle'],
    [2, .22, 'sine'],
    [3, .09, 'sine'],
    [4, .04, 'sine'],
    [6, .012, 'sine']
  ];
  
  harmonics.forEach(([m, a, tp]) => {
    const o = AC.createOscillator(), g = AC.createGain();
    o.type = tp;
    o.frequency.value = freq * m;
    o.detune.value = (Math.random() - .5) * 5;
    g.gain.setValueAtTime(a, t);
    g.gain.exponentialRampToValueAtTime(.001, t + dur * (.8 / m + .2));
    o.connect(g);
    g.connect(master);
    o.start(t);
    o.stop(t + dur + .1);
  });
}

export function errorSound() {
  resumeAudioContext();
  const t = AC.currentTime;
  const tones = [[185, .22, .2], [262, .15, .25], [348, .1, .3]];
  
  tones.forEach(([f, v, d]) => {
    const o = AC.createOscillator(), g = AC.createGain();
    o.type = 'sawtooth';
    o.frequency.setValueAtTime(f, t);
    o.frequency.exponentialRampToValueAtTime(f * .65, t + d);
    g.gain.setValueAtTime(v, t);
    g.gain.exponentialRampToValueAtTime(.001, t + d);
    o.connect(g);
    g.connect(LIM);
    o.start(t);
    o.stop(t + d + .05);
  });
}

export function hitSound() {
  resumeAudioContext();
  const t = AC.currentTime;
  const o = AC.createOscillator(), g = AC.createGain(), f = AC.createBiquadFilter();
  o.type = 'sawtooth';
  o.frequency.setValueAtTime(120, t);
  o.frequency.exponentialRampToValueAtTime(60, t + .12);
  f.type = 'lowpass';
  f.frequency.value = 400;
  g.gain.setValueAtTime(.35, t);
  g.gain.exponentialRampToValueAtTime(.001, t + .18);
  o.connect(f);
  f.connect(g);
  g.connect(LIM);
  o.start(t);
  o.stop(t + .22);
}

export function comboSound(lvl: number) {
  const freqs = [659, 784, 880, 1047, 1319];
  piano(freqs[Math.min(lvl - 1, 4)], .22, .3);
}

export function gameOverSound() {
  [440, 415, 392, 370, 330, 294].forEach((f, i) => setTimeout(() => piano(f, .32, .6), i * 210));
}

export function levelUpSound() {
  [523, 659, 784, 1047, 1319].forEach((f, i) => setTimeout(() => piano(f, .32, .4), i * 75));
}

export function whooshSound() {
  resumeAudioContext();
  const t = AC.currentTime, o = AC.createOscillator(), g = AC.createGain(), f = AC.createBiquadFilter();
  o.type = 'sawtooth';
  o.frequency.setValueAtTime(900, t);
  o.frequency.exponentialRampToValueAtTime(220, t + .28);
  f.type = 'bandpass';
  f.frequency.value = 700;
  f.Q.value = .7;
  g.gain.setValueAtTime(.14, t);
  g.gain.exponentialRampToValueAtTime(.001, t + .32);
  o.connect(f);
  f.connect(g);
  g.connect(LIM);
  o.start(t);
  o.stop(t + .38);
}

export function monsterShootSound() {
  resumeAudioContext();
  const t = AC.currentTime, o = AC.createOscillator(), g = AC.createGain();
  o.type = 'square';
  o.frequency.setValueAtTime(200, t);
  o.frequency.exponentialRampToValueAtTime(80, t + .15);
  g.gain.setValueAtTime(.18, t);
  g.gain.exponentialRampToValueAtTime(.001, t + .2);
  o.connect(g);
  g.connect(LIM);
  o.start(t);
  o.stop(t + .25);
}
