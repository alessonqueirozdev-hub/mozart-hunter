export const MUSIC_FONT_FAMILY = "'Bravura', 'Bravura Text', 'Noto Music', 'Segoe UI Symbol', serif";

export const SMuFLGlyphs = {
  Clefs: {
    TREBLE: '\uE050',
    BASS: '\uE062',
    C: '\uE05C',
  },
  Noteheads: {
    WHOLE: '\uE0A2',
    HALF: '\uE0A3',
    BLACK: '\uE0A4',
  },
} as const;

export function getClefGlyph(clef: 'treble' | 'bass' | 'alto' | 'tenor'): string {
  if (clef === 'bass') return SMuFLGlyphs.Clefs.BASS;
  if (clef === 'alto' || clef === 'tenor') return SMuFLGlyphs.Clefs.C;
  return SMuFLGlyphs.Clefs.TREBLE;
}
