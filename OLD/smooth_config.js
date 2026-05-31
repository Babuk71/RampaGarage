// smooth_config.js — profilo a transizioni di curvatura GRADUALE (smoothstep ~ clotoide).
// Grade(x): 0 -> -G (CREST, lung. Lc) -> costante -G (retto, Lstr) -> 0 (SAG, lung. Ls).
// Smoothstep S(t)=3t^2-2t^3 => curvatura nulla agli estremi (ingresso dolce nel SAG).
// Vincoli FISSI: H=380, L=1700, vettura invariata. Verifica corpo rigido nei 2 orientamenti.
'use strict';
const H=380, Ltot=1700, h=8, wb=240, Lant=140, Lpost=120, rw=35;

function makeGeom(Lc, Lstr, Ls){
  const G = H/(Lc/2 + Lstr + Ls/2);           // pendenza di picco (tan theta) da drop=380
  const yA = H - G*Lc/2;                        // fine CREST
  const yB = yA - G*Lstr;                       // fine retto
  const xB = Lc+Lstr, xC = Lc+Lstr+Ls;
  function ys(x){
    if (x<=0) return H;
    if (x<Lc){ const t=x/Lc; return H - G*Lc*(t*t*t - t*t*t*t/2); }
    if (x<xB) return yA - G*(x-Lc);
    if (x<xC){ const τ=(x-xB)/Ls, w=1-τ; return yB - G*Ls*(0.5 - (w*w*w - w*w*w*w/2)); }
    return 0;
  }
  return { ys, G, thetaDeg: Math.atan(G)*180/Math.PI, Lc, Lstr, Ls };
}

function poseFactory(ys){
  function solveOther(xr,dir){ let lo,hi; if(dir>0){lo=xr+1;hi=xr+wb+120;}else{lo=xr-wb-120;hi=xr-1;}
    let xo=xr+dir*wb; for(let i=0;i<70;i++){xo=(lo+hi)/2; const d=Math.hypot(xo-xr,ys(xo)-ys(xr));
      if(dir>0){if(d>wb)hi=xo;else lo=xo;}else{if(d>wb)lo=xo;else hi=xo;}} return xo; }
  return function(xr,dir){ const xo=solveOther(xr,dir);
    const Cr={x:xr,y:ys(xr)},Cf={x:xo,y:ys(xo)}; const ux=Cf.x-Cr.x,uy=Cf.y-Cr.y,ul=Math.hypot(ux,uy)||1;
    const u={x:ux/ul,y:uy/ul}; let nn={x:-u.y,y:u.x}; if(nn.y<0)nn={x:u.y,y:-u.x};
    const W=(bx,by)=>({x:Cr.x+bx*u.x+by*nn.x,y:Cr.y+bx*u.y+by*nn.y});
    return {Cr,Cf,W,bumperFront:W(wb+Lant,h),bumperRear:W(-Lpost,h)}; };
}
function evalGeom(ys){
  const pose=poseFactory(ys); let mf=1e9,mr=1e9,mb=1e9;
  for(const dir of [+1,-1]) for(let xr=-300;xr<=Ltot+120;xr+=2){ const p=pose(xr,dir);
    mf=Math.min(mf,p.bumperFront.y-ys(p.bumperFront.x));
    mr=Math.min(mr,p.bumperRear.y-ys(p.bumperRear.x));
    for(let s=0;s<=wb;s+=6){const P=p.W(s,h); mb=Math.min(mb,P.y-ys(P.x));} }
  return {front:mf,rear:mr,belly:mb,gov:Math.min(mf,mr,mb)};
}

let best=null;
for(let Lc=150; Lc<=900; Lc+=50)
  for(let Ls=400; Ls<=1550; Ls+=50){
    const Lstr=Ltot-Lc-Ls; if(Lstr<0) continue;
    const g=makeGeom(Lc,Lstr,Ls); const e=evalGeom(g.ys);
    if(!best||e.gov>best.e.gov) best={g,e,Lc,Lstr,Ls};
  }
console.log('=== Migliore profilo a transizioni graduali (smoothstep) ===');
console.log(`Lc(CREST)=${best.Lc}  Lstr(retto)=${best.Lstr}  Ls(SAG)=${best.Ls}  [cm]`);
console.log(`pendenza picco = ${(best.g.G*100).toFixed(1)}%  (theta=${best.g.thetaDeg.toFixed(1)} deg)`);
console.log(`clearance: ant=${best.e.front.toFixed(2)}  post=${best.e.rear.toFixed(2)}  ventre=${best.e.belly.toFixed(2)}  [cm]`);
console.log(`GOVERNANTE = ${best.e.gov.toFixed(2)} cm => ${best.e.gov>=0?'PERCORRIBILE':'NON percorribile'}`);

// raffina attorno al migliore (SAG piu' lungo, CREST corto)
let b2=best;
for(let Lc=Math.max(60,best.Lc-80); Lc<=best.Lc+80; Lc+=20)
  for(let Ls=best.Ls-120; Ls<=Math.min(1600,best.Ls+250); Ls+=20){
    const Lstr=Ltot-Lc-Ls; if(Lstr<0) continue;
    const g=makeGeom(Lc,Lstr,Ls); const e=evalGeom(g.ys);
    if(e.gov>b2.e.gov) b2={g,e,Lc,Lstr,Ls};
  }
console.log('\n=== Raffinato ===');
console.log(`Lc=${b2.Lc} Lstr=${b2.Lstr} Ls=${b2.Ls} | picco ${(b2.g.G*100).toFixed(1)}% (${b2.g.thetaDeg.toFixed(1)} deg)`);
console.log(`ant=${b2.e.front.toFixed(2)} post=${b2.e.rear.toFixed(2)} ventre=${b2.e.belly.toFixed(2)} | GOV=${b2.e.gov.toFixed(2)} => ${b2.e.gov>=0?'PERCORRIBILE':'NON percorribile'}`);
