let _shootFlash = 0;
let _lastWorldX = 115;
let _lastWorldY = 170;
let _lastBobY = 0;
let _lastBobRot = 0;

let _leftBlinkCooldown = 90;
let _rightBlinkCooldown = 155;
let _leftBlinkFrames = 0;
let _rightBlinkFrames = 0;

export function triggerMozartShoot(): void {
  _shootFlash = 15;
  updateBatonTipWorld(true);
}

let _batonTipWorldX = 185;
let _batonTipWorldY = 170;

export function getMozartBatonTip(): { x: number; y: number } {
  return { x: _batonTipWorldX, y: _batonTipWorldY };
}

const mozartIdleSprite = new Image();
const mozartShootSprite = new Image();
let idleReady = false;
let shootReady = false;
type SpriteCache = {
  upper: HTMLCanvasElement;
  lowerLeft: HTMLCanvasElement;
  lowerRight: HTMLCanvasElement;
  upperH: number;
  lowerH: number;
  halfW: number;
};
let idleCache: SpriteCache | null = null;
let shootCache: SpriteCache | null = null;

mozartIdleSprite.onload = () => {
  idleReady = true;
  idleCache = buildSpriteCache(mozartIdleSprite);
};
mozartShootSprite.onload = () => {
  shootReady = true;
  shootCache = buildSpriteCache(mozartShootSprite);
};

mozartIdleSprite.src = '/mozart-idle.svg';
mozartShootSprite.src = '/mozart-shoot.svg';

// Sprite is drawn anchored at feet base (worldX, worldY).
const SPRITE_W = 186;
const SPRITE_H = 186;
const SPRITE_Y_OFFSET = 120;
const REFERENCE_Y_OFFSET = 22;
const Y_DELTA = SPRITE_Y_OFFSET - REFERENCE_Y_OFFSET;
const SPRITE_DRAW_X = -SPRITE_W * 0.5;
const SPRITE_DRAW_Y = -SPRITE_H + SPRITE_Y_OFFSET;
const SVG_SIZE = 1282;
const SPRITE_SCALE = SPRITE_W / SVG_SIZE;
const LEG_SPLIT_RATIO = 0.73;
const LEG_SEAM_OVERLAP = 2;

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

  return { upper, lowerLeft, lowerRight, upperH, lowerH, halfW };
}

function svgPointToLocal(svgX: number, svgY: number): { x: number; y: number } {
  return {
    x: SPRITE_DRAW_X + svgX * SPRITE_SCALE,
    y: SPRITE_DRAW_Y + svgY * SPRITE_SCALE,
  };
}

// Batuta idle: centro visual da ponta branca no SVG-base.
const BATON_IDLE_TIP = svgPointToLocal(789, 1004);
// Batuta shoot: mesma ponta, mas com transform aplicado no grupo shoot (rotate + translate).
const BATON_SHOOT_TIP = svgPointToLocal(884.783, 841.609);

function updateBatonTipWorld(useShootPose: boolean): void {
  const tip = useShootPose ? BATON_SHOOT_TIP : BATON_IDLE_TIP;
  const cosR = Math.cos(_lastBobRot);
  const sinR = Math.sin(_lastBobRot);
  _batonTipWorldX = _lastWorldX + (cosR * tip.x - sinR * tip.y);
  _batonTipWorldY = _lastWorldY + _lastBobY + (sinR * tip.x + cosR * tip.y);
}

function blinkAmount(framesLeft: number, totalFrames: number): number {
  if (framesLeft <= 0) return 0;
  const t = (totalFrames - framesLeft) / totalFrames;
  return 1 - Math.abs(t * 2 - 1);
}

function updateBlink(): void {
  const LEFT_DURATION = 8;
  const RIGHT_DURATION = 7;

  if (_leftBlinkFrames > 0) {
    _leftBlinkFrames--;
  } else {
    _leftBlinkCooldown--;
    if (_leftBlinkCooldown <= 0) {
      _leftBlinkFrames = LEFT_DURATION;
      _leftBlinkCooldown = 110 + Math.floor(Math.random() * 220);
    }
  }

  if (_rightBlinkFrames > 0) {
    _rightBlinkFrames--;
  } else {
    _rightBlinkCooldown--;
    if (_rightBlinkCooldown <= 0) {
      _rightBlinkFrames = RIGHT_DURATION;
      _rightBlinkCooldown = 130 + Math.floor(Math.random() * 260);
    }
  }
}

function drawEyeBlinkOverlay(ctx: CanvasRenderingContext2D): void {
  const leftClose = blinkAmount(_leftBlinkFrames, 8);
  const rightClose = blinkAmount(_rightBlinkFrames, 7);
  if (leftClose <= 0.01 && rightClose <= 0.01) return;

  // Coordenadas aproximadas dos olhos no sprite (esq/dir), mantendo sutileza.
  const LEFT_EYE_X = -27;
  const RIGHT_EYE_X = 5;
  const EYE_Y = -13;
  const EYE_HALF_W = 5;

  const drawLid = (eyeX: number, closure: number): void => {
    if (closure <= 0.01) return;
    ctx.strokeStyle = 'rgba(242,219,184,0.96)';
    ctx.lineCap = 'round';
    ctx.lineWidth = 1.7 + closure * 5.2;
    ctx.beginPath();
    ctx.moveTo(eyeX - EYE_HALF_W, EYE_Y - closure * 1.2);
    ctx.lineTo(eyeX + EYE_HALF_W, EYE_Y + closure * 1.0);
    ctx.stroke();

    ctx.strokeStyle = `rgba(70,50,38,${0.2 + closure * 0.25})`;
    ctx.lineWidth = 0.9 + closure * 0.8;
    ctx.beginPath();
    ctx.moveTo(eyeX - EYE_HALF_W + 0.4, EYE_Y - 1.2);
    ctx.lineTo(eyeX + EYE_HALF_W - 0.4, EYE_Y - 0.2);
    ctx.stroke();
  };

  drawLid(LEFT_EYE_X, leftClose);
  drawLid(RIGHT_EYE_X, rightClose);
}

export function drawMozart(
  ctx: CanvasRenderingContext2D,
  worldX: number,
  worldY: number,
  anger = 0,
  hitFlash = 0,
  frame = 0,
): void {
  if (_shootFlash > 0) _shootFlash--;

  updateBlink();

  const walkCycle = frame * 0.25;
  const bobY = 0;
  const bobRot = 0;
  const bodyScaleX = 1;
  const bodyScaleY = 1;
  const useShootPose = _shootFlash > 0 && shootReady;

  _lastWorldX = worldX;
  _lastWorldY = worldY;
  _lastBobY = bobY;
  _lastBobRot = bobRot;
  updateBatonTipWorld(useShootPose);

  ctx.save();
  ctx.translate(worldX, worldY + bobY);
  ctx.rotate(bobRot);
  ctx.scale(bodyScaleX, bodyScaleY);

  if (hitFlash > 0) {
    ctx.shadowBlur = 45;
    ctx.shadowColor = '#ff2200';
    ctx.globalAlpha = 0.78 + Math.sin(hitFlash * 0.9) * 0.22;
  }

  ctx.save();
  ctx.globalAlpha = hitFlash > 0 ? 0.08 : 0.16;
  ctx.scale(1, 0.25);
  ctx.beginPath();
  ctx.ellipse(2, 4, 24, 9, 0, 0, Math.PI * 2);
  ctx.fillStyle = '#000000';
  ctx.fill();
  ctx.restore();

  if (anger > 0.15) {
    const ar = 54 + anger * 20;
    const ag = ctx.createRadialGradient(0, -102 + Y_DELTA, 10, 0, -102 + Y_DELTA, ar);
    ag.addColorStop(0, `rgba(255,70,0,${anger * 0.14})`);
    ag.addColorStop(1, 'transparent');
    ctx.beginPath();
    ctx.arc(0, -102 + Y_DELTA, ar, 0, Math.PI * 2);
    ctx.fillStyle = ag;
    ctx.fill();
  }

  const spriteReady = useShootPose ? shootReady : idleReady;
  const cache = useShootPose ? shootCache : idleCache;

  if (spriteReady && cache) {
    const splitDstY = SPRITE_DRAW_Y + cache.upperH;

    // Parte superior totalmente estática (tronco/cabeça/braços), via cache raster.
    ctx.drawImage(cache.upper, SPRITE_DRAW_X, SPRITE_DRAW_Y);

    // Pernas/pés: pequeno ciclo alternado sem balançar o corpo inteiro.
    const stride = 0;
    const leftLift = Math.max(0, -Math.sin(walkCycle)) * 0.8;
    const rightLift = Math.max(0, Math.sin(walkCycle)) * 0.8;

    ctx.drawImage(cache.lowerLeft, SPRITE_DRAW_X + stride, splitDstY - leftLift);
    ctx.drawImage(
      cache.lowerRight,
      SPRITE_DRAW_X + cache.halfW - stride - LEG_SEAM_OVERLAP,
      splitDstY - rightLift,
    );

    drawEyeBlinkOverlay(ctx);
  } else {
    drawSpriteFallback(ctx);
  }
  ctx.restore();
}

function drawSpriteFallback(ctx: CanvasRenderingContext2D): void {
  ctx.fillStyle = '#a3222c';
  ctx.beginPath();
  ctx.roundRect(-40, -150, 80, 130, 20);
  ctx.fill();
  ctx.fillStyle = '#f7ddbc';
  ctx.beginPath();
  ctx.arc(0, -140, 18, 0, Math.PI * 2);
  ctx.fill();
}
