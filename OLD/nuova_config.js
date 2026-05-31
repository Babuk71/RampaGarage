// nuova_config.js — ricerca di una configurazione di rampa PERCORRIBILE.
// Vincoli FISSI: vettura (h=8, wb=240, L_ant=140, L_post=120, R_ruota=35), H=380, L=1700.
// Libero: forma del profilo (theta, R_crest, R_sag). Profilo a 3 segmenti CREST+retto+SAG,
// che si chiude esattamente a (1700,0). Verifica corpo rigido continuo nei DUE orientamenti.
'use strict';
const DEG = Math.PI/180;
const H = 380, Ltot = 1700;
const h = 8, wb = 240, Lant = 140, Lpost = 120, rw = 35;

function Sof(th){ return (Ltot*Math.sin(th) - H*Math.cos(th))/(1 - Math.cos(th)); }

// costruisce ys(x) per (theta, Rc, Rs) con Rc+Rs=S(theta)
function makeGeom(thDeg, Rc, Rs){
  const th = thDeg*DEG, s=Math.sin(th), c=Math.cos(th), t=Math.tan(th);
  const S = Rc+Rs;
  const Lh = Ltot - S*s;                       // tratto retto orizzontale
  const ceX = Rc*s, ceY = H - Rc*(1-c);        // fine CREST
  const ssX = ceX + Lh, ssY = ceY - Lh*t;      // inizio SAG
  const seX = ssX + Rs*s;                       // fine SAG (~1700)
  const crestC = { x:0, y:H-Rc };               // centro CREST (sotto)
  const sagC   = { x:Ltot, y:Rs };              // centro SAG (sopra), arriva tangente a y=0 in x=1700
  function ys(x){
    if (x<=0) return H;
    if (x<ceX) return (H-Rc) + Math.sqrt(Math.max(0,Rc*Rc - x*x));         // CREST convesso
    if (x<ssX) return ceY + (ssY-ceY)*(x-ceX)/(ssX-ceX);                   // retto
    if (x<Ltot) return sagC.y - Math.sqrt(Math.max(0,Rs*Rs-(x-Ltot)**2)); // SAG concavo
    return 0;
  }
  return { ys, Lh, th, points:{ceX,ceY,ssX,ssY,seX}, crestC, sagC, Rc, Rs, thDeg };
}

// --- corpo rigido su 2 ruote (normale sempre verso l'alto) ---
function poseFactory(ys){
  function solveOther(xr, dir){
    let lo, hi;
    if (dir>0){ lo=xr+1; hi=xr+wb+120; } else { lo=xr-wb-120; hi=xr-1; }
    let xo=xr+dir*wb;
    for (let i=0;i<70;i++){ xo=(lo+hi)/2; const d=Math.hypot(xo-xr, ys(xo)-ys(xr));
      if (dir>0){ if(d>wb)hi=xo; else lo=xo; } else { if(d>wb)lo=xo; else hi=xo; } }
    return xo;
  }
  function pose(xr, dir){
    const xo=solveOther(xr,dir);
    const Cr={x:xr,y:ys(xr)}, Cf={x:xo,y:ys(xo)};
    const ux=Cf.x-Cr.x, uy=Cf.y-Cr.y, ul=Math.hypot(ux,uy)||1;
    const u={x:ux/ul,y:uy/ul}; let nn={x:-u.y,y:u.x}; if(nn.y<0)nn={x:u.y,y:-u.x};
    const W=(bx,by)=>({x:Cr.x+bx*u.x+by*nn.x, y:Cr.y+bx*u.y+by*nn.y});
    return {Cr,Cf,W, bumperFront:W(wb+Lant,h), bumperRear:W(-Lpost,h)};
  }
  return pose;
}

// min clearance su tutto il transito, per un orientamento
function minClearOrient(ys, dir){
  const pose=poseFactory(ys);
  let mf=1e9, mr=1e9, mb=1e9;
  for (let xr=-300; xr<=Ltot+120; xr+=2){
    const p=pose(xr,dir);
    mf=Math.min(mf, p.bumperFront.y-ys(p.bumperFront.x));
    mr=Math.min(mr, p.bumperRear.y -ys(p.bumperRear.x));
    for (let sIt=0;sIt<=wb;sIt+=6){ const P=p.W(sIt,h); mb=Math.min(mb,P.y-ys(P.x)); }
  }
  return {mf,mr,mb};
}
// governante su entrambi gli orientamenti
function evaluate(geom){
  const a=minClearOrient(geom.ys,+1), b=minClearOrient(geom.ys,-1);
  const front=Math.min(a.mf,b.mf), rear=Math.min(a.mr,b.mr), belly=Math.min(a.mb,b.mb);
  return { front, rear, belly, gov:Math.min(front,rear,belly) };
}

// --- RICERCA ---
let best=null;
const rows=[];
for (let thDeg=6; thDeg<=26; thDeg+=0.5){
  const th=thDeg*DEG, S=Sof(th);
  if (S<=0) continue;
  const Lh0=Ltot - S*Math.sin(th);
  if (Lh0 < 0) continue;                 // arco non entra nei 1700
  let bestθ=null;
  // ripartizione: Rc da 950 a S-300
  for (let Rc=950; Rc<=S-300; Rc+=50){
    const Rs=S-Rc; if (Rs<=300) break;
    const g=makeGeom(thDeg,Rc,Rs);
    const e=evaluate(g);
    if (!bestθ || e.gov>bestθ.e.gov) bestθ={Rc,Rs,e,g};
    if (!best || e.gov>best.e.gov) best={thDeg,Rc,Rs,Lh:g.Lh,e,g};
  }
  if (bestθ) rows.push({thDeg, S:S.toFixed(0), Lh:Lh0.toFixed(0), Rc:bestθ.Rc, Rs:bestθ.Rs,
    front:bestθ.e.front, rear:bestθ.e.rear, belly:bestθ.e.belly, gov:bestθ.e.gov});
}

console.log('theta   S    Lh    Rc    Rs   | front   rear  belly |  GOV');
for (const r of rows) console.log(
  String(r.thDeg).padStart(4), String(r.S).padStart(5), String(r.Lh).padStart(5),
  String(r.Rc).padStart(5), String(r.Rs).padStart(5), '|',
  r.front.toFixed(1).padStart(6), r.rear.toFixed(1).padStart(6), r.belly.toFixed(1).padStart(6), '|',
  r.gov.toFixed(2).padStart(6), r.gov>=0?'<= percorribile':'');

console.log('\n=== MIGLIORE CONFIGURAZIONE (max della clearance governante) ===');
if (best){
  console.log(`theta=${best.thDeg} deg | R_crest=${best.Rc} | R_sag=${best.Rs} | tratto retto Lh=${best.Lh.toFixed(0)} cm`);
  console.log(`clearance: paraurti ant=${best.e.front.toFixed(2)}  post=${best.e.rear.toFixed(2)}  ventre=${best.e.belly.toFixed(2)}  [cm]`);
  console.log(`GOVERNANTE = ${best.e.gov.toFixed(2)} cm  => ${best.e.gov>=0?'PERCORRIBILE':'NON percorribile'}`);
}
