// genera_schematizzazione_vettura.js — rigenera Schematizzazione_Vettura.dxf con TRE pannelli
// (luce da terra h = 8 / 9 / 10 cm). Per ciascuna altezza mostra:
//   - silhouette carrozzeria (Porsche 992 GT3 RS) sollevata di (h-8) rispetto a terra
//   - le due ruote (R=35) a contatto, con marker mozzo al centro
//   - angolo di ATTACCO/ENTRATA anteriore  alfa = arctan(h / sbalzo_ant=140)
//   - angolo di PARTENZA/USCITA posteriore beta = arctan(h / sbalzo_post=120)
//     (entrambi misurati dal punto di contatto ruota a terra fino al paraurti)
// Orientamento silhouette: muso (paraurti ANT, sbalzo 140) a body-x<0 (ruota ant. a x=0);
//                          coda+ala (paraurti POST, sbalzo 120) a body-x>0 (ruota post. a x=240).
'use strict';
const fs = require('fs');
const SIL = JSON.parse(fs.readFileSync(__dirname + '/_silhouette.json', 'utf8'));

const wb = 240, Lant = 140, Lpost = 120, rw = 35, hBase = 8;
const DEG = Math.PI/180;
// I primi 4 segmenti di _silhouette.json sono le croci-mozzo (le ridisegniamo noi al centro ruota)
const BODY = SIL.slice(4);

// --- helper DXF ---
const n = v => (Math.round(v*100)/100).toString();
const L = (lay,x1,y1,x2,y2)=>`  0\nLINE\n  8\n${lay}\n 10\n${n(x1)}\n 20\n${n(y1)}\n 30\n0.0\n 11\n${n(x2)}\n 21\n${n(y2)}\n 31\n0.0\n`;
const C = (lay,x,y,r)=>`  0\nCIRCLE\n  8\n${lay}\n 10\n${n(x)}\n 20\n${n(y)}\n 30\n0.0\n 40\n${n(r)}\n`;
const ARC=(lay,cx,cy,r,a0,a1)=>`  0\nARC\n  8\n${lay}\n 10\n${n(cx)}\n 20\n${n(cy)}\n 30\n0.0\n 40\n${n(r)}\n 50\n${n(a0)}\n 51\n${n(a1)}\n`;
const T = (lay,x,y,hg,s)=>`  0\nTEXT\n  8\n${lay}\n 10\n${n(x)}\n 20\n${n(y)}\n 30\n0.0\n 40\n${n(hg)}\n  1\n${s}\n`;

// freccia di quota orizzontale (tacche a 45 gradi) in (x,y)
function tick(lay,x,y,sign){ let e=''; e+=L(lay,x,y,x+sign*3,y+2); e+=L(lay,x,y,x+sign*3,y-2); return e; }

function panel(dy, h){
  const Y = v => v + dy;
  const lift = h - hBase;                 // la scocca sale con la luce; ruote a contatto invariate
  const alfa = Math.atan(h/Lant)/DEG;     // angolo entrata anteriore
  const beta = Math.atan(h/Lpost)/DEG;    // angolo uscita posteriore
  let e = '';

  // suolo
  e += L('GROUND', -260, Y(0), 480, Y(0));
  // ruote (contatto a terra: centro a y=rw) + croce mozzo
  for (const cx of [0, wb]){
    e += C('RUOTE', cx, Y(rw), rw);
    e += L('RUOTE', cx-5, Y(rw), cx+5, Y(rw));
    e += L('RUOTE', cx, Y(rw)-5, cx, Y(rw)+5);
  }
  // carrozzeria (sollevata di lift)
  for (const s of BODY){ e += L('CARROZZERIA', s[0], Y(s[1]+lift), s[2], Y(s[3]+lift)); }

  // --- linee angolo (dal contatto ruota al paraurti, prolungate) ---
  // anteriore: contatto ruota ant. (0,0) -> muso (-140, h); prolungo a x=-220
  const xa = -220, ya = -xa/Lant * h;     // y sulla retta di pendenza h/140
  e += L('ANGOLI', 0, Y(0), xa, Y(ya));
  // posteriore: contatto ruota post. (240,0) -> coda (360, h); prolungo a x=460
  const xb = 460, yb = (xb-wb)/Lpost * h;
  e += L('ANGOLI', wb, Y(0), xb, Y(yb));

  // archi di quota angolo
  e += ARC('QUOTE', 0,   Y(0), 70, 180-alfa, 180);   // alfa, lato sinistro
  e += ARC('QUOTE', wb,  Y(0), 70, 0, beta);          // beta, lato destro

  // marker paraurti (punto su cui si appoggia l'angolo) a (-140,h) e (360,h)
  e += C('QUOTE', -Lant, Y(h), 3);
  e += C('QUOTE', wb+Lpost, Y(h), 3);

  // quota verticale della luce h (a x=120, sotto il ventre)
  e += L('QUOTE', 120, Y(0), 120, Y(h));
  e += L('QUOTE', 116, Y(0), 124, Y(0));
  e += L('QUOTE', 116, Y(h), 124, Y(h));
  e += T('TESTO', 128, Y(h/2-3), 5, `h=${h}`);

  // etichette angoli
  e += T('TESTO', -250, Y(ya+6), 6.5, `alfa = ${alfa.toFixed(2)} gradi`);
  e += T('TESTO', -250, Y(ya-4), 4.5, `(entrata, anteriore)`);
  e += T('TESTO', 350, Y(yb+6), 6.5, `beta = ${beta.toFixed(2)} gradi`);
  e += T('TESTO', 350, Y(yb-4), 4.5, `(uscita, posteriore)`);

  // etichetta pannello
  e += T('TESTO', -250, Y(150), 9, `LUCE DA TERRA  h = ${h} cm`);
  return e;
}

// --- assemblaggio ---
let E = '';
E += T('TESTO', -260, 320, 11, 'SCHEMATIZZAZIONE VETTURA - ANGOLI DI ENTRATA/USCITA PER LUCE DA TERRA h = 8 / 9 / 10 cm');
E += T('TESTO', -260, 300, 5.5, 'Porsche 992 GT3 RS. Passo 240 cm, sbalzo ant. 140 cm, sbalzo post. 120 cm, R ruota 35 cm. Quote in cm, angoli in gradi.');
E += T('TESTO', -260, 286, 5.5, 'alfa (entrata) = arctan(h / sbalzo ant.) ; beta (uscita) = arctan(h / sbalzo post.) - misurati dal contatto ruota a terra al paraurti.');

// tabella riepilogo (in alto a destra)
E += T('TESTO', 250, 320, 6, 'h [cm]   alfa(ant)   beta(post)');
[8,9,10].forEach((h,i)=>{
  const a=(Math.atan(h/Lant)/DEG).toFixed(2), b=(Math.atan(h/Lpost)/DEG).toFixed(2);
  E += T('TESTO', 250, 320-12*(i+1), 6, `  ${h}        ${a}        ${b}`);
});

const STEP = -250;
E += panel(0*STEP, 8);
E += panel(1*STEP, 9);
E += panel(2*STEP, 10);

E += T('TESTO', -260, 2*STEP-60, 5,
  'Nota: alzando la luce gli angoli di entrata/uscita AUMENTANO (piu\' favorevoli per i raccordi), ma la clearance al SAG resta governata dallo sbalzo. Vedi Relazione_Profilo_Ottimo.md.');

// header del template Schematizzazione (layer GROUND/CARROZZERIA/RUOTE/ANGOLI/QUOTE/TESTO gia' presenti)
const tpl = fs.readFileSync(__dirname + '/Schematizzazione_Vettura.dxf','utf8');
let head = tpl.slice(0, tpl.indexOf('ENTITIES')) + 'ENTITIES\n';
// estendo l'estensione del disegno
head = head.replace('-300.0\n 20\n-100.0', '-300.0\n 20\n-700.0');  // EXTMIN
head = head.replace('500.0\n 20\n200.0', '520.0\n 20\n340.0');      // EXTMAX
fs.writeFileSync(__dirname + '/Schematizzazione_Vettura.dxf', head + E + '  0\nENDSEC\n  0\nEOF\n', 'utf8');
console.log('Scritto: Schematizzazione_Vettura.dxf (h=8/9/10)');
console.log('Angoli: ' + [8,9,10].map(h=>`h${h}: a=${(Math.atan(h/Lant)/DEG).toFixed(2)} b=${(Math.atan(h/Lpost)/DEG).toFixed(2)}`).join(' | '));
