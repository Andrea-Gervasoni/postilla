# Postilla

**Capisci cosa ti hanno mandato.**

Fotografi una lettera dell'Agenzia delle Entrate, una multa, un avviso del condominio o una bolletta. Postilla ti dice **cosa devi fare, entro quando, e cosa succede se non lo fai** — in parole normali, e per ogni cosa che afferma ti mostra la frase esatta del documento da cui l'ha ricavata.

🔗 [postilla-kappa.vercel.app](https://postilla-kappa.vercel.app)

---

## Il problema

Le lettere che contano sono scritte per proteggere chi le manda, non per essere capite da chi le riceve. La scadenza sta a metà del secondo capoverso, la conseguenza dentro una parentesi, il diritto di ricorso in un rimando normativo.

Il risultato lo conosciamo tutti: **chi riceve la lettera la porta a qualcun altro.** Ai figli, a un amico che "se ne intende", al CAF. Non è una questione di istruzione — è che il testo è costruito per essere inattaccabile in tribunale, non per essere letto.

Postilla non riscrive la legge. Traduce quella singola lettera, per quella singola persona, in quel momento.

---

## Come funziona

1. **Fotografi il documento** — una foto anche storta o poco illuminata, oppure un PDF.
2. **Postilla lo legge** — estrae mittente, oggetto, importo, scadenza, obblighi, conseguenze e diritti.
3. **Ti mostra le prove** — ogni voce è accompagnata dalla frase testuale del documento da cui viene.

### La verifica è obbligatoria

Questo è il punto che distingue Postilla da un riassunto automatico qualsiasi.

Prima di poter archiviare un documento **devi passare dalla schermata di verifica**. Lì il testo trascritto ti viene mostrato accanto a ciò che Postilla ha letto, e ogni voce viene cercata nel testo:

- se la frase citata **si trova** nel documento, la voce si conferma da sola e l'evidenziazione si accende nel testo;
- se **non si trova**, la voce resta in sospeso in ambra, e sei tu a doverla rileggere e confermare con un pulsante.

Solo quando ogni voce è confermata — dal confronto o dalla tua mano — scatta il sigillo e il documento diventa archiviabile.

**La responsabilità della lettura resta a una persona.** Il modello propone, l'utente firma. Se qualcosa non risulta nel testo, Postilla lo dice invece di nasconderlo.

---

## Dove finiscono i tuoi dati

Meglio essere precisi, perché è la domanda più importante:

| Dato | Dove sta |
|---|---|
| Profilo, raccoglitori, documenti archiviati | **Solo nel browser** del tuo dispositivo (`localStorage`). Non esiste un database, non esiste un account. |
| La foto del documento | Inviata **una volta** al servizio di lettura (API Anthropic) tramite una funzione serverless, il tempo necessario ad analizzarla. |
| Il documento dopo l'analisi | **Non viene conservato**: né dal server di Postilla, che non ha archivio, né in una sessione riutilizzabile. |

Non ci sono account, non c'è tracciamento pubblicitario, non gestiamo pagamenti e non diamo consigli legali.

---

## Come è fatto

Volutamente minimale: tre file, nessun processo di build, nessun framework da installare.

```
index.html      interfaccia completa (markup, stili, logica del componente)
support.js      piccolo runtime di template lato client (compila i {{ }} su React)
api/estrai.js   funzione serverless: riceve l'immagine, interroga il modello, ritorna JSON
vercel.json     instradamento: /api/* alla funzione, tutto il resto statico
```

- **Modello**: `claude-haiku-4-5` (veloce ed economico, con supporto immagini).
- **Deploy**: Vercel. Il ramo `main` va in produzione a ogni push.
- **Requisiti**: la variabile d'ambiente `ANTHROPIC_API_KEY` impostata nel progetto Vercel. Senza, l'endpoint risponde 500 e l'app lo dice all'utente.

Il prompt impone due regole non negoziabili: la trascrizione deve essere **integrale** (niente riassunti) e ogni citazione deve essere una **sottostringa letterale** del testo trascritto. Il confronto lato client normalizza accenti, apostrofi tipografici, punteggiatura e spaziatura, con un margine di tolleranza per le riformulazioni minime — così una virgola di differenza non fa fallire una citazione corretta, ma una citazione inventata non passa.

### Accessibilità

Il pubblico di Postilla comprende molte persone anziane, quindi non è un dettaglio:

- comando **dimensione testo** su tre livelli (100% / 115% / 135%), ricordato tra le sessioni;
- pulsante di scansione grande e riconoscibile, con etichetta sempre visibile;
- etichette per lettori di schermo su tutti i comandi, contrasti alti, rispetto di `prefers-reduced-motion`;
- interfaccia bilingue italiano/inglese.

---

## Sviluppo in locale

```bash
# serve i file statici
python3 -m http.server 8000
```

L'endpoint `/api/estrai` richiede l'ambiente Vercel:

```bash
npm i -g vercel
vercel dev            # con ANTHROPIC_API_KEY nel .env locale
```

Senza chiave, il percorso **"Prova con un esempio"** funziona comunque: mostra una cartella esattoriale dimostrativa completa, utile per vedere l'intero flusso senza consumare crediti.

---

## Come può crescere

> ⚠️ **Quanto segue è una prospettiva, non un accordo in essere.** Nessuna interlocuzione istituzionale è stata avviata. È il modello che riteniamo sostenibile, descritto per trasparenza sul futuro del progetto.

Postilla oggi si ferma un passo prima del momento che conta davvero: **il pagamento**.

La stessa persona che non capiva la lettera, dopo averla capita, deve entrare in un portale, individuare l'avviso giusto, riconoscere un codice di 18 cifre e completare un pagamento. La difficoltà non è sparita: si è spostata.

### Il passo naturale: dal capire al pagare

L'estensione più diretta è chiudere il cerchio: dal documento fotografato all'avviso pagato, restando dentro la stessa interfaccia che la persona ha appena dimostrato di saper usare. **pagoPA** espone già l'infrastruttura per farlo — l'avviso di pagamento è un dato strutturato che Postilla, avendo letto il documento, ha di fatto già in mano.

Il modello economico ipotizzato è quello classico dei **Prestatori di Servizi di Pagamento**: una commissione per transazione, a carico del canale e non aggiuntiva per il cittadino, in linea con quanto già avviene per gli altri canali aderenti. Un progetto sostenibile senza pubblicità, senza rivendere dati e senza abbonamenti a chi riceve una cartella esattoriale — categoria che, per definizione, ha già un problema di soldi.

### Le altre direzioni

- **Scadenzario attivo** — Postilla conosce già le scadenze che ha letto. Il passo è avvisare prima, non dopo.
- **Portale famiglia** — trasformare il "chiedo a mio figlio" da telefonata a funzione: una delega esplicita e revocabile, invece di girare le password.
- **Sportello per CAF e patronati** — gli stessi operatori che oggi rileggono le lettere ad alta voce, con lo strumento in mano.
- **Enti locali** — un Comune che allega alla propria comunicazione una versione già in chiaro riduce le proprie code allo sportello.

Il nucleo tecnico — leggere un documento e provare ogni affermazione citando il testo — è lo stesso in tutti questi casi. Cambia soltanto cosa ci si costruisce sopra.

---

## Limiti dichiarati

- Postilla **riporta e traduce** ciò che il documento dice. **Non è un parere legale** e non sostituisce un professionista.
- La lettura è automatica e può sbagliare: per questo la verifica esiste, è obbligatoria e mostra le prove invece di chiedere fiducia.
- Le foto molto sfocate, tagliate o con testo manoscritto danno risultati peggiori. In quel caso l'app lo dice e chiede di riprovare, invece di inventare un'analisi.

---

## Licenza

Progetto realizzato per un bando pubblico. Licenza da definire.
