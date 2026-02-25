import { STAFF_TOP, LS, CLEF_X, CLEF_Y_BL } from '../constants';
import type { Note } from '../types';

export function drawStaff(ctx: CanvasRenderingContext2D, width: number, staffAnim: number, currentNote: Note | null) {
  ctx.clearRect(0, 0, width, 148);
  
  ctx.fillStyle = 'rgba(252, 248, 238, 0.95)';
  ctx.shadowBlur = 8;
  ctx.shadowColor = 'rgba(0,0,0,0.4)';
  ctx.fillRect(5, 5, width - 10, 138);
  ctx.shadowBlur = 0;
  
  ctx.strokeStyle = 'rgba(60, 40, 10, 0.15)';
  ctx.lineWidth = 2;
  const borderPad = 10;
  ctx.strokeRect(borderPad, borderPad, width - borderPad * 2, 148 - borderPad * 2);
  
  ctx.strokeStyle = '#4a3b2c';
  ctx.lineWidth = 1.5;
  for (let i = 0; i < 5; i++) {
    const y = STAFF_TOP + i * LS;
    ctx.beginPath();
    ctx.moveTo(20, y);
    ctx.lineTo(width - 20, y);
    ctx.stroke();
  }
  
  drawTrebleClef(ctx, CLEF_X, CLEF_Y_BL);
  
  if (currentNote) {
    drawNoteOnStaff(ctx, currentNote, staffAnim);
  }
}

function drawTrebleClef(ctx: CanvasRenderingContext2D, x: number, y: number) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(0.85, 0.85);

  ctx.strokeStyle = '#3a2b1c';
  ctx.lineWidth = 2.5;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  ctx.beginPath();
  ctx.moveTo(20, -8);
  ctx.bezierCurveTo(20, -8, 28, -8, 30, -18);
  ctx.bezierCurveTo(32, -28, 24, -38, 14, -36);
  ctx.bezierCurveTo(4, -34, -2, -22, -2, -10);
  ctx.bezierCurveTo(-2, 5, 12, 15, 26, 10);
  ctx.bezierCurveTo(36, 6, 42, -5, 38, -18);
  ctx.bezierCurveTo(34, -30, 24, -45, 18, -65);
  ctx.bezierCurveTo(14, -80, 20, -95, 26, -95);
  ctx.bezierCurveTo(32, -95, 36, -85, 32, -70);
  ctx.bezierCurveTo(30, -60, 18, -25, 18, 5);
  ctx.bezierCurveTo(18, 30, 10, 35, 6, 30);
  ctx.bezierCurveTo(2, 25, 8, 15, 15, 15);
  
  ctx.stroke();
  ctx.restore();
}

function drawNoteOnStaff(ctx: CanvasRenderingContext2D, note: Note, animProgress: number) {
  const noteX = 480;
  const tTop = STAFF_TOP;
  const centerY = tTop + 4 * LS - (LS / 2) * note.sp;
  
  // Animation bounce/scale
  const scale = 1 + Math.sin(animProgress * Math.PI) * 0.15;
  const offsetY = Math.sin(animProgress * Math.PI * 2) * 3;
  
  ctx.save();
  ctx.translate(noteX, centerY + offsetY);
  ctx.scale(scale, scale);
  
  // Ledger lines
  ctx.strokeStyle = '#4a3b2c';
  ctx.lineWidth = 2;
  
  const drawLedger = (ly: number) => {
    ctx.beginPath();
    ctx.moveTo(-18, ly);
    ctx.lineTo(18, ly);
    ctx.stroke();
  };

  // Check if we need ledger lines based on staff position
  if (note.sp <= -2) { // Below staff
    for (let i = -2; i >= note.sp; i -= 2) {
      drawLedger((note.sp - i) * (LS / 2));
    }
  } else if (note.sp >= 10) { // Above staff
    for (let i = 10; i <= note.sp; i += 2) {
       drawLedger((note.sp - i) * (LS / 2));
    }
  }

  // Draw the note head
  ctx.fillStyle = '#1a0f08';
  ctx.beginPath();
  ctx.ellipse(0, 0, 11, 8, -0.3, 0, Math.PI * 2);
  ctx.fill();
  
  // Draw stem (always up for simplicity in this game style, or logic based on sp)
  ctx.beginPath();
  const stemDir = note.sp < 4 ? -1 : 1;
  const stemX = stemDir === -1 ? 9 : -9;
  ctx.moveTo(stemX, 0);
  ctx.lineTo(stemX, stemDir * 35);
  ctx.lineWidth = 2.5;
  ctx.stroke();
  
  ctx.restore();
}
