import { hitSpark } from './Particle';
import { GH, GW } from '../constants';
import type { EntityEvent } from '../types';

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
  orbitAngle: number;
  bobT: number;
  eyePulse: number;
  anger: number;
  hp: number;
  maxHp: number;
  squash: number;
  onScreenFrames: number;
  shootInterval: number;
  shootTimer: number;
  shootAnim: number;
  scale: number;
  scaleTarget: number;

  // Contadores internos de frame para animação (sem Date.now())
  private _animFrame: number = 0;

  constructor(phase: number) {
    this.x = GW + 90;
    this.y = GH * 0.65;
    this.type = Math.floor(Math.random() * 4);

    const baseSpeeds = [0.5, 0.8, 1.2, 1.6, 2.1];
    this.baseSpd = baseSpeeds[Math.min(phase, 4)] * (0.75 + Math.random() * 0.35);

    this.alive = true;
    this.dying = false;
    this.dyingT = 0;
    this.dyingDur = 55;
    this.hitFlash = 0;
    this.orbitAngle = Math.random() * Math.PI * 2;
    this.bobT = Math.random() * Math.PI * 2;
    this.eyePulse = Math.random() * Math.PI * 2;
    this.anger = 0;
    this.hp = 1 + Math.floor(phase / 2);
    this.maxHp = this.hp;
    this.squash = 0;
    this.onScreenFrames = 0;

    const intervals = [260, 230, 200, 175, 150];
    this.shootInterval = intervals[Math.min(phase, 4)] + (Math.random() * 30 - 15);
    this.shootTimer = Math.floor(this.shootInterval * 0.5);
    this.shootAnim = 0;
    this.scale = 1.6;
    this.scaleTarget = 1.6;
  }

  get spd(): number { return this.baseSpd * (1 + this.anger * 0.45); }
  get dangerRatio(): number { return Math.max(0, Math.min(1, 1 - (this.x - 100) / 500)); }

  update(): EntityEvent {
    if (this.dying) { this.dyingT++; return null; }

    this._animFrame++;
    this.bobT += 0.042;
    this.orbitAngle += 0.05;
    this.eyePulse += 0.065;
    this.anger = this.dangerRatio;
    this.squash *= 0.86;
    this.x -= this.spd;
    this.onScreenFrames++;
    if (this.shootAnim > 0) this.shootAnim--;
    this.scale += (this.scaleTarget - this.scale) * 0.12;

    if (this.onScreenFrames > 60) {
      this.shootTimer++;
      if (this.shootTimer >= this.shootInterval) {
        this.shootTimer = 0;
        this.shootAnim = 20;
        this.scaleTarget = 1.6 * 1.18;
        setTimeout(() => { this.scaleTarget = 1.6; }, 200);
        return 'shoot';
      }
    }

    return null;
  }

  takeDamage(): boolean {
    this.hp--;
    this.hitFlash = 22;
    this.squash = 0.32;
    hitSpark(this.x, this.y - 20);
    if (this.hp <= 0) { this.die(); return true; }
    return false;
  }

  die(): void {
    if (!this.dying) { this.dying = true; this.dyingT = 0; }
  }

  draw(ctx: CanvasRenderingContext2D): void {
    const af = this._animFrame; // alias legível
    const bob = Math.sin(this.bobT) * 5.5;
    const cx = this.x;
    const cy = this.y + bob;

    if (this.dying) {
      const t = this.dyingT / this.dyingDur;
      ctx.save();
      ctx.globalAlpha = Math.max(0, 1 - t * 1.1);
      ctx.translate(cx, cy);
      ctx.scale((1 + t * 0.9) * this.scale, (1 - t * 0.95) * this.scale);
      ctx.rotate(t * Math.PI * (this.type % 2 === 0 ? 0.6 : -0.6));
      this._body(ctx, 0, 0, af);
      ctx.restore();
      return;
    }

    // Aura de perigo
    if (this.anger > 0.2) {
      const ag = ctx.createRadialGradient(cx, cy, 10, cx, cy, 60);
      ag.addColorStop(0, `rgba(255,60,0,${this.anger * 0.14})`);
      ag.addColorStop(1, 'transparent');
      ctx.beginPath();
      ctx.arc(cx, cy, 60, 0, Math.PI * 2);
      ctx.fillStyle = ag;
      ctx.fill();
    }

    // Barra de vida (só para monstros com mais de 1 HP)
    if (this.maxHp > 1) {
      const bw = 48, bx = cx - bw / 2, by = cy - 78;
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

    // Corpo
    ctx.save();
    ctx.translate(cx, cy);
    if (this.hitFlash > 0) {
      ctx.shadowBlur = 45;
      ctx.shadowColor = '#ff8800';
      this.hitFlash--;
    }
    const sq = this.squash;
    ctx.scale((1 + sq * 0.3) * this.scale, (1 - sq * 0.3) * this.scale);
    this._body(ctx, 0, 0, af);
    ctx.restore();

    // Sombra no chão
    ctx.save();
    ctx.globalAlpha = 0.18 * (1 - this.anger * 0.5);
    const sg = ctx.createRadialGradient(cx, this.y + 48, 4, cx, this.y + 48, 32);
    sg.addColorStop(0, 'rgba(0,0,0,.6)');
    sg.addColorStop(1, 'transparent');
    ctx.beginPath();
    ctx.ellipse(cx, this.y + 48, 32, 9, 0, 0, Math.PI * 2);
    ctx.fillStyle = sg;
    ctx.fill();
    ctx.restore();

    // Indicador de carga de tiro
    if (!this.dying && this.onScreenFrames > 60) {
      const prog = this.shootTimer / this.shootInterval;
      if (prog > 0.5) {
        const typeColors = ['#ff6600', '#8800ff', '#00aaff', '#ff0088'];
        ctx.save();
        ctx.globalAlpha = (prog - 0.5) * 2 * 0.6;
        ctx.strokeStyle = typeColors[this.type];
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(cx, cy - 20, 16 + prog * 8, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }
    }
  }

  private _body(ctx: CanvasRenderingContext2D, ox: number, oy: number, af: number): void {
    const drawFns = [this._grumpyBlob, this._sonicBat, this._choirGhost, this._rhythmSlime];
    drawFns[this.type].call(this, ctx, ox, oy, af);
  }

  // ─── Grumpy Blob ────────────────────────────────────────────────────────────
  private _grumpyBlob(ctx: CanvasRenderingContext2D, ox: number, oy: number, af: number): void {
    ctx.save();
    ctx.translate(ox, oy);

    const breath = 1 + Math.sin(af * 0.3) * 0.05;
    ctx.scale(1, breath);

    const grad = ctx.createRadialGradient(0, 10, 5, 0, 10, 35);
    grad.addColorStop(0, '#ff4444');
    grad.addColorStop(1, '#880000');
    ctx.fillStyle = grad;
    ctx.strokeStyle = '#550000';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(0, 15, 30, 25, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.beginPath(); ctx.ellipse(-10, 5, 6, 8, -0.2, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(10, 5, 6, 8, 0.2, 0, Math.PI * 2); ctx.fill();

    ctx.fillStyle = '#000000';
    ctx.beginPath(); ctx.arc(-8, 7, 2.5, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(8, 7, 2.5, 0, Math.PI * 2); ctx.fill();

    ctx.lineWidth = 3;
    ctx.strokeStyle = '#000000';
    ctx.beginPath(); ctx.moveTo(-18, -2); ctx.lineTo(-4, 4); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(18, -2); ctx.lineTo(4, 4); ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(-8, 20); ctx.quadraticCurveTo(0, 15, 8, 20);
    ctx.strokeStyle = '#330000';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.beginPath(); ctx.moveTo(-6, 19); ctx.lineTo(-4, 23); ctx.lineTo(-2, 18); ctx.fill();
    ctx.beginPath(); ctx.moveTo(6, 19); ctx.lineTo(4, 23); ctx.lineTo(2, 18); ctx.fill();

    ctx.strokeStyle = '#dddddd';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(25, 20); ctx.lineTo(35, 35);
    ctx.moveTo(35, 35); ctx.lineTo(30, 45);
    ctx.moveTo(35, 35); ctx.lineTo(40, 45);
    ctx.stroke();

    ctx.restore();
  }

  // ─── Sonic Bat ──────────────────────────────────────────────────────────────
  private _sonicBat(ctx: CanvasRenderingContext2D, ox: number, oy: number, af: number): void {
    ctx.save();
    ctx.translate(ox, oy);

    const flap = Math.sin(af * 0.4) * 20;

    ctx.fillStyle = '#3a2e5d';
    ctx.strokeStyle = '#1e1635';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(0, 0, 18, 22, 0, 0, Math.PI * 2);
    ctx.fill(); ctx.stroke();

    ctx.fillStyle = '#2a1f45';
    ctx.beginPath();
    ctx.moveTo(-15, 0);
    ctx.quadraticCurveTo(-35, -20 + flap, -50, -10 + flap * 0.5);
    ctx.quadraticCurveTo(-35, 10, -15, 10);
    ctx.fill(); ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(15, 0);
    ctx.quadraticCurveTo(35, -20 + flap, 50, -10 + flap * 0.5);
    ctx.quadraticCurveTo(35, 10, 15, 10);
    ctx.fill(); ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(-10, -18); ctx.lineTo(-15, -30); ctx.lineTo(-5, -20);
    ctx.moveTo(10, -18); ctx.lineTo(15, -30); ctx.lineTo(5, -20);
    ctx.fill(); ctx.stroke();

    const ep = Math.sin(this.eyePulse) * 1.5;
    ctx.fillStyle = '#ffaa00';
    ctx.shadowBlur = 10;
    ctx.shadowColor = '#ffaa00';
    ctx.beginPath(); ctx.arc(-7, -2, 6 + ep, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(7, -2, 6 + ep, 0, Math.PI * 2); ctx.fill();
    ctx.shadowBlur = 0;

    ctx.fillStyle = '#000000';
    ctx.beginPath(); ctx.arc(-8, -2, 2, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(6, -2, 2, 0, Math.PI * 2); ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.beginPath(); ctx.moveTo(-4, 8); ctx.lineTo(-2, 13); ctx.lineTo(0, 8); ctx.fill();
    ctx.beginPath(); ctx.moveTo(4, 8); ctx.lineTo(2, 13); ctx.lineTo(0, 8); ctx.fill();

    ctx.restore();
  }

  // ─── Choir Ghost ────────────────────────────────────────────────────────────
  private _choirGhost(ctx: CanvasRenderingContext2D, ox: number, oy: number, af: number): void {
    ctx.save();
    ctx.translate(ox, oy);

    const floatY = Math.sin(af * 0.08) * 6;
    ctx.translate(0, floatY);

    const grad = ctx.createLinearGradient(0, -30, 0, 40);
    grad.addColorStop(0, 'rgba(200, 240, 255, 0.9)');
    grad.addColorStop(1, 'rgba(100, 200, 255, 0.1)');
    ctx.fillStyle = grad;

    ctx.beginPath();
    ctx.moveTo(-20, 10);
    ctx.bezierCurveTo(-20, -30, 20, -30, 20, 10);
    const wave = af * 0.13;
    for (let i = 20; i >= -20; i -= 4) {
      ctx.lineTo(i, 35 + Math.sin(wave + i * 0.5) * 5);
    }
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#0a2a4a';
    ctx.beginPath(); ctx.ellipse(0, 5, 6, 10, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(-8, -10, 4, 6, -0.2, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(8, -10, 4, 6, 0.2, 0, Math.PI * 2); ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(-12, 15, 24, 16);
    ctx.strokeStyle = '#dddddd';
    ctx.strokeRect(-12, 15, 24, 16);
    ctx.fillStyle = '#000000';
    ctx.fillRect(-8, 18, 16, 1);
    ctx.fillRect(-8, 21, 16, 1);
    ctx.fillRect(-8, 24, 16, 1);
    ctx.beginPath(); ctx.arc(-4, 23, 1.5, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(4, 20, 1.5, 0, Math.PI * 2); ctx.fill();

    ctx.restore();
  }

  // ─── Rhythm Slime ───────────────────────────────────────────────────────────
  private _rhythmSlime(ctx: CanvasRenderingContext2D, ox: number, oy: number, af: number): void {
    ctx.save();
    ctx.translate(ox, oy);

    const squish = Math.sin(af * 0.2);
    ctx.scale(1 + squish * 0.1, 1 - squish * 0.1);

    ctx.fillStyle = 'rgba(100, 255, 100, 0.7)';
    ctx.strokeStyle = '#22aa22';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-25, 25);
    ctx.bezierCurveTo(-25, -20, 25, -20, 25, 25);
    ctx.closePath();
    ctx.fill(); ctx.stroke();

    ctx.fillStyle = '#dddddd';
    ctx.strokeStyle = '#888888';
    const beatX = Math.sin(af * 0.1) * 10;
    ctx.beginPath();
    ctx.moveTo(0, 15);
    ctx.lineTo(beatX - 4, -5);
    ctx.lineTo(beatX + 4, -5);
    ctx.closePath();
    ctx.fill(); ctx.stroke();

    ctx.fillStyle = '#ffaa00';
    ctx.fillRect(beatX - 6, -2, 12, 6);

    ctx.fillStyle = '#ffffff';
    ctx.beginPath(); ctx.arc(-10, 8, 5, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(10, 8, 5, 0, Math.PI * 2); ctx.fill();

    ctx.fillStyle = '#000000';
    ctx.beginPath(); ctx.arc(-10 + squish * 2, 8, 2, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(10 + squish * 2, 8, 2, 0, Math.PI * 2); ctx.fill();

    ctx.restore();
  }
}