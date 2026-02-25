import { G } from '../state/gameState';
import { Particle } from './Particle';
import { GW, MOZART_X, PROJECTILE_LANE_Y } from '../constants';

export class PlayerProjectile {
  x: number;
  y: number;
  vx: number;
  vy: number;
  alive: boolean;
  trail: { x: number; y: number }[];
  age: number;
  color: string;
  size: number;

  /**
   * @param tx  Posição X do alvo (monstro)
   * @param ty  Posição Y do alvo (monstro)
   * @param freq Frequência da nota (determina a cor)
   * @param originX Posição X de origem — ponta da batuta de Mozart
   * @param originY Posição Y de origem — ponta da batuta de Mozart
   */
  constructor(tx: number, ty: number, freq: number, originX?: number, originY?: number) {
    void tx;
    void ty;
    // Usa a ponta da batuta como ponto de partida quando fornecida
    this.x = originX ?? 175;
    this.y = originY ?? 185;

    this.vx = 18;
    this.vy = 0;

    this.alive = true;
    this.trail = [];
    this.age = 0;
    this.color = `hsl(${200 + (freq - 261) / 4}, 85%, 68%)`;
    this.size = 9;
  }

  update() {
    this.age++;
    this.trail.push({ x: this.x, y: this.y });
    if (this.trail.length > 24) this.trail.shift();

    this.x += this.vx;
    this.y += this.vy;

    if (this.x > GW + 50 || this.x < -50) this.alive = false;

    if (this.age % 2 === 0) {
      G.particles.push(
        new Particle(this.x, this.y, {
          color: this.color,
          r: 2.5,
          spd: 0.6,
          decay: 0.09,
          gravity: 0,
          glow: true,
        }),
      );
    }
  }

  draw(ctx: CanvasRenderingContext2D) {
    // Trilha com gradiente de velocidade
    for (let i = 1; i < this.trail.length; i++) {
      const t = i / this.trail.length;
      const p = this.trail[i];
      const pp = this.trail[i - 1];
      ctx.beginPath();
      ctx.moveTo(pp.x, pp.y);
      ctx.lineTo(p.x, p.y);
      ctx.strokeStyle = `hsla(200, 85%, ${35 + t * 35}%, ${t * 0.65})`;
      ctx.lineWidth = t * 8;
      ctx.lineCap = 'round';
      ctx.stroke();
    }

    // Aura exterior difusa
    const gr1 = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, 22);
    gr1.addColorStop(0, this.color.replace('hsl(', 'hsla(').replace(')', ', .55)'));
    gr1.addColorStop(1, 'transparent');
    ctx.beginPath();
    ctx.arc(this.x, this.y, 22, 0, Math.PI * 2);
    ctx.fillStyle = gr1;
    ctx.fill();

    // Núcleo brilhante
    const gr2 = ctx.createRadialGradient(this.x, this.y, 1, this.x, this.y, this.size);
    gr2.addColorStop(0, '#ffffff');
    gr2.addColorStop(0.4, this.color);
    gr2.addColorStop(1, 'transparent');
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fillStyle = gr2;
    ctx.fill();

    // Nota musical no centro
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
  targetX: number;
  targetY: number;
  alive: boolean;
  trail: { x: number; y: number }[];
  age: number;
  type: number;
  color: string;
  glowColor: string;
  sparkColor: string;
  size: number;
  rot: number;

  constructor(sx: number, _sy: number, type = 0, laneY = PROJECTILE_LANE_Y) {
    this.x = sx;
    this.y = laneY;
    this.targetX = MOZART_X + 15;
    this.targetY = laneY;

    const spd = 7 + type * 0.5;
    this.vx = -spd;
    this.vy = 0;

    this.alive = true;
    this.trail = [];
    this.age = 0;
    this.type = type;

    const cols = [
      ['#ff6600', '#ff3300', '#ffaa00'],
      ['#8800ff', '#5500cc', '#cc88ff'],
      ['#00aaff', '#0066ff', '#88ddff'],
      ['#ff0088', '#cc0055', '#ff88cc'],
    ];
    const c = cols[type % 4];
    this.color = c[0];
    this.glowColor = c[1];
    this.sparkColor = c[2];
    this.size = 10 + type * 1.5;
    this.rot = 0;
  }

  update() {
    this.age++;
    this.rot += 0.12;
    this.trail.push({ x: this.x, y: this.y });
    if (this.trail.length > 18) this.trail.shift();

    this.x += this.vx;
    this.y += this.vy;

    if (this.age % 3 === 0) {
      G.particles.push(
        new Particle(this.x, this.y, {
          color: this.sparkColor,
          r: 2,
          spd: 0.4,
          decay: 0.12,
          gravity: 0,
        }),
      );
    }

    const dx = this.x - this.targetX;
    const dy = this.y - this.targetY;
    if (Math.abs(dx) < Math.max(20, this.size + 8) && Math.abs(dy) < 26) {
      this.alive = false;
      return 'hit';
    }
    if (this.x < -30) this.alive = false;
    return null;
  }

  draw(ctx: CanvasRenderingContext2D) {
    // Trilha
    for (let i = 1; i < this.trail.length; i++) {
      const t = i / this.trail.length;
      ctx.beginPath();
      ctx.arc(this.trail[i].x, this.trail[i].y, this.size * t * 0.7, 0, Math.PI * 2);
      const rgba =
        this.type === 0 ? '255,100,0'
        : this.type === 1 ? '136,0,255'
        : this.type === 2 ? '0,170,255'
        : '255,0,136';
      ctx.fillStyle = `rgba(${rgba},${t * 0.4})`;
      ctx.fill();
    }

    // Aura
    const g1 = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.size * 2);
    g1.addColorStop(0, this.color.replace(')', ',0.6)').replace('rgb', 'rgba'));
    g1.addColorStop(1, 'transparent');
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size * 2, 0, Math.PI * 2);
    ctx.fillStyle = g1;
    ctx.fill();

    // Núcleo
    const g2 = ctx.createRadialGradient(this.x, this.y, 1, this.x, this.y, this.size);
    g2.addColorStop(0, '#ffffff');
    g2.addColorStop(0.35, this.color);
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
    ctx.strokeStyle = 'rgba(255,255,255,.7)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(-this.size * 0.7, 0); ctx.lineTo(this.size * 0.7, 0);
    ctx.moveTo(0, -this.size * 0.7); ctx.lineTo(0, this.size * 0.7);
    ctx.stroke();
    ctx.restore();
  }
}
