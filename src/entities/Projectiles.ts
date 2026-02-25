import { G } from '../state/gameState';
import { Particle } from './Particle';
import { GH, GW } from '../constants';

export class PlayerProjectile {
  x: number;
  y: number;
  vx: number;
  vy: number;
  alive: boolean;
  trail: {x: number, y: number}[];
  age: number;
  color: string;
  size: number;

  constructor(tx: number, ty: number, freq: number) {
    this.x = 145;
    this.y = GH * .60;
    const dx = tx - this.x, dy = ty - this.y, d = Math.sqrt(dx * dx + dy * dy) || 1;
    this.vx = dx / d * 18;
    this.vy = dy / d * 18;
    this.alive = true;
    this.trail = [];
    this.age = 0;
    this.color = `hsl(${200 + (freq - 261) / 4},85%,68%)`;
    this.size = 9;
  }

  update() {
    this.age++;
    this.trail.push({ x: this.x, y: this.y });
    if (this.trail.length > 24) this.trail.shift();
    this.x += this.vx;
    this.y += this.vy;
    if (this.x > GW + 50 || this.x < -50) this.alive = false;
    if (this.age % 2 === 0) G.particles.push(new Particle(this.x, this.y, { color: this.color, r: 2.5, spd: .6, decay: .09, gravity: 0, glow: true }));
  }

  draw(ctx: CanvasRenderingContext2D) {
    for (let i = 1; i < this.trail.length; i++) {
      const t = i / this.trail.length, p = this.trail[i], pp = this.trail[i - 1];
      ctx.beginPath();
      ctx.moveTo(pp.x, pp.y);
      ctx.lineTo(p.x, p.y);
      ctx.strokeStyle = `hsla(200,85%,${35 + t * 35}%,${t * .65})`;
      ctx.lineWidth = t * 8;
      ctx.lineCap = 'round';
      ctx.stroke();
    }
    const gr1 = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, 22);
    gr1.addColorStop(0, this.color.replace('hsl(', 'hsla(').replace(')', ', .55)'));
    gr1.addColorStop(1, 'transparent');
    ctx.beginPath();
    ctx.arc(this.x, this.y, 22, 0, Math.PI * 2);
    ctx.fillStyle = gr1;
    ctx.fill();
    const gr2 = ctx.createRadialGradient(this.x, this.y, 1, this.x, this.y, this.size);
    gr2.addColorStop(0, '#ffffff');
    gr2.addColorStop(.4, this.color);
    gr2.addColorStop(1, 'transparent');
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fillStyle = gr2;
    ctx.fill();
    ctx.save();
    ctx.shadowBlur = 12;
    ctx.shadowColor = this.color;
    ctx.font = '12px serif';
    ctx.fillStyle = 'rgba(255,255,255,.98)';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('♩', this.x, this.y + 1);
    ctx.restore();
  }
}

export class MonsterProjectile {
  x: number;
  y: number;
  vx: number;
  vy: number;
  alive: boolean;
  trail: {x: number, y: number}[];
  age: number;
  type: number;
  color: string;
  glowColor: string;
  sparkColor: string;
  size: number;
  rot: number;

  constructor(sx: number, sy: number, type = 0) {
    this.x = sx;
    this.y = sy;
    const targetX = 130, targetY = GH * .60 - 25;
    const dx = targetX - sx, dy = targetY - sy, d = Math.sqrt(dx * dx + dy * dy) || 1;
    const spd = 7 + type * .5;
    this.vx = dx / d * spd;
    this.vy = dy / d * spd;
    this.alive = true;
    this.trail = [];
    this.age = 0;
    this.type = type;
    const cols = [['#ff6600', '#ff3300', '#ffaa00'], ['#8800ff', '#5500cc', '#cc88ff'], ['#00aaff', '#0066ff', '#88ddff'], ['#ff0088', '#cc0055', '#ff88cc']];
    const c = cols[type % 4];
    this.color = c[0];
    this.glowColor = c[1];
    this.sparkColor = c[2];
    this.size = 10 + type * 1.5;
    this.rot = 0;
  }

  update() {
    this.age++;
    this.rot += .12;
    this.trail.push({ x: this.x, y: this.y });
    if (this.trail.length > 18) this.trail.shift();
    this.x += this.vx;
    this.y += this.vy;
    if (this.age % 3 === 0) G.particles.push(new Particle(this.x, this.y, { color: this.sparkColor, r: 2, spd: .4, decay: .12, gravity: 0 }));
    // Hit Mozart area
    const mx = 130, my = GH * .60 - 20;
    const dx = this.x - mx, dy = this.y - my, dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < 38 && this.x < 180) { this.alive = false; return 'hit'; }
    if (this.x < -30) this.alive = false;
    return null;
  }

  draw(ctx: CanvasRenderingContext2D) {
    for (let i = 1; i < this.trail.length; i++) {
      const t = i / this.trail.length;
      ctx.beginPath();
      ctx.arc(this.trail[i].x, this.trail[i].y, this.size * t * .7, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${this.type === 0 ? '255,100,0' : this.type === 1 ? '136,0,255' : this.type === 2 ? '0,170,255' : '255,0,136'},${t * .4})`;
      ctx.fill();
    }
    const g1 = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.size * 2);
    g1.addColorStop(0, this.color.replace(')', ',0.6)').replace('rgb', 'rgba'));
    g1.addColorStop(1, 'transparent');
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size * 2, 0, Math.PI * 2);
    ctx.fillStyle = g1;
    ctx.fill();
    const g2 = ctx.createRadialGradient(this.x, this.y, 1, this.x, this.y, this.size);
    g2.addColorStop(0, '#ffffff');
    g2.addColorStop(.35, this.color);
    g2.addColorStop(1, 'transparent');
    ctx.save();
    ctx.shadowBlur = 22;
    ctx.shadowColor = this.glowColor;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fillStyle = g2;
    ctx.fill();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.rot);
    ctx.strokeStyle = `rgba(255,255,255,.7)`;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(-this.size * .7, 0);
    ctx.lineTo(this.size * .7, 0);
    ctx.moveTo(0, -this.size * .7);
    ctx.lineTo(0, this.size * .7);
    ctx.stroke();
    ctx.restore();
  }
}
