type VivusCtor = new (
  element: string | HTMLElement,
  options?: Record<string, unknown>,
  callback?: () => void,
) => {
  stop?: () => void;
  reset?: () => void;
  play?: (speed?: number) => void;
  destroy?: () => void;
};

let vivusCtorPromise: Promise<VivusCtor> | null = null;
let vivusInstance: {
  stop?: () => void;
  reset?: () => void;
  play?: (speed?: number) => void;
  destroy?: () => void;
} | null = null;

function getVivusCtor(): Promise<VivusCtor> {
  if (!vivusCtorPromise) {
    vivusCtorPromise = import('vivus').then((mod) => {
      const ctor = (mod as { default?: VivusCtor }).default ?? (mod as unknown as VivusCtor);
      return ctor;
    });
  }
  return vivusCtorPromise;
}

export function playMozartVivusIntro(): void {
  const host = document.getElementById('mozart-vivus');
  if (!host) return;

  host.classList.remove('has-vivus');
  host.innerHTML = '<img class="mozart-vivus-fallback" src="/mozart-idle.svg" alt="Mozart" /><div id="mozart-vivus-target"></div>';
  const target = document.getElementById('mozart-vivus-target');
  if (!target) return;

  void getVivusCtor().then((Vivus) => {
    if (vivusInstance?.destroy) vivusInstance.destroy();
    vivusInstance = new Vivus(
      target,
      {
        file: '/mozart-line.svg',
        type: 'oneByOne',
        duration: 130,
        start: 'autostart',
        animTimingFunction: 'EASE_OUT',
        pathTimingFunction: 'EASE_OUT',
      },
      () => {
        // Keep final rendered frame visible.
      },
    );
    host.classList.add('has-vivus');
  }).catch(() => {
    // Intro effect should fail silently to avoid blocking gameplay.
  });
}
