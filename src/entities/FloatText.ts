export class FloatText {
  x: number;
  y: number;
  text: string;
  color: string;
  size: number;
  life: number;
  decay: number;
  vy: number;

  constructor(x: number, y: number, text: string, color = '#ffdd44', size = 22) {
    this.x = x;
    this.y = y;
    this.text = text;
    this.color = color;
    this.size = size;
    this.life = 1;
    this.decay = .013;
    this.vy = -1.9;
  }

  update() {
    this.life -= this.decay;
    this.y += this.vy;
    this.vy *= .952;
  }

  draw(ctx: CanvasRenderingContext2D) {
    if (this.life <= 0) return;
    ctx.save();
    ctx.globalAlpha = Math.min(1, this.life * 1.5);
    ctx.font = `700 ${this.size}px 'Cinzel',serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowBlur = 18;
    ctx.shadowColor = this.color;
    ctx.fillStyle = this.color;
    ctx.fillText(this.text, this.x, this.y);
    ctx.restore();
  }
}
