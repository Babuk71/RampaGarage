// genera_animazione.js — genera Animazione_Rampa.html: transito animato della vettura sul
// profilo OTTIMIZZATO ESTREMO (CREST R=950 + SAG R=3042, picco 47%), con la silhouette che
// CAMBIA COLORE in base alla clearance governante (verde/arancio/rosso) nei punti critici.
//
// DUE modelli di contatto selezionabili:
//  - VERIFICATO (punto singolo): paraurti/sbalzi all'estremita' + ventre. E' il modello delle
//    tavole, con i numeri gia' validati (ingresso ant -0.80 a h=8, ecc.). E' il colore DI DEFAULT.
//  - STIMA (multi-punto): aggiunge punti bassi del sottoscocca (splitter, minigonna, terminali)
//    con altezze STIMATE non verificate -> il minimo e' solo INDICATIVO.
//
// Controlli: play/pausa, slider posizione, luce h = 8/9/10 cm, direzione INGRESSO (muso->garage)
// o USCITA GIRATA (muso->strada), modello colore, pulsante "posa critica". Corpo rigido su 2 ruote.
'use strict';
const fs = require('fs');
const SIL = JSON.parse(fs.readFileSync(__dirname + '/_silhouette.json', 'utf8'));

// --- punti bassi del sottoscocca (frame silhouette sx; h = clearance statica STIMATA a luce 8) ---
//   sx: -140 = punta muso | 0 = ruota ant | 240 = ruota post | 360 = punta coda
const UNDER = [
  { sx:-140, h:14, name:'punta muso' },
  { sx:-122, h:8,  name:'splitter ant.' },
  { sx:-40,  h:11, name:'fondo piatto ant.' },
  { sx:60,   h:10, name:'minigonna' },
  { sx:120,  h:12, name:'ventre (breakover)' },
  { sx:200,  h:11, name:'fondo piatto post.' },
  { sx:330,  h:10, name:'diffusore/terminali' },
  { sx:360,  h:16, name:'punta coda' },
];

const PAGE = `<!DOCTYPE html>
<html lang="it">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Rampa Garage — Animazione transito vettura</title>
<style>
  body{font-family:Arial,Helvetica,sans-serif;margin:0;background:#f4f5f7;color:#1d1f23}
  header{padding:14px 18px 6px}
  h1{font-size:18px;margin:0 0 4px}
  .sub{font-size:12px;color:#555;margin:0}
  .warn{font-size:12px;color:#b03000;background:#fff3e8;border:1px solid #f0c49a;border-radius:6px;padding:6px 10px;margin:8px 18px}
  .bar{display:flex;flex-wrap:wrap;gap:14px;align-items:center;padding:8px 18px;background:#fff;border-top:1px solid #e3e3e3;border-bottom:1px solid #e3e3e3}
  .grp{display:flex;gap:6px;align-items:center;font-size:13px}
  .grp b{font-size:12px;color:#444;margin-right:2px}
  button{font:inherit;font-size:13px;padding:5px 12px;border:1px solid #bbb;background:#fafafa;border-radius:5px;cursor:pointer}
  button:hover{background:#eee}
  button.on{background:#2244bb;color:#fff;border-color:#2244bb}
  input[type=range]{width:340px;vertical-align:middle}
  #wrap{padding:10px 18px}
  canvas{width:100%;height:auto;background:#fff;border:1px solid #ddd;border-radius:6px;display:block;touch-action:none;cursor:grab}
  .read{display:flex;flex-wrap:wrap;gap:18px;padding:6px 18px 18px;font-size:13px}
  .card{background:#fff;border:1px solid #e0e0e0;border-radius:6px;padding:10px 12px;min-width:230px}
  .card h3{margin:0 0 6px;font-size:12px;color:#555;text-transform:uppercase;letter-spacing:.4px}
  .big{font-size:22px;font-weight:bold}
  .leg{display:inline-block;width:14px;height:14px;border-radius:3px;vertical-align:middle;margin-right:5px}
  .mut{color:#777;font-size:12px}
</style>
</head>
<body>
<header>
  <h1>Rampa Garage — animazione del transito (profilo ottimizzato, picco 47%)</h1>
  <p class="sub">La silhouette cambia colore in base alla clearance governante del <b>modello attivo</b>:
    <span class="leg" style="background:#119911"></span>sicuro (&ge;1 cm)
    <span class="leg" style="background:#e8820c"></span>a rischio (0–1 cm)
    <span class="leg" style="background:#cc0000"></span>collisione (&lt;0).</p>
</header>
<div class="warn"><b>Modello colore di default = VERIFICATO</b> (punto singolo, numeri validati: a h=8 in ingresso la
  silhouette diventa <b>rossa</b> alla posa critica). Il modello <b>STIMA multi-punto</b> usa altezze sottoscocca
  <b>non verificate</b> ed è solo indicativo (può non diventare rosso anche quando il verificato lo è).</div>

<div class="bar">
  <div class="grp"><button id="play">► Play</button></div>
  <div class="grp"><b>Posizione</b><input type="range" id="pos" min="0" max="1000" value="0"></div>
  <div class="grp"><b>Luce</b>
    <button class="hbtn on" data-h="8">h=8</button>
    <button class="hbtn" data-h="9">h=9</button>
    <button class="hbtn" data-h="10">h=10</button></div>
  <div class="grp"><b>Direzione</b>
    <button class="dbtn on" data-d="in">Ingresso (muso→garage)</button>
    <button class="dbtn" data-d="out">Uscita girata (muso→strada)</button></div>
  <div class="grp"><b>Modello</b>
    <button class="mbtn on" data-m="ver">Verificato (punto singolo)</button>
    <button class="mbtn" data-m="sti">Stima (multi-punto)</button></div>
  <div class="grp"><button id="crit">Vai alla posa critica</button></div>
  <div class="grp mut">↔ puoi anche trascinare la vettura sul disegno</div>
</div>

<div id="wrap"><canvas id="cv" width="1600" height="380"></canvas></div>

<div class="read">
  <div class="card">
    <h3 id="minh">Clearance — modello attivo</h3>
    <div class="big" id="minv">—</div>
    <div id="ming" class="mut">—</div>
  </div>
  <div class="card">
    <h3 id="alth">Altro modello (stessa posa)</h3>
    <div class="big" id="altv">—</div>
    <div id="altg" class="mut">—</div>
  </div>
  <div class="card">
    <h3>Stato (modello attivo)</h3>
    <div class="big" id="state">—</div>
    <div class="mut" id="posinfo">—</div>
  </div>
  <div class="card" title="Soglie: verde mu_req <= 0.275 (margine x2 su CLS spazzolato bagnato); arancio 0.275-0.55 (margine ridotto); rosso > 0.55 (oltre l'aderenza disponibile da bagnato).">
    <h3>Inclinazione vettura (trazione)</h3>
    <div class="big" id="incv">—</div>
    <div class="mut" id="incg">—</div>
  </div>
</div>

<script>
var SIL = ${JSON.stringify(SIL)};
var UNDER = ${JSON.stringify(UNDER)};

// ---------- geometria profilo ottimizzato ----------
var DEG=Math.PI/180, H=380, Ltot=1700, wb=240, Lant=140, Lpost=120, rw=35;
var thDeg=25, th=thDeg*DEG, s=Math.sin(th), c=Math.cos(th), t=Math.tan(th);
var Rc=950, S=(Ltot*s-H*c)/(1-c), Rs=S-Rc, Lh=Ltot-S*s;
var ceX=Rc*s, ceY=H-Rc*(1-c), ssX=ceX+Lh, ssY=ceY-Lh*t;
var crestC={x:0,y:H-Rc}, sagC={x:Ltot,y:Rs};
function ys(x){
  if(x<=0) return H;
  if(x<ceX) return crestC.y+Math.sqrt(Math.max(0,Rc*Rc-x*x));
  if(x<ssX) return ceY+(ssY-ceY)*(x-ceX)/(ssX-ceX);
  if(x<Ltot) return sagC.y-Math.sqrt(Math.max(0,Rs*Rs-(x-Ltot)*(x-Ltot)));
  return 0;
}
// ---------- corpo rigido su 2 ruote ----------
function solveOther(xr,dir){
  var lo,hi; if(dir>0){lo=xr+1;hi=xr+wb+200;}else{lo=xr-wb-200;hi=xr-1;}
  var xo=xr+dir*wb;
  for(var i=0;i<100;i++){ xo=(lo+hi)/2; var d=Math.hypot(xo-xr,ys(xo)-ys(xr));
    if(dir>0){ if(d>wb)hi=xo; else lo=xo; } else { if(d>wb)lo=xo; else hi=xo; } }
  return xo;
}
function pose(xr,dir,h){
  var xo=solveOther(xr,dir);
  var Cr={x:xr,y:ys(xr)}, Cf={x:xo,y:ys(xo)};
  var dist=Math.hypot(Cf.x-Cr.x,Cf.y-Cr.y);
  var ux=Cf.x-Cr.x, uy=Cf.y-Cr.y, ul=Math.hypot(ux,uy)||1;
  var u={x:ux/ul,y:uy/ul}; var nn={x:-u.y,y:u.x}; if(nn.y<0)nn={x:u.y,y:-u.x};
  function W(bx,by){ return {x:Cr.x+bx*u.x+by*nn.x, y:Cr.y+bx*u.y+by*nn.y}; }
  return {Cr:Cr,Cf:Cf,dist:dist,W:W};
}
function valid(p){ return Math.abs(p.dist-wb)<0.5; }
// mappa sx silhouette -> body-x del modello, secondo l'orientamento
function bodyx(sx,dir){ return dir==='in' ? (wb-sx) : sx; }

// ---------- VERIFICATO (punto singolo): paraurti/sbalzi all'estremita' + ventre ----------
function evalSingle(xr,h,dir){
  var p=pose(xr,+1,h); if(!valid(p)) return null;
  var ends = (dir==='in')
    ? [{bx:wb+Lant, name:'paraurti anteriore (muso, sbalzo 140)'}, {bx:-Lpost, name:'paraurti posteriore (coda, 120)'}]
    : [{bx:-Lant,    name:'muso (sbalzo 140)'},                    {bx:wb+Lpost, name:'coda (sbalzo 120)'}];
  var mn=1e9, nm='', P=null;
  for(var i=0;i<ends.length;i++){ var Q=p.W(ends[i].bx, h); var cl=Q.y-ys(Q.x); if(cl<mn){mn=cl;nm=ends[i].name;P=Q;} }
  for(var b=0;b<=wb;b+=4){ var Qb=p.W(b,h); var clb=Qb.y-ys(Qb.x); if(clb<mn){mn=clb;nm='ventre';P=Qb;} }
  return {p:p, min:mn, name:nm, P:P, multi:false};
}
// ---------- STIMA (multi-punto): punti bassi del sottoscocca (altezze STIMATE) ----------
function evalMulti(xr,h,dir){
  var p=pose(xr,+1,h); if(!valid(p)) return null;
  var lift=h-8, mn=1e9, nm='', P=null;
  for(var i=0;i<UNDER.length;i++){
    var u=UNDER[i]; var Q=p.W(bodyx(u.sx,dir), u.h+lift); var cl=Q.y-ys(Q.x);
    if(cl<mn){ mn=cl; nm=u.name; P=Q; }
  }
  return {p:p, min:mn, name:nm, P:P, multi:true};
}
function evalBy(model,xr,h,dir){ return model==='ver' ? evalSingle(xr,h,dir) : evalMulti(xr,h,dir); }
function statusCol(cm){ return cm<0?'#cc0000':(cm<1?'#e8820c':'#119911'); }
function statusTxt(cm){ return cm<0?'COLLISIONE':(cm<1?'a rischio':'sicuro'); }
// inclinazione vettura = pendenza della retta fra i due appoggi ruota
function gradePct(p){ var dx=Math.abs(p.Cf.x-p.Cr.x)||1; return Math.abs(p.Cf.y-p.Cr.y)/dx*100; }
function gradeDeg(p){ return Math.atan2(Math.abs(p.Cf.y-p.Cr.y), Math.abs(p.Cf.x-p.Cr.x))/DEG; }
// trazione: mu_req = tan = pendenza/100; mu disponibile bagnato ~0.55 (CLS spazzolato), margine x2
function tracCol(g){ var mu=g/100; return mu>0.55?'#cc0000':(mu>0.275?'#e8820c':'#119911'); }
function tracTxt(g){ var mu=g/100; return mu>0.55?'oltre aderenza (bagnato)':(mu>0.275?'margine ridotto':'sicuro'); }

// ---------- mappatura mondo -> canvas ----------
var cv=document.getElementById('cv'), ctx=cv.getContext('2d');
var wXmin=-480, wXmax=2180, wYmin=-70, wYmax=560;
var scale=1, dpr=window.devicePixelRatio||1;
function fit(){
  var cssW=cv.clientWidth||1500;
  scale=cssW/(wXmax-wXmin);
  var cssH=(wYmax-wYmin)*scale;
  cv.width=Math.round(cssW*dpr); cv.height=Math.round(cssH*dpr);
  cv.style.height=cssH+'px';
  ctx.setTransform(dpr,0,0,dpr,0,0);
}
function MX(x){ return (x-wXmin)*scale; }
function MY(y){ return (wYmax-y)*scale; }

// ---------- range di transito (xr = contatto ruota posteriore) ----------
var xrA=-200, xrB=1950;
function xrOf(tt,dir){ return dir==='in' ? (xrA+tt*(xrB-xrA)) : (xrB+tt*(xrA-xrB)); }

// ---------- disegno ----------
function drawProfile(){
  ctx.lineWidth=2.4; ctx.strokeStyle='#0a7a0a'; ctx.beginPath();
  ctx.moveTo(MX(-450),MY(H)); ctx.lineTo(MX(0),MY(H));
  for(var x=0;x<=Ltot;x+=4){ ctx.lineTo(MX(x),MY(ys(x))); }
  ctx.lineTo(MX(2150),MY(0)); ctx.stroke();
  ctx.fillStyle='#333'; ctx.font='13px Arial';
  ctx.fillText('STRADA', MX(-360), MY(H)-8);
  ctx.fillText('GARAGE', MX(1880), MY(0)-8);
}
// quote TECNICHE statiche (non variano nell'animazione): quota max/min e lunghezza 0-1700
function drawDims(){
  ctx.save();
  var DC='#2a5db0'; ctx.strokeStyle=DC; ctx.fillStyle=DC; ctx.lineWidth=1; ctx.font='12px Arial';
  function tick(x,y){ ctx.beginPath(); ctx.moveTo(MX(x)-4,MY(y)-4); ctx.lineTo(MX(x)+4,MY(y)+4); ctx.stroke(); }
  // datum orizzontale a quota 0 (riferimento) sotto tutta la rampa
  ctx.setLineDash([5,4]);
  ctx.beginPath(); ctx.moveTo(MX(-450),MY(0)); ctx.lineTo(MX(1700),MY(0)); ctx.stroke();
  // witness verticali agli estremi della lunghezza
  ctx.beginPath(); ctx.moveTo(MX(0),MY(0)); ctx.lineTo(MX(0),MY(-52)); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(MX(1700),MY(0)); ctx.lineTo(MX(1700),MY(-52)); ctx.stroke();
  ctx.setLineDash([]);
  // linea di quota LUNGHEZZA (orizzontale) a y=-42
  ctx.beginPath(); ctx.moveTo(MX(0),MY(-42)); ctx.lineTo(MX(1700),MY(-42)); ctx.stroke();
  tick(0,-42); tick(1700,-42);
  ctx.textAlign='center'; ctx.fillText('L = 1700 cm', MX(850), MY(-42)-5);
  ctx.fillText('0', MX(0), MY(-42)+16); ctx.fillText('1700', MX(1700), MY(-42)+16);
  // quota VERTICALE (dislivello) a sinistra, x=-430
  ctx.beginPath(); ctx.moveTo(MX(-430),MY(0)); ctx.lineTo(MX(-430),MY(380)); ctx.stroke();
  tick(-430,0); tick(-430,380);
  ctx.setLineDash([5,4]);
  ctx.beginPath(); ctx.moveTo(MX(-430),MY(380)); ctx.lineTo(MX(0),MY(380)); ctx.stroke();
  ctx.setLineDash([]);
  ctx.save(); ctx.translate(MX(-430)-7, MY(190)); ctx.rotate(-Math.PI/2);
  ctx.textAlign='center'; ctx.fillText('H = 380 cm', 0, 0); ctx.restore();
  // punti di quota MAX e MIN, marcati come riferimenti tecnici
  ctx.beginPath(); ctx.arc(MX(0),MY(380),3.5,0,7); ctx.fill();
  ctx.textAlign='left'; ctx.fillText('quota MAX  +380 cm  (inizio discesa)', MX(0)+9, MY(380)-7);
  ctx.beginPath(); ctx.arc(MX(1700),MY(0),3.5,0,7); ctx.fill();
  ctx.textAlign='center'; ctx.fillText('quota MIN  0 cm  (fondo rampa)', MX(1700), MY(0)+34);
  ctx.restore();
}
function drawCar(st,h,dir,showUnder){
  var lift=h-8, p=st.p;
  // silhouette colorata dallo stato del modello attivo
  ctx.lineWidth=2; ctx.strokeStyle=statusCol(st.min); ctx.beginPath();
  for(var i=0;i<SIL.length;i++){ var g=SIL[i];
    var a=p.W(bodyx(g[0],dir), g[1]+lift), b=p.W(bodyx(g[2],dir), g[3]+lift);
    ctx.moveTo(MX(a.x),MY(a.y)); ctx.lineTo(MX(b.x),MY(b.y));
  }
  ctx.stroke();
  // ruote
  ctx.strokeStyle='#3366aa'; ctx.lineWidth=1.6;
  var wF=p.W(wb,rw), wR=p.W(0,rw);
  ctx.beginPath(); ctx.arc(MX(wF.x),MY(wF.y), rw*scale, 0, 7); ctx.stroke();
  ctx.beginPath(); ctx.arc(MX(wR.x),MY(wR.y), rw*scale, 0, 7); ctx.stroke();
  // punti sottoscocca (mostrati solo in modalita' stima multi-punto)
  if(showUnder){
    for(var k=0;k<UNDER.length;k++){ var u=UNDER[k];
      var Q=p.W(bodyx(u.sx,dir), u.h+lift); var cl=Q.y-ys(Q.x);
      ctx.fillStyle=statusCol(cl);
      ctx.beginPath(); ctx.arc(MX(Q.x),MY(Q.y), 3, 0, 7); ctx.fill();
    }
  }
  // punto governante: anello + linea a terra + etichetta
  var P=st.P, col=statusCol(st.min);
  ctx.strokeStyle=col; ctx.lineWidth=2;
  ctx.beginPath(); ctx.arc(MX(P.x),MY(P.y), 6, 0, 7); ctx.stroke();
  ctx.setLineDash([4,3]); ctx.beginPath();
  ctx.moveTo(MX(P.x),MY(P.y)); ctx.lineTo(MX(P.x),MY(ys(P.x))); ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle=col; ctx.font='bold 13px Arial';
  ctx.fillText((st.min>=0?'+':'')+st.min.toFixed(2)+' cm', MX(P.x)+8, MY(P.y)-6);
}

// ---------- stato UI ----------
var H_SEL=8, D_SEL='in', M_SEL='ver', POS=0, playing=false;
function setBig(id,val){ var e=document.getElementById(id);
  e.textContent=(val>=0?'+':'')+val.toFixed(2)+' cm'; e.style.color=statusCol(val); }
function render(){
  fit();
  ctx.clearRect(0,0,cv.width,cv.height);
  drawProfile();
  drawDims();
  var xr=xrOf(POS/1000, D_SEL);
  var st=evalBy(M_SEL,xr,H_SEL,D_SEL);
  var other=evalBy(M_SEL==='ver'?'sti':'ver',xr,H_SEL,D_SEL);
  var verName = M_SEL==='ver';
  document.getElementById('minh').textContent = 'Clearance — '+(verName?'VERIFICATO (punto singolo)':'STIMA (multi-punto)');
  document.getElementById('alth').textContent = 'Stessa posa — '+(verName?'STIMA (multi-punto)':'VERIFICATO (punto singolo)');
  if(st){
    drawCar(st,H_SEL,D_SEL, M_SEL==='sti');
    setBig('minv', st.min);
    document.getElementById('ming').textContent='governa: '+st.name;
    document.getElementById('state').textContent=statusTxt(st.min);
    document.getElementById('state').style.color=statusCol(st.min);
    // inclinazione vettura / trazione (indipendente dal modello di contatto)
    var g=gradePct(st.p);
    var iv=document.getElementById('incv'); iv.textContent=g.toFixed(1)+' %'; iv.style.color=tracCol(g);
    document.getElementById('incg').textContent='≈ '+gradeDeg(st.p).toFixed(1)+'°  ·  μ richiesto '+(g/100).toFixed(2)+'  ·  '+tracTxt(g);
  }
  if(other){ setBig('altv', other.min);
    document.getElementById('altg').textContent='governa: '+other.name + (other.multi?'  (stima non verificata)':''); }
  var pct=(POS/10).toFixed(0);
  document.getElementById('posinfo').textContent='transito '+pct+'%  ·  luce h='+H_SEL+' cm  ·  '+
    (D_SEL==='in'?'ingresso':'uscita girata');
}
function loop(){
  if(playing){ POS+=2.2; if(POS>=1000){POS=1000; playing=false; document.getElementById('play').textContent='► Play';}
    document.getElementById('pos').value=POS; render(); }
  requestAnimationFrame(loop);
}
// posa critica: scan del minimo del modello ATTIVO
function gotoCrit(){
  var best=1e9, bt=0;
  for(var i=0;i<=1000;i++){ var xr=xrOf(i/1000,D_SEL); var st=evalBy(M_SEL,xr,H_SEL,D_SEL);
    if(st && st.min<best){ best=st.min; bt=i; } }
  POS=bt; document.getElementById('pos').value=POS; playing=false;
  document.getElementById('play').textContent='► Play'; render();
}

// ---------- eventi ----------
document.getElementById('play').onclick=function(){
  if(POS>=1000) POS=0;
  playing=!playing; this.textContent=playing?'❚❚ Pausa':'► Play';
};
document.getElementById('pos').oninput=function(){ POS=+this.value; playing=false;
  document.getElementById('play').textContent='► Play'; render(); };
document.getElementById('crit').onclick=gotoCrit;
function wire(cls, fn){ var bs=document.querySelectorAll(cls);
  bs.forEach(function(b){ b.onclick=function(){ bs.forEach(function(x){x.classList.remove('on');});
    b.classList.add('on'); fn(b); render(); }; }); }
wire('.hbtn', function(b){ H_SEL=+b.dataset.h; });
wire('.mbtn', function(b){ M_SEL=b.dataset.m; });
// direzione: cambiando senso, mantieni la STESSA posizione fisica (le mappe sono speculari -> POS->1000-POS)
var db=document.querySelectorAll('.dbtn');
db.forEach(function(b){ b.onclick=function(){
  var nd=b.dataset.d;
  if(nd!==D_SEL){ POS=1000-POS; document.getElementById('pos').value=POS; }
  db.forEach(function(x){x.classList.remove('on');}); b.classList.add('on');
  D_SEL=nd; render();
}; });
window.addEventListener('resize', render);

// ---------- DRAG & DROP della vettura lungo la rampa ----------
function evtWorldX(e){ var r=cv.getBoundingClientRect(); return wXmin + (e.clientX-r.left)/scale; }
function xrToPos(xr,dir){ var d=xrB-xrA; var f=(dir==='in')?(xr-xrA)/d:(xrB-xr)/d; return Math.max(0,Math.min(1000,f*1000)); }
function carFoot(xr){ return [xr - Lpost - 50, xr + wb + Lant + 60]; }   // ingombro orizzontale approx
var dragging=false, grabOffset=0;
cv.addEventListener('pointerdown', function(e){
  var wx=evtWorldX(e), xrNow=xrOf(POS/1000,D_SEL), f=carFoot(xrNow);
  if(wx<f[0] || wx>f[1]) return;                 // afferra solo se sei sulla vettura
  dragging=true; grabOffset=wx-xrNow;
  playing=false; document.getElementById('play').textContent='► Play';
  cv.style.cursor='grabbing'; try{cv.setPointerCapture(e.pointerId);}catch(_){}
  e.preventDefault();
});
cv.addEventListener('pointermove', function(e){
  if(dragging){
    var xr=Math.max(xrA, Math.min(xrB, evtWorldX(e)-grabOffset));
    POS=xrToPos(xr,D_SEL); document.getElementById('pos').value=POS; render(); e.preventDefault();
  } else {
    var wx=evtWorldX(e), f=carFoot(xrOf(POS/1000,D_SEL));
    cv.style.cursor=(wx>=f[0]&&wx<=f[1])?'grab':'default';
  }
});
function endDrag(e){ if(dragging){ dragging=false; cv.style.cursor='grab'; try{cv.releasePointerCapture(e.pointerId);}catch(_){}} }
cv.addEventListener('pointerup', endDrag);
cv.addEventListener('pointercancel', endDrag);

// stato iniziale da URL hash (#pos=520&h=8&dir=in&m=ver) — utile per inquadrare una posa
(function(){ var hs=location.hash.slice(1); if(!hs) return; hs.split('&').forEach(function(kv){
  var p=kv.split('='); var k=p[0], v=p[1];
  if(k==='pos'){POS=+v; document.getElementById('pos').value=POS;}
  if(k==='h'){H_SEL=+v; document.querySelectorAll('.hbtn').forEach(function(b){b.classList.toggle('on', +b.dataset.h===H_SEL);});}
  if(k==='dir'){D_SEL=v; document.querySelectorAll('.dbtn').forEach(function(b){b.classList.toggle('on', b.dataset.d===D_SEL);});}
  if(k==='m'){M_SEL=v; document.querySelectorAll('.mbtn').forEach(function(b){b.classList.toggle('on', b.dataset.m===M_SEL);});}
}); })();
render(); loop();
</script>
</body>
</html>`;

fs.writeFileSync(__dirname + '/Animazione_Rampa.html', PAGE, 'utf8');
console.log('Scritto: Animazione_Rampa.html  (' + SIL.length + ' segmenti silhouette, ' + UNDER.length + ' punti sottoscocca STIMATI; colore di default = VERIFICATO)');
