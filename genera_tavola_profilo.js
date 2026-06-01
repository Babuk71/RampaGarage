// genera_tavola_profilo.js — TAVOLA PRELIMINARE: solo profilo longitudinale della rampa,
// quotato completamente, con le criticita' segnalate come note per una fase realizzativa.
// Geometria = PROFILO OTTIMIZZATO ESTREMO (la stessa di Tavola_Profilo_Ottimo): CREST stretto +
// SAG amplissimo che si fondono, tratto retto ~13 cm (praticamente assente), picco 47%.
// E' il profilo che MASSIMIZZA la clearance a H=380 / L=1700 fissi (theta=25 deg, Rc=950).
// NON disegna la vettura: tavola di sole quote + avvertenze di cantiere.
// Disegno PRELIMINARE non esecutivo. Quote in cm, angoli in gradi.
'use strict';
const fs = require('fs');

const DEG = Math.PI/180;
const H = 380, Ltot = 1700;

// --- profilo ottimo: theta=25, Rc=950, Rs ricavato per chiusura esatta a (1700,0) ---
const thDeg = 25, th = thDeg*DEG, s = Math.sin(th), c = Math.cos(th), t = Math.tan(th);
const Rc = 950;
const S  = (Ltot*s - H*c)/(1 - c);     // sviluppo orizz. totale dei due archi
const Rs = S - Rc;                     // ~3042 cm
const Lh = Ltot - S*s;                 // tratto retto orizz. ~13 cm
const ceX = Rc*s, ceY = H - Rc*(1-c);  // fine CREST / inizio retto
const ssX = ceX + Lh, ssY = ceY - Lh*t;// fine retto / inizio SAG
const crestC = { x:0, y:H-Rc }, sagC = { x:Ltot, y:Rs };
const aCrest0 = Math.atan2(ceY-crestC.y, ceX-crestC.x)/DEG, aCrest1 = 90;
const aSag0   = Math.atan2(ssY-sagC.y, ssX-sagC.x)/DEG + 360, aSag1 = 270;
const slopePc = t*100, slopeDeg = thDeg;

function ys(x){
  if (x<=0) return H;
  if (x<ceX) return crestC.y + Math.sqrt(Math.max(0,Rc*Rc - x*x));
  if (x<ssX) return ceY + (ssY-ceY)*(x-ceX)/(ssX-ceX);
  if (x<Ltot) return sagC.y - Math.sqrt(Math.max(0,Rs*Rs-(x-Ltot)**2));
  return 0;
}

// --- helper DXF ---
const n = v => (Math.round(v*100)/100).toString();
const colTag = col => (col!==undefined ? ` 62\n${col}\n` : '');
const L  = (lay,x1,y1,x2,y2,col)=>`  0\nLINE\n  8\n${lay}\n${colTag(col)} 10\n${n(x1)}\n 20\n${n(y1)}\n 30\n0.0\n 11\n${n(x2)}\n 21\n${n(y2)}\n 31\n0.0\n`;
const C  = (lay,x,y,r,col)=>`  0\nCIRCLE\n  8\n${lay}\n${colTag(col)} 10\n${n(x)}\n 20\n${n(y)}\n 30\n0.0\n 40\n${n(r)}\n`;
const ARC= (lay,cx,cy,r,a0,a1,col)=>`  0\nARC\n  8\n${lay}\n${colTag(col)} 10\n${n(cx)}\n 20\n${n(cy)}\n 30\n0.0\n 40\n${n(r)}\n 50\n${n(a0)}\n 51\n${n(a1)}\n`;
const T  = (lay,x,y,hg,str,col)=>`  0\nTEXT\n  8\n${lay}\n${colTag(col)} 10\n${n(x)}\n 20\n${n(y)}\n 30\n0.0\n 40\n${n(hg)}\n  1\n${str}\n`;

// --- helper quote ---
function tick(lay,x,y,col){ const k=6; return L(lay,x-k,y-k,x+k,y+k,col); }
function ext(x1,y1,x2,y2){ return L('REF',x1,y1,x2,y2,8); }
function dimV(y1,y2,x,label,col){
  let o=L('QUOTE',x,y1,x,y2,col)+tick('QUOTE',x,y1,col)+tick('QUOTE',x,y2,col);
  o+=T('QUOTE',x+8,(y1+y2)/2-4, 9, label, col);
  return o;
}
function mark(x,y,num){ return C('CRITICO',x,y,13,1)+T('CRITICO',x-3.5,y+5,12,String(num),1); }

let E='';
// ====================== TITOLO / TESTATA ======================
E += T('TESTO', -650, 560, 18, 'RAMPA GARAGE - PROFILO LONGITUDINALE (OTTIMIZZATO) - INDICAZIONI PRELIMINARI PER FASE REALIZZATIVA');
E += T('TESTO', -650, 534, 9, `Profilo che MASSIMIZZA la clearance a H=${H} cm / L=${Ltot} cm fissi: raccordo CREST R=${Rc} + raccordo SAG R=${Rs.toFixed(0)} che si fondono; tratto retto ${Lh.toFixed(0)} cm (praticamente assente).`);
E += T('TESTO', -650, 518, 9, `Pendenza di PICCO ${slopePc.toFixed(0)}% (${slopeDeg.toFixed(0)} deg). DISEGNO PRELIMINARE NON ESECUTIVO - quote in cm, angoli in gradi, da verificare in sito.`);
E += L('REF', -650, 506, 2200, 506, 8);

// ====================== STRADA / GARAGE (piani) ======================
E += L('RAMPA', -450, H, 0, H);          E += T('TESTO', -430, H+10, 11, 'STRADA (piano stradale)');
E += L('RAMPA', Ltot, 0, 2150, 0);       E += T('TESTO', 1870, 12, 11, 'PIANO GARAGE');

// ====================== PROFILO RAMPA ======================
E += ARC('RAMPA', crestC.x, crestC.y, Rc, aCrest0, aCrest1);   // CREST (convesso, stretto)
E += L('RAMPA', ceX, ceY, ssX, ssY);                           // tratto retto (corto)
E += ARC('RAMPA', sagC.x, sagC.y, Rs, aSag0, aSag1);           // SAG (concavo, ampio)

// punti notevoli + coordinate
const pts = [
  [0,H,'CREST start (0, 380)', -30, 14],
  [ceX,ceY,`giunzione (${ceX.toFixed(0)}, ${ceY.toFixed(0)})`, -150, 14],
  [ssX,ssY,`inizio SAG (${ssX.toFixed(0)}, ${ssY.toFixed(0)})`, 8, -2],
  [Ltot,0,'SAG end (1700, 0)', -150, -16],
];
for(const[x,y,lab,dx,dy] of pts){ E+=C('TESTO',x,y,4,7); E+=T('TESTO',x+dx,y+dy,8,lab,7); }

// centri archi (fuori scala) richiamati + raggi
E += C('REF', crestC.x, crestC.y, 3, 8);
E += T('RAMPA', ceX*0.55-30, (H+ceY)/2+10, 10, `CREST  R = ${Rc} cm`, 3);
E += T('RAMPA', (ssX+Ltot)/2-30, ssY*0.5+10, 10, `SAG  R = ${Rs.toFixed(0)} cm`, 3);
// pendenza di picco sulla zona ripida
const sx=560, syv=ys(sx);
E += L('REF', sx, syv, sx+90, syv+70, 8);
E += T('RAMPA', sx+96, syv+78, 11, `picco ${slopePc.toFixed(0)} %`, 3);
E += T('RAMPA', sx+96, syv+64, 8, `(${slopeDeg.toFixed(0)} deg)`, 3);

// ====================== QUOTE ORIZZONTALI (catena sotto il profilo) ======================
const yD1=-70, yD2=-120;
for(const x of [0,ceX,ssX,Ltot]) E+=ext(x,0,x,yD1+6);
// CREST
E+=L('QUOTE',0,yD1,ceX,yD1,5)+tick('QUOTE',0,yD1,5)+tick('QUOTE',ceX,yD1,5);
E+=T('QUOTE',ceX/2-12,yD1+7,9,`${ceX.toFixed(0)}`,5);
E+=T('QUOTE',ceX/2-42,yD1-12,7,'raccordo CREST',5);
// retto (corto): ticks + leader verso label
E+=L('QUOTE',ceX,yD1,ssX,yD1,5)+tick('QUOTE',ssX,yD1,5);
E+=L('REF',(ceX+ssX)/2,yD1,(ceX+ssX)/2-150,yD1-44,8);
E+=T('QUOTE',(ceX+ssX)/2-300,yD1-50,8,`tratto retto ${Lh.toFixed(0)} cm (praticamente assente)`,5);
// SAG
E+=L('QUOTE',ssX,yD1,Ltot,yD1,5)+tick('QUOTE',Ltot,yD1,5);
E+=T('QUOTE',(ssX+Ltot)/2-12,yD1+7,9,`${(Ltot-ssX).toFixed(0)}`,5);
E+=T('QUOTE',(ssX+Ltot)/2-40,yD1-12,7,'raccordo SAG',5);
// totale
E+=ext(0,yD1,0,yD2+6); E+=ext(Ltot,0,Ltot,yD2+6);
E+=L('QUOTE',0,yD2,Ltot,yD2,5)+tick('QUOTE',0,yD2,5)+tick('QUOTE',Ltot,yD2,5);
E+=T('QUOTE',Ltot/2-44,yD2+7,9,`L totale = ${Ltot} cm`,5);

// ====================== QUOTE VERTICALI ======================
// dislivello totale (sinistra)
E += ext(0,H,-300,H); E += ext(Ltot,0,-300,0);
E += dimV(0, H, -300, `H = ${H} cm`, 5);
E += T('QUOTE', -360, H/2-18, 8, '(dislivello)', 5);
// catena verticale a destra: 89 (CREST) / 6 (retto) / 285 (SAG)
const xV=1880;
E += ext(0,H,xV,H); E += ext(ceX,ceY,xV,ceY); E += ext(ssX,ssY,xV,ssY); E += ext(Ltot,0,xV,0);
E += dimV(ceY, H,  xV, `${(H-ceY).toFixed(0)}`, 5); E += T('QUOTE', xV+44, (ceY+H)/2, 7, 'CREST', 5);
E += dimV(0,   ssY, xV, `${ssY.toFixed(0)}`, 5);     E += T('QUOTE', xV+44, ssY/2, 7, 'SAG', 5);
E += T('QUOTE', xV+44, (ssY+ceY)/2-4, 7, `retto ${(ceY-ssY).toFixed(0)}`, 5);

// ====================== MARCATORI CRITICITA' SUL DISEGNO ======================
E += mark(1300, ys(1300), 1);    // transito vettura (paraurti ant. al SAG)
E += mark(Ltot, 0, 2);           // soglia garage
E += mark(1650, ys(1650), 3);    // drenaggio/caditoia a fondo rampa
E += mark(520, ys(520), 4);      // pendenza/aderenza (zona ripida)
E += mark(820, ys(820), 5);      // antighiaccio

// ====================== BLOCCO CRITICITA' ======================
let yc=-200;
const line=(num,txt,col)=>{ let o=''; if(num){ o+=C('CRITICO',-630,yc-3,11,1)+T('CRITICO',-633.5,yc+2,10,String(num),1);}
  o+=T(col===1?'CRITICO':'TESTO',-610,yc, 9, txt, col); yc-=22; return o; };
E += T('TESTO', -650, yc+24, 12, 'CRITICITA\' DA RECEPIRE IN FASE REALIZZATIVA', 1); yc-=4;
E += line(1, 'TRANSITO VETTURA (governante): anche su questo profilo-LIMITE (clearance MASSIMIZZATA) il PARAURTI ANTERIORE resta a -0.80 cm a luce h=8 cm', 1);
E += line(0, '   (verificato a sweep continuo): la vettura estrema NON passa alla luce di progetto. Margini risicati solo aumentando la luce: +0.24 cm a h=9,', 1);
E += line(0, '   +1.23 cm a h=10 (ottimistici, modello a contatto puntiforme; splitter/lame reali stanno piu\' in basso). Vincolo geometrico a H=380 / L=1700.', 1);
E += line(2, 'SOGLIA GARAGE: la soglia deve essere MAX 3 cm (luce vettura 8 cm); pavimento garage ribassato ~3 cm; guaina impermeabile continua e risvoltata.', 7);
E += line(3, 'DRENAGGIO: caditoia trasversale a fondo rampa (a monte della soglia), grata carrabile classe C250, maglia <= 20x20 mm; pozzetto + scarico dedicato.', 7);
E += line(4, 'PENDENZA / ADERENZA: picco 47% (sconsigliato per aderenza, usura, comfort e avviamento in salita). Superficie in CLS spazzolato trasversale', 7);
E += line(0, '   (striature ortogonali alla marcia, prof. 3-5 mm, passo 10-15 mm), coeff. attrito bagnato richiesto >= 0.50. Evitare CLS lisciato.', 7);
E += line(5, 'ANTIGHIACCIO (consigliato): a 47% qualunque formazione di ghiaccio rende la rampa inagibile/pericolosa. Cavi scaldanti o serpentina nel massetto +', 7);
E += line(0, '   termostato e sensore umidita\'.', 7);

// ====================== BLOCCO DATI / NOTE ======================
let yn=-200; const xn=900;
const nline=(txt,col)=>{ const o=T(col===1?'CRITICO':'TESTO',xn,yn,9,txt,col||7); yn-=20; return o; };
E += T('TESTO', xn, yn+24, 12, 'DATI E NOTE', 5); yn-=4;
E += nline('Vettura di riferimento: Porsche 992 GT3 RS - luce da terra 8 cm, passo 240 cm, sbalzo ant. 140 / post. 120 cm.', 7);
E += nline(`Geometria: CREST R=${Rc} (centro 0, ${crestC.y.toFixed(0)}) - retto ${Lh.toFixed(0)} cm - SAG R=${Rs.toFixed(0)} (centro ${Ltot}, ${Rs.toFixed(0)}); picco ${slopePc.toFixed(0)}%.`, 7);
E += nline('Profilo-LIMITE di fattibilita\': massimizza la clearance, ma a 47% di picco NON e\' un profilo di marcia confortevole (sconsigliato).', 1);
E += nline('Anche al meglio la rampa resta NON percorribile a h=8: per liberare il transito servono piu\' sviluppo (>1700), meno dislivello (<380) o un ausilio fisico.', 1);
E += nline('Larghezza rampa: assunta 300 cm (DATO DA RILEVARE in sito - serve per verifica manovra in pianta).', 1);
E += nline('Sezione/solaio, planimetria di manovra e dettagli costruttivi: NON oggetto di questa tavola (preliminare di solo profilo).', 7);
E += nline('I raccordi sono archi di cerchio; un profilo parabolico/clotoide darebbe risultati analoghi sui transiti.', 7);

// header del template, esteso in verticale
const tpl = fs.readFileSync(__dirname + '/_template_tavole.dxf','utf8');
let head = tpl.slice(0, tpl.indexOf('ENTITIES')) + 'ENTITIES\n';
head = head.replace(/ 10\n-600.0/g, ' 10\n-700.0');   // EXTMIN.x
head = head.replace(/ 10\n2400.0/g, ' 10\n2250.0');   // EXTMAX.x
head = head.replace(/ 20\n-200.0/g, ' 20\n-460.0');   // EXTMIN.y
head = head.replace(/ 20\n600.0/g,  ' 20\n590.0');    // EXTMAX.y
fs.writeFileSync(__dirname + '/Tavola_Profilo_Rampa.dxf', head + E + '  0\nENDSEC\n  0\nEOF\n', 'utf8');

console.log('Scritto: Tavola_Profilo_Rampa.dxf');
console.log(`theta=${slopeDeg} deg | picco=${slopePc.toFixed(1)}% | CREST R=${Rc} | SAG R=${Rs.toFixed(0)} | giunzione=(${ceX.toFixed(1)},${ceY.toFixed(1)}) | inizio SAG=(${ssX.toFixed(1)},${ssY.toFixed(1)}) | retto=${Lh.toFixed(1)} cm`);
