import { NOTES } from './constants';

export function initInputHandlers(handleInput: (noteIdx: number) => void) {
  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.repeat) return;
    const key = e.key.toLowerCase();
    const idx = NOTES.findIndex(n => n.key === key);
    if (idx !== -1) {
      e.preventDefault();
      handleInput(idx);
    }
  };

  window.addEventListener('keydown', handleKeyDown);

  // Return a cleanup function if needed later
  return () => {
    window.removeEventListener('keydown', handleKeyDown);
  };
}
