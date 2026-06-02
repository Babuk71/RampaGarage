# Rampa Garage — Progetto Dimensionamento

## Obiettivo
Dimensionare una rampa di accesso al garage per un'autovettura estrema con minima altezza da terra.

> ⚠️ **CORREZIONE FATTIBILITÀ (30/05/2026).** La clearance "+1.5 cm sicura" del paraurti
> anteriore con R=1500 era un **check a posa singola** (asse anteriore esattamente sulla
> tangente del SAG) e **NON è conservativa**. Una verifica a **corpo rigido con sweep
> continuo** mostra che il paraurti anteriore **compenetra il raccordo SAG fino a ~9.8 cm**
> (primo contatto ~17 cm oltre la tangente, con il posteriore ancora in pendenza e il muso
> picchiato). Vale in **ingresso e uscita**, in ogni orientamento. **La rampa come adottata
> (R=1500) NON è percorribile** da questa vettura senza strisciare: il raccordo SAG va
> ridimensionato. Dettagli in «Verifica transito continuo» e in `verifica_uscita.js` /
> `Tavola_Uscita.dxf`. Il ventre (breakover) resta invece OK (+3.2 cm).

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
- Clearance paraurti anteriore (check a **posa singola**, asse ant. sulla tangente SAG): **+15 mm** — ⚠️ **NON CONSERVATIVO / SUPERATO**: il minimo del transito continuo è **−9.8 cm** (interferenza). Vedi «Verifica transito continuo».
- Punti notevoli: CREST start (0,380); CREST end (435,316); SAG start (1265,64); SAG end (1700,0)
- Centri archi: CREST (0,-1120); SAG (1700,1500); entrambi R=1500 cm
- Raggio ruota aggiornato: **R_ruota = 35 cm** (275/35 ZR20: cerchio 20"=254mm + fianco 96.25mm = 350.25mm)

---

## Verifica transito continuo (corpo rigido) — CORREZIONE

Modello: vettura come **corpo rigido appoggiato sulle due ruote**, fatta scorrere con
continuità lungo tutto il transito; per ogni posa si misura la clearance di paraurti
anteriore, posteriore e ventre contro la superficie reale (archi + tratto retto).
Script: `rampa_geom.js` (geometria), `verifica_uscita.js` (report), `genera_tavola_uscita.js`
(tavola). Silhouette Porsche 992 GT3 RS riusata da `Schematizzazione_Vettura.dxf`.

### Perché il +1.5 cm del dimensionamento è sbagliato
Quel valore valuta **una sola posa** (asse anteriore esattamente sulla tangente del SAG):
lì la clearance è davvero +1.5 cm. Ma **non è il minimo**. Avanzando di ~17 cm, il muso
resta picchiato (−16.9°) perché **l'asse posteriore è ancora sul tratto in pendenza**, e lo
sbalzo anteriore (140 cm) spinge il paraurti contro il SAG che intanto risale → contatto.
È l'effetto noto "il retrotreno non è ancora sceso".

### Risultati (geometria ADOTTATA invariata: R=1500, θ=16.87°)
| Elemento | Clearance min (transito) | Dove | Esito |
|---|---|---|---|
| Paraurti **anteriore** | **−9.8 cm** | asse ant. ~17 cm oltre tangente SAG (x≈1282) | ❌ compenetra il SAG |
| Paraurti **posteriore** | **−6.7 cm** | sbalzo post. sul SAG | ❌ compenetra il SAG |
| **Ventre** (breakover) | **+3.2 cm** | al CREST (240²/8R) | ✅ OK |

Check a posa singola (asse ant. su tangente x=1265): +1.65 cm — coincide col +1.5 del
progetto, **ma non è il minimo**.

### Vale per ingresso E uscita, in ogni orientamento
Entrando a muso avanti la vettura esce in retromarcia: le pose sono le stesse → stesso
contatto del paraurti anteriore (−9.8 cm). Girando la vettura ed uscendo di muso, è lo
sbalzo posteriore a toccare (−6.4 cm). **In nessun caso la vettura entrata può uscire (né
entrare) senza strisciare.** Tavola: `Tavola_Uscita.dxf/.svg` (due orientamenti).

### Implicazione progettuale
Il vincolo è **solo lo sbalzo** (ventre OK). Per liberarlo serve intervenire sul **raccordo
SAG**: raggio molto maggiore, oppure curva a raggio variabile (clotoide), oppure tratto piano
allungato a fondo rampa — mantenendo H=380 e L=1700.

---

## Ridimensionamento SAG — ricerca esaustiva (30/05/2026)

> ⛔ **CONCLUSIONE: a H=380 e L=1700 fissi NON esiste alcun profilo percorribile per questa
> vettura.** Il vincolo è **geometrico fondamentale**, non risolvibile cambiando la sola forma
> del raccordo SAG.

Cercata, a corpo rigido e sweep continuo nei due orientamenti, la miglior forma di profilo che
massimizzi la clearance governante, tenendo **fissi** vettura (h=8, passo 240, sbalzi 140/120,
R_ruota 35), dislivello **H=380** e lunghezza **L=1700**. Tre famiglie di profilo testate:

| Script | Forma profilo | Miglior config trovata | Clearance governante |
|---|---|---|---|
| `nuova_config.js` | 3 segmenti (CREST + retto + SAG ad arco singolo) | θ=25°, R_crest=950, R_sag≈3042, retto 13 cm | **−0.84 cm** |
| `compound_config.js` | SAG a 2 archi (dolce in ingresso + stretto sul fondo) | θ=25°, φ1=4°, Rs1≈3276, Rs2≈3036 | **−0.83 cm** |
| `smooth_config.js` | transizioni graduali smoothstep (≈clotoide) | Lc=330, retto 40, Ls=1330, picco ~44% | **−4.36 cm** |

Anche il caso ottimo (arco singolo/composto, θ spinto a 25° ≈ 47%) resta **negativo di ~8 mm**:
il paraurti anteriore continua a compenetrare il SAG. Il profilo a curvatura graduale peggiora
(ventre e sbalzo insieme). **Nessuna forma di raccordo rende la rampa percorribile** entro i
1700 cm con 380 cm di dislivello.

### Sensibilità alla luce da terra (h = 8 / 9 / 10 cm)
Sul **profilo ottimizzato estremo** (l'unico che si avvicina allo zero), verificati **entrambi i
paraurti e il ventre** in sweep continuo. La clearance è **lineare in h** (~+1 cm per +1 cm di
luce); **governa sempre il paraurti anteriore** (sbalzo 140 cm) contro il SAG:

| h | paraurti **ANT** (governa) | paraurti **POST** | **ventre** | esito | clearance ant. su rampa ADOTTATA R=1500 |
|---:|---:|---:|---:|---|---:|
| 8 cm | **−0.80 cm** | +0.89 | +0.39 | 🔴 collisione | −9.8 cm |
| 9 cm | **+0.24 cm** | +1.89 | +1.40 | 🟠 a rischio (≈ nullo) | ≈ −8.8 cm |
| 10 cm | **+1.23 cm** | +2.90 | +2.41 | 🟢 sicuro (risicato) | ≈ −7.8 cm |

Quindi: 1 cm di luce in più attraversa lo zero **solo** col profilo estremo (pendenza di picco
47%, **sconsigliato** per aderenza/usura/comfort); sulla **rampa adottata non cambia nulla**.
Il +0.24 a h=9 non è un margine ingegneristico (tolleranze massetto, assetto/carico, pressione
e usura gomme oscillano di più). Modello a **contatto puntiforme**: splitter/lame/terminali bassi
reali possono stare sotto la linea di paraurti usata → i margini positivi (h=9/10) sono ottimistici.

Tavola `Tavola_Profilo_Ottimo.dxf/.svg`: 3 pannelli (h=8/9/10), sagoma disegnata ogni 150 cm (+ posa
critica) e colorata per stato (verde≥1 cm / arancio 0–1 / rosso <0). Relazione completa in
`Relazione_Profilo_Ottimo.md`, sensibilità in `verifica_h.js`.

> ⚠️ **Correzione disegno (31/05/2026).** In una prima versione della tavola la silhouette era
> resa **a specchio** (muso↔coda invertiti: il file sagoma ha il muso a body-x<0, il modello a
> body-x>0), così l'etichetta "paraurti anteriore" cadeva sul retrotreno e il muso reale sembrava
> penetrare la rampa. Corretto con `bx_model = wb − sx` (muso verso il garage). I **valori
> numerici governanti erano già corretti**: cambiava solo il disegno.

### Uscita con vettura girata (muso→strada) — girare NON aiuta
Tavola gemella `Tavola_Profilo_Ottimo_Uscita.dxf/.svg`. Girando la vettura, al SAG si presenta la
**coda (120)** e il **muso (140) sale dal lato strada**. Ma il vincolo resta lo **sbalzo lungo
(muso, 140)**, che governa in ogni orientamento:

| h | muso (140, governa) | coda (120) @SAG | ventre | esito uscita girata | confronto ingresso |
|---:|---:|---:|---:|---|---:|
| 8 cm | **−0.84** | +0.88 | +0.39 | 🔴 collisione | ingresso −0.80 🔴 |
| 9 cm | **+0.24** | +1.88 | +1.40 | 🟠 a rischio | ingresso +0.24 🟠 |
| 10 cm | **+1.24** | +2.88 | +2.41 | 🟢 sicuro | ingresso +1.23 🟢 |

A h=8 **non si passa in nessun orientamento** (muso −0.84 in uscita girata, ~uguale all'ingresso
−0.80). ⚠️ Vale **solo sul profilo estremo**: sulla **rampa adottata R=1500** in uscita è lo sbalzo
posteriore a compenetrare il SAG (≈ −6.4 cm) → girare **non salva** la rampa adottata.
Generatore `genera_tavola_uscita_ottimo.js` (valida il passo ruota per scartare pose degeneri).

> ⚠️ **Correzione (31/05/2026).** Due bozze di questa sezione davano numeri **inventati, non
> verificati** (prima coda governante −0.36; poi muso +8.34 / "ventre governa, passa al limite").
> Lo sweep corretto mostra che il muso (sbalzo 140) governa in ogni orientamento a −0.84: girare
> NON aiuta. Vedi [[no-unverified-conclusions]] e [[exit-turned-car-still-strikes]].

### Cosa serve davvero (le leve che restano)
Liberare lo sbalzo richiede di toccare i vincoli **fissati**, non la forma del SAG:
1. **Più lunghezza orizzontale** disponibile (oltre i 1700 cm) → riduce la pendenza di picco;
2. **Meno dislivello** da recuperare (H < 380, es. garage meno profondo / soglia rialzata);
3. **Ausilio fisico**: inserto/rampa portatile a fondo rampa che riempia il SAG quando transita
   questa vettura, oppure piano mobile;
4. **Vettura diversa**: il rapporto sbalzo/luce (140/8 = 17.5) è il vero killer.

Senza una di queste leve, la rampa non è geometricamente compatibile con la vettura.

---

## File prodotti

> **Organizzazione cartella (31/05/2026).** La cartella principale contiene **solo i file
> attuali e corretti** (silhouette vettura + tavole che verificano le 3 luci in entrata e
> uscita, con i relativi generatori). Tutto il materiale **superato** è stato spostato in
> `OLD/` (profilo originale R=1500 con la clearance +1.5cm non conservativa, verifica della
> rampa adottata, sezione costruttiva, script di ricerca del SAG). I file in `OLD/` restano
> consultabili come storico ma **non** sono più mantenuti.

### Cartella principale — file attuali

| File | Descrizione |
|---|---|
| _silhouette.json | Silhouette Porsche 992 GT3 RS (segmenti body-frame), riusata da tutte le tavole |
| Schematizzazione_Vettura.dxf / .svg | Vista laterale a 3 luci (h=8/9/10): angoli di entrata α=arctan(h/140) e uscita β=arctan(h/120). α: 3.27/3.68/4.09°; β: 3.81/4.29/4.76° |
| genera_schematizzazione_vettura.js | Generatore di Schematizzazione_Vettura.dxf (3 altezze + angoli) |
| Tavola_Profilo_Ottimo.dxf / .svg | INGRESSO (muso→garage): profilo estremo + vettura a h=8/9/10, sweep colorato; governa il paraurti ANT |
| genera_tavola_ottimo.js | Generatore di Tavola_Profilo_Ottimo.dxf (ingresso) |
| Tavola_Profilo_Ottimo_Uscita.dxf / .svg | USCITA girata (muso→strada): stesso confronto a 3 luci; governa lo sbalzo lungo (muso) |
| genera_tavola_uscita_ottimo.js | Generatore di Tavola_Profilo_Ottimo_Uscita.dxf (uscita, vettura girata) |
| Tavola_Profilo_Rampa.dxf / .svg | PRELIMINARE per fase realizzativa: solo profilo ottimizzato (CREST R=950 + SAG R=3042, retto ~13 cm, picco 47%) quotato, SENZA vettura, con le criticità di cantiere (transito −0.80 governante, soglia, drenaggio, aderenza, antighiaccio) |
| genera_tavola_profilo.js | Generatore di Tavola_Profilo_Rampa.dxf |
| Tavola_Profilo_Quote.dxf / .svg | COSTRUTTIVA: stesso profilo, senza vettura, con picchettazione quote ogni 50 cm di progressiva orizzontale (q. 380 innesto strada → q. 0 fondo garage), griglia, quote MAX/MIN, H e L |
| genera_tavola_quote.js | Generatore di Tavola_Profilo_Quote.dxf (TEXT con rotazione gruppo 50) |
| Animazione_Rampa.html | Animazione interattiva (canvas): transito sul profilo ottimizzato; silhouette colorata per clearance governante. Due modelli (VERIFICATO punto singolo = colore di default / STIMA multi-punto, altezze sottoscocca non verificate), 3 luci, direzione ingresso/uscita girata (mantiene la posizione fisica), box clearance + stato + inclinazione/trazione passo-passo, quote tecniche statiche |
| genera_animazione.js | Generatore di Animazione_Rampa.html (embedda silhouette + punti sottoscocca STIMATI; modello VERIFICATO riproduce i numeri validati −0.80/−0.84 ecc.) |
| _foto.jpg | Foto laterale di riferimento (992 GT3 RS): stima visiva luce/estremità ↔ punti più bassi |
| _template_tavole.dxf | Header/layer DXF condiviso usato dai generatori `_ottimo`, `genera_tavola_profilo.js` e `genera_tavola_quote.js` (estratto da Profilo_Rampa.dxf) |
| dxf_to_svg.js | Convertitore DXF→SVG (+ indice Tavole_Rampa.html); colori per-entità verde/arancio/rosso; gestisce la rotazione TEXT (gruppo 50) |
| Relazione_Profilo_Ottimo.md | Relazione: profilo estremo, sensibilità in h, uscita girata, problemi di pendenza/aderenza/usura/altezza reale |
| CLAUDE.md | Questo documento |

### Cartella OLD/ — materiale superato (non mantenuto)

| File | Perché superato |
|---|---|
| Profilo_Rampa.dxf / .svg | Profilo originale R=1500 con clearance +1.5cm **non conservativa** (errata) |
| Sezione_Costruttiva.dxf / .svg | Dettagli costruttivi della rampa adottata (non realizzabile) |
| Tavola_Uscita.dxf / .svg | Verifica della rampa adottata R=1500 (transito nei 2 orientamenti, −9.8/−6.7 cm) |
| rampa_geom.js, verifica_uscita.js, genera_tavola_uscita.js | Modulo+report+generatore della rampa adottata R=1500 |
| nuova_config.js, compound_config.js, smooth_config.js | Ricerca SAG (arco singolo −0.84 / 2 archi −0.83 / clotoide −4.36): tutti non percorribili |
| verifica_h.js | Sensibilità clearance in h (one-shot; risultati confluiti nelle tavole `_ottimo`) |

> Nota repo: `Tavole_Rampa.html` (indice SVG) è rigenerabile in locale con `node dxf_to_svg.js`.

---

## TODO aggiornata

### Fase 1 — Schematizzazione vettura [COMPLETATA]
- [x] Raccolta dati vettura
- [x] Calcolo angolo di attacco anteriore (alfa = 3.27° a h=8; 3.68° a h=9; 4.09° a h=10)
- [x] Calcolo angolo di partenza posteriore (beta = 3.81° a h=8; 4.29° a h=9; 4.76° a h=10)
- [x] DXF vista laterale a 3 luci con angoli di entrata/uscita (Schematizzazione_Vettura.dxf, generata da genera_schematizzazione_vettura.js)

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
- [!] **CORREZIONE**: la clearance +1.5cm era a posa singola; il transito continuo dà **−9.8 cm** (paraurti ant. compenetra il SAG). Vedi «Verifica transito continuo».
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
- [x] **Verifica uscita (salita) a corpo rigido / sweep continuo** → paraurti ant. −9.8 cm, post. −6.7 cm, ventre +3.2 cm. **Uscita NON possibile senza strisciare** (vedi «Verifica transito continuo», Tavola_Uscita)
- [x] **Ridimensionare il raccordo SAG** (R maggiore / clotoide / tratto piano a fondo rampa) per liberare lo sbalzo, mantenendo H=380 e L=1700 → **ricerca esaustiva: NESSUN profilo percorribile** (miglior caso −0.84 cm). Vincolo geometrico fondamentale: servono più L, meno H, o un ausilio. Vedi «Ridimensionamento SAG — ricerca esaustiva»
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
