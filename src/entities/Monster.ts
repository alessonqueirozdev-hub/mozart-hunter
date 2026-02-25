import { hitSpark } from './Particle';
import { GW, MOZART_Y, PROJECTILE_LANE_Y } from '../constants';
import type { EntityEvent } from '../types';
import { getMonsterSpriteObjectUrls } from '../graphics/monsterJsSvg';
import { G } from '../state/gameState';

type SpriteCache = {
  full: HTMLCanvasElement;
  upper: HTMLCanvasElement;
  lowerLeft: HTMLCanvasElement;
  lowerRight: HTMLCanvasElement;
  upperH: number;
  lowerH: number;
  halfW: number;
};

const SPRITE_W = 168;
const SPRITE_H = 168;
const FEET_Y_OFFSET = 120;
const SPRITE_DRAW_X = -SPRITE_W * 0.5;
const SPRITE_DRAW_Y = -SPRITE_H + FEET_Y_OFFSET;
const LEG_SPLIT_RATIO = 0.7;
const LEG_SEAM_OVERLAP = 2;

const BATON_TIPS = [
  { x: 64, y: PROJECTILE_LANE_Y - MOZART_Y },
  { x: 64, y: PROJECTILE_LANE_Y - MOZART_Y },
  { x: 64, y: PROJECTILE_LANE_Y - MOZART_Y },
  { x: 64, y: PROJECTILE_LANE_Y - MOZART_Y },
];

const spriteSources = getMonsterSpriteObjectUrls();
const spriteReady = [false, false, false, false];
const spriteCaches: Array<SpriteCache | null> = [null, null, null, null];

function makeCanvas(w: number, h: number): HTMLCanvasElement {
  const c = document.createElement('canvas');
  c.width = Math.max(1, Math.floor(w));
  c.height = Math.max(1, Math.floor(h));
  return c;
}

function buildSpriteCache(img: HTMLImageElement): SpriteCache {
  const full = makeCanvas(SPRITE_W, SPRITE_H);
  const fctx = full.getContext('2d')!;
  fctx.drawImage(img, 0, 0, SPRITE_W, SPRITE_H);

  const splitY = Math.floor(SPRITE_H * LEG_SPLIT_RATIO);
  const upperH = splitY;
  const lowerH = SPRITE_H - splitY;
  const halfW = Math.floor(SPRITE_W * 0.5);

  const upper = makeCanvas(SPRITE_W, upperH);
  upper.getContext('2d')!.drawImage(full, 0, 0, SPRITE_W, upperH, 0, 0, SPRITE_W, upperH);

  const legW = halfW + LEG_SEAM_OVERLAP;
  const lowerLeft = makeCanvas(legW, lowerH);
  lowerLeft.getContext('2d')!.drawImage(full, 0, splitY, legW, lowerH, 0, 0, legW, lowerH);

  const lowerRight = makeCanvas(legW, lowerH);
  lowerRight.getContext('2d')!.drawImage(
    full,
    halfW - LEG_SEAM_OVERLAP,
    splitY,
    legW,
    lowerH,
    0,
    0,
    legW,
    lowerH,
  );

  return { full, upper, lowerLeft, lowerRight, upperH, lowerH, halfW };
}

spriteSources.forEach((src, idx) => {
  const img = new Image();
  img.onload = () => {
    spriteReady[idx] = true;
    spriteCaches[idx] = buildSpriteCache(img);
  };
  img.src = src;
});

export class Monster {
  x: number;
  y: number;
  type: number;
  baseSpd: number;
  alive: boolean;
  dying: boolean;
  dyingT: number;
  dyingDur: number;
  hitFlash: number;
  bobT: number;
  anger: number;
  hp: number;
  maxHp: number;
  onScreenFrames: number;
  shootInterval: number;
  shootTimer: number;
  shootAnim: number;
  scale: number;

  private _animFrame: number = 0;

  constructor(phase: number) {
    this.x = GW - 30;
    this.y = MOZART_Y;
    this.type = Math.floor(Math.random() * 4);

    const baseSpeeds = [0.62, 0.92, 1.32, 1.75, 2.25];
    this.baseSpd = baseSpeeds[Math.min(phase, 4)] * (0.75 + Math.random() * 0.35);

    this.alive = true;
    this.dying = false;
    this.dyingT = 0;
    this.dyingDur = 55;
    this.hitFlash = 0;
    this.bobT = Math.random() * Math.PI * 2;
    this.anger = 0;
    this.hp = 1 + Math.floor(phase / 2);
    this.maxHp = this.hp;
    this.onScreenFrames = 0;

    const intervals = [260, 230, 200, 175, 150];
    this.shootInterval = intervals[Math.min(phase, 4)] + (Math.random() * 30 - 15);
    this.shootTimer = Math.floor(this.shootInterval * 0.5);
    this.shootAnim = 0;
    this.scale = 1;
  }

  get spd(): number { return this.baseSpd * (1 + this.anger * 0.45); }
  get dangerRatio(): number { return Math.max(0, Math.min(1, 1 - (this.x - 100) / 500)); }

  update(): EntityEvent {
    if (this.dying) {
      this.dyingT++;
      return null;
    }

    this._animFrame++;
    this.bobT += 0.04;
    this.anger = this.dangerRatio;
    this.x -= this.spd * G.difficulty.monsterSpeed;
    if (this.x <= GW - 48) this.onScreenFrames++;
    if (this.shootAnim > 0) this.shootAnim--;

    if (this.onScreenFrames > 60) {
      this.shootTimer += G.difficulty.fireRate;
      if (this.shootTimer >= this.shootInterval) {
        this.shootTimer = 0;
        this.shootAnim = 16;
        return 'shoot';
      }
    }

    return null;
  }

  takeDamage(): boolean {
    this.hp--;
    this.hitFlash = 18;
    hitSpark(this.x, this.y - 20);
    if (this.hp <= 0) {
      this.die();
      return true;
    }
    return false;
  }

  die(): void {
    if (!this.dying) {
      this.dying = true;
      this.dyingT = 0;
    }
  }

  getProjectileOrigin(laneY: number): { x: number; y: number } {
    const tip = BATON_TIPS[this.type];
    const attackKick = this.shootAnim > 0 ? 14 : 0;
    return {
      x: this.x + tip.x + attackKick,
      y: laneY,
    };
  }

  draw(ctx: CanvasRenderingContext2D): void {
    const cx = this.x;
    const cy = this.y;
    const bob = Math.sin(this.bobT) * 2.2;

    if (this.dying) {
      const t = this.dyingT / this.dyingDur;
      ctx.save();
      ctx.globalAlpha = Math.max(0, 1 - t * 1.1);
      ctx.translate(cx, cy + bob);
      ctx.scale(1 + t * 0.5, 1 - t * 0.85);
      ctx.rotate(t * Math.PI * 0.5);
      this.drawSprite(ctx, this.shootAnim > 0);
      ctx.restore();
      return;
    }

    if (this.maxHp > 1) {
      const bw = 48;
      const bx = cx - bw / 2;
      const by = cy - 78;
      ctx.fillStyle = 'rgba(0,0,0,.65)';
      ctx.beginPath();
      ctx.roundRect(bx, by, bw, 6, 3);
      ctx.fill();

      const r = this.hp / this.maxHp;
      ctx.fillStyle = r > 0.5 ? '#44ee88' : r > 0.25 ? '#ffcc00' : '#ff3300';
      ctx.beginPath();
      ctx.roundRect(bx, by, bw * r, 6, 3);
      ctx.fill();
    }

    ctx.save();
    ctx.globalAlpha = 0.2;
    ctx.scale(1, 0.24);
    ctx.beginPath();
    ctx.ellipse(cx, cy + 10, 32, 10, 0, 0, Math.PI * 2);
    ctx.fillStyle = '#000000';
    ctx.fill();
    ctx.restore();

    ctx.save();
    ctx.translate(cx, cy + bob);
    if (this.hitFlash > 0) {
      ctx.shadowBlur = 28;
      ctx.shadowColor = '#ff8844';
      this.hitFlash--;
    }
    const pulse = this.shootAnim > 0 ? 1 + (this.shootAnim / 16) * 0.08 : 1;
    ctx.scale(pulse, pulse);
    this.drawSprite(ctx, this.shootAnim > 0);
    ctx.restore();

    if (!this.dying && this.onScreenFrames > 60) {
      const prog = this.shootTimer / this.shootInterval;
      if (prog > 0.5) {
        const typeColors = ['#ff6600', '#8800ff', '#00aaff', '#ff0088'];
        ctx.save();
        ctx.globalAlpha = (prog - 0.5) * 2 * 0.5;
        ctx.strokeStyle = typeColors[this.type];
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(cx, cy - 20, 16 + prog * 8, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }
    }
  }

  private drawSprite(ctx: CanvasRenderingContext2D, shooting: boolean): void {
    const idx = this.type % 4;
    if (spriteReady[idx] && spriteCaches[idx]) {
      const cache = spriteCaches[idx]!;
      const walkCycle = this._animFrame * 0.24;
      const stride = Math.sin(walkCycle) * 2.4;
      const leftLift = Math.max(0, -Math.sin(walkCycle)) * 1.8;
      const rightLift = Math.max(0, Math.sin(walkCycle)) * 1.8;
      const splitDstY = SPRITE_DRAW_Y + cache.upperH;
      const attackPhase = shooting ? this.shootAnim / 16 : 0;
      const pivotX = -18;
      const pivotY = -48;
      const attackTilt = -0.45 * attackPhase;

      if (shooting) {
        // Durante ataque, desenha sprite completo para evitar "partir ao meio".
        ctx.save();
        ctx.translate(pivotX, pivotY);
        ctx.rotate(attackTilt);
        ctx.translate(-pivotX + attackPhase * 6, -pivotY - attackPhase * 8);
        ctx.drawImage(cache.full, SPRITE_DRAW_X, SPRITE_DRAW_Y);
        ctx.restore();
      } else {
        ctx.drawImage(cache.upper, SPRITE_DRAW_X, SPRITE_DRAW_Y);
        ctx.drawImage(cache.lowerLeft, SPRITE_DRAW_X + stride, splitDstY - leftLift);
        ctx.drawImage(
          cache.lowerRight,
          SPRITE_DRAW_X + cache.halfW - stride - LEG_SEAM_OVERLAP,
          splitDstY - rightLift,
        );
      }
      return;
    }

    ctx.fillStyle = '#863030';
    ctx.beginPath();
    ctx.roundRect(-28, -64, 56, 72, 12);
    ctx.fill();
  }
}
