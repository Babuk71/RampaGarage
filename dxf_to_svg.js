// DXF R12 ASCII → SVG converter
// Usage: node dxf_to_svg.js
'use strict';
const fs = require('fs');
const path = require('path');

const FILES = [
  'Schematizzazione_Vettura.dxf',
  'Profilo_Rampa.dxf',
  'Sezione_Costruttiva.dxf',
];

const DIR = __dirname;

// DXF ACI color → SVG hex (white-background readable)
const ACI = {
  1: '#cc0000', 2: '#997700', 3: '#007700', 4: '#006699',
  5: '#2244bb', 6: '#aa0099', 7: '#111111', 8: '#777777',
};
function aciColor(n) { return ACI[n] || '#333333'; }

// Parse DXF file into flat pair list
function parsePairs(content) {
  const lines = content.split(/\r?\n/);
  const pairs = [];
  let i = 0;
  while (i < lines.length - 1) {
    const code = parseInt(lines[i].trim(), 10);
    if (!isNaN(code)) {
      pairs.push([code, lines[i + 1].trim()]);
      i += 2;
    } else {
      i++;
    }
  }
  return pairs;
}

// Extract header extent values
function getExtents(pairs) {
  let xmin = 0, ymin = 0, xmax = 1000, ymax = 500;
  for (let i = 0; i < pairs.length; i++) {
    const [c, v] = pairs[i];
    if (c === 9 && v === '$EXTMIN') {
      if (pairs[i+1]?.[0] === 10) xmin = parseFloat(pairs[i+1][1]);
      if (pairs[i+2]?.[0] === 20) ymin = parseFloat(pairs[i+2][1]);
    }
    if (c === 9 && v === '$EXTMAX') {
      if (pairs[i+1]?.[0] === 10) xmax = parseFloat(pairs[i+1][1]);
      if (pairs[i+2]?.[0] === 20) ymax = parseFloat(pairs[i+2][1]);
    }
  }
  return { xmin, ymin, xmax, ymax };
}

// Extract layer definitions
function getLayers(pairs) {
  const layers = {};
  let inLayerTable = false;
  let cur = null;
  for (let i = 0; i < pairs.length; i++) {
    const [c, v] = pairs[i];
    if (c === 2 && v === 'LAYER' && pairs[i-1]?.[0] === 0 && pairs[i-1]?.[1] === 'TABLE') {
      inLayerTable = true; continue;
    }
    if (!inLayerTable) continue;
    if (c === 0 && v === 'ENDTAB') { inLayerTable = false; break; }
    if (c === 0 && v === 'LAYER') { cur = { color: 7, linetype: 'CONTINUOUS' }; continue; }
    if (!cur) continue;
    if (c === 2) { layers[v] = cur; cur = { ...cur }; cur = layers[v]; }
    if (c === 62) cur.color = parseInt(v, 10);
    if (c === 6) cur.linetype = v;
  }
  return layers;
}

// Extract entities from ENTITIES section
function getEntities(pairs) {
  const entities = [];
  let inEnt = false;
  let cur = null;
  const ETYPES = new Set(['LINE', 'ARC', 'CIRCLE', 'TEXT']);

  for (let i = 0; i < pairs.length; i++) {
    const [c, v] = pairs[i];
    if (c === 2 && v === 'ENTITIES' && pairs[i-1]?.[0] === 0 && pairs[i-1]?.[1] === 'SECTION') {
      inEnt = true; continue;
    }
    if (!inEnt) continue;
    if (c === 0 && v === 'ENDSEC') break;
    if (c === 0 && ETYPES.has(v)) {
      if (cur) entities.push(cur);
      cur = { type: v };
      continue;
    }
    if (cur) cur[c] = v;
  }
  if (cur) entities.push(cur);
  return entities;
}

// Compute SVG arc path from DXF ARC entity (CCW convention)
function arcPath(cx, cy, r, startDeg, endDeg, tx, ty) {
  const toRad = d => d * Math.PI / 180;
  // span: always CCW from start to end
  let span = endDeg - startDeg;
  if (span < 0) span += 360;
  const largeArc = span > 180 ? 1 : 0;
  const sx = cx + r * Math.cos(toRad(startDeg));
  const sy = cy + r * Math.sin(toRad(startDeg));
  const ex = cx + r * Math.cos(toRad(endDeg));
  const ey = cy + r * Math.sin(toRad(endDeg));
  // sweep=0: CCW in SVG (= CCW in DXF after Y-flip)
  return `M ${tx(sx).toFixed(2)} ${ty(sy).toFixed(2)} A ${r} ${r} 0 ${largeArc} 0 ${tx(ex).toFixed(2)} ${ty(ey).toFixed(2)}`;
}

function entityToSvg(e, layers, tx, ty) {
  const layer = layers[e[8]] || { color: 7, linetype: 'CONTINUOUS' };
  const col = aciColor(layer.color);
  const dash = layer.linetype === 'DASHED' ? ' stroke-dasharray="8 4"' :
               layer.linetype === 'CENTER' ? ' stroke-dasharray="20 4 4 4"' : '';
  // stroke-width by layer category
  const structural = ['RAMPA', 'STRUTTURA', 'CARROZZERIA', 'GROUND', 'TERRENO'];
  const detail = ['RUOTE', 'GUAINA', 'DETTAGLI', 'CRITICO'];
  const sw = structural.includes(e[8]) ? 2 : detail.includes(e[8]) ? 1.5 : 0.8;

  if (e.type === 'LINE') {
    const x1 = tx(e[10]).toFixed(2), y1 = ty(e[20]).toFixed(2);
    const x2 = tx(e[11]).toFixed(2), y2 = ty(e[21]).toFixed(2);
    return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${col}" stroke-width="${sw}"${dash}/>`;
  }
  if (e.type === 'ARC') {
    const d = arcPath(
      parseFloat(e[10]), parseFloat(e[20]),
      parseFloat(e[40]),
      parseFloat(e[50]), parseFloat(e[51]),
      tx, ty
    );
    return `<path d="${d}" fill="none" stroke="${col}" stroke-width="${sw}"${dash}/>`;
  }
  if (e.type === 'CIRCLE') {
    return `<circle cx="${tx(e[10]).toFixed(2)}" cy="${ty(e[20]).toFixed(2)}" r="${parseFloat(e[40]).toFixed(2)}" fill="none" stroke="${col}" stroke-width="${sw}"${dash}/>`;
  }
  if (e.type === 'TEXT') {
    const x = tx(e[10]).toFixed(2), y = ty(e[20]).toFixed(2);
    const h = parseFloat(e[40]) || 5;
    const rot = e[50] ? -parseFloat(e[50]) : 0; // negate: Y-flip reverses rotation
    const fill = aciColor(layer.color === 7 ? 7 : layer.color);
    const txt = (e[1] || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
    const rotAttr = rot !== 0 ? ` transform="rotate(${rot.toFixed(1)},${x},${y})"` : '';
    // Flip text vertically (Y-flip makes text upside-down without this)
    return `<text x="${x}" y="${y}" font-size="${h}" fill="${fill}" font-family="Arial,sans-serif" dominant-baseline="text-after-edge"${rotAttr}>${txt}</text>`;
  }
  return '';
}

function dxfToSvg(dxfFile) {
  const content = fs.readFileSync(path.join(DIR, dxfFile), 'utf8');
  const pairs = parsePairs(content);
  const { xmin, ymin, xmax, ymax } = getExtents(pairs);
  const layers = getLayers(pairs);
  const entities = getEntities(pairs);

  const pad = 20;
  const vw = (xmax - xmin) + 2 * pad;
  const vh = (ymax - ymin) + 2 * pad;

  const tx = x => parseFloat(x) - xmin + pad;
  const ty = y => (ymax - parseFloat(y)) + pad;

  const svgLines = entities
    .map(e => '  ' + entityToSvg(e, layers, tx, ty))
    .filter(l => l.trim() !== '');

  const title = path.basename(dxfFile, '.dxf');
  const svg = [
    `<?xml version="1.0" encoding="UTF-8"?>`,
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${vw.toFixed(0)} ${vh.toFixed(0)}" width="${vw.toFixed(0)}" height="${vh.toFixed(0)}" style="background:#fff">`,
    `  <!-- ${title} — generato da dxf_to_svg.js -->`,
    ...svgLines,
    `</svg>`,
  ].join('\n');

  const outFile = path.join(DIR, title + '.svg');
  fs.writeFileSync(outFile, svg, 'utf8');
  console.log(`Scritto: ${outFile}  (${entities.length} entità, viewBox ${vw.toFixed(0)}x${vh.toFixed(0)})`);
  return { title, vw, vh };
}

// Convert all files
const results = FILES.map(f => dxfToSvg(f));

// Generate index HTML that embeds all SVGs
const html = `<!DOCTYPE html>
<html lang="it">
<head>
<meta charset="UTF-8">
<title>Rampa Garage — Tavole DXF</title>
<style>
  body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background: #f0f0f0; }
  h1 { color: #222; font-size: 18px; }
  .tavola { background: #fff; border: 1px solid #ccc; margin: 20px 0; padding: 10px; box-shadow: 2px 2px 6px rgba(0,0,0,.15); }
  .tavola h2 { font-size: 14px; color: #444; margin: 0 0 8px; border-bottom: 1px solid #ddd; padding-bottom: 4px; }
  .tavola img, .tavola object { max-width: 100%; display: block; }
  .btn { display: inline-block; margin: 4px; padding: 6px 14px; background: #2244bb; color: #fff;
         border-radius: 4px; cursor: pointer; font-size: 13px; text-decoration: none; border: none; }
  .btn:hover { background: #1133aa; }
  @media print {
    body { background: #fff; padding: 0; }
    .btn { display: none; }
    .tavola { border: none; box-shadow: none; page-break-after: always; }
  }
</style>
</head>
<body>
<h1>Rampa Garage — Visualizzazione Tavole</h1>
<p style="font-size:12px;color:#666">Per esportare in PDF: <b>Ctrl+P → Salva come PDF</b> (usa "Più impostazioni" → Scala = 100%, senza margini)</p>
${results.map(r => `
<div class="tavola" id="${r.title}">
  <h2>${r.title.replace(/_/g, ' ')}</h2>
  <img src="${r.title}.svg" alt="${r.title}" style="width:100%;height:auto"/>
  <div style="margin-top:6px">
    <a class="btn" href="${r.title}.svg" download>↓ Scarica SVG</a>
    <button class="btn" onclick="window.open('${r.title}.svg')">Apri SVG</button>
  </div>
</div>`).join('\n')}
</body>
</html>`;

const htmlPath = path.join(DIR, 'Tavole_Rampa.html');
fs.writeFileSync(htmlPath, html, 'utf8');
console.log(`\nIndex HTML: ${htmlPath}`);
console.log('Apri Tavole_Rampa.html nel browser → Ctrl+P → Salva come PDF');
