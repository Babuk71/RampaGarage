// genera_animazione.js — genera Animazione_Rampa.html: transito animato della vettura sul
// profilo OTTIMIZZATO ESTREMO (CREST R=950 + SAG R=3042, picco 47%), con la silhouette che
// CAMBIA COLORE in base alla clearance governante (verde/arancio/rosso) nei punti critici.
//
// Modello di contatto MULTI-PUNTO: oltre ai paraurti, una serie di punti bassi del sottoscocca
// (splitter, minigonna, ventre, diffusore/terminali). ATTENZIONE: le altezze del sottoscocca
// sono STIME non verificate (vedi discussione foto): il minimo multi-punto e' INDICATIVO.
// Accanto vengono mostrati i valori VERIFICATI a punto singolo come riferimento.
//
// Controlli: play/pausa, slider posizione, luce h = 8/9/10 cm, direzione INGRESSO (muso->garage)
// o USCITA GIRATA (muso->strada), pulsante "posa critica". Corpo rigido su 2 ruote, parametrico in h.
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

// valori VERIFICATI a punto singolo (clearance governante, cm) — riferimento mostrato a video
const REF = { in:{8:-0.80,9:0.24,10:1.23}, out:{8:-0.84,9:0.24,10:1.24} };

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
  canvas{width:100%;height:auto;background:#fff;border:1px solid #ddd;border-radius:6px;display:block}
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
  <p class="sub">La silhouette cambia colore in base alla clearance governante:
    <span class="leg" style="background:#119911"></span>sicuro (&ge;1 cm)
    <span class="leg" style="background:#e8820c"></span>a rischio (0–1 cm)
    <span class="leg" style="background:#cc0000"></span>collisione (&lt;0).</p>
</header>
<div class="warn"><b>Modello multi-punto:</b> le altezze del sottoscocca (splitter, minigonna, terminali…) sono
  <b>STIME non verificate</b> — il minimo multi-punto è <b>indicativo</b>. Il valore <b>verificato a punto singolo</b>
  è mostrato a destra come riferimento.</div>

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
  <div class="grp"><button id="crit">Vai alla posa critica</button></div>
</div>

<div id="wrap"><canvas id="cv" width="1600" height="380"></canvas></div>

<div class="read">
  <div class="card">
    <h3>Clearance minima (multi-punto · stima)</h3>
    <div class="big" id="minv">—</div>
    <div id="ming" class="mut">—</div>
  </div>
  <div class="card">
    <h3>Riferimento verificato (punto singolo)</h3>
    <div class="big" id="refv">—</div>
    <div class="mut" id="refg">paraurti/sbalzo lungo contro il SAG</div>
  </div>
  <div class="card">
    <h3>Stato</h3>
    <div class="big" id="state">—</div>
    <div class="mut" id="posinfo">—</div>
  </div>
</div>

<script>
var SIL = ${JSON.stringify(SIL)};
var UNDER = ${JSON.stringify(UNDER)};
var REF = ${JSON.stringify(REF)};

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

// clearance multi-punto di una posa: ritorna {min, name, P}
function evalPose(xr,h,dir){
  var p=pose(xr,+1,h); if(!valid(p)) return null;
  var lift=h-8, mn=1e9, nm='', P=null;
  for(var i=0;i<UNDER.length;i++){
    var u=UNDER[i]; var Q=p.W(bodyx(u.sx,dir), u.h+lift); var cl=Q.y-ys(Q.x);
    if(cl<mn){ mn=cl; nm=u.name; P=Q; }
  }
  return {p:p, min:mn, name:nm, P:P};
}
function statusCol(cm){ return cm<0?'#cc0000':(cm<1?'#e8820c':'#119911'); }
function statusTxt(cm){ return cm<0?'COLLISIONE':(cm<1?'a rischio':'sicuro'); }

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
var xrA=-200, xrB=1950;             // A=alto/strada, B=basso/garage
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
function drawCar(st,h,dir){
  var lift=h-8, p=st.p;
  // silhouette
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
  // punti sottoscocca
  for(var k=0;k<UNDER.length;k++){ var u=UNDER[k];
    var Q=p.W(bodyx(u.sx,dir), u.h+lift); var cl=Q.y-ys(Q.x);
    ctx.fillStyle=statusCol(cl);
    ctx.beginPath(); ctx.arc(MX(Q.x),MY(Q.y), 3, 0, 7); ctx.fill();
  }
  // punto governante: anello + linea a terra + etichetta
  var P=st.P; var col=statusCol(st.min);
  ctx.strokeStyle=col; ctx.lineWidth=2;
  ctx.beginPath(); ctx.arc(MX(P.x),MY(P.y), 6, 0, 7); ctx.stroke();
  ctx.setLineDash([4,3]); ctx.beginPath();
  ctx.moveTo(MX(P.x),MY(P.y)); ctx.lineTo(MX(P.x),MY(ys(P.x))); ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle=col; ctx.font='bold 13px Arial';
  var lab=(st.min>=0?'+':'')+st.min.toFixed(2)+' cm';
  ctx.fillText(lab, MX(P.x)+8, MY(P.y)-6);
}

// ---------- stato UI ----------
var H_SEL=8, D_SEL='in', POS=0, playing=false;
function render(){
  fit();
  ctx.clearRect(0,0,cv.width,cv.height);
  drawProfile();
  var xr=xrOf(POS/1000, D_SEL);
  var st=evalPose(xr,H_SEL,D_SEL);
  if(st){
    drawCar(st,H_SEL,D_SEL);
    document.getElementById('minv').textContent=(st.min>=0?'+':'')+st.min.toFixed(2)+' cm';
    document.getElementById('minv').style.color=statusCol(st.min);
    document.getElementById('ming').textContent='governa: '+st.name;
    document.getElementById('state').textContent=statusTxt(st.min);
    document.getElementById('state').style.color=statusCol(st.min);
  }
  var rv=REF[D_SEL][H_SEL];
  document.getElementById('refv').textContent=(rv>=0?'+':'')+rv.toFixed(2)+' cm';
  document.getElementById('refv').style.color=statusCol(rv);
  document.getElementById('refg').textContent = D_SEL==='in'
    ? 'paraurti anteriore (sbalzo 140) contro il SAG' : 'muso (sbalzo 140) contro il SAG';
  var pct=(POS/10).toFixed(0);
  document.getElementById('posinfo').textContent='transito '+pct+'%  ·  luce h='+H_SEL+' cm  ·  '+
    (D_SEL==='in'?'ingresso':'uscita girata');
}
function loop(){
  if(playing){ POS+= (D_SEL==='in'?2.2:2.2); if(POS>=1000){POS=1000; playing=false; document.getElementById('play').textContent='► Play';}
    document.getElementById('pos').value=POS; render(); }
  requestAnimationFrame(loop);
}
// posa critica: scan del minimo governante
function gotoCrit(){
  var best=1e9, bt=0;
  for(var i=0;i<=1000;i++){ var xr=xrOf(i/1000,D_SEL); var st=evalPose(xr,H_SEL,D_SEL);
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
var hb=document.querySelectorAll('.hbtn'); hb.forEach(function(b){ b.onclick=function(){
  hb.forEach(function(x){x.classList.remove('on');}); b.classList.add('on'); H_SEL=+b.dataset.h; render(); }; });
var db=document.querySelectorAll('.dbtn'); db.forEach(function(b){ b.onclick=function(){
  db.forEach(function(x){x.classList.remove('on');}); b.classList.add('on'); D_SEL=b.dataset.d; render(); }; });
window.addEventListener('resize', render);
// stato iniziale da URL hash (#pos=520&h=8&dir=in) — utile per inquadrare una posa
(function(){ var hs=location.hash.slice(1); if(!hs) return; hs.split('&').forEach(function(kv){
  var p=kv.split('='); if(p[0]==='pos'){POS=+p[1]; document.getElementById('pos').value=POS;}
  if(p[0]==='h'){H_SEL=+p[1]; document.querySelectorAll('.hbtn').forEach(function(b){b.classList.toggle('on', +b.dataset.h===H_SEL);});}
  if(p[0]==='dir'){D_SEL=p[1]; document.querySelectorAll('.dbtn').forEach(function(b){b.classList.toggle('on', b.dataset.d===D_SEL);});}
}); })();
render(); loop();
</script>
</body>
</html>`;

fs.writeFileSync(__dirname + '/Animazione_Rampa.html', PAGE, 'utf8');
console.log('Scritto: Animazione_Rampa.html  (' + SIL.length + ' segmenti silhouette, ' + UNDER.length + ' punti sottoscocca STIMATI)');
