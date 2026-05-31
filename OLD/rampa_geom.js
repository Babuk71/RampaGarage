// rampa_geom.js — geometria pura rampa+vettura (nessun side effect).
'use strict';
const R = 1500, Htot = 380, Ltot = 1700, slopeDeg = 16.87;
const CREST = { cx: 0, cy: -1120, x0: 0, x1: 435 };
const SAG   = { cx: 1700, cy: 1500, x0: 1265, x1: 1700 };
const h = 8, wb = 240, Lant = 140, Lpost = 120, rw = 35;

function ys(x) {
  if (x <= CREST.x0) return Htot;
  if (x < CREST.x1)  return CREST.cy + Math.sqrt(R*R - (x-CREST.cx)**2);
  if (x < SAG.x0)    return 316 + ((64-316)/(1265-435))*(x-435);
  if (x < SAG.x1)    return SAG.cy - Math.sqrt(R*R - (x-SAG.cx)**2);
  return 0;
}
function solveContacts(xrear, dir) {
  let lo, hi;
  if (dir > 0) { lo = xrear + 1; hi = xrear + wb + 80; }
  else         { lo = xrear - wb - 80; hi = xrear - 1; }
  let xo = xrear + dir*wb;
  for (let it = 0; it < 90; it++) {
    xo = (lo + hi) / 2;
    const d = Math.hypot(xo - xrear, ys(xo) - ys(xrear));
    if (dir > 0) { if (d > wb) hi = xo; else lo = xo; }
    else         { if (d > wb) lo = xo; else hi = xo; }
  }
  return xo;
}
function pose(xrear, dir) {
  const xo = solveContacts(xrear, dir);
  const Crear = { x: xrear, y: ys(xrear) };
  const Cfront = { x: xo, y: ys(xo) };
  const phi = Math.atan2(Cfront.y - Crear.y, Cfront.x - Crear.x);
  // versore longitudinale u (verso il muso) e normale n SEMPRE verso l'alto
  // (per la vettura girata evita il ribaltamento sottosopra)
  const ux = Cfront.x - Crear.x, uy = Cfront.y - Crear.y, ul = Math.hypot(ux, uy) || 1;
  const u = { x: ux/ul, y: uy/ul };
  let nn = { x: -u.y, y: u.x };
  if (nn.y < 0) nn = { x: u.y, y: -u.x };
  const W = (bx, by) => ({ x: Crear.x + bx*u.x + by*nn.x, y: Crear.y + bx*u.y + by*nn.y });
  return { dir, xrear, phi, Crear, Cfront, W,
    axleRear: W(0, rw), axleFront: W(wb, rw),
    bumperFront: W(wb + Lant, h), bumperRear: W(-Lpost, h) };
}
const vClear = P => P.y - ys(P.x);
function bellyClear(p) {
  let m = 1e9, mx = null;
  for (let s = 0; s <= wb; s += 2) { const P = p.W(s, h); const c = vClear(P); if (c < m) { m = c; mx = P.x; } }
  return { c: m, x: mx };
}
function sweep(dir) {
  let mf={c:1e9}, mr={c:1e9}, mb={c:1e9};
  for (let xr=-260; xr<=1760; xr+=0.5){ const p=pose(xr,dir);
    const cf=vClear(p.bumperFront); if(cf<mf.c)mf={c:cf,xr,P:p.bumperFront,p};
    const cr=vClear(p.bumperRear);  if(cr<mr.c)mr={c:cr,xr,P:p.bumperRear,p};
    const b=bellyClear(p);          if(b.c<mb.c)mb={c:b.c,xr,x:b.x,p}; }
  return {mf,mr,mb};
}
// primo contatto di un paraurti col SAG marciando lungo il transito.
// which: 'front' (dir+1, asse ant. avanza in +x) | 'rear' (dir-1, vettura girata esce in -x)
function firstContact(which) {
  if (which === 'front') {
    let prev=null;
    for (let xr=950; xr<=1300; xr+=0.25){ const p=pose(xr,+1); const c=vClear(p.bumperFront);
      if (prev && prev.c>0 && c<=0){ const t=prev.c/(prev.c-c); const xz=prev.xr+(xr-prev.xr)*t; return pose(xz,+1); }
      prev={xr,c}; }
  } else {
    // vettura girata (dir-1) che esce in -x: xrear (asse +x/garage) decresce; paraurti post (+x) sul SAG
    let prev=null;
    for (let xr=1700; xr>=1300; xr-=0.25){ const p=pose(xr,-1); const c=vClear(p.bumperRear);
      if (p.bumperRear.x>SAG.x0 && p.bumperRear.x<SAG.x1+60 && prev && prev.c>0 && c<=0){
        const t=prev.c/(prev.c-c); const xz=prev.xr+(xr-prev.xr)*t; return pose(xz,-1); }
      prev={xr,c}; }
  }
  return null;
}
module.exports = { R,Htot,Ltot,slopeDeg,CREST,SAG,h,wb,Lant,Lpost,rw, ys,solveContacts,pose,vClear,bellyClear,sweep,firstContact };
