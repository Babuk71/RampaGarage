# Relazione — Profilo ottimizzato estremo e sensibilità alla luce da terra

**Progetto:** Rampa garage interrato per autovettura a luce ridotta
**Data:** 30/05/2026
**Tavola di riferimento:** `Tavola_Profilo_Ottimo.dxf` / `.svg` (tre scene, h = 8 / 9 / 10 cm)
**Script di calcolo:** `nuova_config.js` (ricerca profilo), `verifica_h.js` (sensibilità in h),
`genera_tavola_ottimo.js` (tavola)

---

## 1. Scopo della relazione

Verificare se la rampa possa diventare **percorribile** da questa vettura agendo:

1. sulla **forma del raccordo a fondo rampa (SAG)** — tenendo fissi dislivello H = 380 cm e
   lunghezza disponibile L = 1700 cm;
2. sulla **luce da terra** della vettura, ipotizzandola 1–2 cm più alta del valore di progetto
   (h = 8 cm) → casi h = 9 cm e h = 10 cm.

La relazione accompagna la tavola grafica e ne spiega i limiti pratici (pendenza, aderenza,
usura, altezza reale).

---

## 2. Che cos'è il "profilo ottimizzato estremo"

A H e L fissi, è stata cercata — con verifica a **corpo rigido in transito continuo** nei due
orientamenti — la forma di profilo che **massimizza la clearance minima** (la più piccola
distanza tra carrozzeria e superficie lungo tutto il passaggio). Sono state esplorate tre
famiglie: arco singolo, arco composto a due raggi, transizioni graduali tipo clotoide. La
migliore è risultata l'**arco singolo spinto**:

| Parametro | Valore |
|---|---|
| Pendenza di picco | **≈ 47 %** (θ = 25°) |
| Raccordo superiore (CREST) | R = 950 cm |
| Tratto retto | **13 cm** (praticamente assente) |
| Raccordo inferiore (SAG) | R ≈ 3042 cm |

È un profilo **molto più aggressivo** della rampa adottata (R = 1500, θ = 16.9°, picco 30 %):
qui quasi tutta la lunghezza è "spesa" nei due raccordi per rendere il SAG il più dolce
possibile, al prezzo di una pendenza centrale altissima. **Non è una proposta costruttiva**:
serve a stabilire il *limite teorico* di percorribilità.

---

## 3. Risultato del confronto (la tavola)

Vettura modellata come corpo rigido appoggiato sulle due ruote, fatta scorrere lungo tutto il
transito (muso verso il garage, in discesa). La tavola `Tavola_Profilo_Ottimo` ha **tre pannelli**
(h = 8 / 9 / 10 cm); in ciascuno la sagoma è disegnata **ogni 150 cm** lungo l'intero percorso
(più la posa critica di minima clearance) e **colorata in base allo stato peggiore** di quella
posa, valutato su **entrambi i paraurti e sul ventre**:

- 🟢 **VERDE** = sicuro (clearance ≥ 1.0 cm)
- 🟠 **ARANCIO** = a rischio (0 … 1.0 cm)
- 🔴 **ROSSO** = collisione (clearance < 0)

Per ogni altezza i tre minimi (continui) e l'esito governante:

| Luce da terra h | Paraurti **ANT** | Paraurti **POST** | **Ventre** | Esito (governa l'ANT) |
|---:|---:|---:|---:|---|
| **8 cm** (progetto) | **−0.80** | +0.89 | +0.39 | 🔴 collisione: **NON passa** |
| **9 cm** | **+0.24** | +1.89 | +1.40 | 🟠 a rischio (margine ≈ nullo) |
| **10 cm** | **+1.23** | +2.90 | +2.41 | 🟢 sicuro (margine modesto) |

**Il vincolo che governa è sempre il paraurti anteriore** (sbalzo 140 cm) contro il raccordo SAG;
posteriore (sbalzo 120 cm) e ventre restano meno critici in tutte le altezze.

### 3.0 bis — Uscita con vettura girata (muso e coda invertiti)

Tavola gemella `Tavola_Profilo_Ottimo_Uscita`: la vettura **risale girata**, cioè con il **muso
verso la strada** e la **coda + ala verso il garage** (rispetto all'ingresso, muso e coda sono
invertiti). Al raccordo SAG si presenta quindi la **coda** (sbalzo 120, più corto), mentre il
**muso** (sbalzo 140) sale dal lato strada. Sweep continuo su sole pose valide (passo ruota = 240):

| Luce da terra h | **Muso (140, governa)** | Coda (120) al SAG | **Ventre** | Esito |
|---:|---:|---:|---:|---|
| **8 cm** (progetto) | **−0.84** | +0.88 | +0.39 | 🔴 collisione: **NON passa** |
| **9 cm** | **+0.24** | +1.88 | +1.40 | 🟠 a rischio |
| **10 cm** | **+1.24** | +2.88 | +2.41 | 🟢 sicuro |

**Girare la vettura NON aiuta.** Il vincolo resta lo **sbalzo lungo (muso, 140 cm)**, che governa
in *ogni* orientamento: in uscita girata il muso striscia a **−0.84 cm** (h=8), praticamente come
in ingresso (−0.80). La coda (120) al SAG e il ventre restano meno critici. Quindi a **h = 8 cm la
vettura non passa in nessun orientamento**; uscita girata ≈ ingresso. A h=9 entrambe "a rischio",
a h=10 entrambe sicure.

> ⚠️ Vale **solo sul profilo estremo (47 %)**, non sulla rampa **adottata** R = 1500: lì in uscita
> è lo sbalzo posteriore a compenetrare il SAG (≈ −6.4 cm). Girare la vettura **non salva** la rampa
> adottata.
>
> **Nota di metodo (correzione).** Due stesure consecutive di questa sezione riportavano numeri
> **inventati, non verificati** (prima coda governante −0.36 "meno severa"; poi muso +8.34 "ventre
> governa, passa al limite"). Lo sweep corretto, filtrando le sole pose con passo ruota valido,
> mostra che governa il muso (−0.84). I numeri in tabella sono quelli effettivamente calcolati da
> `genera_tavola_uscita_ottimo.js`.

**Punto chiave già a h = 8:** nemmeno il profilo geometricamente migliore possibile (picco 47 %)
porta la clearance sopra lo zero. A H = 380 e L = 1700 fissi, **con luce 8 cm la rampa non è
percorribile in nessun modo**: il vincolo è geometrico fondamentale, non una questione di
"raccordo fatto male".

### 3.1 Dove si concentra il rischio
Sui **tratti piani** (strada in cima, garage in fondo) la clearance è ampia: le sagome sono verdi
a tutte le altezze. Il problema è **tutta la discesa + SAG**, dove la clearance del paraurti
anteriore è **quasi costante** (un *plateau* di pochi centesimi di cm): l'auto striscia/non striscia
**per l'intero tratto**, non in un singolo istante. Nella tavola questo si legge come una sequenza
di sagome del colore di esito (rosse a h=8, arancio a h=9, verdi a h=10) lungo la discesa, mentre
sui tratti piani le sagome restano verdi a ogni altezza.

> **Nota di correzione (rispetto a una bozza precedente):** in una prima versione la silhouette era
> disegnata **a specchio** (muso e coda invertiti), per un disallineamento tra l'orientamento del
> file sagoma e quello del modello cinematico. Di conseguenza l'etichetta "paraurti anteriore"
> cadeva sul retrotreno e sembrava che il muso reale penetrasse la rampa. **Corretto:** ora il muso
> è verso il garage (lato discesa) e i due paraurti sono verificati entrambi e separatamente; i
> valori numerici governanti (paraurti anteriore) erano comunque già corretti.

---

## 4. Perché bastano 1–2 cm: la clearance è lineare in h

I numeri scalano in modo quasi esatto: **+1 cm di luce → +1 cm di clearance** (pendenza ≈ 1).

```
h = 8  →  −0.80 cm
h = 9  →  +0.24 cm   (Δ ≈ +1.04)
h = 10 →  +1.23 cm   (Δ ≈ +0.99)
```

Spiegazione fisica: alzare la luce da terra **trasla verticalmente** tutto il corpo vettura
(paraurti e sottoscocca) di Δh, mentre la superficie della rampa resta ferma. La distanza
verticale tra i due aumenta quindi di ≈ Δh, indipendentemente dal punto. È il motivo per cui
il problema, geometricamente, si gioca **sul filo del centimetro**.

---

## 5. Avvertenza: questo NON salva la rampa adottata

I valori sopra valgono **solo** per il profilo estremo al 47 %. Sulla **rampa effettivamente
adottata** (R = 1500, picco 30 %) la stessa linearità dà:

| Luce da terra h | Clearance paraurti anteriore (rampa R=1500) |
|---:|---:|
| 8 cm | **−9.8 cm** |
| 9 cm | ≈ −8.8 cm |
| 10 cm | ≈ −7.8 cm |

Cioè: **alzare la vettura di 1–2 cm non rende percorribile la rampa adottata** — resta
del tutto inutilizzabile. Per avvicinarsi allo zero servirebbe *contemporaneamente* il profilo
estremo *e* una luce ≥ 9–10 cm. Da qui la conclusione progettuale: senza toccare i vincoli
fissi (più L, meno H, o un ausilio fisico), la rampa non è compatibile con questa vettura.

---

## 6. Problemi pratici del profilo estremo (perché "geometricamente possibile" ≠ "utilizzabile")

Anche ammesso h = 10 cm, il profilo che fa passare la vettura ha una **pendenza di picco del
47 %** (≈ 25°). Questo introduce problemi reali, non geometrici:

### 6.1 Aderenza e frenata
- Il coefficiente d'attrito minimo per non slittare in salita/frenata è μ ≈ tan(θ) = **0.47**.
  Con un ragionevole fattore di sicurezza ×2 si richiede **μ ≈ 0.9**, valore difficile da
  garantire **sul bagnato** anche con cls spazzolato (μ bagnato tipico 0.5–0.65).
- In discesa, frenare su 47 % bagnato porta facilmente al **bloccaggio/slittamento**; in salita,
  alla **perdita di trazione**. Una vettura sportiva a trazione posteriore con gomme da pista
  (mescola fredda all'imbocco) è particolarmente esposta.
- **Ghiaccio/neve:** rampa inutilizzabile. Indispensabile riscaldamento del massetto.

### 6.2 Usura e sollecitazione di gomme e trasmissione
- Avviare in salita al 47 % richiede coppia elevata a bassa velocità: **slittamento della
  frizione** (o stress su convertitore/innesti) e **usura accelerata del battistrada**
  sull'asse motore, con possibile *flat-spotting* in caso di pattinamento.
- Ingresso/uscita ripetuti a questa pendenza stressano semiassi, giunti e supporti motore più
  di una rampa convenzionale.

### 6.3 Transito del sottoscocca e dei paraurti
- Il margine, anche nel caso verde (h = 10), è **+1.23 cm**: insufficiente come margine di
  progetto reale (vedi §7). Splitter anteriori, lame aerodinamiche, terminali di scarico bassi
  e fondo piatto possono comunque toccare.
- Il **ventre (breakover)** in questo profilo è verificato, ma con margini ridotti: va
  ricontrollato per ogni variante di assetto.

### 6.4 Comfort, geometria e sicurezza di manovra
- Il raccordo CREST a R = 950 e il passaggio quasi immediato alla pendenza del 47 % danno una
  **variazione di pendenza brusca**: scuotimento, rischio di **beccheggio** marcato, ridotta
  visibilità del fondo rampa dall'abitacolo.
- A 47 % aumenta la sensibilità al **trasferimento di carico longitudinale** (alleggerimento
  dell'avantreno in salita, del retrotreno in discesa) con effetti su sterzo e frenata.

> In sintesi: il profilo estremo è la dimostrazione di un *limite*, non una rampa che si
> consiglierebbe di costruire. Anche superato il vincolo geometrico, i vincoli di **aderenza,
> usura e comfort** rendono una pendenza del 47 % inadatta all'uso quotidiano di una sportiva.

---

## 7. Altezza reale vs altezza dichiarata: perché il "+0.24 cm" non è un margine

Il caso h = 9 cm dà +0.24 cm (2.4 mm). **Non è un margine ingegneristico**, per più ragioni che
fanno oscillare la luce *reale* di parecchi millimetri rispetto al valore nominale:

- **Tolleranze costruttive della rampa:** un massetto gettato in opera ha planarità ±0.5–1 cm su
  pochi metri; basta una controtendenza locale a fondo rampa per azzerare 2.4 mm.
- **Assetto e carico:** passeggeri, pieno di carburante, bagagli **abbassano l'assetto** di
  diversi mm; molte sportive hanno assetto regolabile o si abbassano in modalità sport.
- **Pressione e usura gomme:** una gomma sgonfia o consumata riduce il raggio rotolamento e
  quindi la luce; il modello assume raggio ruota costante.
- **Dinamica:** in ingresso la vettura non è ferma; affondi di sospensione su una variazione di
  pendenza brusca (§6.4) riducono istantaneamente la luce.
- **Componenti più bassi del paraurti:** splitter, minigonne, fondo piatto possono stare **sotto**
  la quota di paraurti usata nel calcolo.

Per questo un margine reale di progetto dovrebbe essere dell'ordine di **alcuni centimetri**, non
di millimetri. In questa ottica **anche h = 10 cm (+1.23 cm) è da considerare risicato**.

---

## 8. Conclusioni

1. **A H = 380 e L = 1700 fissi, con luce 8 cm la rampa non è percorribile**, nemmeno con il
   miglior profilo geometricamente possibile (−0.80 cm). Il limite è fondamentale.
2. **La clearance è lineare nella luce** (≈ +1 cm ogni +1 cm di h). Bastano quindi 1 cm per
   attraversare lo zero **nel profilo estremo**, ma:
   - h = 9 cm (+0.24 cm) è **al limite, non un margine** (§7);
   - h = 10 cm (+1.23 cm) dà un margine **modesto e ancora risicato**.
3. **Tutto ciò vale solo per il profilo estremo al 47 %**, che però **non è raccomandabile** per
   aderenza, usura e comfort (§6). Sulla **rampa adottata (R = 1500)** alzare la luce di 1–2 cm
   **non cambia nulla** (resta a ≈ −8/−9 cm).
4. Le uniche leve realmente risolutive restano: **più lunghezza orizzontale**, **meno
   dislivello**, oppure un **ausilio fisico** a fondo rampa (inserto/rampa removibile), oppure
   una **vettura con sbalzo minore / luce maggiore**.

---

## 9. File correlati

| File | Contenuto |
|---|---|
| `Tavola_Profilo_Ottimo.dxf` / `.svg` | INGRESSO (muso→garage), 3 pannelli (h=8/9/10): sagoma ogni 150 cm (+ posa critica), colorata per stato, su entrambi i paraurti + ventre |
| `Tavola_Profilo_Ottimo_Uscita.dxf` / `.svg` | USCITA vettura girata (muso→strada, coda→garage), stessi 3 pannelli e codifica colore; governa lo sbalzo lungo (muso) |
| `genera_tavola_ottimo.js` | Generatore della tavola d'ingresso |
| `genera_tavola_uscita_ottimo.js` | Generatore della tavola d'uscita (valida il passo ruota per scartare pose degeneri) |
| `nuova_config.js` | Ricerca del profilo che massimizza la clearance (arco singolo) |
| `compound_config.js`, `smooth_config.js` | Altre famiglie di profilo testate (peggiori) |
| `verifica_h.js` | Sensibilità della clearance alla luce da terra (h = 8/9/10) |
| `verifica_uscita.js`, `rampa_geom.js` | Verifica corpo rigido sulla rampa adottata R = 1500 |
| `CLAUDE.md` | Quadro completo del dimensionamento e delle correzioni |
