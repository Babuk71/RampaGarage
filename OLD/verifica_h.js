// verifica_h.js — sensibilità del risultato all'altezza da terra h.
// Riusa il modello di nuova_config.js (profilo a 3 segmenti CREST+retto+SAG, arco singolo,
// corpo rigido su 2 ruote, sweep continuo nei 2 orientamenti) e cerca la MIGLIOR config
// per ogni h in {8,9,10} cm. Vincoli FISSI: H=380, L=1700, vettura (wb=240, Lant=140,
// Lpost=120, R_ruota=35). Risponde: bastano 1-2 cm in piu' di luce per renderla percorribile?
'use strict';
const DEG = Math.PI/180;
const H = 380, Ltot = 1700;
const wb = 240, Lant = 140, Lpost = 120; // rw (raggio ruota) non entra nel modello a contatto-punto

function Sof(th){ return (Ltot*Math.sin(th) - H*Math.cos(th))/(1 - Math.cos(th)); }

function makeGeom(thDeg, Rc, Rs){
  const th = thDeg*DEG, s=Math.sin(th), c=Math.cos(th), t=Math.tan(th);
  const Lh = Ltot - (Rc+Rs)*s;
  const ceX = Rc*s, ceY = H - Rc*(1-c);
  const ssX = ceX + Lh, ssY = ceY - Lh*t;
  const sagC = { x:Ltot, y:Rs };
  function ys(x){
    if (x<=0) return H;
    if (x<ceX) return (H-Rc) + Math.sqrt(Math.max(0,Rc*Rc - x*x));
    if (x<ssX) return ceY + (ssY-ceY)*(x-ceX)/(ssX-ceX);
    if (x<Ltot) return sagC.y - Math.sqrt(Math.max(0,Rs*Rs-(x-Ltot)**2));
    return 0;
  }
  return { ys, Lh };
}

function poseFactory(ys, h){
  function solveOther(xr, dir){
    let lo, hi;
    if (dir>0){ lo=xr+1; hi=xr+wb+120; } else { lo=xr-wb-120; hi=xr-1; }
    let xo=xr+dir*wb;
    for (let i=0;i<70;i++){ xo=(lo+hi)/2; const d=Math.hypot(xo-xr, ys(xo)-ys(xr));
      if (dir>0){ if(d>wb)hi=xo; else lo=xo; } else { if(d>wb)lo=xo; else hi=xo; } }
    return xo;
  }
  return function pose(xr, dir){
    const xo=solveOther(xr,dir);
    const Cr={x:xr,y:ys(xr)}, Cf={x:xo,y:ys(xo)};
    const ux=Cf.x-Cr.x, uy=Cf.y-Cr.y, ul=Math.hypot(ux,uy)||1;
    const u={x:ux/ul,y:uy/ul}; let nn={x:-u.y,y:u.x}; if(nn.y<0)nn={x:u.y,y:-u.x};
    const W=(bx,by)=>({x:Cr.x+bx*u.x+by*nn.x, y:Cr.y+bx*u.y+by*nn.y});
    return {W, bumperFront:W(wb+Lant,h), bumperRear:W(-Lpost,h)};
  };
}

function minClearOrient(ys, dir, h){
  const pose=poseFactory(ys,h);
  let mf=1e9, mr=1e9, mb=1e9;
  for (let xr=-300; xr<=Ltot+120; xr+=2){
    const p=pose(xr,dir);
    mf=Math.min(mf, p.bumperFront.y-ys(p.bumperFront.x));
    mr=Math.min(mr, p.bumperRear.y -ys(p.bumperRear.x));
    for (let sIt=0;sIt<=wb;sIt+=6){ const P=p.W(sIt,h); mb=Math.min(mb,P.y-ys(P.x)); }
  }
  return {mf,mr,mb};
}

function evaluate(ys, h){
  const a=minClearOrient(ys,+1,h), b=minClearOrient(ys,-1,h);
  const front=Math.min(a.mf,b.mf), rear=Math.min(a.mr,b.mr), belly=Math.min(a.mb,b.mb);
  return { front, rear, belly, gov:Math.min(front,rear,belly) };
}

function searchBest(h){
  let best=null;
  for (let thDeg=6; thDeg<=26; thDeg+=0.5){
    const th=thDeg*DEG, S=Sof(th);
    if (S<=0) continue;
    if (Ltot - S*Math.sin(th) < 0) continue;
    for (let Rc=950; Rc<=S-300; Rc+=25){
      const Rs=S-Rc; if (Rs<=300) break;
      const g=makeGeom(thDeg,Rc,Rs);
      const e=evaluate(g.ys,h);
      if (!best || e.gov>best.e.gov) best={thDeg,Rc,Rs,Lh:g.Lh,e};
    }
  }
  return best;
}

console.log('Sensibilita\' alla luce da terra h (profilo ad arco singolo ottimizzato, H=380 L=1700 fissi)\n');
console.log(' h    theta  R_crest  R_sag   Lh  | front   rear  belly |  GOV     esito');
for (const h of [8,9,10]){
  const b=searchBest(h);
  console.log(
    String(h).padStart(2),
    String(b.thDeg).padStart(6), String(b.Rc).padStart(7), String(b.Rs).padStart(7),
    String(b.Lh.toFixed(0)).padStart(5), '|',
    b.e.front.toFixed(2).padStart(6), b.e.rear.toFixed(2).padStart(6), b.e.belly.toFixed(2).padStart(6), '|',
    b.e.gov.toFixed(2).padStart(6), '  ', b.e.gov>=0?'PERCORRIBILE':'non percorribile');
}
