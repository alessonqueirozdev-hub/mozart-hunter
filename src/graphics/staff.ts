import { STAFF_TOP, LS } from '../constants';
import type { ClefType, Note } from '../types';
import { getClefGlyph, MUSIC_FONT_FAMILY, SMuFLGlyphs } from './smuflGlyphs';

const STAFF_HEIGHT = 168;
const STAFF_LEFT = 20;
const STAFF_RIGHT_PAD = 20;
const STAFF_SPACE = LS;
const STAFF_BOTTOM = STAFF_TOP + 4 * STAFF_SPACE;

const CLEF_OFFSETS_FROM_TREBLE: Record<ClefType, number> = {
  treble: 0,
  bass: 12,
  alto: 6,
  tenor: 8,
};

function hasBravuraLoaded(): boolean {
  if (typeof document === 'undefined' || !('fonts' in document)) return true;
  return document.fonts.check(`28px ${MUSIC_FONT_FAMILY}`);
}

function getNoteAnchorX(width: number, noteheadWidth: number): number {
  const clefAreaWidth = STAFF_SPACE * 4.7;
  const contentStart = STAFF_LEFT + clefAreaWidth;
  const contentWidth = width - STAFF_RIGHT_PAD - contentStart;
  return contentStart + contentWidth * 0.5 - noteheadWidth * 0.5;
}

function getClefBaselineY(clef: ClefType): number {
  if (clef === 'bass') return STAFF_TOP + STAFF_SPACE;
  if (clef === 'alto' || clef === 'tenor') return STAFF_TOP + STAFF_SPACE * 2;
  return STAFF_TOP + STAFF_SPACE * 3;
}

function toClefStaffPosition(trebleSp: number, clef: ClefType): number {
  return trebleSp + CLEF_OFFSETS_FROM_TREBLE[clef];
}

function drawLedgerLine(ctx: CanvasRenderingContext2D, y: number, noteX: number, noteheadWidth: number): void {
  const ledgerWidth = noteheadWidth * 1.5;
  const centerX = noteX + noteheadWidth / 2;
  ctx.beginPath();
  ctx.moveTo(centerX - ledgerWidth / 2, y);
  ctx.lineTo(centerX + ledgerWidth / 2, y);
  ctx.stroke();
}

function drawClef(ctx: CanvasRenderingContext2D, clef: ClefType): void {
  ctx.save();
  ctx.fillStyle = '#ffffff';

  const clefGlyph = getClefGlyph(clef);
  const clefX = STAFF_LEFT + STAFF_SPACE * 0.5;
  const clefY = getClefBaselineY(clef);
  const clefSize = STAFF_SPACE * 4.2;

  if (hasBravuraLoaded()) {
    ctx.font = `${clefSize}px ${MUSIC_FONT_FAMILY}`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    ctx.fillText(clefGlyph, clefX, clefY);
  } else {
    ctx.font = `${STAFF_SPACE * 4}px ${MUSIC_FONT_FAMILY}`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    ctx.fillText('\uD834\uDD1E', clefX, clefY);
  }

  ctx.restore();
}

function drawNoteOnStaff(
  ctx: CanvasRenderingContext2D,
  width: number,
  note: Note,
  animProgress: number,
  clef: ClefType,
): void {
  const clefSp = toClefStaffPosition(note.sp, clef);
  const centerY = STAFF_BOTTOM - (STAFF_SPACE / 2) * clefSp;
  const bounceY = Math.sin(animProgress * Math.PI * 2) * 2.2;
  const y = centerY + bounceY;
  const stemUp = clefSp < 6;

  ctx.save();
  ctx.strokeStyle = '#ffffff';
  ctx.fillStyle = '#ffffff';

  const noteGlyphFontSize = Math.max(12, STAFF_SPACE * 4);
  let noteheadWidth = 22;
  if (hasBravuraLoaded()) {
    ctx.font = `${noteGlyphFontSize}px ${MUSIC_FONT_FAMILY}`;
    noteheadWidth = ctx.measureText(SMuFLGlyphs.Noteheads.BLACK).width;
  }
  const noteX = getNoteAnchorX(width, noteheadWidth);

  if (clefSp <= -2) {
    for (let pos = -2; pos >= clefSp; pos -= 2) {
      drawLedgerLine(ctx, STAFF_BOTTOM - (STAFF_SPACE / 2) * pos, noteX, noteheadWidth);
    }
  } else if (clefSp >= 10) {
    for (let pos = 10; pos <= clefSp; pos += 2) {
      drawLedgerLine(ctx, STAFF_BOTTOM - (STAFF_SPACE / 2) * pos, noteX, noteheadWidth);
    }
  }

  if (hasBravuraLoaded()) {
    ctx.font = `${noteGlyphFontSize}px ${MUSIC_FONT_FAMILY}`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    ctx.fillText(SMuFLGlyphs.Noteheads.BLACK, noteX, y);
  } else {
    ctx.save();
    ctx.translate(noteX, y);
    ctx.beginPath();
    ctx.ellipse(0, 0, 11, 8, -0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  const stemWidth = STAFF_SPACE * 0.12;
  const stemX = stemUp
    ? noteX + noteheadWidth - stemWidth * 0.4
    : noteX + stemWidth * 0.4;
  const stemEndY = stemUp ? y - STAFF_SPACE * 4.2 : y + STAFF_SPACE * 4.2;
  ctx.lineWidth = stemWidth;
  ctx.beginPath();
  ctx.moveTo(stemX, y);
  ctx.lineTo(stemX, stemEndY);
  ctx.stroke();

  ctx.restore();
}

export function drawStaff(
  ctx: CanvasRenderingContext2D,
  width: number,
  staffAnim: number,
  currentNote: Note | null,
  clef: ClefType = 'treble',
): void {
  ctx.clearRect(0, 0, width, STAFF_HEIGHT);
  ctx.strokeStyle = 'rgba(255,255,255,0.92)';
  ctx.lineWidth = 1.7;
  for (let i = 0; i < 5; i++) {
    const y = STAFF_TOP + i * STAFF_SPACE;
    ctx.beginPath();
    ctx.moveTo(STAFF_LEFT, y);
    ctx.lineTo(width - STAFF_RIGHT_PAD, y);
    ctx.stroke();
  }

  drawClef(ctx, clef);
  if (currentNote) drawNoteOnStaff(ctx, width, currentNote, staffAnim, clef);
}
