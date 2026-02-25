// ─── Mozart — personagem principal ───────────────────────────────────────────
//
// worldX, worldY = ponto de âncora = BASE DOS PÉS de Mozart no canvas.
// Todo o desenho usa Y negativo para cima.
// Scale interna: 1.5x
//
// Exporta getMozartBatonTip() para que PlayerProjectile nasça na ponta da batuta.

// ─── Estado de animação ───────────────────────────────────────────────────────

let _shootFlash = 0;

export function triggerMozartShoot(): void {
  _shootFlash = 15;
}

let _batonTipWorldX = 185;
let _batonTipWorldY = 170;

export function getMozartBatonTip(): { x: number; y: number } {
  return { x: _batonTipWorldX, y: _batonTipWorldY };
}

// ─── Desenho ──────────────────────────────────────────────────────────────────

export function drawMozart(
  ctx: CanvasRenderingContext2D,
  worldX: number,
  worldY: number,
  anger = 0,
  hitFlash = 0,
  frame = 0,
) {
  if (_shootFlash > 0) _shootFlash--;

  ctx.save();

  // Bob vertical sutil
  const bobY   = Math.sin(frame * 0.07) * 3;
  const bobRot = Math.sin(frame * 0.045) * 0.035;

  ctx.translate(worldX, worldY + bobY);
  ctx.rotate(bobRot);

  const S = 1.5;
  ctx.scale(S, S);

  // Flash de dano
  if (hitFlash > 0) {
    ctx.shadowBlur   = 45;
    ctx.shadowColor  = '#ff2200';
    ctx.globalAlpha  = 0.78 + Math.sin(hitFlash * 0.9) * 0.22;
  }

  // ── Layout vertical (Y negativo = acima dos pés) ──────────────────────────
  // Pés/sapatos:      Y =   0
  // Tornozelos:       Y =  -5
  // Joelhos:          Y = -20
  // Cintura:          Y = -40
  // Ombros:           Y = -75
  // Pescoço:          Y = -80
  // Centro da cabeça: Y = -96
  // Topo da peruca:   Y =-125

  // ── Sombra no chão ────────────────────────────────────────────────────────
  ctx.save();
  ctx.globalAlpha = hitFlash > 0 ? 0.08 : 0.16;
  ctx.scale(1, 0.25);
  ctx.beginPath();
  ctx.ellipse(2, 10, 22, 8, 0, 0, Math.PI * 2);
  ctx.fillStyle = '#000000';
  ctx.fill();
  ctx.restore();

  // ── Aura de raiva ─────────────────────────────────────────────────────────
  if (anger > 0.15) {
    const ar = 52 + anger * 18;
    const ag = ctx.createRadialGradient(0, -65, 10, 0, -65, ar);
    ag.addColorStop(0, `rgba(255,70,0,${anger * 0.14})`);
    ag.addColorStop(1, 'transparent');
    ctx.beginPath(); ctx.arc(0, -65, ar, 0, Math.PI * 2);
    ctx.fillStyle = ag; ctx.fill();
  }

  // ── Calcular pose do braço direito e ponta da batuta ──────────────────────
  const conductCycle = Math.sin(frame * 0.12) * 0.85 + Math.sin(frame * 0.07) * 0.35;
  const shootBurst   = _shootFlash > 0 ? Math.pow(_shootFlash / 15, 0.5) : 0;

  const batonAngle  = -0.75 + anger * 0.28 + conductCycle * 0.20 - shootBurst * 0.50;
  const batonLength = 36 + anger * 7 + shootBurst * 10;

  // Punho direito em coords locais (Y negativo = acima dos pés)
  const wristX =  22 + anger * 7  + conductCycle * 3.5;
  const wristY = -68 - anger * 5  - conductCycle * 4 - shootBurst * 7;

  // Ponta da batuta em coords locais
  const tipLX = wristX + Math.cos(batonAngle) * batonLength;
  const tipLY = wristY + Math.sin(batonAngle) * batonLength;

  // ── Converter ponta para espaço do mundo e exportar ──────────────────────
  const cosR = Math.cos(bobRot), sinR = Math.sin(bobRot);
  _batonTipWorldX = worldX + (cosR * tipLX  - sinR * tipLY)  * S;
  _batonTipWorldY = worldY + bobY + (sinR * tipLX + cosR * tipLY) * S;

  // ─────────────────────────────────────────────────────────────────────────
  // CONSTANTES DE COR
  // ─────────────────────────────────────────────────────────────────────────
  const coatPri  = '#7a0c1e';
  const coatDark = '#3a050e';
  const coatHi   = '#aa1e30';
  const coatShad = '#280409';
  const gold     = '#d4a030';
  const goldDk   = '#8a6010';
  const skin     = '#ffd5a8';
  const skinSh   = '#e8b888';

  // ── 1. Pernas (calças brancas, meias brancas) ─────────────────────────────
  // Meias brancas (Y -5 a 0)
  ctx.fillStyle   = '#f0ece0';
  ctx.strokeStyle = '#c0bca8';
  ctx.lineWidth   = 0.7;
  ctx.beginPath();
  ctx.moveTo(-10, -8); ctx.bezierCurveTo(-11, -4, -10, -1, -8, 0);
  ctx.lineTo(-2, 0);   ctx.bezierCurveTo(-4, -1, -4, -4, -3, -8);
  ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(3, -8);  ctx.bezierCurveTo(4, -4, 3, -1, 2, 0);
  ctx.lineTo(8, 0);   ctx.bezierCurveTo(10, -1, 11, -4, 10, -8);
  ctx.closePath(); ctx.fill(); ctx.stroke();

  // Calças (Y -40 a -8)
  ctx.fillStyle   = '#e8e0d0';
  ctx.strokeStyle = '#b8b0a0';
  ctx.lineWidth   = 0.8;
  ctx.beginPath();
  ctx.moveTo(-12, -40); ctx.bezierCurveTo(-13, -25, -12, -15, -10, -8);
  ctx.lineTo(-3, -8);   ctx.bezierCurveTo(-5, -15, -6, -25, -4, -40);
  ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(4, -40); ctx.bezierCurveTo(6, -25, 5, -15, 2, -8);
  ctx.lineTo(9, -8);  ctx.bezierCurveTo(12, -15, 12, -25, 10, -40);
  ctx.closePath(); ctx.fill(); ctx.stroke();

  // Sapatos pretos
  ctx.fillStyle   = '#1a0a04';
  ctx.strokeStyle = '#0a0402';
  ctx.lineWidth   = 0.5;
  ctx.beginPath(); ctx.ellipse(-5.5, 1.5, 8, 3, -0.08, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.ellipse( 5.5, 1.5, 8, 3,  0.08, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  // Fivelas douradas
  ctx.fillStyle = gold;
  ctx.beginPath(); ctx.rect(-9, -0.5, 5, 2.5); ctx.fill();
  ctx.beginPath(); ctx.rect( 4, -0.5, 5, 2.5); ctx.fill();

  // ── 2. Caudas do casaco ───────────────────────────────────────────────────
  const tailSwing = Math.sin(frame * 0.07) * 2.5;
  ctx.fillStyle   = coatDark;
  ctx.strokeStyle = coatShad;
  ctx.lineWidth   = 1;
  ctx.lineJoin    = 'round';

  // Cauda esq
  ctx.beginPath();
  ctx.moveTo(-8, -40);
  ctx.bezierCurveTo(-16, -25, -20 + tailSwing * 0.4, -10, -10 + tailSwing, -2);
  ctx.bezierCurveTo(-6, 2, -1, -2, 0, -8);
  ctx.bezierCurveTo(-2, -18, -3, -28, -2, -40);
  ctx.closePath(); ctx.fill(); ctx.stroke();
  // Cauda dir
  ctx.beginPath();
  ctx.moveTo(8, -40);
  ctx.bezierCurveTo(16, -25, 18 - tailSwing * 0.4, -10, 8 - tailSwing * 0.7, -2);
  ctx.bezierCurveTo(4, 2, 1, -2, 0, -8);
  ctx.bezierCurveTo(2, -18, 2, -28, 2, -40);
  ctx.closePath(); ctx.fill(); ctx.stroke();
  // Bordas douradas
  ctx.strokeStyle = gold; ctx.lineWidth = 1; ctx.globalAlpha = 0.45;
  ctx.beginPath(); ctx.moveTo(-8, -38); ctx.bezierCurveTo(-17, -23, -19, -8, -10, -3); ctx.stroke();
  ctx.beginPath(); ctx.moveTo( 8, -38); ctx.bezierCurveTo( 17, -23,  17, -8,  8, -3); ctx.stroke();
  ctx.globalAlpha = hitFlash > 0 ? 0.78 + Math.sin(hitFlash * 0.9) * 0.22 : 1;

  // ── 3. Braço esquerdo ─────────────────────────────────────────────────────
  const lSwing = Math.sin(frame * 0.07 + Math.PI) * 3.5;
  const lWX = -20 + lSwing * 0.3;
  const lWY = -48 + lSwing * 0.5;

  ctx.strokeStyle = coatPri; ctx.lineWidth = 8; ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(-13, -70); ctx.bezierCurveTo(-26, -60, -24, -52, lWX, lWY);
  ctx.stroke();
  ctx.strokeStyle = coatShad; ctx.lineWidth = 8; ctx.globalAlpha = 0.28;
  ctx.beginPath();
  ctx.moveTo(-13, -69); ctx.bezierCurveTo(-27, -59, -25, -51, lWX - 1, lWY + 1);
  ctx.stroke();
  ctx.globalAlpha = hitFlash > 0 ? 0.78 + Math.sin(hitFlash * 0.9) * 0.22 : 1;
  _drawCuff(ctx, lWX, lWY, 5);
  _drawHand(ctx, lWX, lWY + 2, false, skin, skinSh);

  // ── 4. Torso do casaco ────────────────────────────────────────────────────
  const torsoG = ctx.createLinearGradient(-20, -80, 20, -38);
  torsoG.addColorStop(0,    coatHi);
  torsoG.addColorStop(0.35, coatPri);
  torsoG.addColorStop(0.75, coatDark);
  torsoG.addColorStop(1,    coatShad);

  ctx.fillStyle   = torsoG;
  ctx.strokeStyle = coatShad;
  ctx.lineWidth   = 1.2;
  ctx.lineJoin    = 'round';
  ctx.lineCap     = 'round';

  ctx.beginPath();
  ctx.moveTo(-16, -77);                                   // ombro esq
  ctx.bezierCurveTo(-22, -63, -20, -50, -14, -40);       // lateral esq
  ctx.lineTo(-8, -40);                                    // cintura esq
  ctx.lineTo( 8, -40);                                    // cintura dir
  ctx.lineTo(14, -40);
  ctx.bezierCurveTo(20, -50, 20, -63, 16, -77);          // lateral dir
  ctx.closePath();
  ctx.fill(); ctx.stroke();

  // Reflexo lateral
  const shineG = ctx.createLinearGradient(-22, -77, -8, -40);
  shineG.addColorStop(0, 'rgba(255,200,160,0.09)');
  shineG.addColorStop(1, 'transparent');
  ctx.fillStyle = shineG;
  ctx.beginPath();
  ctx.moveTo(-16, -77); ctx.bezierCurveTo(-22, -63, -20, -50, -14, -40);
  ctx.lineTo(-8, -40); ctx.lineTo(-7, -77); ctx.closePath(); ctx.fill();

  // ── 5. Lapelas douradas ───────────────────────────────────────────────────
  ctx.fillStyle = gold; ctx.strokeStyle = goldDk; ctx.lineWidth = 0.8;
  ctx.beginPath();
  ctx.moveTo(-8, -77); ctx.quadraticCurveTo(-14, -65, -7, -55);
  ctx.lineTo(-3, -57); ctx.quadraticCurveTo(-10, -65, -6, -77);
  ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(8, -77); ctx.quadraticCurveTo(14, -65, 7, -55);
  ctx.lineTo(3, -57); ctx.quadraticCurveTo(10, -65, 6, -77);
  ctx.closePath(); ctx.fill(); ctx.stroke();

  // Botões
  [[-1, -69], [-1, -62], [-1, -55]].forEach(([bx, by]) => {
    ctx.fillStyle = '#ffe080'; ctx.strokeStyle = goldDk; ctx.lineWidth = 0.5;
    ctx.beginPath(); ctx.arc(bx, by, 1.6, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  });

  // Medalha
  ctx.fillStyle = '#ffe8a0'; ctx.strokeStyle = goldDk; ctx.lineWidth = 0.7;
  ctx.beginPath(); ctx.arc(0, -63, 3.2, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#ff4444';
  ctx.beginPath(); ctx.arc(0, -63, 1.6, 0, Math.PI * 2); ctx.fill();

  // ── 6. Jabot de renda (colarinho) ─────────────────────────────────────────
  const jabG = ctx.createLinearGradient(0, -79, 0, -55);
  jabG.addColorStop(0, '#ffffff');
  jabG.addColorStop(0.5, '#f2f2f2');
  jabG.addColorStop(1, '#d8d8d8');

  for (let layer = 0; layer < 3; layer++) {
    const ly = -79 + layer * 7;
    const lw = 8 - layer * 1.2;
    const lh = 9 - layer;
    ctx.fillStyle   = jabG;
    ctx.strokeStyle = '#c0c0c0';
    ctx.lineWidth   = 0.7;
    ctx.beginPath();
    ctx.moveTo(-lw, ly);
    ctx.bezierCurveTo(-lw - 2, ly + lh * 0.4, -lw + 2, ly + lh * 0.8, 0, ly + lh);
    ctx.bezierCurveTo( lw - 2, ly + lh * 0.8,  lw + 2, ly + lh * 0.4, lw, ly);
    ctx.quadraticCurveTo(0, ly - 3, -lw, ly);
    ctx.fill(); ctx.stroke();
  }

  // ── 7. Braço direito (com batuta) ─────────────────────────────────────────
  ctx.strokeStyle = coatPri; ctx.lineWidth = 8; ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(13, -73); ctx.bezierCurveTo(20, -64, wristX - 5, wristY + 8, wristX, wristY);
  ctx.stroke();
  ctx.strokeStyle = coatShad; ctx.lineWidth = 8; ctx.globalAlpha = 0.28;
  ctx.beginPath();
  ctx.moveTo(14, -72); ctx.bezierCurveTo(22, -63, wristX - 4, wristY + 9, wristX + 1, wristY + 1);
  ctx.stroke();
  ctx.globalAlpha = hitFlash > 0 ? 0.78 + Math.sin(hitFlash * 0.9) * 0.22 : 1;
  _drawCuff(ctx, wristX, wristY, 5);
  _drawHand(ctx, wristX + 1, wristY + 1, true, skin, skinSh);

  // ── 8. BATUTA ─────────────────────────────────────────────────────────────
  const btX1 = wristX + 2, btY1 = wristY - 1;
  const btX2 = tipLX,      btY2 = tipLY;
  const bLen  = Math.sqrt((btX2 - btX1) ** 2 + (btY2 - btY1) ** 2);
  const bAng  = Math.atan2(btY2 - btY1, btX2 - btX1);

  // Sombra
  ctx.strokeStyle = 'rgba(0,0,0,0.3)';
  ctx.lineWidth = 3; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(btX1 + 1, btY1 + 1); ctx.lineTo(btX2 + 1, btY2 + 1); ctx.stroke();

  // Corpo cônico
  ctx.save();
  ctx.translate(btX1, btY1); ctx.rotate(bAng);
  const batG = ctx.createLinearGradient(0, -2, 0, 2);
  batG.addColorStop(0,   '#f0e8d0');
  batG.addColorStop(0.4, '#d4c898');
  batG.addColorStop(1,   '#8a7840');
  ctx.fillStyle = batG; ctx.strokeStyle = 'rgba(0,0,0,0.35)'; ctx.lineWidth = 0.5;
  ctx.beginPath();
  ctx.moveTo(0, -2); ctx.lineTo(bLen, -0.7);
  ctx.lineTo(bLen, 0.7); ctx.lineTo(0, 2);
  ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.restore();

  // Esfera da ponta
  const tipR = 4.5 + shootBurst * 7;
  if (shootBurst > 0) {
    const sg = ctx.createRadialGradient(btX2, btY2, 0, btX2, btY2, tipR * 3.5);
    sg.addColorStop(0,   `rgba(100,220,255,${shootBurst * 0.85})`);
    sg.addColorStop(0.5, `rgba(60,160,255,${shootBurst * 0.35})`);
    sg.addColorStop(1,   'transparent');
    ctx.beginPath(); ctx.arc(btX2, btY2, tipR * 3.5, 0, Math.PI * 2);
    ctx.fillStyle = sg; ctx.fill();
  }
  const tipG = ctx.createRadialGradient(btX2 - 1, btY2 - 1, 0, btX2, btY2, tipR);
  tipG.addColorStop(0,   shootBurst > 0.3 ? '#aaeeff' : '#fffce0');
  tipG.addColorStop(0.5, shootBurst > 0.3 ? '#44aaff' : '#e0c060');
  tipG.addColorStop(1,   'transparent');
  ctx.shadowBlur  = shootBurst > 0 ? 16 : 7;
  ctx.shadowColor = shootBurst > 0 ? '#88ddff' : 'rgba(255,240,160,0.9)';
  ctx.beginPath(); ctx.arc(btX2, btY2, tipR, 0, Math.PI * 2);
  ctx.fillStyle = tipG; ctx.fill();
  ctx.shadowBlur = 0;

  // ── 9. Cabeça ─────────────────────────────────────────────────────────────
  const headCY = -96;  // centro da cabeça

  // Pescoço
  ctx.fillStyle   = skinSh;
  ctx.strokeStyle = '#c8986a';
  ctx.lineWidth   = 0.5;
  ctx.beginPath(); ctx.ellipse(0, -81, 4, 6, 0, 0, Math.PI * 2); ctx.fill();

  // Cabeça (oval ligeiramente)
  const headG = ctx.createRadialGradient(-3, headCY - 4, 2, 0, headCY, 15);
  headG.addColorStop(0,   '#ffe8c8');
  headG.addColorStop(0.5, skin);
  headG.addColorStop(1,   skinSh);
  ctx.fillStyle   = headG;
  ctx.strokeStyle = '#c8986a';
  ctx.lineWidth   = 0.8;
  ctx.beginPath();
  ctx.ellipse(0, headCY, 13, 15, 0, 0, Math.PI * 2);
  ctx.fill(); ctx.stroke();

  // Nariz
  ctx.fillStyle = skinSh;
  ctx.beginPath(); ctx.ellipse(1, headCY + 4, 2.5, 1.8, 0.2, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = 'rgba(160,90,60,0.22)';
  ctx.beginPath(); ctx.arc(-0.4, headCY + 5.5, 1.1, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc( 2.4, headCY + 5.5, 1.1, 0, Math.PI * 2); ctx.fill();

  // Bochechas
  ctx.fillStyle = 'rgba(255,110,100,0.16)';
  ctx.beginPath(); ctx.ellipse(-8, headCY + 5, 4.5, 3, -0.15, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse( 9, headCY + 5, 4.5, 3,  0.15, 0, Math.PI * 2); ctx.fill();

  // Olhos
  const eyY = headCY - 2;
  if (hitFlash > 0) {
    ctx.strokeStyle = '#333'; ctx.lineWidth = 1.8; ctx.lineCap = 'round';
    [[-7, eyY], [6, eyY]].forEach(([ex, ey]) => {
      ctx.beginPath(); ctx.moveTo(ex - 2.5, ey - 2.5); ctx.lineTo(ex + 2.5, ey + 2.5); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(ex + 2.5, ey - 2.5); ctx.lineTo(ex - 2.5, ey + 2.5); ctx.stroke();
    });
  } else if (anger > 0.5) {
    ctx.fillStyle = '#1a0000';
    ctx.beginPath(); ctx.ellipse(-7, eyY, 3.5, 2.8,  0.15, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse( 7, eyY, 3.5, 2.8, -0.15, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#cc0000';
    ctx.beginPath(); ctx.arc(-7, eyY, 1.2, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc( 7, eyY, 1.2, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#1a0000'; ctx.lineWidth = 2; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(-11, eyY - 5); ctx.lineTo(-4, eyY - 2); ctx.stroke();
    ctx.beginPath(); ctx.moveTo( 11, eyY - 5); ctx.lineTo( 4, eyY - 2); ctx.stroke();
  } else {
    ctx.fillStyle = '#ffffff';
    ctx.beginPath(); ctx.ellipse(-7, eyY, 3.8, 2.8, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse( 7, eyY, 3.8, 2.8, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#3a5fa8';
    ctx.beginPath(); ctx.arc(-7, eyY, 2,   0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc( 7, eyY, 2,   0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#0a0a14';
    ctx.beginPath(); ctx.arc(-6.5, eyY, 1.1, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc( 6.5, eyY, 1.1, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    ctx.beginPath(); ctx.arc(-7.8, eyY - 1.2, 0.85, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc( 5.8, eyY - 1.2, 0.85, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#6b4020'; ctx.lineWidth = 1.3; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(-11, eyY - 5.5); ctx.quadraticCurveTo(-7, eyY - 7.5, -3.5, eyY - 4.5); ctx.stroke();
    ctx.beginPath(); ctx.moveTo( 11, eyY - 5.5); ctx.quadraticCurveTo( 7, eyY - 7.5,  3.5, eyY - 4.5); ctx.stroke();
  }

  // Pálpebras superiores (tampam o branco do olho por cima)
  ctx.fillStyle = skin;
  ctx.beginPath(); ctx.ellipse(-7, eyY - 2.5, 4, 1.4, 0, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse( 7, eyY - 2.5, 4, 1.4, 0, 0, Math.PI * 2); ctx.fill();

  // Boca
  const mY = headCY + 9;
  ctx.lineWidth = 1.4; ctx.lineCap = 'round';
  if (hitFlash > 0) {
    ctx.fillStyle = '#3a0808'; ctx.strokeStyle = '#8a4040';
    ctx.beginPath(); ctx.ellipse(0, mY, 3.5, 4.5, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  } else if (anger > 0.3) {
    ctx.strokeStyle = '#5a1010';
    ctx.beginPath(); ctx.moveTo(-5.5, mY); ctx.quadraticCurveTo(0, mY + 3, 5.5, mY); ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.55)';
    ctx.beginPath(); ctx.ellipse(0, mY + 1, 3.5, 1.1, 0, 0, Math.PI * 2); ctx.fill();
  } else {
    ctx.strokeStyle = '#8a4040';
    ctx.beginPath();
    ctx.moveTo(-5, mY - 1);
    ctx.bezierCurveTo(-3.5, mY + 2.5, 3.5, mY + 2.5, 5, mY - 1);
    ctx.stroke();
  }

  // ── 10. Peruca empoada ────────────────────────────────────────────────────
  const wigCY = headCY - 20;
  const wigG  = ctx.createRadialGradient(-3, wigCY - 2, 2, 0, wigCY + 4, 26);
  wigG.addColorStop(0,    '#ffffff');
  wigG.addColorStop(0.4,  '#f4f4f4');
  wigG.addColorStop(0.75, '#e4e4e4');
  wigG.addColorStop(1,    '#c8c8c8');

  ctx.fillStyle   = wigG;
  ctx.strokeStyle = '#b0b0b0';
  ctx.lineWidth   = 0.8;

  // Puff principal
  ctx.beginPath(); ctx.arc(0, wigCY, 15, 0, Math.PI * 2); ctx.fill(); ctx.stroke();

  // 3 cachos por lado
  const curlData = [
    { cx: -16, y0: wigCY + 6  },
    { cx:  16, y0: wigCY + 6  },
  ];
  const curlRadii = [7, 5.5, 4.5];
  curlData.forEach(({ cx, y0 }) => {
    let cy = y0;
    curlRadii.forEach((cr, ri) => {
      const ox = cx > 0 ? -ri * 2 : ri * 2;
      ctx.fillStyle = wigG; ctx.strokeStyle = '#b0b0b0'; ctx.lineWidth = 0.7;
      ctx.beginPath(); ctx.arc(cx + ox, cy, cr, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.strokeStyle = 'rgba(150,150,150,0.4)'; ctx.lineWidth = 0.5;
      ctx.beginPath(); ctx.arc(cx + ox, cy, cr * 0.55, 0.4, Math.PI * 1.3); ctx.stroke();
      cy += cr * 1.7;
    });
  });

  // Pó
  ctx.fillStyle = 'rgba(255,255,255,0.10)';
  ctx.beginPath(); ctx.arc(4,  wigCY - 7, 7,   0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(-5, wigCY - 4, 4.5, 0, Math.PI * 2); ctx.fill();

  // Laço preto (fita traseira)
  ctx.fillStyle = '#111'; ctx.strokeStyle = '#000'; ctx.lineWidth = 0.5;
  ctx.fillRect(-20, headCY - 12, 6, 12);
  ctx.fillRect(-21, headCY - 3,  8, 4);

  // ── 11. Chapéu tricórnio (raiva alta) ─────────────────────────────────────
  if (anger > 0.65) {
    const hY  = wigCY - 12;
    const hAl = (anger - 0.65) / 0.35;
    ctx.globalAlpha = hAl * (hitFlash > 0 ? 0.78 : 1);
    ctx.fillStyle = '#0a0a0a'; ctx.strokeStyle = '#333'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.ellipse(0, hY + 7, 20, 5.5, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(-11, hY + 7);
    ctx.bezierCurveTo(-9, hY - 6, 9, hY - 6, 11, hY + 7);
    ctx.fill(); ctx.stroke();
    ctx.strokeStyle = gold; ctx.lineWidth = 1.4;
    ctx.beginPath(); ctx.ellipse(0, hY + 6, 19, 5, 0, 0, Math.PI * 2); ctx.stroke();
    ctx.globalAlpha = hitFlash > 0 ? 0.78 + Math.sin(hitFlash * 0.9) * 0.22 : 1;
  }

  ctx.restore();
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function _drawCuff(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number): void {
  const g = ctx.createRadialGradient(cx - 1, cy - 1, 0, cx, cy, r + 2);
  g.addColorStop(0, '#ffffff'); g.addColorStop(0.6, '#f0f0f0'); g.addColorStop(1, '#d0d0d0');
  ctx.fillStyle = g; ctx.strokeStyle = '#c0c0c0'; ctx.lineWidth = 0.8;
  ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  ctx.strokeStyle = 'rgba(0,0,0,0.08)'; ctx.lineWidth = 0.5;
  for (let a = 0; a < Math.PI * 2; a += Math.PI / 4) {
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + Math.cos(a) * r * 0.65, cy + Math.sin(a) * r * 0.65);
    ctx.stroke();
  }
}

function _drawHand(
  ctx: CanvasRenderingContext2D, cx: number, cy: number,
  isRight: boolean, skin: string, shade: string,
): void {
  const hg = ctx.createRadialGradient(cx - 1, cy - 1, 0, cx, cy, 5);
  hg.addColorStop(0, '#ffe8c8'); hg.addColorStop(0.5, skin); hg.addColorStop(1, shade);
  ctx.fillStyle = hg; ctx.strokeStyle = 'rgba(160,100,60,0.4)'; ctx.lineWidth = 0.5; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.ellipse(cx, cy, 3.8, 3, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  for (let f = 0; f < 4; f++) {
    const fa  = (f - 1.5) * 0.3 + (isRight ? -0.45 : 0.45);
    const fl  = 3.2 + (f === 1 || f === 2 ? 0.7 : 0);
    const dir = isRight ? 0.75 : -0.75;
    ctx.beginPath();
    ctx.arc(cx + Math.cos(fa) * (fl + 2) * dir, cy + Math.sin(fa) * fl - 0.5, 1.1, 0, Math.PI * 2);
    ctx.fill();
  }
  const ta = isRight ? 0.95 : Math.PI - 0.95;
  ctx.beginPath(); ctx.arc(cx + Math.cos(ta) * 3.2, cy + Math.sin(ta) * 1.8, 1.4, 0, Math.PI * 2); ctx.fill();
}