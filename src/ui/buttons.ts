import { NOTES } from '../constants';

export function createButtons(noteIndices: number[], handleInput: (idx: number) => void) {
  const row = document.getElementById('btn-row')!;
  row.className = 'keyboard-container';
  row.innerHTML = '';
  
  // C D E F G A B (octave 4), C D E F G A B (octave 5), C (octave 6)
  // Has black key *after* index: 0(C4), 1(D4), 3(F4), 4(G4), 5(A4), 7(C5), 8(D5), 10(F5), 11(G5), 12(A5)
  const hasBlackKeyAfter = [0, 1, 3, 4, 5, 7, 8, 10, 11, 12];

  noteIndices.forEach((i) => {
    const n = NOTES[i];
    // Create white key
    const b = document.createElement('button');
    b.className = `key white-key note-btn-${i}`;
    b.innerHTML = `<span class="nn">${n.name}</span><span class="nk">${n.key.toUpperCase()}</span>`;
    b.onmousedown = (e) => { e.preventDefault(); handleInput(i); };
    b.ontouchstart = (e) => { e.preventDefault(); handleInput(i); };
    row.appendChild(b);
    
    // Create black key if necessary
    if (hasBlackKeyAfter.includes(i)) {
      const black = document.createElement('div');
      black.className = 'key black-key';
      row.appendChild(black);
    }
  });
}

export function setButtonResult(idx: number, type: 'correct' | 'wrong' | 'miss') {
  const b = document.querySelector('.note-btn-' + idx) as HTMLElement;
  if (!b) return;
  b.classList.remove('active', 'correct', 'wrong', 'miss');
  void b.offsetWidth; // Request reflow
  b.classList.add(type);
  if (type === 'correct') {
    setTimeout(() => b?.classList.remove('correct', 'active'), 200);
  }
}

export function setButtonActive(idx: number) {
  const b = document.querySelector('.note-btn-' + idx) as HTMLElement;
  if (b) b.classList.add('active');
}

export function clearButtons() {
  const btns = document.querySelectorAll('.white-key');
  for (let i = 0; i < btns.length; i++) {
    btns[i].classList.remove('active', 'correct', 'wrong', 'miss');
  }
}
