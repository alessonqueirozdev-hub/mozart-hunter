import { G } from '../state/gameState';
import type { ParticleOptions } from '../types';

export class Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  decay: number;
  r: number;
  color: string;
  type: string;
  rot: number;
  rotV: number;
  gravity: number;
  glow: boolean;

  constructor(x: number, y: number, o: ParticleOptions = {}) {
    this.x = x;
    this.y = y;
    const ang = o.ang ?? Math.random() * Math.PI * 2;
    const spd = (o.spd ?? 4) * (Math.random() * .7 + .65);
    this.vx = Math.cos(ang) * spd;
    this.vy = Math.sin(ang) * spd - (o.up ?? 1.2);
    this.life = 1;
    this.decay = o.decay ?? (0.016 + Math.random() * .022);
    this.r = o.r ?? (Math.random() * 5 + 2);
    this.color = o.color ?? '#ffcc44';
    this.type = o.type ?? 'circle';
    this.rot = Math.random() * Math.PI * 2;
    this.rotV = (Math.random() - .5) * .18;
    this.gravity = o.gravity ?? .09;
    this.glow = o.glow ?? false;
  }

  update() {
    this.life -= this.decay;
    this.x += this.vx;
    this.y += this.vy;
    this.vy += this.gravity;
    this.vx *= .972;
    this.rot += this.rotV;
  }

  draw(ctx: CanvasRenderingContext2D) {
    if (this.life <= 0) return;
    ctx.save();
    ctx.globalAlpha = Math.max(0, this.life);
    ctx.translate(this.x, this.y);
    ctx.rotate(this.rot);
    if (this.glow) {
      ctx.shadowBlur = 14;
      ctx.shadowColor = this.color;
    }
    if (this.type === 'note') {
      ctx.font = `${this.r * 4}px serif`;
      ctx.fillStyle = this.color;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('♪', 0, 0);
    } else if (this.type === 'star') {
      ctx.beginPath();
      for (let i = 0; i < 5; i++) {
        const a = i / 5 * Math.PI * 2 - Math.PI / 2, ai = a + Math.PI / 5;
        i === 0 ? ctx.moveTo(Math.cos(a) * this.r, Math.sin(a) * this.r) : ctx.lineTo(Math.cos(a) * this.r, Math.sin(a) * this.r);
        ctx.lineTo(Math.cos(ai) * this.r * .4, Math.sin(ai) * this.r * .4);
      }
      ctx.closePath();
      ctx.fillStyle = this.color;
      ctx.fill();
    } else if (this.type === 'ring') {
      ctx.beginPath();
      ctx.arc(0, 0, this.r * (2 - this.life), 0, Math.PI * 2);
      ctx.strokeStyle = this.color;
      ctx.lineWidth = 2 * this.life;
      ctx.stroke();
    } else if (this.type === 'ember') {
      ctx.fillStyle = this.color;
      ctx.fillRect(-this.r * this.life, 0, this.r * 2 * this.life, this.r * this.life * .5);
    } else {
      ctx.beginPath();
      ctx.arc(0, 0, this.r * Math.max(.1, this.life * .8 + .2), 0, Math.PI * 2);
      ctx.fillStyle = this.color;
      ctx.fill();
    }
    ctx.restore();
  }
}

export function burst(x: number, y: number, color: string, n = 18, o: ParticleOptions = {}) {
  for (let i = 0; i < n; i++) G.particles.push(new Particle(x, y, { color, ...o }));
}

export function noteExplosion(x: number, y: number, col = '#aaddff') {
  burst(x, y, col, 12, { spd: 7, r: 4.5, type: 'star', gravity: .06, glow: true });
  burst(x, y, '#ffffff', 10, { spd: 11, r: 2.8, decay: .05 });
  burst(x, y, col, 6, { spd: 3.5, r: 7, type: 'ring', decay: .025, gravity: 0 });
  for (let i = 0; i < 10; i++) G.particles.push(new Particle(x, y, { color: col, type: 'note', r: 3.5, spd: 4, gravity: .035, decay: .02, glow: true }));
  burst(x, y, '#ffee88', 8, { spd: 3, r: 3, type: 'ember', gravity: .08 });
}

export function hitSpark(x: number, y: number, col = '#ffee88') {
  burst(x, y, col, 7, { spd: 4.5, r: 3.5, type: 'star', gravity: .09, decay: .058 });
  burst(x, y, '#ff8800', 5, { spd: 7, r: 2.2, gravity: .12, decay: .065 });
}

export function mozartHitEffect(x: number, y: number) {
  burst(x, y, '#ff4400', 12, { spd: 5, r: 4, type: 'star', gravity: .07, decay: .04, glow: true });
  burst(x, y, '#ff8800', 8, { spd: 8, r: 2.5, decay: .055 });
  burst(x, y, '#ff0000', 5, { spd: 2.5, r: 6, type: 'ring', decay: .03, gravity: 0 });
}
