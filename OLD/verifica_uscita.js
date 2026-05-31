// verifica_uscita.js — REPORT numerico della verifica di uscita (salita).
// Usa rampa_geom.js (geometria ADOTTATA invariata). Non disegna nulla:
// la tavola e' prodotta da genera_tavola_uscita.js.
'use strict';
const G = require('./rampa_geom.js');

const EX  = G.sweep(+1); // muso verso garage (entrata muso-avanti / uscita retromarcia)
const ALT = G.sweep(-1); // vettura girata (uscita di muso)

const r = (label, m, extra='') =>
  `  ${label.padEnd(26)} ${m.c.toFixed(2).padStart(7)} cm   @x_asse=${m.xr.toFixed(0).padStart(5)}  ${extra}`;

console.log('============ VERIFICA USCITA (SALITA) - modello corpo rigido, sweep continuo ============');
console.log('Geometria ADOTTATA invariata: R=1500, theta=16.87 (30.3%), h=8, L_ant=140, L_post=120, R_ruota=35\n');

console.log('A) USCITA REALISTICA (muso verso garage, salita in RETROMARCIA):');
console.log(r('Paraurti ANTERIORE',  EX.mf, `(paraurti a x=${EX.mf.P.x.toFixed(0)})`));
console.log(r('Paraurti POSTERIORE', EX.mr, `(paraurti a x=${EX.mr.P.x.toFixed(0)})`));
console.log(r('VENTRE (breakover)',  EX.mb, `(punto a x=${EX.mb.x.toFixed(0)})`));
console.log(`  -> GOVERNANTE ${Math.min(EX.mf.c,EX.mr.c,EX.mb.c).toFixed(2)} cm\n`);

console.log('B) USCITA ALTERNATIVA (vettura girata, salita di MUSO):');
console.log(r('Paraurti ANTERIORE',  ALT.mf, `(paraurti a x=${ALT.mf.P.x.toFixed(0)})`));
console.log(r('Paraurti POSTERIORE', ALT.mr, `(paraurti a x=${ALT.mr.P.x.toFixed(0)})`));
console.log(r('VENTRE (breakover)',  ALT.mb, `(punto a x=${ALT.mb.x.toFixed(0)})`));

// confronto col check a posa singola del progetto (asse ant. ESATTAMENTE sulla tangente SAG)
let lo=900, hi=1100, xr=1000;
for (let i=0;i<80;i++){ xr=(lo+hi)/2; if (G.pose(xr,+1).Cfront.x>1265) hi=xr; else lo=xr; }
console.log(`\nCHECK A POSA SINGOLA (asse ant. su tangente SAG x=1265): clearance ant. = ${G.vClear(G.pose(xr,+1).bumperFront).toFixed(2)} cm`);
console.log('  -> coincide col +1.5 cm del progetto, ma NON e\' il minimo del transito continuo.');
console.log('\nCONCLUSIONE: in ogni orientamento un paraurti tocca il SAG -> uscita NON possibile senza strisciare.');
