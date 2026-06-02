// genera_tavola_quote.js — TAVOLA PROFILO COSTRUTTIVA (picchettazione): stesso profilo
// dell'animazione (OTTIMIZZATO ESTREMO: CREST R=950 + SAG R=3042, picco 47%), SENZA vettura.
// Riporta ogni 50 cm di progressiva orizzontale (0 = innesto strada ... 1700 = garage) la QUOTA
// di altezza riferita al piano garage (0 cm in fondo, 380 cm al piano strada).
// Disegno PRELIMINARE non esecutivo. Quote in cm.
'use strict';
const fs = require('fs');

const DEG = Math.PI/180;
const H = 380, Ltot = 1700;
// --- profilo ottimo: theta=25, Rc=950, Rs ricavato per chiusura esatta a (1700,0) ---
const thDeg = 25, th = thDeg*DEG, s = Math.sin(th), c = Math.cos(th), t = Math.tan(th);
const Rc = 950, S = (Ltot*s - H*c)/(1 - c), Rs = S - Rc, Lh = Ltot - S*s;
const ceX = Rc*s, ceY = H - Rc*(1-c), ssX = ceX + Lh, ssY = ceY - Lh*t;
const crestC = { x:0, y:H-Rc }, sagC = { x:Ltot, y:Rs };
const aCrest0 = Math.atan2(ceY-crestC.y, ceX-crestC.x)/DEG, aCrest1 = 90;
const aSag0   = Math.atan2(ssY-sagC.y, ssX-sagC.x)/DEG + 360, aSag1 = 270;
function ys(x){
  if (x<=0) return H;
  if (x<ceX) return crestC.y + Math.sqrt(Math.max(0,Rc*Rc - x*x));
  if (x<ssX) return ceY + (ssY-ceY)*(x-ceX)/(ssX-ceX);
  if (x<Ltot) return sagC.y - Math.sqrt(Math.max(0,Rs*Rs-(x-Ltot)**2));
  return 0;
}

// --- helper DXF (TEXT con rotazione opzionale via gruppo 50) ---
const n = v => (Math.round(v*100)/100).toString();
const colTag = col => (col!==undefined ? ` 62\n${col}\n` : '');
const L  = (lay,x1,y1,x2,y2,col)=>`  0\nLINE\n  8\n${lay}\n${colTag(col)} 10\n${n(x1)}\n 20\n${n(y1)}\n 30\n0.0\n 11\n${n(x2)}\n 21\n${n(y2)}\n 31\n0.0\n`;
const ARC= (lay,cx,cy,r,a0,a1,col)=>`  0\nARC\n  8\n${lay}\n${colTag(col)} 10\n${n(cx)}\n 20\n${n(cy)}\n 30\n0.0\n 40\n${n(r)}\n 50\n${n(a0)}\n 51\n${n(a1)}\n`;
const C  = (lay,x,y,r,col)=>`  0\nCIRCLE\n  8\n${lay}\n${colTag(col)} 10\n${n(x)}\n 20\n${n(y)}\n 30\n0.0\n 40\n${n(r)}\n`;
const T  = (lay,x,y,hg,str,col,rot)=>`  0\nTEXT\n  8\n${lay}\n${colTag(col)} 10\n${n(x)}\n 20\n${n(y)}\n 30\n0.0\n 40\n${n(hg)}\n${rot?` 50\n${n(rot)}\n`:''}  1\n${str}\n`;

let E='';
// ====================== TESTATA ======================
E += T('TESTO', -650, 500, 18, 'RAMPA GARAGE - PROFILO COSTRUTTIVO - PICCHETTAZIONE QUOTE OGNI 50 cm');
E += T('TESTO', -650, 476, 9, `Stesso profilo dell'animazione (OTTIMIZZATO: CREST R=${Rc} + SAG R=${Rs.toFixed(0)}, tratto retto ${Lh.toFixed(0)} cm, picco ${(t*100).toFixed(0)}%). Senza vettura.`);
E += T('TESTO', -650, 460, 9, 'Quote di altezza riferite al PIANO GARAGE (0 cm in fondo) fino al PIANO STRADA (380 cm). Progressive orizzontali dall\'innesto strada (0) al garage (1700).');
E += L('REF', -650, 448, 2200, 448, 8);

// ====================== PIANI STRADA / GARAGE ======================
E += L('RAMPA', -450, H, 0, H);     E += T('TESTO', -430, H+10, 11, 'STRADA  (q. 380)');
E += L('RAMPA', Ltot, 0, 2150, 0);  E += T('TESTO', 1880, 12, 11, 'GARAGE  (q. 0)');

// ====================== PROFILO ======================
E += ARC('RAMPA', crestC.x, crestC.y, Rc, aCrest0, aCrest1);
E += L('RAMPA', ceX, ceY, ssX, ssY);
E += ARC('RAMPA', sagC.x, sagC.y, Rs, aSag0, aSag1);

// punti di quota MAX/MIN
E += C('CRITICO', 0,H,4,1);    E += T('CRITICO', 14,H+2,9,'quota MAX 380 cm (innesto strada)',1);
E += C('CRITICO', Ltot,0,4,1); E += T('CRITICO', Ltot-470,-14,9,'quota MIN 0 cm (fondo garage)',1);

// ====================== DATUM + GRIGLIA + PICCHETTI OGNI 50 cm ======================
E += L('REF', -100, 0, 1800, 0, 8);   // datum quota 0
const yProg = -150, yQuota = -70;     // righe del cartiglio quote
E += L('QUOTE', 0, -55, Ltot, -55, 5);// asse progressive

E += T('TESTO', -300, yQuota+2, 9, 'QUOTA H (cm):', 5);
E += T('TESTO', -300, yProg+2, 9, 'PROGR. (cm):', 5);

for (let x=0; x<=Ltot; x+=50){
  const h = ys(x);
  // verticale di griglia dal datum al profilo + tacca
  E += L('REF', x, 0, x, h, 8);
  E += L('QUOTE', x, -55, x, -60, 5);
  // quota altezza (ruotata 90) e progressiva (ruotata 90)
  E += T('QUOTE', x+3, yQuota, 8, h.toFixed(1), 5, 90);
  E += T('TESTO', x+3, yProg, 8, String(x), 7, 90);
}

// ====================== QUOTE D'INSIEME ======================
// dislivello H a sinistra
function tick(lay,x,y,col){ const k=6; return L(lay,x-k,y-k,x+k,y+k,col); }
E += L('QUOTE', -430,0, -430,H, 5) + tick('QUOTE',-430,0,5) + tick('QUOTE',-430,H,5);
E += T('QUOTE', -470, H/2-20, 9, `H = ${H}`, 5, 90);
E += L('REF', -430,H, 0,H, 8);
// lunghezza L in alto
E += L('QUOTE', 0,H+30, Ltot,H+30, 5) + tick('QUOTE',0,H+30,5) + tick('QUOTE',Ltot,H+30,5);
E += T('QUOTE', Ltot/2-44, H+36, 9, `L = ${Ltot} cm`, 5);
E += L('REF', 0,H, 0,H+30, 8); E += L('REF', Ltot,0, Ltot,H+30, 8);

// nota
E += T('TESTO', -650, yProg-50, 9, 'NB: progressive e quote su proiezione ORIZZONTALE; i raccordi sono archi di cerchio. Disegno preliminare, da verificare in sito.', 7);

// header del template, esteso
const tpl = fs.readFileSync(__dirname + '/_template_tavole.dxf','utf8');
let head = tpl.slice(0, tpl.indexOf('ENTITIES')) + 'ENTITIES\n';
head = head.replace(/ 10\n-600.0/g, ' 10\n-700.0');
head = head.replace(/ 10\n2400.0/g, ' 10\n2250.0');
head = head.replace(/ 20\n-200.0/g, ' 20\n-260.0');
head = head.replace(/ 20\n600.0/g,  ' 20\n530.0');
fs.writeFileSync(__dirname + '/Tavola_Profilo_Quote.dxf', head + E + '  0\nENDSEC\n  0\nEOF\n', 'utf8');

// stampa anche la tabella a console
console.log('Scritto: Tavola_Profilo_Quote.dxf');
let row='';
for (let x=0; x<=Ltot; x+=50){ row += `${x}:${ys(x).toFixed(1)}  `; if((x/50+1)%6===0){console.log(row);row='';} }
if(row) console.log(row);
