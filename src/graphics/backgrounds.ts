import { GW, GH } from '../constants';

export const bgSky = (() => {
  const c = document.createElement('canvas'); c.width = GW; c.height = GH;
  const x = c.getContext('2d')!;
  
  // Rich, deep twilight-to-midnight gradient
  const g = x.createLinearGradient(0,0,0,GH);
  g.addColorStop(0,'#030114'); 
  g.addColorStop(0.3,'#080424'); 
  g.addColorStop(0.6,'#150638'); 
  g.addColorStop(1,'#260b4a');
  x.fillStyle = g; x.fillRect(0,0,GW,GH);
  
  // Layer of complex nebula clouds
  const nebulaColors = ['#4a0b65', '#2b095e', '#160845'];
  for (let i = 0; i < 6; i++) {
    const nx = Math.random() * GW, ny = Math.random() * GH * 0.7;
    const nr = 120 + Math.random() * 150;
    const ng = x.createRadialGradient(nx,ny,0,nx,ny,nr);
    const col = nebulaColors[Math.floor(Math.random() * nebulaColors.length)];
    ng.addColorStop(0, col + 'bb'); 
    ng.addColorStop(.4, col + '44'); 
    ng.addColorStop(1, 'transparent');
    x.globalAlpha = 0.15 + Math.random() * 0.15; 
    x.beginPath(); x.arc(nx,ny,nr,0,Math.PI*2); x.fillStyle=ng; x.fill();
  }
  x.globalAlpha = 1;

  // Starfield
  for (let i = 0; i < 200; i++) {
    const sx = Math.random() * GW, sy = Math.random() * GH * 0.8;
    const r = Math.random() * 1.5 + 0.5;
    const a = Math.random() * 0.8 + 0.1;
    x.globalAlpha = a;
    x.fillStyle = Math.random() > 0.8 ? '#f4e0ff' : '#d0e8ff';
    x.beginPath(); x.arc(sx, sy, r, 0, Math.PI * 2); x.fill();
  }
  x.globalAlpha = 1;

  // Celestial Staff (glowing bezier curves)
  for (let s = 0; s < 5; s++) {
    x.beginPath();
    const offset = s * 12;
    x.moveTo(0, GH * 0.35 + offset);
    x.bezierCurveTo(GW * 0.3, GH * 0.15 + offset, GW * 0.6, GH * 0.55 + offset, GW, GH * 0.25 + offset);
    x.strokeStyle = `rgba(220, 180, 255, ${0.15 + Math.abs(2-s)*0.05})`;
    x.lineWidth = 2;
    x.stroke();
  }

  // Constellation notes
  x.textAlign = "center";
  x.textBaseline = "middle";
  const notes = ['♪', '♫', '♬', '♩', '𝄞', '𝄢'];
  function drawNoteGlow(char: string, nx: number, ny: number, size: number, alpha: number) {
    x.font = `italic ${size}px serif`;
    x.fillStyle = `rgba(255, 230, 255, ${alpha})`;
    x.shadowBlur = 15;
    x.shadowColor = 'rgba(255, 180, 255, 0.8)';
    x.fillText(char, nx, ny);
    x.shadowBlur = 0;
  }
  for (let i = 0; i < 12; i++) {
    const nx = Math.random() * GW;
    const ny = Math.random() * GH * 0.5;
    drawNoteGlow(notes[Math.floor(Math.random() * notes.length)], nx, ny, 20 + Math.random() * 30, 0.1 + Math.random() * 0.3);
  }

  // Epic Blood/Golden Moon (Treble Clef inside)
  const mx=GW*.82, my=85;
  const outerGlow = x.createRadialGradient(mx,my,40,mx,my,160);
  outerGlow.addColorStop(0,'rgba(255, 180, 80, 0.3)'); 
  outerGlow.addColorStop(0.5,'rgba(200, 100, 40, 0.1)'); 
  outerGlow.addColorStop(1,'transparent');
  x.beginPath(); x.arc(mx,my,160,0,Math.PI*2); x.fillStyle=outerGlow; x.fill();

  const mhalo = x.createRadialGradient(mx,my,35,mx,my,70);
  mhalo.addColorStop(0,'rgba(255, 220, 140, 0.8)'); 
  mhalo.addColorStop(1,'transparent');
  x.beginPath(); x.arc(mx,my,70,0,Math.PI*2); x.fillStyle=mhalo; x.fill();
  
  const mg = x.createLinearGradient(mx-40,my-40,mx+40,my+40);
  mg.addColorStop(0,'#fffce0'); 
  mg.addColorStop(.5,'#ffd275'); 
  mg.addColorStop(.8,'#e89035'); 
  mg.addColorStop(1,'#8c2d13');
  x.beginPath(); x.arc(mx,my,40,0,Math.PI*2); x.fillStyle=mg; x.fill();
  
  // Moon craters
  x.globalCompositeOperation = 'multiply';
  x.globalAlpha = 0.4;
  const craters = [[8,12,6], [-12,-5,5], [10,-12,3.5], [-16,15,4], [22,2,3], [-2,22,4.5], [16,-22,2]];
  craters.forEach(([cx,cy,cr])=>{
    x.beginPath(); x.arc(mx+cx,my+cy,cr,0,Math.PI*2); x.fillStyle='#b86f21'; x.fill();
    x.beginPath(); x.arc(mx+cx-1,my+cy-1,cr*.8,0,Math.PI*2); x.fillStyle='#8a470d'; x.fill();
  });
  x.globalCompositeOperation = 'source-over';
  x.globalAlpha = 1;

  // Add a huge faint glowing treble clef overlapping the moon
  drawNoteGlow('𝄞', mx, my, 140, 0.4);

  return c;
})();

export const bgCastle = (() => {
  const c = document.createElement('canvas'); c.width = GW; c.height = GH;
  const x = c.getContext('2d')!;

  const rs = (num: number) => Math.sin(num*124.125) * 452.12 % 1;
  let seed = 1;
  const rnd = () => { seed++; const val = rs(seed); return val < 0 ? val + 1 : val; };

  function drawLayer(offsetY: number, colorTop: string, colorBot: string, scale: number, density: number) {
    const groundY = GH * 0.7 + offsetY;
    const floorG = x.createLinearGradient(0, groundY - 20, 0, groundY + 50);
    floorG.addColorStop(0, colorTop); floorG.addColorStop(1, colorBot);
    x.fillStyle = floorG;
    x.fillRect(0, groundY - 20, GW, GH - groundY + 20);

    const pipeCount = Math.floor(40 * density);
    for(let i=0; i<pipeCount; i++) {
      const cx = (i / pipeCount) * GW + (rnd() * 30 - 15);
      const w = (8 + rnd() * 20) * scale;
      const h = (50 + rnd() * 180) * scale;
      
      for(let rep=-1; rep<=1; rep++) {
        const rCx = cx + rep * GW;
        if (rCx + w < 0 || rCx > GW) continue; 
        
        const ty = groundY - h;
        
        // Organ Pipe body
        const g = x.createLinearGradient(rCx, ty, rCx+w, ty);
        g.addColorStop(0, colorBot); 
        g.addColorStop(0.3, colorTop); 
        g.addColorStop(0.7, colorBot); 
        g.addColorStop(1, '#000000');
        x.fillStyle = g;
        x.fillRect(rCx, ty, w, h);

        const holeY = ty + h * (0.1 + rnd() * 0.05);
        
        // Top angled cut
        x.beginPath();
        x.moveTo(rCx, ty);
        x.lineTo(rCx + w, ty - w * Math.tan(Math.PI/6)); 
        x.lineTo(rCx + w, ty);
        x.closePath();
        x.fillStyle = colorTop;
        x.fill();
        
        // The pipe mouth / lip
        x.fillStyle = '#05010a'; // dark hole
        x.beginPath();
        x.ellipse(rCx + w/2, holeY, w*0.4, w*0.2, 0, 0, Math.PI*2);
        x.fill();

        // Lower lip
        x.fillStyle = colorTop;
        x.beginPath();
        x.ellipse(rCx + w/2, holeY + w*0.05, w*0.4, w*0.1, 0, 0, Math.PI*2);
        x.fill();

        // Glowing piano keys at the base
        if (rnd() > 0.6) {
          x.fillStyle = 'rgba(255, 220, 100, 0.4)';
          const kH = 20 * scale;
          x.fillRect(rCx + w*0.2, groundY - kH, w*0.2, kH);
          x.fillRect(rCx + w*0.6, groundY - kH*0.8, w*0.2, kH*0.8);
        }

        // Add small glowing notes floating up from the pipes occasionally
        if (rnd() > 0.85) {
          x.fillStyle = 'rgba(255, 200, 50, 0.6)';
          x.font = `${Math.floor(10*scale)}px serif`;
          x.fillText(rnd()>0.5?'♪':'♫', rCx + w/2, ty - 10 - rnd()*20);
        }
      }
    }
  }

  // Draw layers of organ pipe city
  drawLayer(-20, '#1a083d', '#0b021d', 0.5, 1.5);
  drawLayer( 10, '#140530', '#070114', 0.8, 1.0);
  drawLayer( 45, '#0d021f', '#030008', 1.2, 0.7);

  const mist = x.createLinearGradient(0, GH*0.65, 0, GH*0.85);
  mist.addColorStop(0, 'transparent'); 
  mist.addColorStop(0.5, 'rgba(15, 6, 35, 0.9)'); 
  mist.addColorStop(1, '#05010d');
  x.fillStyle = mist;
  x.fillRect(0, GH*0.65, GW, GH*0.2);

  return c;
})();

export const bgFloor = (() => {
  const c = document.createElement('canvas'); c.width = GW; c.height = GH;
  const x = c.getContext('2d')!;
  
  const fg = x.createLinearGradient(0,GH*.64,0,GH);
  fg.addColorStop(0,'#120526'); fg.addColorStop(.4,'#090214'); fg.addColorStop(1,'#020008');
  x.fillStyle=fg; x.fillRect(0,GH*.64,GW,GH*.36);

  // Horizon line
  const hg = x.createLinearGradient(0,GH*.64-5,0,GH*.64+15);
  hg.addColorStop(0,'rgba(160,50,255,0)'); 
  hg.addColorStop(.5,'rgba(180,70,255,.8)'); 
  hg.addColorStop(1,'rgba(80,20,160,0)');
  x.fillStyle=hg; x.fillRect(0,GH*.64-5,GW,20);
  x.beginPath(); x.moveTo(0,GH*.64); x.lineTo(GW,GH*.64);
  x.strokeStyle='#d9a0ff'; x.lineWidth=1.5; x.stroke();

  const vanishingY = GH*.55; 
  const staffWidthAtBottom = 400;

  // Central Glowing Staff
  x.shadowBlur = 10;
  x.shadowColor = '#d9a0ff';
  for(let i=0; i<5; i++) {
    const bottomX = GW/2 - staffWidthAtBottom/2 + (staffWidthAtBottom/4) * i;
    x.beginPath();
    x.moveTo(GW/2, vanishingY);
    x.lineTo(bottomX, GH);
    x.strokeStyle = 'rgba(217, 160, 255, 0.8)';
    x.lineWidth = 1.5;
    x.stroke();
  }
  x.shadowBlur = 0;

  // Horizontal bar lines for the central staff
  for(let yi=0; yi<12; yi++) {
    const py = GH*.64 + Math.pow(yi, 1.6) * 3;
    if(py > GH) break;
    const t = (py - vanishingY) / (GH - vanishingY);
    if (t < 0) continue;
    const leftX = GW/2 - (staffWidthAtBottom/2) * t;
    const rightX = GW/2 + (staffWidthAtBottom/2) * t;
    x.beginPath(); 
    x.moveTo(leftX, py);
    x.lineTo(rightX, py);
    x.strokeStyle = 'rgba(217, 160, 255, 0.5)';
    x.lineWidth = 1;
    x.stroke();
  }

  // Outer piano keys framing the staff
  const whiteKeyColor = '#9a8fa8';
  const whiteKeyDark = '#6a5a7d';
  
  for(let yi=0; yi<35; yi++) {
    const py1 = GH*.64 + Math.pow(yi, 1.5) * 2;
    const py2 = GH*.64 + Math.pow(yi+0.8, 1.5) * 2;
    if(py1 > GH*1.2) break; 
    
    const t1 = Math.max(0, (py1 - vanishingY) / (GH - vanishingY));
    const t2 = Math.max(0, (py2 - vanishingY) / (GH - vanishingY));
    const staffW1 = staffWidthAtBottom * t1;
    const staffW2 = staffWidthAtBottom * t2;

    const lx1 = GW/2 - staffW1/2;
    const lx2 = GW/2 - staffW2/2;
    const rx1 = GW/2 + staffW1/2;
    const rx2 = GW/2 + staffW2/2;

    const kw1 = 150 * t1; 
    const kw2 = 150 * t2;
    
    // Left white key
    x.fillStyle = (yi % 2 === 0) ? whiteKeyColor : whiteKeyDark;
    x.beginPath();
    x.moveTo(lx1, py1); x.lineTo(lx2, py2); x.lineTo(lx2 - kw2, py2); x.lineTo(lx1 - kw1, py1);
    x.fill(); x.strokeStyle='#2a1a3a'; x.lineWidth = 1; x.stroke();
    
    // Right white key
    x.fillStyle = (yi % 2 === 0) ? whiteKeyColor : whiteKeyDark;
    x.beginPath();
    x.moveTo(rx1, py1); x.lineTo(rx2, py2); x.lineTo(rx2 + kw2, py2); x.lineTo(rx1 + kw1, py1);
    x.fill(); x.stroke();

    if (yi % 7 !== 2 && yi % 7 !== 6) {
      x.fillStyle = '#10051f'; // dark glossy purple/black
      // Left black key
      x.beginPath();
      x.moveTo(lx1, py1); x.lineTo(lx2, py2); x.lineTo(lx2 - kw2*0.6, py2); x.lineTo(lx1 - kw1*0.6, py1);
      x.fill();
      x.fillStyle = '#22113d';
      x.beginPath();
      x.moveTo(lx1 - kw1*0.1, py1 + 1); x.lineTo(lx2 - kw2*0.1, py2 - 1); x.lineTo(lx2 - kw2*0.5, py2 - 1); x.lineTo(lx1 - kw1*0.5, py1 + 1);
      x.fill();

      // Right black key
      x.fillStyle = '#10051f';
      x.beginPath();
      x.moveTo(rx1, py1); x.lineTo(rx2, py2); x.lineTo(rx2 + kw2*0.6, py2); x.lineTo(rx1 + kw1*0.6, py1);
      x.fill();
      x.fillStyle = '#22113d';
      x.beginPath();
      x.moveTo(rx1 + kw1*0.1, py1 + 1); x.lineTo(rx2 + kw2*0.1, py2 - 1); x.lineTo(rx2 + kw2*0.5, py2 - 1); x.lineTo(rx1 + kw1*0.5, py1 + 1);
      x.fill();
    }
  }

  // Harp pillars
  function harpColumn(cx: number, scale: number, fgLayer: boolean) {
    const h = GH * 0.45 * scale;
    const botY = GH * 0.64 + (fgLayer ? GH * 0.25 : GH * 0.05);
    const topY = botY - h;
    const w = 50 * scale;
    const dir = cx < GW/2 ? 1 : -1; 

    x.save();
    x.translate(cx, 0);
    x.scale(dir, 1);

    const px = -w/2; 
    
    // Pillar body
    const g = x.createLinearGradient(px, 0, px+w*0.3, 0);
    g.addColorStop(0, '#13052b');
    g.addColorStop(0.5, '#2f1263');
    g.addColorStop(1, '#0b021d');
    x.fillStyle = g;
    x.fillRect(px, topY, w*0.3, h);

    // Pillar Base
    x.fillStyle = '#06010f';
    x.fillRect(px - w*0.1, botY - h*0.1, w*1.2, h*0.1);
    
    // Harp Neck
    x.fillStyle = g;
    x.beginPath();
    x.moveTo(px, topY + w*0.2);
    x.bezierCurveTo(px + w, topY - w*0.5, px + w*1.5, topY + w, px + w*1.2, topY + w*1.8);
    x.lineTo(px + w*0.9, topY + w*1.8);
    x.bezierCurveTo(px + w*1.2, topY + w, px + w*0.8, topY + w*0.2, px + w*0.3, topY);
    x.fill();

    // Harp Strings
    x.strokeStyle = 'rgba(255, 230, 150, 0.4)';
    x.lineWidth = 1.5 * scale;
    for(let i=0; i<6; i++) {
       const sx = px + w*0.4 + i * w * 0.12;
       const sy = topY + w*0.8 + i * w * 0.18;
       x.beginPath();
       x.moveTo(sx, sy);
       x.lineTo(sx, botY - h*0.1);
       x.stroke();
    }
    
    // Glowing orb base
    const orbX = px + w*0.5;
    const orbY = botY - h*0.05;
    const og = x.createRadialGradient(orbX, orbY, 0, orbX, orbY, 15*scale);
    og.addColorStop(0, 'rgba(200,100,255, 0.8)');
    og.addColorStop(1, 'transparent');
    x.fillStyle = og;
    x.beginPath(); x.arc(orbX, orbY, 15*scale, 0, Math.PI*2); x.fill();
    x.fillStyle = '#fff';
    x.beginPath(); x.arc(orbX, orbY, 3*scale, 0, Math.PI*2); x.fill();

    x.restore();
  }

  [80, 250, 400, 580, 750, 920].forEach(cx => harpColumn(cx, 0.6, false));
  [20, GW-20].forEach(cx => harpColumn(cx, 1.4, true));

  // Floor mist
  for(let i=0; i<3; i++) {
    const mist = x.createLinearGradient(0, GH*.62 + i*10, 0, GH*.75 + i*20);
    mist.addColorStop(0, 'transparent'); 
    mist.addColorStop(.5, `rgba(${80 - i*20}, ${20 + i*10}, ${150 + i*30}, ${0.3 - i*0.1})`); 
    mist.addColorStop(1, 'transparent');
    x.fillStyle = mist; 
    x.fillRect(0, GH*.6, GW, GH*.4);
  }

  return c;
})();

export function drawTorches(ctx: CanvasRenderingContext2D, torches: any[]) {
  torches.forEach(torch => {
    torch.flicker += torch.flickerSpeed;
    const fl = Math.sin(torch.flicker) * .25 + .75;
    const tx = torch.x, ty = torch.y;
    ctx.fillStyle = '#2a1800'; ctx.fillRect(tx - 4, ty, 8, 20); ctx.fillRect(tx - 8, ty - 4, 16, 6);
    const og = ctx.createRadialGradient(tx, ty - 8, 0, tx, ty - 8, 30 * fl);
    og.addColorStop(0, `rgba(255,160,20,${.2 * fl})`); og.addColorStop(.5, `rgba(255,80,0,${.1 * fl})`); og.addColorStop(1, 'transparent');
    ctx.beginPath(); ctx.arc(tx, ty - 8, 30 * fl, 0, Math.PI * 2); ctx.fillStyle = og; ctx.fill();
    const fg = ctx.createRadialGradient(tx, ty - 5, 2, tx, ty - 15, 14 * fl);
    fg.addColorStop(0, '#ffffa0'); fg.addColorStop(.3, `rgba(255,120,0,${.9 * fl})`); fg.addColorStop(1, 'transparent');
    ctx.save(); ctx.scale(1, fl * .8 + .2);
    ctx.beginPath(); ctx.arc(tx, ty - 5, 10, 0, Math.PI * 2); ctx.fillStyle = fg; ctx.fill();
    ctx.restore();
  });
}

