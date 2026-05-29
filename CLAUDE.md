# Rampa Garage — Progetto Dimensionamento

## Obiettivo
Dimensionare una rampa di accesso al garage per un'autovettura estrema con minima altezza da terra.

---

## Dati vettura

| Parametro | Valore |
|---|---|
| Altezza da terra (h) | 8 cm |
| Interasse (passo) | 240 cm (centro mozzo) |
| Sbalzo anteriore (L_ant) | 140 cm (da mozzo a margine carrozzeria) |
| Sbalzo posteriore (L_post) | 120 cm (da mozzo a margine carrozzeria) |
| Raggio ruota assunto | 30 cm (non fornito, valore tipico sportiva) |
| Lunghezza totale vettura | 500 cm |

---

## Dati rampa

| Parametro | Valore |
|---|---|
| Tipo | **Discendente** (garage interrato) |
| Dislivello da recuperare (H) | 380 cm |
| Lunghezza massima disponibile (L_tot) | 1700 cm (proiezione orizzontale) |
| Pendenza tratto retto (accettata) | 27.9–30.3% ✅ |

---

## Angoli critici vettura

### Angolo di attacco anteriore (alfa)
- Definizione: massima pendenza alla quale la vettura può trovarsi senza che il paraurti anteriore tocchi la superficie
- Formula: alfa = arctan(h / L_ant) = arctan(8/140)
- **alfa = 3.27° ≈ 5.71%**

### Angolo di partenza posteriore (beta)
- Definizione: massima pendenza alla quale la vettura può trovarsi senza che il paraurti posteriore tocchi la superficie
- Formula: beta = arctan(h / L_post) = arctan(8/120)
- **beta = 3.81° ≈ 6.67%**

---

## Analisi fattibilità

### Rampa rettilinea (IMPOSSIBILE)
- Pendenza media disponibile: 380/1700 = **22.4% >> 5.71% (alfa)**
- Lunghezza minima per rampa dritta: 380 / tan(3.27°) = **6.655 m**
- Spazio disponibile solo 17 m: non sufficiente per rampa rettilinea

### Soluzione: rampa con raccordi curvilinei
Una rampa dritta ripida al centro, con archi di cerchio alle transizioni, permette di:
- Percorrere il tratto retto con la vettura parallela alla rampa (clearance mantenuta)
- Transitare tra 0° e pendenza_max con raccordi di raggio adeguato
- Rispettare i vincoli di paraurti durante le transizioni

---

## Raggio minimo raccordi

### Formula raggio minimo (paraurti anteriore)
Il vincolo critico è il paraurti anteriore che non deve toccare la superficie durante la transizione.

```
R_min = L_ant² / (2 × h) = 140² / (2 × 8) = 19600 / 16 = 1225 cm = 12.25 m
```

### Verifica paraurti posteriore
```
R_min_post = L_post² / (2 × h) = 120² / 16 = 900 cm = 9.00 m
```

### Verifica ventre (breakover, interasse)
```
R_min_ventre = interasse² / (8 × h) = 240² / 64 = 900 cm = 9.00 m
```

**Raggio di raccordo minimo da adottare: R = 1225 cm (governato dal paraurti anteriore)**

---

## Identificazione del punto critico (garage discendente)

Per una rampa discendente, il punto di **zero clearance non è in cima** (dove il CREST arc è permissivo) ma **in fondo**, all'inizio del SAG arc, quando la vettura scende a -15.6° e il paraurti anteriore sfiora il raccordo.

- **Posizione critica:** asse anteriore a x=1371 (inizio SAG), paraurti anteriore a (1500, 16)
- Il SAG arc sale di L²/(2R) = 140²/(2×1225) = **8 cm** nel punto del paraurti → clearance = h - 8 = 0
- Lo stesso vincolo vale in uscita (salita): stesso SAG, stessa geometria, stesso R_min = 1225 cm

**CREST in cima** (dove la strada piatta incontra l'inizio discesa): la clearance è ≈ 2h = 16 cm → non è il punto critico.

## Profilo rampa ottimale (soluzione minima)

Profilo a 3 segmenti:
1. Raccordo inferiore: arco concavo (da 0° a theta_rampa), R >= 1225 cm
2. Tratto retto: pendenza costante theta_rampa
3. Raccordo superiore: arco concavo (da theta_rampa a 0°), R >= 1225 cm

### Equazioni di vincolo
Con L_retta_oriz = L_tot - 2*R*sin(theta):

```
Vincolo orizzontale: 2*R*sin(theta) + L_retta_oriz = 1700 cm
Vincolo verticale:   2*R*(1-cos(theta)) + L_retta_oriz*tan(theta) = 380 cm
```

Combinando: **2*R*(1-cos theta) = 1700*sin(theta) - 380*cos(theta)**

### Soluzione con R = 1225 cm (minimo)
Equazione: 2450*(1-cos theta) = 1700*sin(theta) - 380*cos(theta)

**Risultato: theta_rampa ≈ 15.6° ≈ 27.9%**

Verifiche:
- Raccordo inferiore: orizzontale = R*sin(theta) = 1225*0.269 = 329 cm; verticale = R*(1-cos theta) = 1225*0.037 = 45 cm
- Tratto retto: orizzontale = 1700-2*329 = 1042 cm; verticale = 1042*tan(15.6°) = 290 cm
- Totale verticale: 2*45 + 290 = **380 cm** ✓
- Totale orizzontale: 2*329 + 1042 = **1700 cm** ✓

### Parametri di progetto (con R = R_min = 1225 cm) — rampa DISCENDENTE
Coordinate DXF: origine = giunzione strada/rampa; x+ verso garage; strada a y=380, garage a y=0

| Segmento | Lunghezza orizz. | Dislivello | Tipo arco | Centro arco DXF | Angoli DXF (CCW) |
|---|---|---|---|---|---|
| Raccordo superiore (CREST) | 329 cm | 45 cm | convesso (lato guida) | (0, -845) | 74.4°→90° |
| Tratto retto discendente | 1042 cm | 290 cm | — | — | slope -15.6° |
| Raccordo inferiore (SAG) | 329 cm | 45 cm | concavo (lato guida) | (1700, 1225) | 254.4°→270° |
| **TOTALE** | **1700 cm** | **380 cm** | | | |

Punti notevoli: CREST start (0,380); CREST end (329,335); SAG start (1371,45); SAG end (1700,0)

**ATTENZIONE:** Con R = 1225 cm (valore minimo), il paraurti anteriore ha clearance = 0 nella posizione critica. 
In pratica adottare R >= 1500 cm con un piccolo tratto retto aggiuntivo.

### Soluzione con R = 1500 cm — **GEOMETRIA ADOTTATA**
Stessa equazione con R=1500: **theta_rampa = 16.87° ≈ 16.9° = 30.3%**
- Raccordi: orizzontale 435 cm cad., dislivello 64 cm cad.
- Tratto retto: 830 cm orizzontale, 252 cm dislivello
- Verifica: 2*64+252=380 ✓, 2*435+830=1700 ✓
- Clearance paraurti anteriore (esatta): **+15 mm** (positiva, sicura)
- Punti notevoli: CREST start (0,380); CREST end (435,316); SAG start (1265,64); SAG end (1700,0)
- Centri archi: CREST (0,-1120); SAG (1700,1500); entrambi R=1500 cm
- Raggio ruota aggiornato: **R_ruota = 35 cm** (275/35 ZR20: cerchio 20"=254mm + fianco 96.25mm = 350.25mm)

---

## File prodotti

| File | Descrizione |
|---|---|
| Schematizzazione_Vettura.dxf | Vista laterale vettura, angoli di attacco, quote |
| Profilo_Rampa.dxf | Profilo rampa con raccordi, vettura sovrapposta in pos. critica |
| Sezione_Costruttiva.dxf | 3 dettagli costruttivi: sezione trasversale, caditoia, soglia garage |

---

## TODO aggiornata

### Fase 1 — Schematizzazione vettura [COMPLETATA]
- [x] Raccolta dati vettura
- [x] Calcolo angolo di attacco anteriore (alfa = 3.27°)
- [x] Calcolo angolo di partenza posteriore (beta = 3.81°)
- [x] DXF vista laterale (Schematizzazione_Vettura.dxf)

### Fase 2 — Raccolta dati rampa [COMPLETATA]
- [x] Tipo: garage interrato, rampa discendente
- [x] Dislivello: 380 cm
- [x] Lunghezza disponibile: 1700 cm
- [ ] Verificare se garage interrato (accesso in discesa) o rialzato (accesso in salita)
- [ ] Rilevare larghezza disponibile (per verifica planimetrica manovra)
- [ ] Tipo superficie prevista (cls, asfalto, pavé) → aderenza su 28%

### Fase 3 — Calcolo profilo rampa [COMPLETATA]
- [x] Verifica impossibilità rampa rettilinea
- [x] Calcolo raggio minimo raccordi: R_min = 1225 cm
- [x] Calcolo theta_rampa con R_min: 15.6° / 27.9%
- [x] Calcolo theta_rampa con R consigliato (1500 cm): 16.9° / 30.3%
- [x] Identificazione punto critico: SAG bottom, front axle a x=1371, paraurti a (1500,16)
- [x] DXF profilo rampa con geometria discendente corretta (Profilo_Rampa.dxf)
- [x] Silhouette vettura in posizione critica e di approccio nel DXF
- [x] Pendenza 27.9–30.3% accettata dal cliente
- [x] Lunghezza tratto retto lungo-slope: 1042/cos(15.6°) ≈ 1082 cm

### Fase 4 — Disegno esecutivo [COMPLETATA]
- [x] Profilo con raccordi quotati (Profilo_Rampa.dxf)
- [x] Sezione trasversale (larghezza 300 cm, pendenza 2%, solaio 10+20+30 cm) → Sezione_Costruttiva.dxf Det.A
- [x] Dettaglio caditoia/drenaggio a valle (grata C250, mesh ≤20×20 mm) → Sezione_Costruttiva.dxf Det.B
- [x] Dettaglio soglia garage (soglia MAX 3 cm, guaina continua, piano garage ribassato) → Sezione_Costruttiva.dxf Det.C
- [!] VINCOLO CRITICO: soglia standard 6 cm > clearance vettura 8 cm; soglia MAX 3 cm, pavimento garage ribassato di 3 cm rispetto alla soglia

### Fase 5 — Verifica e ottimizzazione
- [x] Simulare con altezza da terra ridotta (h=6 cm) → vedi analisi sotto
- [ ] Verifica spazio in pianta per manovra di ingresso/uscita
- [ ] Soluzione rampa portatile aggiuntiva (necessaria per h=6 cm)
- [x] Materiale superficie: analisi aderenza completata → vedi sotto

---

---

## Analisi Fase 5

### Simulazione h = 6 cm (vettura carica / assetto gara)

| Parametro | h=8 cm (progetto) | h=6 cm (carica/gara) |
|---|---|---|
| R_min raccordi | 1225 cm | **1633 cm** |
| Clearance con R=1225 esistente | 0 mm (limite) | **−2 cm** (tocca) |
| Bumper y a pos. critica (x=1508) | 15.1 cm | 13.1 cm |
| Superficie SAG a x=1508 | 15.1 cm | 15.1 cm (invariata) |

**Conclusione:** la rampa dimensionata per h=8 cm NON è percorribile con h=6 cm. Il paraurti anteriore interferisce di 2 cm col raccordo SAG in fondo.

**Opzioni:**
1. **In costruzione**: adottare R=1633 cm per il SAG (raccordo fondo rampa più lungo) → θ_rampa ≈ 17.8° ≈ 32%; raccordi 499 cm cad., tratto retto 702 cm — rimane nei 1700 cm totali
2. **Post costruzione**: inserto portatile di riempimento SAG (lunghezza 329 cm, spessore max 3 cm al centro, profilo concavo) da posare sul raccordo inferiore quando si usa la vettura in assetto ridotto
3. **Accettare il limite**: la rampa è dedicata ad h≥8 cm; per h=6 usare rampa portatile aggiuntiva a monte (lato strada)

**Soluzione raccomandata se la vettura verrà usata anche a h=6:** scegliere R=1633 cm in costruzione (costa nulla in più, theta sale solo di 2°, tutti i vincoli di spazio rispettati).

---

### Analisi aderenza superficie (pendenza 27.9–30.3%)

Coefficiente di attrito minimo necessario per frenata sicura:
```
μ_min = tan(θ) = tan(15.6°) = 0.279 (forza gravitazionale ≡ forza frenante)
Con fattore di sicurezza ×2: μ_req ≈ 0.56
```

| Superficie | μ asciutto | μ bagnato | Idoneità |
|---|---|---|---|
| CLS lisciato / staggiato | 0.60–0.70 | 0.25–0.35 | ❌ bagnato insufficiente |
| **CLS spazzolato trasversalmente** | 0.70–0.80 | **0.50–0.65** | ✅ raccomandato |
| Asfalto drenante rugoso | 0.70–0.80 | 0.45–0.55 | ✅ accettabile |
| Porfido bugnato | 0.60–0.70 | 0.35–0.50 | ⚠️ marginale bagnato |
| Ghiaccio / neve | — | 0.05–0.15 | ❌ impossibile |

**Raccomandazione superficie:** CLS spazzolato trasversalmente (striature ⊥ direzione marcia, profondità 3–5 mm, passo 10–15 mm). In alternativa asfalto drenante.

**Riscaldamento invernale (fortemente consigliato):** con θ=28% qualsiasi formazione di ghiaccio rende la rampa inutilizzabile e pericolosa. Prevedere circuito di cavi scaldanti elettrici (tipo Raychem o equiv.) o tubi annegati nel cls (circuito acqua calda da caldaia), attivati da termostato + sensore umidità, posti nel massetto sotto la superficie.

---

### Dati mancanti per verifica planimetrica (Fase 5 residua)

Per la verifica dello spazio in pianta (manovra ingresso/uscita) servono:
- Larghezza disponibile della rampa e del piazzale antistante [non fornita]
- Raggio di sterzata minimo della vettura [non fornito]
- Larghezza vettura [non fornita]

Larghezza rampa assunta 300 cm (Det.A): sufficiente per vettura fino a ~200 cm di larghezza con 50 cm di margine per lato. Se la larghezza è inferiore a 300 cm andrà rivista la sezione trasversale.

---

## Note tecniche

- Tutti i valori lineari in **centimetri**
- Angoli in **gradi sessagesimali**
- Raggio ruota vettura assunto = 30 cm (da verificare)
- I raccordi sono approssimati come archi di cerchio; un profilo parabolico/cosinoide darebbe risultati analoghi
- La pendenza di 28-30% è estrema: verificare con produttore vettura o scuderia
- Con theta=16°, il rapporto sbalzo/luce (140/8=17.5) è il parametro critico → vetture con sbalzo ridotto o luce maggiore avrebbero prestazioni migliori
