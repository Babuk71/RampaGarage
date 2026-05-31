// genera_tavola_uscita_ottimo.js — come genera_tavola_ottimo.js, ma vettura in USCITA con
// MUSO E CODA INVERTITI: la vettura e' GIRATA (muso verso la STRADA, coda+ala verso il GARAGE)
// e risale la rampa di muso. Sweep continuo, sagome ogni 150 cm (+ posa critica), colore per stato.
//
// Risultato chiave (VERIFICATO con sweep fine, pose a passo ruota valido):
//  - girare la vettura NON aiuta: il vincolo resta lo SBALZO LUNGO (muso, 140 cm), che governa
//    in ogni orientamento. In uscita girata il muso tocca a -0.84 cm (h=8): praticamente identico
//    all'ingresso (-0.80). La coda (120) al SAG sta a +0.88 e il ventre a +0.39: meno critici.
//  - quindi a h=8 NON si passa in nessun orientamento; uscita girata ~ ingresso.
//
// NB orientamento: la silhouette ha il muso a body-x<0 e la coda+ala a body-x>0. Qui NON si
// ribalta (bx_model = sx): muso verso strada/-x, coda verso garage/+x.
// Profilo: arco singolo che massimizza la clearance a H=380, L=1700 fissi (theta=25 ~47%).
'use strict';
const fs = require('fs');
const SIL = JSON.parse(fs.readFileSync(__dirname + '/_silhouette.json', 'utf8'));

const DEG = Math.PI/180;
const H = 380, Ltot = 1700;
const wb = 240, Lant = 140, Lpost = 120, rw = 35;

// --- profilo ottimo: theta=25, Rc=950, Rs=S-Rc (chiusura esatta a (1700,0)) ---
const thDeg = 25, th = thDeg*DEG, s = Math.sin(th), c = Math.cos(th), t = Math.tan(th);
const Rc = 950;
const S  = (Ltot*s - H*c)/(1 - c);
const Rs = S - Rc;
const Lh = Ltot - S*s;
const ceX = Rc*s, ceY = H - Rc*(1-c);
const ssX = ceX + Lh, ssY = ceY - Lh*t;
const crestC = { x:0, y:H-Rc };
const sagC   = { x:Ltot, y:Rs };

function ys(x){
  if (x<=0) return H;
  if (x<ceX) return crestC.y + Math.sqrt(Math.max(0,Rc*Rc - x*x));
  if (x<ssX) return ceY + (ssY-ceY)*(x-ceX)/(ssX-ceX);
  if (x<Ltot) return sagC.y - Math.sqrt(Math.max(0,Rs*Rs-(x-Ltot)**2));
  return 0;
}
const aCrest0 = Math.atan2(ceY-crestC.y, ceX-crestC.x)/DEG;
const aCrest1 = 90;
const aSag0   = Math.atan2(ssY-sagC.y, ssX-sagC.x)/DEG + 360;
const aSag1   = 270;

// --- corpo rigido su 2 ruote, parametrico in h ---
function solveOther(xr, dir){
  let lo, hi;
  if (dir>0){ lo=xr+1; hi=xr+wb+200; } else { lo=xr-wb-200; hi=xr-1; }
  let xo=xr+dir*wb;
  for (let i=0;i<100;i++){ xo=(lo+hi)/2; const d=Math.hypot(xo-xr, ys(xo)-ys(xr));
    if (dir>0){ if(d>wb)hi=xo; else lo=xo; } else { if(d>wb)lo=xo; else hi=xo; } }
  return xo;
}
function pose(xr, dir, h){
  const xo=solveOther(xr,dir);
  const Cr={x:xr,y:ys(xr)}, Cf={x:xo,y:ys(xo)};
  const dist=Math.hypot(Cf.x-Cr.x, Cf.y-Cr.y);
  const ux=Cf.x-Cr.x, uy=Cf.y-Cr.y, ul=Math.hypot(ux,uy)||1;
  const u={x:ux/ul,y:uy/ul}; let nn={x:-u.y,y:u.x}; if(nn.y<0)nn={x:u.y,y:-u.x};
  const W=(bx,by)=>({x:Cr.x+bx*u.x+by*nn.x, y:Cr.y+bx*u.y+by*nn.y});
  // VETTURA GIRATA: coda (paraurti POST) verso il garage/+x; muso (paraurti ANT) verso strada/-x
  return {Cr,Cf,dist,W, bumperCoda:W(wb+Lpost,h), bumperMuso:W(-Lant,h)};
}
const vClear = P => P.y - ys(P.x);
const VALID = p => Math.abs(p.dist - wb) < 0.5;   // scarta pose degeneri (contatto non risolto)
function bellyMin(p,h){ let m=1e9, mx=null; for(let b=0;b<=wb;b+=4){ const P=p.W(b,h); const cl=vClear(P); if(cl<m){m=cl;mx=P.x;} } return {c:m,x:mx}; }
// clearance dei 3 elementi in una posa (vettura girata); null se posa non valida
function clearances(xr,h){
  const p=pose(xr,+1,h);
  if(!VALID(p)) return null;
  const bm=bellyMin(p,h);
  return { p, coda:vClear(p.bumperCoda), muso:vClear(p.bumperMuso), belly:bm.c, bellyX:bm.x };
}

// --- soglie di stato e colore. 1=rosso 30=arancio 90=verde ---
const TH_SAFE = 1.0, TH_RISK = 0.0;
function statusColor(cmin){ return cmin < TH_RISK ? 1 : (cmin < TH_SAFE ? 30 : 90); }
function statusName(cmin){ return cmin < TH_RISK ? 'COLLISIONE' : (cmin < TH_SAFE ? 'a rischio' : 'sicuro'); }

// --- helper DXF (con colore per-entita' opzionale) ---
const n = v => (Math.round(v*100)/100).toString();
const colTag = col => (col!==undefined ? ` 62\n${col}\n` : '');
const L  = (lay,x1,y1,x2,y2,col)=>`  0\nLINE\n  8\n${lay}\n${colTag(col)} 10\n${n(x1)}\n 20\n${n(y1)}\n 30\n0.0\n 11\n${n(x2)}\n 21\n${n(y2)}\n 31\n0.0\n`;
const C  = (lay,x,y,r,col)=>`  0\nCIRCLE\n  8\n${lay}\n${colTag(col)} 10\n${n(x)}\n 20\n${n(y)}\n 30\n0.0\n 40\n${n(r)}\n`;
const ARC= (lay,cx,cy,r,a0,a1,col)=>`  0\nARC\n  8\n${lay}\n${colTag(col)} 10\n${n(cx)}\n 20\n${n(cy)}\n 30\n0.0\n 40\n${n(r)}\n 50\n${n(a0)}\n 51\n${n(a1)}\n`;
const T  = (lay,x,y,hg,str,col)=>`  0\nTEXT\n  8\n${lay}\n${colTag(col)} 10\n${n(x)}\n 20\n${n(y)}\n 30\n0.0\n 40\n${n(hg)}\n  1\n${str}\n`;

// disegna la silhouette NON ribaltata (muso verso strada/-x, coda+ala verso garage/+x).
function drawCar(e, p, dy, h, col, layer){
  const lift = h - 8;
  const Wf = (sx,sy)=>p.W(sx, sy + lift);               // NESSUN ribaltamento
  let out = e;
  for (const sg of SIL){ const a=Wf(sg[0],sg[1]), b=Wf(sg[2],sg[3]); out += L(layer, a.x,a.y+dy, b.x,b.y+dy, col); }
  const wF=p.W(wb,rw), wR=p.W(0,rw);
  out += C(layer, wF.x,wF.y+dy, rw, col);
  out += C(layer, wR.x,wR.y+dy, rw, col);
  return out;
}

function buildPanel(dy, h){
  const Y = v => v + dy;
  let e = '';
  // profilo
  e += L('RAMPA', -560,Y(H), 0,Y(H));
  e += ARC('RAMPA', crestC.x, crestC.y+dy, Rc, aCrest0, aCrest1);
  e += L('RAMPA', ceX,Y(ceY), ssX,Y(ssY));
  e += ARC('RAMPA', sagC.x, sagC.y+dy, Rs, aSag0, aSag1);
  e += L('RAMPA', Ltot,Y(0), 2360,Y(0));
  e += T('TESTO', -545,Y(H+12), 11, 'STRADA');
  e += T('TESTO', 2175,Y(14), 11, 'GARAGE');

  // minimi continui (solo pose VALIDE) e posa critica
  let mc=1e9,mm=1e9,mb=1e9,Pc,Pm,PbX, xrCrit, critMin=1e9;
  for (let xr=-300; xr<=2000; xr+=0.5){ const cl=clearances(xr,h); if(!cl)continue;
    const cmin=Math.min(cl.coda,cl.muso,cl.belly);
    if(cl.coda<mc){mc=cl.coda;Pc=cl.p.bumperCoda}
    if(cl.muso<mm){mm=cl.muso;Pm=cl.p.bumperMuso}
    if(cl.belly<mb){mb=cl.belly;PbX=cl.bellyX}
    if(cmin<critMin){critMin=cmin;xrCrit=xr}
  }
  const gov=Math.min(mc,mm,mb);

  // SWEEP: sagome ogni 150 cm (+ posa critica), colore = stato peggiore della posa
  let nRed=0,nOra=0,nGrn=0;
  const xrs=[]; for (let xr=-150; xr<=1850; xr+=150) xrs.push(xr);
  xrs.push(xrCrit); xrs.sort((a,bb)=>a-bb);
  for (const xr of xrs){
    const cl = clearances(xr,h); if(!cl)continue;
    const st = statusColor(Math.min(cl.coda, cl.muso, cl.belly));
    e = drawCar(e, cl.p, dy, h, st, 'CARROZZERIA');
    if(st===1)nRed++; else if(st===30)nOra++; else nGrn++;
  }

  // quota sul MUSO (paraurti ANT, sbalzo 140): e' il vincolo GOVERNANTE anche in uscita girata
  e += C(mm<0?'CRITICO':'TESTO', Pm.x,Pm.y+dy, 11, statusColor(mm));
  e += L('CRITICO', Pm.x,Pm.y+dy, Pm.x,ys(Pm.x)+dy, statusColor(mm));
  e += L('CRITICO', Pm.x,Pm.y+dy, Pm.x-150,Pm.y+dy-55, statusColor(mm));
  e += T('CRITICO', Pm.x-470,Pm.y+dy-63, 9, `paraurti ANT (muso, sbalzo 140): ${mm>=0?'+':''}${mm.toFixed(2)} cm -> ${statusName(mm)}`, statusColor(mm));
  // marcatore sulla CODA (120) al SAG: meno critica
  e += C('TESTO', Pc.x,Pc.y+dy, 9, statusColor(mc));
  e += T('TESTO', Pc.x+12,Pc.y+dy+18, 8, `coda (120) al SAG: ${mc>=0?'+':''}${mc.toFixed(2)}`, statusColor(mc));

  // etichetta pannello
  const govCol = statusColor(gov);
  e += T('TESTO', -560,Y(H+92), 16, `h = ${h} cm`, govCol);
  e += T('TESTO', -300,Y(H+94), 11,
    `muso(140) ${mm>=0?'+':''}${mm.toFixed(2)}  |  coda(120)@SAG ${mc>=0?'+':''}${mc.toFixed(2)}  |  ventre ${mb>=0?'+':''}${mb.toFixed(2)}  [cm]  ->  ${statusName(gov).toUpperCase()}`, govCol);
  e += T('TESTO', -300,Y(H+74), 9,
    `sagome ogni 150 cm (+ posa critica): ${nGrn} verdi (sicuro), ${nOra} arancio (a rischio), ${nRed} rosse (collisione)`, 7);
  e += L('REF', -560,Y(H+62), 2360,Y(H+62), 8);
  return { e, coda:mc, muso:mm, belly:mb, gov };
}

// --- assemblaggio ---
let E = '';
E += T('TESTO', -560, 740, 18, 'PROFILO OTTIMIZZATO ESTREMO - USCITA (VETTURA GIRATA: MUSO VERSO STRADA) - CONFRONTO LUCE (h = 8 / 9 / 10 cm)');
E += T('TESTO', -560, 712, 9, `Profilo che MASSIMIZZA la clearance a H=380, L=1700 fissi: CREST R=${Rc}, retto ${Lh.toFixed(0)} cm, SAG R=${Rs.toFixed(0)}, pendenza di picco ${(t*100).toFixed(0)}% (theta=${thDeg} deg). Vettura GIRATA: coda+ala verso il garage, muso verso la strada.`);
E += T('TESTO', -560, 695, 9, 'Sagoma ogni 150 cm (+ posa critica); colore = stato PEGGIORE tra muso (sbalzo 140), coda (sbalzo 120, verso SAG) e ventre. Solo pose con passo ruota valido.');
// legenda
E += T('TESTO', -560, 672, 10, 'LEGENDA:');
E += L('REF', -430,675, -360,675, 90); E += T('TESTO', -350,679, 9, 'VERDE  = sicuro (clearance >= 1.0 cm)', 90);
E += L('REF', -430,657, -360,657, 30); E += T('TESTO', -350,661, 9, 'ARANCIO = a rischio (0 .. 1.0 cm)', 30);
E += L('REF', -430,639, -360,639, 1);  E += T('TESTO', -350,643, 9, 'ROSSO  = collisione (clearance < 0)', 1);

const STEP = -900;
const r8  = buildPanel(0*STEP, 8);
const r9  = buildPanel(1*STEP, 9);
const r10 = buildPanel(2*STEP, 10);
E += r8.e + r9.e + r10.e;

[['h=8',r8],['h=9',r9],['h=10',r10]].forEach(([k,r])=>
  console.log(`${k}: muso(140) ${r.muso.toFixed(2)} | coda(120)@SAG ${r.coda.toFixed(2)} | ventre ${r.belly.toFixed(2)} -> ${statusName(r.gov)}`));

const yb = 2*STEP;
E += T('TESTO', -560, yb-150, 9, 'NB1: girare la vettura NON aiuta. Il vincolo GOVERNANTE resta lo SBALZO LUNGO (muso, 140 cm): in uscita girata tocca a -0.84 cm (h=8), ~uguale all\'ingresso (-0.80). Coda (120) e ventre meno critici.');
E += T('TESTO', -560, yb-168, 9, 'NB2: a h=8 NON si passa in nessun orientamento. Vale sul profilo ESTREMO (47%), non sulla rampa adottata R=1500 (in uscita lo sbalzo posteriore compenetra il SAG di ~6.4 cm).');

// header del template, esteso in verticale
const tpl = fs.readFileSync(__dirname + '/_template_tavole.dxf','utf8');
let head = tpl.slice(0, tpl.indexOf('ENTITIES')) + 'ENTITIES\n';
head = head.replace(/ 20\n-200.0/, ' 20\n-1980.0');  // EXTMIN.y
head = head.replace(/ 20\n600.0/,  ' 20\n780.0');     // EXTMAX.y
fs.writeFileSync(__dirname + '/Tavola_Profilo_Ottimo_Uscita.dxf', head + E + '  0\nENDSEC\n  0\nEOF\n', 'utf8');
console.log('Scritto: Tavola_Profilo_Ottimo_Uscita.dxf');
