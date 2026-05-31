// genera_tavola_uscita.js — Tavola verifica USCITA: due orientamenti in una tavola.
// Scena A: uscita in retromarcia (muso->garage) -> paraurti ANTERIORE contro il SAG.
// Scena B: uscita di muso (vettura girata)      -> paraurti POSTERIORE contro il SAG.
// Ogni vettura e' disegnata nella posa di MASSIMA interferenza, con quota di penetrazione.
'use strict';
const fs = require('fs');
const G = require('./rampa_geom.js');
const SIL = JSON.parse(fs.readFileSync(__dirname + '/_silhouette.json', 'utf8'));

// --- posa di massima interferenza per un dato paraurti/orientamento ---
function maxInterf(dir, which) {
  let best = { c: 1e9 };
  for (let xr = -200; xr <= 1900; xr += 0.5) {
    const p = G.pose(xr, dir);
    const P = which === 'front' ? p.bumperFront : p.bumperRear;
    if (P.x < G.SAG.x0 - 20 || P.x > G.SAG.x1 + 160) continue; // solo zona fondo rampa/SAG
    const c = G.vClear(P);
    if (c < best.c) best = { c, xr, P, p };
  }
  return best;
}
const A = maxInterf(+1, 'front'); // retromarcia, muso verso garage
const B = maxInterf(-1, 'rear');  // di muso, vettura girata
console.log('A) retromarcia  : paraurti ANT a x=%s, interferenza %s cm (asse ant x=%s)',
  A.P.x.toFixed(0), A.c.toFixed(1), A.p.Cfront.x.toFixed(0));
console.log('B) di muso      : paraurti POST a x=%s, interferenza %s cm (asse post x=%s)',
  B.P.x.toFixed(0), B.c.toFixed(1), B.p.Crear.x.toFixed(0));

// --- helper DXF ---
const n = v => (Math.round(v*100)/100).toString();
const L = (lay,x1,y1,x2,y2)=>`  0\nLINE\n  8\n${lay}\n 10\n${n(x1)}\n 20\n${n(y1)}\n 30\n0.0\n 11\n${n(x2)}\n 21\n${n(y2)}\n 31\n0.0\n`;
const C = (lay,x,y,r)=>`  0\nCIRCLE\n  8\n${lay}\n 10\n${n(x)}\n 20\n${n(y)}\n 30\n0.0\n 40\n${n(r)}\n`;
const ARC=(lay,cx,cy,r,a0,a1)=>`  0\nARC\n  8\n${lay}\n 10\n${n(cx)}\n 20\n${n(cy)}\n 30\n0.0\n 40\n${n(r)}\n 50\n${n(a0)}\n 51\n${n(a1)}\n`;
const T = (lay,x,y,hg,s)=>`  0\nTEXT\n  8\n${lay}\n 10\n${n(x)}\n 20\n${n(y)}\n 30\n0.0\n 40\n${n(hg)}\n  1\n${s}\n`;

function buildScene(dy, m, title, bumperName, motionTxt) {
  const Y = v => v + dy;
  let e = '';
  // profilo rampa
  e += L('RAMPA', -520,Y(380), 0,Y(380));
  e += ARC('RAMPA', G.CREST.cx, G.CREST.cy+dy, G.R, 73.13, 90);
  e += L('RAMPA', 435,Y(316), 1265,Y(64));
  e += ARC('RAMPA', G.SAG.cx, G.SAG.cy+dy, G.R, 253.13, 270);
  e += L('RAMPA', 1700,Y(0), 2320,Y(0));
  e += T('TESTO', -505,Y(394), 11, 'STRADA');
  e += T('TESTO', 2115,Y(16), 11, 'GARAGE');
  e += L('REF', 1265,Y(64), 1265,Y(-58)); e += T('TESTO', 1150,Y(-76), 8, 'tangente SAG (x=1265)');
  // vettura (silhouette body-frame trasformata con la posa)
  for (const s of SIL){ const a=m.p.W(s[0],s[1]), b=m.p.W(s[2],s[3]); e += L('CARROZZERIA', a.x,a.y+dy, b.x,b.y+dy); }
  const wR=m.p.W(0,G.rw), wF=m.p.W(G.wb,G.rw);
  e += C('RUOTE', wR.x,wR.y+dy, G.rw); e += C('RUOTE', wF.x,wF.y+dy, G.rw);
  // quota penetrazione: dal paraurti (sotto) alla superficie (sopra)
  const sx = m.P.x, sy = G.ys(sx);
  e += C('CRITICO', m.P.x, m.P.y+dy, 11);
  e += L('CRITICO', m.P.x, m.P.y+dy, m.P.x, sy+dy); // segmento di interferenza
  e += L('CRITICO', m.P.x, m.P.y+dy, m.P.x+170, m.P.y+dy-55);
  e += T('CRITICO', m.P.x+178, m.P.y+dy-63, 10, `${bumperName} compenetra il SAG`);
  e += T('CRITICO', m.P.x+178, m.P.y+dy-83, 11, `interferenza ${Math.abs(m.c).toFixed(1)} cm`);
  // freccia uscita (salita -> strada, verso sinistra)
  const ay = Y(450);
  e += L('QUOTE', 1040,ay, 250,ay);
  e += L('QUOTE', 250,ay, 296,ay+13); e += L('QUOTE', 250,ay, 296,ay-13);
  e += T('QUOTE', 540,ay+12, 11, motionTxt);
  // titolo scena
  e += T('TESTO', -520,Y(515), 13, title);
  return e;
}

let E = '';
E += T('TESTO', -520, 605, 17, 'TAVOLA VERIFICA USCITA (SALITA) - DUE ORIENTAMENTI');
E += T('TESTO', -520, 578, 9, 'Geometria ADOTTATA invariata: R=1500, theta=16.87 (30.3%), H=380, L=1700.  Porsche 992 GT3 RS: h=8, sbalzo ant=140, post=120, R_ruota=35.');
E += T('CRITICO', -520, 558, 10, 'ESITO: in ENTRAMBI gli orientamenti un paraurti compenetra il raccordo SAG -> la vettura entrata NON puo\' uscire senza strisciare.');

E += buildScene(0, A,
  'A)  USCITA IN RETROMARCIA   (muso resta verso il garage, a destra)',
  'paraurti ANTERIORE (sbalzo 140)', 'USCITA (salita)');

const DY = -820;
E += buildScene(DY, B,
  'B)  USCITA DI MUSO   (vettura girata: muso verso la strada, a sinistra)',
  'paraurti POSTERIORE (sbalzo 120)', 'USCITA (salita)');

E += T('TESTO', -520, DY-110, 9, 'Nota: il ventre (breakover) e\' OK (+3.2 cm al CREST). Il vincolo e\' SOLO lo sbalzo, troppo lungo per il SAG con R=1500.');
E += T('TESTO', -520, DY-128, 9, 'Il +1.5 cm del dimensionamento e\' un check a posa singola (asse ant. sulla tangente) e NON e\' il minimo del transito continuo.');

// assembla con header/tabelle di Profilo_Rampa.dxf
const tpl = fs.readFileSync(__dirname + '/Profilo_Rampa.dxf','utf8');
let head = tpl.slice(0, tpl.indexOf('ENTITIES')) + 'ENTITIES\n';
head = head.replace(/ 20\n-200.0/, ' 20\n-1400.0');
fs.writeFileSync(__dirname + '/Tavola_Uscita.dxf', head + E + '  0\nENDSEC\n  0\nEOF\n', 'utf8');
console.log('Scritto: Tavola_Uscita.dxf');
