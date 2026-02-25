export function drawMozart(ctx: CanvasRenderingContext2D, x: number, y: number, anger = 0, hitFlash = 0, frame = 0) {
  ctx.save();
  ctx.translate(x, y);

  // Smooth bobbing factor based on frame
  const bobY = Math.sin(frame * 0.08) * 4;
  const bobRot = Math.sin(frame * 0.05) * 0.05;
  
  // Base transforms
  ctx.translate(0, bobY);
  ctx.rotate(bobRot);
  ctx.scale(1.5, 1.5);

  // Aura / Shadow
  ctx.shadowBlur = hitFlash > 0 ? 40 : 15 + anger * 15;
  ctx.shadowColor = hitFlash > 0 ? '#ff0000' : (anger > 0.5 ? 'rgba(255, 100, 0, 0.6)' : 'rgba(0, 0, 0, 0.3)');
  if (hitFlash > 0) ctx.globalAlpha = 0.8;

  // --- COAT (TORSO & TAILS) ---
  const coatPrimary = '#7b0d20'; // Deep crimson
  const coatDark = '#3d0610';
  const coatHighlight = '#a31b34';
  const goldTrim = '#ce9c3b';
  
  const coatGrad = ctx.createLinearGradient(-20, -40, 20, 10);
  coatGrad.addColorStop(0, coatHighlight);
  coatGrad.addColorStop(0.5, coatPrimary);
  coatGrad.addColorStop(1, coatDark);

  ctx.fillStyle = coatGrad;
  ctx.strokeStyle = '#2b030a';
  ctx.lineWidth = 1;
  ctx.lineJoin = 'round';

  // Torso shape with tails
  ctx.beginPath();
  ctx.moveTo(-18, -35); // Left shoulder
  ctx.bezierCurveTo(-25, -5, -20, 15, -10, 25); // Left tail
  ctx.quadraticCurveTo(0, 5, 5, 25); // Right tail
  ctx.bezierCurveTo(22, 10, 22, -10, 18, -35); // Right shoulder
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Gold Lapels
  ctx.strokeStyle = goldTrim;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(-10, -35);
  ctx.quadraticCurveTo(-15, -15, -5, -5);
  ctx.moveTo(10, -35);
  ctx.quadraticCurveTo(15, -15, 5, -5);
  ctx.stroke();

  // --- CRAVAT (LACE FRILLED COLLAR) ---
  const laceGrad = ctx.createLinearGradient(0, -35, 0, -10);
  laceGrad.addColorStop(0, '#ffffff');
  laceGrad.addColorStop(1, '#d0d0d0');
  ctx.fillStyle = laceGrad;
  ctx.strokeStyle = '#b0b0b0';
  ctx.lineWidth = 1;
  
  ctx.beginPath();
  ctx.moveTo(-10, -35);
  ctx.quadraticCurveTo(0, -25, 10, -35);
  ctx.quadraticCurveTo(15, -20, 6, -15);
  ctx.quadraticCurveTo(0, -5, -6, -15);
  ctx.quadraticCurveTo(-15, -20, -10, -35);
  ctx.fill();
  ctx.stroke();

  // Lace inner details
  ctx.beginPath();
  ctx.moveTo(0, -30); ctx.lineTo(0, -15);
  ctx.moveTo(-5, -25); ctx.lineTo(5, -25);
  ctx.strokeStyle = 'rgba(0,0,0,0.15)';
  ctx.stroke();

  // --- ARMS & HANDS ---
  const armBob = Math.cos(frame * 0.08) * 3;
  
  // Left Arm
  ctx.strokeStyle = coatPrimary;
  ctx.lineWidth = 8;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(-15, -30);
  ctx.bezierCurveTo(-30, -20, -25, -5, -18 + armBob, -5 + armBob);
  ctx.stroke();

  // Left Cuff (Lace)
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(-18 + armBob, -5 + armBob, 5, 0, Math.PI * 2);
  ctx.fill();

  // Left Hand
  ctx.fillStyle = '#ffceaa';
  ctx.beginPath();
  ctx.arc(-16 + armBob, -3 + armBob, 3, 0, Math.PI * 2);
  ctx.fill();

  // Right Arm (Conducting/Dynamic)
  const conductDirX = 25 + anger * 15;
  const conductDirY = -15 - armBob * 1.5 - anger * 10;
  
  ctx.strokeStyle = coatPrimary;
  ctx.lineWidth = 8;
  ctx.beginPath();
  ctx.moveTo(15, -30);
  ctx.bezierCurveTo(25, -20, conductDirX - 10, conductDirY + 10, conductDirX, conductDirY);
  ctx.stroke();

  // Right Cuff (Lace)
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(conductDirX, conductDirY, 5, 0, Math.PI * 2);
  ctx.fill();

  // Right Hand
  ctx.fillStyle = '#ffceaa';
  ctx.beginPath();
  ctx.arc(conductDirX + 2, conductDirY - 2, 3, 0, Math.PI * 2);
  ctx.fill();

  // Conducting Baton
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.shadowBlur = 10;
  ctx.shadowColor = 'rgba(255,255,255,0.9)';
  ctx.moveTo(conductDirX + 1, conductDirY - 1);
  ctx.lineTo(conductDirX + 20 + anger * 10, conductDirY - 20 - anger * 5);
  ctx.stroke();
  ctx.shadowBlur = 0; 

  // --- HEAD ---
  // Skin base
  ctx.fillStyle = '#ffe0bd';
  ctx.strokeStyle = '#d6b28c';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(0, -48, 14, 0, Math.PI * 2); // Head stays the same size
  // Extend chin slightly
  ctx.ellipse(0, -44, 13, 15, 0, 0, Math.PI); 
  ctx.fill();
  ctx.stroke();

  // Blush (moved slightly lower down the cheeks)
  ctx.fillStyle = 'rgba(255, 100, 100, 0.25)';
  ctx.beginPath(); ctx.arc(-8, -42, 4, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(8, -42, 4, 0, Math.PI * 2); ctx.fill();

  // Eyes (moved down slightly from the forehead line)
  ctx.fillStyle = '#222222';
  ctx.strokeStyle = '#222222';
  const ey = -46; // Base eye Y
  
  if (anger > 0.5) {
    // Angry
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(-9, ey - 4); ctx.lineTo(-4, ey - 1); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(9, ey - 4); ctx.lineTo(4, ey - 1); ctx.stroke();
    ctx.beginPath(); ctx.arc(-6, ey, 1.5, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(6, ey, 1.5, 0, Math.PI * 2); ctx.fill();
  } else if (hitFlash > 0) {
    // Hurt
    ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(-8, ey - 2); ctx.lineTo(-4, ey - 2); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(8, ey - 2); ctx.lineTo(4, ey - 2); ctx.stroke();
  } else {
    // Normal / Eyebrows
    ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(-8, ey - 5); ctx.quadraticCurveTo(-6, ey - 7, -4, ey - 4); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(8, ey - 5); ctx.quadraticCurveTo(6, ey - 7, 4, ey - 4); ctx.stroke();
    ctx.beginPath(); ctx.arc(-6, ey - 1, 2, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(6, ey - 1, 2, 0, Math.PI * 2); ctx.fill();
    // Gleam
    ctx.fillStyle = '#ffffff';
    ctx.beginPath(); ctx.arc(-6.5, ey - 1.5, 0.8, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(5.5, ey - 1.5, 0.8, 0, Math.PI * 2); ctx.fill();
  }

  // Mouth (moved slightly down to fit new eye position)
  ctx.strokeStyle = '#8a4b4b';
  ctx.fillStyle = '#5e1b1b';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  if (hitFlash > 0) {
    ctx.ellipse(0, -36, 3, 4, 0, 0, Math.PI * 2);
    ctx.fill(); ctx.stroke();
  } else if (anger > 0.3) {
    ctx.ellipse(0, -36, 4, 2, 0, Math.PI, 0);
    ctx.fill(); ctx.stroke();
  } else {
    ctx.arc(0, -38, 5, 0.2, Math.PI - 0.2);
    ctx.stroke();
  }

  // --- WIG (POWDERED) ---
  // Shift wig up by ~8-10px to expose forehead
  const wigY = -68;
  const wigGrad = ctx.createRadialGradient(0, wigY, 5, 0, wigY + 5, 25);
  wigGrad.addColorStop(0, '#ffffff');
  wigGrad.addColorStop(1, '#e8e8e8');
  
  ctx.fillStyle = wigGrad;
  ctx.strokeStyle = '#cccccc';
  ctx.lineWidth = 1;

  // Main puff
  ctx.beginPath();
  ctx.arc(0, wigY, 15, 0, Math.PI * 2);
  ctx.fill(); ctx.stroke();

  // Side curl rolls (placed to frame the face naturally)
  [-15, 15].forEach(cx => {
    // Top curl
    ctx.beginPath(); ctx.arc(cx, wigY + 12, 6.5, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.arc(cx, wigY + 12, 3, 0, Math.PI * 1.5); ctx.stroke();
    // Bottom curl
    const bx = cx + (cx < 0 ? 1 : -1);
    ctx.beginPath(); ctx.arc(bx, wigY + 24, 5.5, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.arc(bx, wigY + 24, 2, 0, Math.PI * 1.5); ctx.stroke();
  });

  // Black Ribbon at back
  ctx.fillStyle = '#111111';
  ctx.fillRect(-20, -46, 5, 12);
  ctx.fillRect(-22, -36, 6, 4);

  ctx.restore();
}
