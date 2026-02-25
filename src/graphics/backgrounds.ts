import { GW, GH } from '../constants';

// ─── Utilitários internos ─────────────────────────────────────────────────────

/** PRNG determinista para gerar a mesma cena toda vez (seed-based) */
function makePRNG(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    return (s >>> 0) / 0xffffffff;
  };
}

/** Desenha uma clave de sol completa via bezier curves, centralizada em (x, y) */
function drawTrebleClef(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  alpha: number,
  glowColor: string,
) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.translate(x, y);
  ctx.scale(size / 80, size / 80);

  ctx.shadowBlur = 28;
  ctx.shadowColor = glowColor;
  ctx.strokeStyle = glowColor;
  ctx.lineWidth = 3.5;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  ctx.beginPath();
  // Haste principal descendo
  ctx.moveTo(0, 38);
  ctx.bezierCurveTo(0, 38, -2, 10, 0, -20);
  ctx.bezierCurveTo(2, -50, 8, -80, 6, -105);
  // Topo curvo
  ctx.bezierCurveTo(6, -120, -10, -122, -14, -108);
  ctx.bezierCurveTo(-18, -92, -6, -78, 6, -72);
  // Curva do meio (anel)
  ctx.bezierCurveTo(22, -65, 28, -48, 22, -32);
  ctx.bezierCurveTo(16, -16, 2, -8, -8, -4);
  ctx.bezierCurveTo(-20, 2, -24, 16, -20, 28);
  ctx.bezierCurveTo(-16, 40, -4, 48, 8, 44);
  ctx.bezierCurveTo(20, 40, 26, 28, 22, 18);
  ctx.bezierCurveTo(18, 8, 8, 4, 0, 8);
  ctx.stroke();

  // Pontinho inferior
  ctx.beginPath();
  ctx.arc(0, 50, 5, 0, Math.PI * 2);
  ctx.fillStyle = glowColor;
  ctx.fill();

  ctx.restore();
}

/** Desenha uma clave de fá */
function drawBassClef(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  alpha: number,
  glowColor: string,
) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.translate(x, y);
  ctx.scale(size / 60, size / 60);

  ctx.shadowBlur = 20;
  ctx.shadowColor = glowColor;
  ctx.strokeStyle = glowColor;
  ctx.lineWidth = 3;
  ctx.lineCap = 'round';

  // Corpo da clave de fá
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.bezierCurveTo(20, -10, 28, -28, 20, -42);
  ctx.bezierCurveTo(12, -56, -8, -56, -12, -44);
  ctx.bezierCurveTo(-16, -32, -6, -22, 4, -26);
  ctx.stroke();

  // Dois pontinhos
  ctx.fillStyle = glowColor;
  ctx.shadowBlur = 12;
  ctx.beginPath(); ctx.arc(20, -10, 3.5, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(20, -24, 3.5, 0, Math.PI * 2); ctx.fill();

  ctx.restore();
}

/** Desenha uma nota musical detalhada (cabeça oval + haste + bandeira) */
function drawMusicalNote(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  alpha: number,
  color: string,
  variant: 'quarter' | 'eighth' | 'sixteenth' = 'quarter',
) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.translate(x, y);
  ctx.scale(size / 20, size / 20);

  ctx.shadowBlur = 16;
  ctx.shadowColor = color;
  ctx.fillStyle = color;
  ctx.strokeStyle = color;

  // Cabeça da nota (oval inclinada)
  ctx.beginPath();
  ctx.save();
  ctx.rotate(-0.35);
  ctx.ellipse(0, 0, 7, 5, 0, 0, Math.PI * 2);
  ctx.restore();
  ctx.fill();

  // Haste
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(6, -2);
  ctx.lineTo(6, -32);
  ctx.stroke();

  // Bandeira(s)
  if (variant === 'eighth' || variant === 'sixteenth') {
    ctx.beginPath();
    ctx.moveTo(6, -32);
    ctx.bezierCurveTo(22, -26, 22, -14, 10, -10);
    ctx.lineWidth = 2;
    ctx.stroke();
  }
  if (variant === 'sixteenth') {
    ctx.beginPath();
    ctx.moveTo(6, -24);
    ctx.bezierCurveTo(22, -18, 22, -6, 10, -2);
    ctx.stroke();
  }

  ctx.restore();
}

// ═══════════════════════════════════════════════════════════════════════════════
// bgSky — Céu noturno: galáxia, lua com clave de sol, partitura celeste
// ═══════════════════════════════════════════════════════════════════════════════
export const bgSky = (() => {
  const c = document.createElement('canvas');
  c.width = GW; c.height = GH;
  const ctx = c.getContext('2d')!;
  const rnd = makePRNG(42);

  // ── 1. Gradiente de fundo — azul-anil profundo para roxo-noite ───────────────
  const skyGrad = ctx.createLinearGradient(0, 0, 0, GH);
  skyGrad.addColorStop(0.00, '#01000d');
  skyGrad.addColorStop(0.20, '#04011a');
  skyGrad.addColorStop(0.45, '#080328');
  skyGrad.addColorStop(0.70, '#0e0535');
  skyGrad.addColorStop(1.00, '#1a0740');
  ctx.fillStyle = skyGrad;
  ctx.fillRect(0, 0, GW, GH);

  // ── 2. Via Láctea — faixa diagonal difusa ────────────────────────────────────
  ctx.save();
  ctx.translate(GW * 0.5, GH * 0.3);
  ctx.rotate(-0.22);
  for (let band = 0; band < 4; band++) {
    const bw = 60 + band * 40;
    const bx = (band - 1.5) * 55;
    const milkyWay = ctx.createLinearGradient(bx - bw, 0, bx + bw, 0);
    milkyWay.addColorStop(0, 'transparent');
    milkyWay.addColorStop(0.3, `rgba(180,160,255,${0.03 + band * 0.01})`);
    milkyWay.addColorStop(0.5, `rgba(210,190,255,${0.06 + band * 0.01})`);
    milkyWay.addColorStop(0.7, `rgba(180,160,255,${0.03 + band * 0.01})`);
    milkyWay.addColorStop(1, 'transparent');
    ctx.fillStyle = milkyWay;
    ctx.fillRect(bx - bw, -GH, bw * 2, GH * 2.5);
  }
  ctx.restore();

  // ── 3. Nebulosas coloridas em camadas ────────────────────────────────────────
  const nebulas = [
    { x: GW * 0.15, y: GH * 0.22, r: 160, color: '#3d0a80', a: 0.18 },
    { x: GW * 0.42, y: GH * 0.10, r: 130, color: '#1a0a70', a: 0.14 },
    { x: GW * 0.68, y: GH * 0.30, r: 110, color: '#600a50', a: 0.16 },
    { x: GW * 0.90, y: GH * 0.18, r: 140, color: '#0a2080', a: 0.12 },
    { x: GW * 0.30, y: GH * 0.50, r: 100, color: '#2a0860', a: 0.10 },
    { x: GW * 0.75, y: GH * 0.55, r: 120, color: '#400850', a: 0.13 },
  ];
  nebulas.forEach(n => {
    const ng = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, n.r);
    ng.addColorStop(0.0, n.color + 'cc');
    ng.addColorStop(0.4, n.color + '55');
    ng.addColorStop(0.8, n.color + '18');
    ng.addColorStop(1.0, 'transparent');
    ctx.globalAlpha = n.a;
    ctx.beginPath(); ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
    ctx.fillStyle = ng; ctx.fill();
  });
  ctx.globalAlpha = 1;

  // ── 4. Campo de estrelas em 3 camadas de profundidade ────────────────────────
  const starLayers = [
    { count: 180, maxR: 0.8,  minA: 0.15, maxA: 0.45, colorBias: 0.7 }, // fundo
    { count: 100, maxR: 1.3,  minA: 0.35, maxA: 0.75, colorBias: 0.6 }, // meio
    { count: 40,  maxR: 2.0,  minA: 0.65, maxA: 1.0,  colorBias: 0.4 }, // frente
  ];
  starLayers.forEach(layer => {
    for (let i = 0; i < layer.count; i++) {
      const sx = rnd() * GW;
      const sy = rnd() * GH * 0.82;
      const r  = rnd() * layer.maxR + 0.3;
      const a  = rnd() * (layer.maxA - layer.minA) + layer.minA;
      // Cor: azul-branco, branco-puro, lilás, amarelo-quente
      const colorChoice = rnd();
      const color = colorChoice > 0.85 ? '#fff8e0'   // quente
                  : colorChoice > 0.70 ? '#e8d0ff'   // lilás
                  : colorChoice > 0.50 ? '#ffffff'   // puro
                  : '#d0e8ff';                       // frio
      ctx.globalAlpha = a;
      ctx.fillStyle = color;
      ctx.beginPath(); ctx.arc(sx, sy, r, 0, Math.PI * 2); ctx.fill();

      // Brilho cruzado nas estrelas maiores
      if (r > 1.4 && rnd() > 0.5) {
        ctx.strokeStyle = color;
        ctx.lineWidth = 0.5;
        ctx.globalAlpha = a * 0.4;
        const cr = r * 3.5;
        ctx.beginPath();
        ctx.moveTo(sx - cr, sy); ctx.lineTo(sx + cr, sy);
        ctx.moveTo(sx, sy - cr); ctx.lineTo(sx, sy + cr);
        ctx.stroke();
      }
    }
  });
  ctx.globalAlpha = 1;

  // ── 5. Partitura celeste — 5 linhas que atravessam o céu curvadas ────────────
  const staffBaseY = GH * 0.38;
  const lineSpacing = 11;
  for (let line = 0; line < 5; line++) {
    const baseY = staffBaseY + line * lineSpacing;
    const alpha = 0.10 + Math.abs(2 - line) * 0.03;
    ctx.strokeStyle = `rgba(200, 170, 255, ${alpha})`;
    ctx.lineWidth = 1;
    ctx.shadowBlur = 6;
    ctx.shadowColor = 'rgba(180, 120, 255, 0.6)';
    ctx.beginPath();
    // Curva suave para dar perspectiva celestial
    ctx.moveTo(0, baseY + 8);
    ctx.bezierCurveTo(
      GW * 0.25, baseY - 12,
      GW * 0.60, baseY + 18,
      GW,        baseY + 4,
    );
    ctx.stroke();
  }
  ctx.shadowBlur = 0;

  // ── 6. Notas musicais constelação — espalhadas no céu ────────────────────────
  // Posições fixas (seed determinista = mesma cena sempre)
  const notePositions = Array.from({ length: 6 }, () => ({
    x: rnd() * GW,
    y: rnd() * GH * 0.60,
    size: 10 + rnd() * 22,
    alpha: 0.06 + rnd() * 0.22,
    variant: (['quarter', 'eighth', 'sixteenth'] as const)[Math.floor(rnd() * 3)],
  }));
  notePositions.forEach(n => {
    drawMusicalNote(ctx, n.x, n.y, n.size * 0.75, n.alpha * 0.45, '#d8d8de', n.variant);
  });

  // ── 7. Claves de sol e fá decorativas no céu ─────────────────────────────────
  drawTrebleClef(ctx, GW * 0.08, GH * 0.35, 40, 0.03, 'rgba(210,210,230,0.5)');
  drawBassClef(ctx, GW * 0.64, GH * 0.28, 26, 0.02, 'rgba(210,210,230,0.4)');

  // ── 8. Lua Dourada — grande, com textura e clave de sol incandescente ─────────
  const mx = GW * 0.80, my = GH * 0.20;

  // Halo exterior difuso (3 camadas)
  [120, 80, 50].forEach((r, i) => {
    const halo = ctx.createRadialGradient(mx, my, r * 0.4, mx, my, r);
    const alphas = [0.06, 0.12, 0.18];
    halo.addColorStop(0, `rgba(255, 200, 80, ${alphas[i]})`);
    halo.addColorStop(0.5, `rgba(220, 140, 40, ${alphas[i] * 0.4})`);
    halo.addColorStop(1, 'transparent');
    ctx.beginPath(); ctx.arc(mx, my, r, 0, Math.PI * 2);
    ctx.fillStyle = halo; ctx.fill();
  });

  // Raios de luz radiais (como numa gravura barroca)
  ctx.save();
  ctx.translate(mx, my);
  for (let ray = 0; ray < 16; ray++) {
    const angle = (ray / 16) * Math.PI * 2;
    const rayGrad = ctx.createLinearGradient(0, 0, Math.cos(angle) * 160, Math.sin(angle) * 160);
    rayGrad.addColorStop(0.2, `rgba(255, 220, 100, 0.08)`);
    rayGrad.addColorStop(1, 'transparent');
    ctx.strokeStyle = rayGrad;
    ctx.lineWidth = 2 + (ray % 3 === 0 ? 2 : 0);
    ctx.globalAlpha = 0.15;
    ctx.beginPath();
    ctx.moveTo(Math.cos(angle) * 48, Math.sin(angle) * 48);
    ctx.lineTo(Math.cos(angle) * 160, Math.sin(angle) * 160);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
  ctx.restore();

  // Corpo da lua — gradiente rico de tons dourados e carmesim
  const moonGrad = ctx.createRadialGradient(mx - 8, my - 9, 4, mx, my, 32);
  moonGrad.addColorStop(0.00, '#fff8d0');
  moonGrad.addColorStop(0.25, '#ffd878');
  moonGrad.addColorStop(0.55, '#e8901a');
  moonGrad.addColorStop(0.80, '#aa4a08');
  moonGrad.addColorStop(1.00, '#5c1a02');
  ctx.beginPath(); ctx.arc(mx, my, 32, 0, Math.PI * 2);
  ctx.fillStyle = moonGrad; ctx.fill();

  // Borda luminosa da lua
  ctx.beginPath(); ctx.arc(mx, my, 32, 0, Math.PI * 2);
  ctx.strokeStyle = 'rgba(255, 220, 120, 0.5)';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Crateras realistas
  ctx.globalCompositeOperation = 'multiply';
  const craters: [number, number, number, number][] = [
    [ 10,  14,  7, 0.45], [-14,  -6,  6, 0.40],
    [ 12, -14,  4, 0.38], [-18,  16,  5, 0.42],
    [ 24,   2,  4, 0.35], [ -2,  24,  5, 0.40],
    [ 18, -24,  3, 0.30], [-28,   4,  4, 0.38],
    [-10,  30,  3, 0.32], [ 28, -10,  3, 0.35],
  ];
  craters.forEach(([cx, cy, cr, a]) => {
    ctx.globalAlpha = a;
    const cg = ctx.createRadialGradient(mx + cx - 1, my + cy - 1, 0, mx + cx, my + cy, cr);
    cg.addColorStop(0, '#70300a');
    cg.addColorStop(0.6, '#a05010');
    cg.addColorStop(1, 'transparent');
    ctx.beginPath(); ctx.arc(mx + cx, my + cy, cr, 0, Math.PI * 2);
    ctx.fillStyle = cg; ctx.fill();
  });
  ctx.globalCompositeOperation = 'source-over';
  ctx.globalAlpha = 1;

  // Clave de sol GRANDE incandescente sobre a lua (assinatura do jogo)
  drawTrebleClef(ctx, mx + 1, my + 6, 56, 0.22, 'rgba(250, 232, 180, 0.65)');

  // Reflexo brilhante no topo da lua
  const shine = ctx.createRadialGradient(mx - 16, my - 18, 0, mx - 16, my - 18, 22);
  shine.addColorStop(0, 'rgba(255, 255, 240, 0.55)');
  shine.addColorStop(1, 'transparent');
  ctx.beginPath(); ctx.arc(mx - 16, my - 18, 22, 0, Math.PI * 2);
  ctx.fillStyle = shine; ctx.fill();

  // ── 9. Nuvens de névoa etérea no horizonte do céu ────────────────────────────
  for (let nc = 0; nc < 5; nc++) {
    const ncx = rnd() * GW;
    const ncy = GH * (0.55 + rnd() * 0.15);
    const ncw = 180 + rnd() * 200;
    const nch = 18 + rnd() * 22;
    const ncg = ctx.createRadialGradient(ncx, ncy, 0, ncx, ncy, ncw * 0.5);
    ncg.addColorStop(0, 'rgba(140, 100, 200, 0.06)');
    ncg.addColorStop(0.5, 'rgba(100, 60, 160, 0.03)');
    ncg.addColorStop(1, 'transparent');
    ctx.beginPath();
    ctx.ellipse(ncx, ncy, ncw * 0.5, nch, 0, 0, Math.PI * 2);
    ctx.fillStyle = ncg; ctx.fill();
  }

  return c;
})();

// ═══════════════════════════════════════════════════════════════════════════════
// bgCastle — Cidade de tubos de órgão em perspectiva noturna
// ═══════════════════════════════════════════════════════════════════════════════
export const bgCastle = (() => {
  const c = document.createElement('canvas');
  c.width = GW; c.height = GH;
  const ctx = c.getContext('2d')!;
  const rnd = makePRNG(7);

  // ── 1. Gradiente base do chão ─────────────────────────────────────────────────
  const baseGrad = ctx.createLinearGradient(0, GH * 0.55, 0, GH);
  baseGrad.addColorStop(0, '#0a0220');
  baseGrad.addColorStop(0.5, '#050110');
  baseGrad.addColorStop(1, '#020008');
  ctx.fillStyle = baseGrad;
  ctx.fillRect(0, GH * 0.55, GW, GH * 0.45);

  // ── 2. Camadas de tubos de órgão em perspectiva atmosférica ──────────────────
  interface PipeLayer {
    groundFrac: number;
    colorLight: string;
    colorDark: string;
    scale: number;
    density: number;
    fogAlpha: number;
  }

  const pipeLayers: PipeLayer[] = [
    { groundFrac: 0.62, colorLight: '#1c0a40', colorDark: '#0a011a', scale: 0.38, density: 1.8, fogAlpha: 0.85 },
    { groundFrac: 0.65, colorLight: '#200d48', colorDark: '#0d0220', scale: 0.55, density: 1.3, fogAlpha: 0.65 },
    { groundFrac: 0.68, colorLight: '#160530', colorDark: '#080118', scale: 0.75, density: 1.0, fogAlpha: 0.45 },
    { groundFrac: 0.72, colorLight: '#0e0328', colorDark: '#04000f', scale: 1.00, density: 0.75, fogAlpha: 0.20 },
    { groundFrac: 0.76, colorLight: '#090120', colorDark: '#02000a', scale: 1.30, density: 0.55, fogAlpha: 0.00 },
  ];

  pipeLayers.forEach(layer => {
    const groundY = GH * layer.groundFrac;

    // Chão desta camada
    const floorG = ctx.createLinearGradient(0, groundY - 10, 0, groundY + 30);
    floorG.addColorStop(0, layer.colorLight);
    floorG.addColorStop(1, layer.colorDark);
    ctx.fillStyle = floorG;
    ctx.fillRect(0, groundY - 10, GW, GH - groundY + 10);

    const pipeCount = Math.floor(38 * layer.density);

    for (let i = 0; i < pipeCount; i++) {
      const cx  = (i / pipeCount) * GW + (rnd() * 28 - 14);
      const pw  = (7 + rnd() * 18) * layer.scale;
      const ph  = (45 + rnd() * 170) * layer.scale;
      const ty  = groundY - ph;

      // Pula pipes fora da tela
      if (cx + pw < 0 || cx - pw > GW) continue;

      // ── Corpo do tubo ──────────────────────────────────────────────────────
      const pipeGrad = ctx.createLinearGradient(cx - pw * 0.5, 0, cx + pw * 0.5, 0);
      pipeGrad.addColorStop(0.00, layer.colorDark);
      pipeGrad.addColorStop(0.20, layer.colorLight);
      pipeGrad.addColorStop(0.50, adjustBrightness(layer.colorLight, 1.4));
      pipeGrad.addColorStop(0.80, layer.colorLight);
      pipeGrad.addColorStop(1.00, '#000000');
      ctx.fillStyle = pipeGrad;
      ctx.fillRect(cx - pw * 0.5, ty, pw, ph);

      // ── Topo biselado (corte diagonal) ────────────────────────────────────
      const bevelH = pw * 0.6;
      ctx.beginPath();
      ctx.moveTo(cx - pw * 0.5, ty);
      ctx.lineTo(cx + pw * 0.5, ty - bevelH);
      ctx.lineTo(cx + pw * 0.5, ty);
      ctx.closePath();
      ctx.fillStyle = adjustBrightness(layer.colorLight, 1.6);
      ctx.fill();

      // ── Boca do tubo (abertura com profundidade) ──────────────────────────
      const mouthY = ty + ph * (0.08 + rnd() * 0.06);
      const mouthW = pw * 0.42;
      const mouthH = pw * 0.22;

      // Sombra interior
      ctx.fillStyle = '#030009';
      ctx.beginPath();
      ctx.ellipse(cx, mouthY, mouthW, mouthH, 0, 0, Math.PI * 2);
      ctx.fill();

      // Lábio inferior reflexivo
      const lipGrad = ctx.createLinearGradient(cx - mouthW, mouthY, cx + mouthW, mouthY + mouthH);
      lipGrad.addColorStop(0, layer.colorLight);
      lipGrad.addColorStop(0.5, adjustBrightness(layer.colorLight, 1.8));
      lipGrad.addColorStop(1, layer.colorDark);
      ctx.fillStyle = lipGrad;
      ctx.beginPath();
      ctx.ellipse(cx, mouthY + mouthH * 0.6, mouthW * 0.9, mouthH * 0.5, 0, 0, Math.PI * 2);
      ctx.fill();

      // ── Decorações: faixa de metal ────────────────────────────────────────
      if (rnd() > 0.55) {
        const bandY = ty + ph * (0.5 + rnd() * 0.25);
        const bandGrad = ctx.createLinearGradient(cx - pw * 0.5, 0, cx + pw * 0.5, 0);
        bandGrad.addColorStop(0, 'rgba(80,40,120,0.4)');
        bandGrad.addColorStop(0.5, 'rgba(160,100,220,0.6)');
        bandGrad.addColorStop(1, 'rgba(40,20,80,0.3)');
        ctx.fillStyle = bandGrad;
        ctx.fillRect(cx - pw * 0.5, bandY, pw, pw * 0.18 * layer.scale);
      }

      // ── Nota flutuando sobre o tubo (efeito musical) ──────────────────────
      if (rnd() > 0.80) {
        const noteAlpha = 0.25 + rnd() * 0.30;
        const noteSize = 8 + rnd() * 10;
        const noteVariant = rnd() > 0.5 ? 'eighth' : 'quarter';
        const noteColors = ['rgba(200,160,255,1)', 'rgba(255,200,100,1)', 'rgba(150,200,255,1)'];
        const noteColor = noteColors[Math.floor(rnd() * 3)];
        drawMusicalNote(ctx, cx, ty - noteSize - rnd() * 15, noteSize, noteAlpha * layer.scale, noteColor, noteVariant as any);
      }

      // ── Névoa atmosférica (oclusão de distância) ─────────────────────────
      if (layer.fogAlpha > 0) {
        const fogGrad = ctx.createLinearGradient(0, ty, 0, groundY);
        fogGrad.addColorStop(0, `rgba(5,1,18,${layer.fogAlpha})`);
        fogGrad.addColorStop(1, 'transparent');
        ctx.fillStyle = fogGrad;
        ctx.fillRect(cx - pw * 0.5, ty, pw, ph);
      }
    }
  });

  // ── 3. Janelas brilhantes nos tubos maiores ───────────────────────────────────
  const windowRnd = makePRNG(99);
  for (let w = 0; w < 22; w++) {
    const wx = windowRnd() * GW;
    const wy = GH * (0.45 + windowRnd() * 0.22);
    const ww = 4 + windowRnd() * 8;
    const wh = 6 + windowRnd() * 10;
    const windowColors = ['rgba(255,200,80,', 'rgba(200,160,255,', 'rgba(100,180,255,'];
    const wc = windowColors[Math.floor(windowRnd() * 3)];
    const wa = 0.3 + windowRnd() * 0.4;

    // Glow exterior da janela
    const wGlow = ctx.createRadialGradient(wx, wy, 0, wx, wy, ww * 3);
    wGlow.addColorStop(0, wc + '0.2)');
    wGlow.addColorStop(1, 'transparent');
    ctx.beginPath(); ctx.arc(wx, wy, ww * 3, 0, Math.PI * 2);
    ctx.fillStyle = wGlow; ctx.fill();

    ctx.fillStyle = wc + wa + ')';
    ctx.fillRect(wx - ww / 2, wy - wh / 2, ww, wh);
  }

  // ── 4. Névoa no chão (camadas de bruma colorida) ─────────────────────────────
  const mistLayers = [
    { y: GH * 0.64, h: GH * 0.12, color: 'rgba(10, 4, 30, 0.85)' },
    { y: GH * 0.70, h: GH * 0.08, color: 'rgba(6, 2, 18, 0.92)' },
    { y: GH * 0.76, h: GH * 0.12, color: 'rgba(3, 1, 10, 0.96)' },
  ];
  mistLayers.forEach(m => {
    const mg = ctx.createLinearGradient(0, m.y, 0, m.y + m.h);
    mg.addColorStop(0, 'transparent');
    mg.addColorStop(0.4, m.color);
    mg.addColorStop(1, m.color);
    ctx.fillStyle = mg;
    ctx.fillRect(0, m.y, GW, m.h);
  });

  // ── 5. Silhueta de castelo gótico ao fundo (centro) ───────────────────────────
  const castleX = GW * 0.50;
  const castleBaseY = GH * 0.64;

  ctx.fillStyle = '#030008';
  ctx.globalAlpha = 0.9;

  // Torre central
  drawGothicTower(ctx, castleX, castleBaseY, 28, 95, 0.9);
  // Torres laterais
  drawGothicTower(ctx, castleX - 55, castleBaseY, 18, 65, 0.7);
  drawGothicTower(ctx, castleX + 55, castleBaseY, 18, 65, 0.7);
  drawGothicTower(ctx, castleX - 110, castleBaseY, 12, 45, 0.5);
  drawGothicTower(ctx, castleX + 110, castleBaseY, 12, 45, 0.5);

  ctx.globalAlpha = 1;

  return c;
})();

/** Desenha uma torre gótica simples (silhueta) */
function drawGothicTower(
  ctx: CanvasRenderingContext2D,
  cx: number,
  baseY: number,
  halfW: number,
  height: number,
  _alpha: number,
) {
  ctx.beginPath();
  // Corpo
  ctx.rect(cx - halfW, baseY - height, halfW * 2, height);
  // Pináculo (topo pontiagudo)
  ctx.moveTo(cx - halfW, baseY - height);
  ctx.lineTo(cx, baseY - height - halfW * 2.2);
  ctx.lineTo(cx + halfW, baseY - height);
  ctx.fill();

  // Ameias (merlões)
  const merlonW = halfW * 0.38;
  const merlonH = halfW * 0.45;
  const numMerlons = Math.floor((halfW * 2) / (merlonW * 2.2));
  const startX = cx - halfW;
  for (let m = 0; m < numMerlons; m++) {
    const mx = startX + m * (halfW * 2 / numMerlons);
    ctx.fillRect(mx + merlonW * 0.2, baseY - height - merlonH, merlonW, merlonH);
  }

  // Janela arqueada com luz
  const winY = baseY - height * 0.55;
  const winW = halfW * 0.45;
  const winH = halfW * 0.7;
  const winGlow = ctx.createRadialGradient(cx, winY, 0, cx, winY, winW * 2.5);
  winGlow.addColorStop(0, 'rgba(255, 200, 80, 0.25)');
  winGlow.addColorStop(1, 'transparent');
  ctx.fillStyle = winGlow;
  ctx.beginPath(); ctx.arc(cx, winY, winW * 2.5, 0, Math.PI * 2); ctx.fill();

  ctx.fillStyle = 'rgba(255, 200, 80, 0.55)';
  ctx.beginPath();
  ctx.rect(cx - winW * 0.5, winY, winW, winH * 0.5);
  ctx.arc(cx, winY, winW * 0.5, Math.PI, 0); // arco
  ctx.fill();

  ctx.fillStyle = '#030008'; // volta pro preto
}

// ═══════════════════════════════════════════════════════════════════════════════
// bgFloor — Piso de perspectiva: partitura em fuga + teclas de piano + harpa
// ═══════════════════════════════════════════════════════════════════════════════
export const bgFloor = (() => {
  const c = document.createElement('canvas');
  c.width = GW; c.height = GH;
  const ctx = c.getContext('2d')!;

  const horizonY = GH * 0.640;
  const vanishX  = GW * 0.500;
  const vanishY  = GH * 0.500;

  // ── 1. Gradiente do piso ─────────────────────────────────────────────────────
  const floorGrad = ctx.createLinearGradient(0, horizonY, 0, GH);
  floorGrad.addColorStop(0.00, '#0e0325');
  floorGrad.addColorStop(0.30, '#080218');
  floorGrad.addColorStop(0.70, '#040110');
  floorGrad.addColorStop(1.00, '#020008');
  ctx.fillStyle = floorGrad;
  ctx.fillRect(0, horizonY, GW, GH - horizonY);

  // ── 2. Linha de horizonte com brilho ─────────────────────────────────────────
  const horizGlow = ctx.createLinearGradient(0, horizonY - 8, 0, horizonY + 20);
  horizGlow.addColorStop(0, 'transparent');
  horizGlow.addColorStop(0.45, 'rgba(180, 80, 255, 0.75)');
  horizGlow.addColorStop(0.55, 'rgba(220, 120, 255, 0.90)');
  horizGlow.addColorStop(1, 'transparent');
  ctx.fillStyle = horizGlow;
  ctx.fillRect(0, horizonY - 8, GW, 28);

  ctx.shadowBlur = 12;
  ctx.shadowColor = 'rgba(200, 100, 255, 0.8)';
  ctx.strokeStyle = 'rgba(220, 140, 255, 0.9)';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(0, horizonY); ctx.lineTo(GW, horizonY);
  ctx.stroke();
  ctx.shadowBlur = 0;

  // ── 3. Partitura em perspectiva (5 linhas que convergem no ponto de fuga) ─────
  const staffSpread = 420; // largura da partitura na base da tela

  ctx.shadowBlur = 8;
  ctx.shadowColor = 'rgba(200, 140, 255, 0.7)';
  for (let line = 0; line < 5; line++) {
    const frac = line / 4; // 0 .. 1
    // Posição X na base: spread em torno do centro
    const bottomX = GW / 2 - staffSpread / 2 + frac * staffSpread;
    const alpha = 0.55 + (line === 0 || line === 4 ? 0.2 : 0);
    ctx.strokeStyle = `rgba(210, 150, 255, ${alpha})`;
    ctx.lineWidth = 1.2 + (line === 0 || line === 4 ? 0.4 : 0);
    ctx.beginPath();
    ctx.moveTo(vanishX, vanishY);
    ctx.lineTo(bottomX, GH + 10);
    ctx.stroke();
  }

  // Linhas horizontais da pauta (perspective foreshortening)
  ctx.shadowBlur = 4;
  for (let row = 0; row < 16; row++) {
    const t = Math.pow((row + 1) / 17, 1.7);
    const py = horizonY + (GH - horizonY) * t;
    const spreadAtY = staffSpread * ((py - vanishY) / (GH - vanishY));
    const lx = vanishX - spreadAtY / 2;
    const rx = vanishX + spreadAtY / 2;
    const alpha = 0.20 + t * 0.35;
    ctx.strokeStyle = `rgba(210, 150, 255, ${alpha})`;
    ctx.lineWidth = 0.8 + t * 0.8;
    ctx.beginPath();
    ctx.moveTo(lx, py); ctx.lineTo(rx, py);
    ctx.stroke();
  }
  ctx.shadowBlur = 0;

  // ── 4. Teclas de piano em perspectiva (lateral à partitura central) ────────────
  const keySpreadOuter = 700;

  for (let row = 0; row < 40; row++) {
    const t1 = Math.pow((row + 0.0) / 42, 1.55);
    const t2 = Math.pow((row + 0.9) / 42, 1.55);
    const py1 = horizonY + (GH - horizonY) * t1;
    const py2 = horizonY + (GH - horizonY) * t2;
    if (py1 > GH + 5) break;

    const innerW1 = staffSpread  * ((py1 - vanishY) / (GH - vanishY));
    const innerW2 = staffSpread  * ((py2 - vanishY) / (GH - vanishY));
    const outerW1 = keySpreadOuter * ((py1 - vanishY) / (GH - vanishY));
    const outerW2 = keySpreadOuter * ((py2 - vanishY) / (GH - vanishY));

    // Grupos de 7 teclas brancas + 5 pretas = 12 semitons
    const isBlackKey = [1, 3, 0, 1, 3, 1, 0][row % 7] > 0; // padrão CDEFGAB

    // ── Teclas brancas ────────────────────────────────────────────────────────
    const brightness = row % 2 === 0 ? 0.55 : 0.42;
    const wkGrad = ctx.createLinearGradient(0, py1, 0, py2);
    wkGrad.addColorStop(0, `rgba(140, 120, 170, ${brightness})`);
    wkGrad.addColorStop(1, `rgba(80, 60, 110, ${brightness * 0.7})`);

    // Tecla esquerda
    ctx.fillStyle = wkGrad;
    ctx.beginPath();
    ctx.moveTo(vanishX - innerW1 / 2, py1);
    ctx.lineTo(vanishX - innerW2 / 2, py2);
    ctx.lineTo(vanishX - outerW2 / 2, py2);
    ctx.lineTo(vanishX - outerW1 / 2, py1);
    ctx.fill();
    ctx.strokeStyle = 'rgba(30, 15, 50, 0.5)';
    ctx.lineWidth = 0.8;
    ctx.stroke();

    // Tecla direita
    ctx.fillStyle = wkGrad;
    ctx.beginPath();
    ctx.moveTo(vanishX + innerW1 / 2, py1);
    ctx.lineTo(vanishX + innerW2 / 2, py2);
    ctx.lineTo(vanishX + outerW2 / 2, py2);
    ctx.lineTo(vanishX + outerW1 / 2, py1);
    ctx.fill();
    ctx.stroke();

    // ── Teclas pretas (sobrepostas) ────────────────────────────────────────
    if (isBlackKey) {
      const bkAlpha = 0.75;
      ctx.fillStyle = `rgba(10, 4, 22, ${bkAlpha})`;

      const bInner1 = innerW1 * 1.0;
      const bInner2 = innerW2 * 1.0;
      const bOuter1 = innerW1 + (outerW1 - innerW1) * 0.52;
      const bOuter2 = innerW2 + (outerW2 - innerW2) * 0.52;

      // Esquerda preta
      ctx.beginPath();
      ctx.moveTo(vanishX - bInner1 / 2, py1);
      ctx.lineTo(vanishX - bInner2 / 2, py2);
      ctx.lineTo(vanishX - bOuter2 / 2, py2);
      ctx.lineTo(vanishX - bOuter1 / 2, py1);
      ctx.fill();

      // Reflexo sutil
      ctx.fillStyle = 'rgba(60, 30, 100, 0.18)';
      ctx.beginPath();
      ctx.moveTo(vanishX - bInner1 / 2, py1);
      ctx.lineTo(vanishX - bInner2 / 2, py2);
      ctx.lineTo(vanishX - (bOuter2 * 0.85) / 2, py2);
      ctx.lineTo(vanishX - (bOuter1 * 0.85) / 2, py1);
      ctx.fill();

      // Direita preta
      ctx.fillStyle = `rgba(10, 4, 22, ${bkAlpha})`;
      ctx.beginPath();
      ctx.moveTo(vanishX + bInner1 / 2, py1);
      ctx.lineTo(vanishX + bInner2 / 2, py2);
      ctx.lineTo(vanishX + bOuter2 / 2, py2);
      ctx.lineTo(vanishX + bOuter1 / 2, py1);
      ctx.fill();

      ctx.fillStyle = 'rgba(60, 30, 100, 0.18)';
      ctx.beginPath();
      ctx.moveTo(vanishX + bInner1 / 2, py1);
      ctx.lineTo(vanishX + bInner2 / 2, py2);
      ctx.lineTo(vanishX + (bOuter2 * 0.85) / 2, py2);
      ctx.lineTo(vanishX + (bOuter1 * 0.85) / 2, py1);
      ctx.fill();
    }
  }

  // ── 5. Reflexos e luz no piso ─────────────────────────────────────────────────
  // Reflexo da lua no piso (coluna de luz)
  const moonReflect = ctx.createLinearGradient(GW * 0.80 - 40, horizonY, GW * 0.80 + 40, horizonY);
  moonReflect.addColorStop(0, 'transparent');
  moonReflect.addColorStop(0.3, 'rgba(255, 200, 80, 0.06)');
  moonReflect.addColorStop(0.5, 'rgba(255, 220, 120, 0.10)');
  moonReflect.addColorStop(0.7, 'rgba(255, 200, 80, 0.06)');
  moonReflect.addColorStop(1, 'transparent');
  ctx.fillStyle = moonReflect;
  ctx.fillRect(GW * 0.65, horizonY, GW * 0.30, GH - horizonY);

  // Brilho central do ponto de fuga
  const vpGlow = ctx.createRadialGradient(vanishX, horizonY, 0, vanishX, horizonY, 200);
  vpGlow.addColorStop(0, 'rgba(160, 80, 255, 0.12)');
  vpGlow.addColorStop(0.4, 'rgba(120, 60, 200, 0.06)');
  vpGlow.addColorStop(1, 'transparent');
  ctx.beginPath(); ctx.ellipse(vanishX, horizonY, 200, 80, 0, 0, Math.PI * 2);
  ctx.fillStyle = vpGlow; ctx.fill();

  // ── 6. Pilares de harpa dos lados ─────────────────────────────────────────────
  const harpPositions = [
    { x: 45,      scale: 1.30, side: 'left'  },
    { x: 200,     scale: 0.75, side: 'left'  },
    { x: 380,     scale: 0.50, side: 'left'  },
    { x: GW - 45,  scale: 1.30, side: 'right' },
    { x: GW - 200, scale: 0.75, side: 'right' },
    { x: GW - 380, scale: 0.50, side: 'right' },
  ];
  harpPositions.forEach(hp => drawHarpPillar(ctx, hp.x, horizonY, hp.scale));

  // ── 7. Névoa do chão (3 camadas cromáticas) ──────────────────────────────────
  [
    { y: horizonY, h: GH * 0.10, r: 80, g: 20, b: 160, a: 0.28 },
    { y: horizonY + GH * 0.08, h: GH * 0.08, r: 50, g: 10, b: 120, a: 0.22 },
    { y: horizonY + GH * 0.15, h: GH * 0.10, r: 20, g: 5, b: 80, a: 0.18 },
  ].forEach(m => {
    const mg = ctx.createLinearGradient(0, m.y, 0, m.y + m.h);
    mg.addColorStop(0, 'transparent');
    mg.addColorStop(0.5, `rgba(${m.r},${m.g},${m.b},${m.a})`);
    mg.addColorStop(1, 'transparent');
    ctx.fillStyle = mg;
    ctx.fillRect(0, m.y, GW, m.h);
  });

  return c;
})();

/** Pilar de harpa com cordas e orbe luminoso */
function drawHarpPillar(ctx: CanvasRenderingContext2D, cx: number, baseY: number, scale: number): void {
  const pw  = 22 * scale;
  const ph  = GH * 0.38 * scale;
  const topY = baseY - ph;
  const dir  = cx < GW / 2 ? 1 : -1; // espelha para lado direito

  ctx.save();
  ctx.translate(cx, 0);
  ctx.scale(dir, 1);

  // Coluna
  const colGrad = ctx.createLinearGradient(-pw / 2, 0, pw / 2, 0);
  colGrad.addColorStop(0.00, '#080118');
  colGrad.addColorStop(0.35, '#1e0850');
  colGrad.addColorStop(0.65, '#2a0e68');
  colGrad.addColorStop(1.00, '#05010f');
  ctx.fillStyle = colGrad;
  ctx.fillRect(-pw / 2, topY, pw * 0.35, ph);

  // Base da coluna
  ctx.fillStyle = '#030008';
  ctx.fillRect(-pw * 0.7, baseY - ph * 0.08, pw * 1.2, ph * 0.08);

  // Pescoço arqueado da harpa
  ctx.beginPath();
  const nw = pw * 1.4;
  ctx.moveTo(-pw / 2, topY + pw * 0.3);
  ctx.bezierCurveTo(nw, topY - pw * 0.6, nw * 1.5, topY + pw, nw * 1.2, topY + pw * 1.9);
  ctx.lineTo(nw * 0.9, topY + pw * 1.9);
  ctx.bezierCurveTo(nw * 1.1, topY + pw, nw * 0.7, topY + pw * 0.3, -pw / 2 + pw * 0.35, topY);
  ctx.closePath();
  ctx.fillStyle = colGrad;
  ctx.fill();

  // Cordas (com degradê de brilho)
  const numStrings = 7;
  for (let s = 0; s < numStrings; s++) {
    const t = s / (numStrings - 1);
    const sx = -pw / 2 + pw * 0.5 + s * pw * 0.14;
    const syTop = topY + pw * 0.9 + s * pw * 0.22;
    const stringAlpha = 0.25 + t * 0.20;
    const strGrad = ctx.createLinearGradient(sx, syTop, sx, baseY - ph * 0.06);
    strGrad.addColorStop(0, `rgba(255, 230, 160, ${stringAlpha})`);
    strGrad.addColorStop(0.5, `rgba(255, 200, 80, ${stringAlpha * 1.4})`);
    strGrad.addColorStop(1, `rgba(200, 160, 60, ${stringAlpha * 0.6})`);
    ctx.strokeStyle = strGrad;
    ctx.lineWidth = (0.8 + t * 0.5) * scale;
    ctx.beginPath();
    ctx.moveTo(sx, syTop);
    ctx.lineTo(sx, baseY - ph * 0.06);
    ctx.stroke();
  }

  // Orbe luminoso na base
  const orbX = -pw / 2 + pw * 0.6;
  const orbY = baseY - ph * 0.04;
  const orbR = 12 * scale;

  [orbR * 2.5, orbR * 1.5, orbR].forEach((r, i) => {
    const og = ctx.createRadialGradient(orbX, orbY, 0, orbX, orbY, r);
    const alphas = [0.08, 0.20, 0.70];
    og.addColorStop(0, `rgba(200, 100, 255, ${alphas[i]})`);
    og.addColorStop(1, 'transparent');
    ctx.beginPath(); ctx.arc(orbX, orbY, r, 0, Math.PI * 2);
    ctx.fillStyle = og; ctx.fill();
  });

  ctx.fillStyle = '#ffffff';
  ctx.globalAlpha = 0.9 * scale;
  ctx.beginPath(); ctx.arc(orbX, orbY, 2.5 * scale, 0, Math.PI * 2); ctx.fill();
  ctx.globalAlpha = 1;

  ctx.restore();
}

// ─── Torches (chamado todo frame no loop principal) ───────────────────────────
export function drawTorches(ctx: CanvasRenderingContext2D, torches: any[]): void {
  torches.forEach(torch => {
    torch.flicker += torch.flickerSpeed;
    const fl = Math.sin(torch.flicker) * 0.28 + 0.72;
    const tx = torch.x as number;
    const ty = torch.y as number;

    // Suporte da tocha (madeira escura)
    ctx.fillStyle = '#1e1008';
    ctx.fillRect(tx - 3, ty, 6, 18);
    // Cabeça com metal
    ctx.fillStyle = '#3a2800';
    ctx.fillRect(tx - 7, ty - 4, 14, 7);
    ctx.fillStyle = '#5a4010';
    ctx.fillRect(tx - 5, ty - 2, 10, 3);

    // Halo de luz ambiente no chão/parede
    const ambient = ctx.createRadialGradient(tx, ty - 4, 4, tx, ty - 4, 55 * fl);
    ambient.addColorStop(0.00, `rgba(255, 150, 20, ${0.18 * fl})`);
    ambient.addColorStop(0.40, `rgba(255, 80, 0, ${0.08 * fl})`);
    ambient.addColorStop(0.70, `rgba(200, 50, 0, ${0.03 * fl})`);
    ambient.addColorStop(1.00, 'transparent');
    ctx.beginPath(); ctx.arc(tx, ty - 4, 55 * fl, 0, Math.PI * 2);
    ctx.fillStyle = ambient; ctx.fill();

    // Chama — 3 camadas
    // Camada exterior (laranja)
    ctx.save();
    ctx.scale(1, fl * 0.75 + 0.25);
    const outerFlame = ctx.createRadialGradient(tx, ty - 6, 2, tx, ty - 14, 14 * fl);
    outerFlame.addColorStop(0.00, '#ffcc40');
    outerFlame.addColorStop(0.35, `rgba(255, 90, 0, ${0.92 * fl})`);
    outerFlame.addColorStop(0.75, `rgba(200, 30, 0, ${0.4 * fl})`);
    outerFlame.addColorStop(1.00, 'transparent');
    ctx.beginPath(); ctx.ellipse(tx, ty - 10, 10 * fl, 16 * fl, 0, 0, Math.PI * 2);
    ctx.fillStyle = outerFlame; ctx.fill();

    // Camada interior (amarela)
    const innerFlame = ctx.createRadialGradient(tx, ty - 8, 1, tx, ty - 14, 8 * fl);
    innerFlame.addColorStop(0, '#ffffcc');
    innerFlame.addColorStop(0.4, '#ffdd44');
    innerFlame.addColorStop(1, 'transparent');
    ctx.beginPath(); ctx.ellipse(tx, ty - 12, 5 * fl, 10 * fl, 0, 0, Math.PI * 2);
    ctx.fillStyle = innerFlame; ctx.fill();

    // Núcleo branco brilhante
    const coreFlame = ctx.createRadialGradient(tx, ty - 10, 0, tx, ty - 10, 4);
    coreFlame.addColorStop(0, 'rgba(255,255,255,0.95)');
    coreFlame.addColorStop(1, 'transparent');
    ctx.beginPath(); ctx.arc(tx, ty - 10, 4, 0, Math.PI * 2);
    ctx.fillStyle = coreFlame; ctx.fill();
    ctx.restore();

    // Faíscas
    if (Math.random() > 0.85) {
      ctx.fillStyle = '#ffee88';
      const sparkX = tx + (Math.random() - 0.5) * 8;
      const sparkY = ty - 20 - Math.random() * 15;
      ctx.beginPath(); ctx.arc(sparkX, sparkY, 0.8, 0, Math.PI * 2); ctx.fill();
    }
  });
}

// ─── Helper: clareia uma cor hex ─────────────────────────────────────────────
function adjustBrightness(hex: string, factor: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const clamp = (v: number) => Math.min(255, Math.max(0, Math.round(v * factor)));
  return `rgb(${clamp(r)}, ${clamp(g)}, ${clamp(b)})`;
}
