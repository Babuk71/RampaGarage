// compound_config.js — SAG COMPOSTO (2 archi): raggio grande all'ingresso (dove il
// paraurti anteriore e' critico) + raggio piu' stretto sul fondo. CREST=Rc, Lh=0.
// Cerca se esiste un profilo PERCORRIBILE (clearance>0 nei 2 orientamenti).
'use strict';
const H=380, Ltot=1700, h=8, wb=240, Lant=140, Lpost=120, rw=35;
const Rc=950; // CREST fisso al minimo per il ventre

// costruisce profilo: CREST(Rc) convesso 0->-theta ; SAG1(Rs1) -theta->-(theta-phi1) ; SAG2(Rs2) ->0
function buildYs(thetaDeg, phi1Deg, Rs1, Rs2){
  const th=thetaDeg*Math.PI/180;
  // integra il percorso
  const ds=1; const pts=[{x:0,y:H,phi:0}];
  let x=0,y=H,phi=0;
  function seg(curv, phiTarget){
    // avanza finche' phi raggiunge phiTarget (curv: dphi/ds)
    let guard=0;
    while(((curv>0)?(phi<phiTarget):(phi>phiTarget)) && guard++<20000){
      phi+=curv*ds; x+=Math.cos(phi)*ds; y+=Math.sin(phi)*ds; pts.push({x,y,phi});
    }
  }
  seg(-1/Rc, -th);                       // CREST (convesso)
  const phiMid=-(th - phi1Deg*Math.PI/180);
  seg(+1/Rs1, phiMid);                   // SAG1 (ingresso, dolce)
  seg(+1/Rs2, 0);                        // SAG2 (fondo)
  // continua piano fino a oltre 1700
  while(x<Ltot+200){ x+=ds; pts.push({x,y,phi:0}); }
  // ys per interpolazione
  const X=pts.map(p=>p.x), Y=pts.map(p=>p.y);
  function ys(xq){
    if(xq<=0) return H;
    if(xq>=X[X.length-1]) return Y[Y.length-1];
    let lo=0,hi=X.length-1;
    while(hi-lo>1){const m=(lo+hi)>>1; if(X[m]<=xq)lo=m; else hi=m;}
    const t=(xq-X[lo])/(X[hi]-X[lo]); return Y[lo]+(Y[hi]-Y[lo])*t;
  }
  const end=pts[pts.length-1-200];
  return { ys, endX:X[X.length-1-200], endY:Y[Y.length-1-200] };
}

// risolve Rs1,Rs2 per chiudere a (1700,0) dati theta,phi1 (Lh=0, Rc fisso)
function solveRs(thetaDeg, phi1Deg){
  const th=thetaDeg*Math.PI/180, a=th-phi1Deg*Math.PI/180; // a=theta-phi1
  // H: Rs1(sin th - sin a) + Rs2(sin a) = 1700 - Rc sin th
  // V: Rs1(cos a - cos th) + Rs2(1 - cos a) = 380 - Rc(1-cos th)
  const Hr=Ltot-Rc*Math.sin(th), Vr=H-Rc*(1-Math.cos(th));
  const a11=Math.sin(th)-Math.sin(a), a12=Math.sin(a);
  const a21=Math.cos(a)-Math.cos(th), a22=1-Math.cos(a);
  const det=a11*a22-a12*a21; if(Math.abs(det)<1e-9) return null;
  const Rs1=(Hr*a22-a12*Vr)/det, Rs2=(a11*Vr-Hr*a21)/det;
  return {Rs1,Rs2};
}

function poseFactory(ys){
  function solveOther(xr,dir){let lo,hi;if(dir>0){lo=xr+1;hi=xr+wb+120;}else{lo=xr-wb-120;hi=xr-1;}
    let xo=xr+dir*wb;for(let i=0;i<70;i++){xo=(lo+hi)/2;const d=Math.hypot(xo-xr,ys(xo)-ys(xr));
      if(dir>0){if(d>wb)hi=xo;else lo=xo;}else{if(d>wb)lo=xo;else hi=xo;}}return xo;}
  return function(xr,dir){const xo=solveOther(xr,dir);const Cr={x:xr,y:ys(xr)},Cf={x:xo,y:ys(xo)};
    const ux=Cf.x-Cr.x,uy=Cf.y-Cr.y,ul=Math.hypot(ux,uy)||1;const u={x:ux/ul,y:uy/ul};
    let nn={x:-u.y,y:u.x};if(nn.y<0)nn={x:u.y,y:-u.x};
    const W=(bx,by)=>({x:Cr.x+bx*u.x+by*nn.x,y:Cr.y+bx*u.y+by*nn.y});
    return {W,bumperFront:W(wb+Lant,h),bumperRear:W(-Lpost,h)};};
}
function evalYs(ys){const pose=poseFactory(ys);let mf=1e9,mr=1e9,mb=1e9;
  for(const dir of[+1,-1])for(let xr=-300;xr<=Ltot+120;xr+=2){const p=pose(xr,dir);
    mf=Math.min(mf,p.bumperFront.y-ys(p.bumperFront.x));mr=Math.min(mr,p.bumperRear.y-ys(p.bumperRear.x));
    for(let s=0;s<=wb;s+=6){const P=p.W(s,h);mb=Math.min(mb,P.y-ys(P.x));}}
  return{front:mf,rear:mr,belly:mb,gov:Math.min(mf,mr,mb)};}

let best=null;
for(let thetaDeg=18; thetaDeg<=30; thetaDeg+=0.5)
  for(let phi1=1; phi1<=Math.min(thetaDeg-1,18); phi1+=1){
    const r=solveRs(thetaDeg,phi1); if(!r||r.Rs1<300||r.Rs2<300) continue;
    const g=buildYs(thetaDeg,phi1,r.Rs1,r.Rs2);
    if(Math.abs(g.endX-Ltot)>15||Math.abs(g.endY)>15) continue; // chiusura ok
    const e=evalYs(g.ys);
    if(!best||e.gov>best.e.gov) best={thetaDeg,phi1,Rs1:r.Rs1,Rs2:r.Rs2,e};
  }
console.log('=== SAG COMPOSTO - migliore ===');
if(best){
  console.log(`theta=${best.thetaDeg} deg | phi1(ingresso)=${best.phi1} deg | Rs1=${best.Rs1.toFixed(0)} (ingresso) | Rs2=${best.Rs2.toFixed(0)} (fondo) | R_crest=${Rc}`);
  console.log(`clearance: ant=${best.e.front.toFixed(2)} post=${best.e.rear.toFixed(2)} ventre=${best.e.belly.toFixed(2)} [cm]`);
  console.log(`GOVERNANTE = ${best.e.gov.toFixed(2)} cm => ${best.e.gov>=0?'PERCORRIBILE':'NON percorribile'}`);
} else console.log('nessuna configurazione valida');
