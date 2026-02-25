import monsterUmRaw from './monster-raw/monstro-um.js?raw';
import monsterDoisRaw from './monster-raw/monstro-dois.js?raw';
import monsterTresRaw from './monster-raw/monstro-tres.js?raw';
import monsterQuatroRaw from './monster-raw/monstro-quatro.js?raw';

const raws = [monsterUmRaw, monsterDoisRaw, monsterTresRaw, monsterQuatroRaw];

function camelToKebab(name: string): string {
  return name.replace(/[A-Z]/g, m => `-${m.toLowerCase()}`);
}

function normalizeSvgMarkup(svg: string): string {
  return svg
    .replace(/\{\.{3}props\}/g, '')
    .replace(/xmlnsXlink=/g, 'xmlns:xlink=')
    .replace(/xlinkHref=/g, 'xlink:href=')
    .replace(/clipRule=/g, 'clip-rule=')
    .replace(/fillRule=/g, 'fill-rule=')
    .replace(/colorInterpolationFilters=/g, 'color-interpolation-filters=')
    .replace(/zoomAndPan="[^"]*"/g, '')
    .replace(/(\w+)=(\{[^}]*\})/g, (_m, key: string, value: string) => {
      const normalizedKey = camelToKebab(key);
      const unwrapped = value.slice(1, -1);
      return `${normalizedKey}="${unwrapped}"`;
    });
}

function extractSvgFromJs(raw: string): string {
  const start = raw.indexOf('<svg');
  const end = raw.lastIndexOf('</svg>');
  if (start < 0 || end < 0 || end <= start) {
    throw new Error('Nao foi possivel extrair SVG do arquivo JS do monstro.');
  }
  const svg = raw.slice(start, end + '</svg>'.length);
  return normalizeSvgMarkup(svg);
}

function svgToObjectUrl(svg: string): string {
  const blob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
  return URL.createObjectURL(blob);
}

export function getMonsterSpriteObjectUrls(): string[] {
  return raws.map(raw => svgToObjectUrl(extractSvgFromJs(raw)));
}

