export default async function handler(req, res) {
  // Abilita CORS e sicurezza per il browser
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Metodo non consentito' });
  }

  // Prende la chiave segreta che hai appena salvato su Vercel
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'Chiave API non configurata su Vercel' });
  }

  try {
    const { immagine } = req.body;
    if (!immagine) {
      return res.status(400).json({ error: 'Nessuna immagine fornita' });
    }

    // Separa il formato immagine dai dati base64
    const match = immagine.match(/^data:(.+);base64,(.+)$/);
    const mediaType = match ? match[1] : 'image/jpeg';
    const base64Data = match ? match[2] : immagine;

    // Il prompt chirurgico che costringe Claude a restituire solo le prove reali
    const prompt = `Analizza l'immagine di questo documento burocratico, fiscale o legale italiano.
Compila ESATTAMENTE e SOLO il seguente formato JSON (senza commenti o testo fuori dal JSON):
{
  "testoTrascritto": "Trascrizione fedele delle parole chiave del documento",
  "estratto": {
    "mittente": "Nome dell'ente o azienda che invia (es. Comune, Agenzia delle Entrate, Banca)",
    "citazione_mittente": "La frase esatta nel testo che indica il mittente",
    "oggetto": "Di cosa si tratta in 3 o 4 parole",
    "citazione_oggetto": "La frase esatta nel testo che indica l'oggetto",
    "sintesi_operativa": "Una frase chiara su cosa deve fare l'utente e per cosa",
    "importo_totale": "L'importo da pagare es. 1.284,50 € (se non c'è, scrivi Nessuna richiesta economica)",
    "data_scadenza": "Entro quando es. 2 agosto 2026 (se non c'è, scrivi Nessuna scadenza)",
    "data_scadenza_iso": "YYYY-MM-DD (es. 2026-08-02, calcola la data ISO precisa, se manca usa 2026-12-31)",
    "obblighi": [
      { "spiegazione": "Cosa fare es. Paga 1.284,50 €", "citazione_esatta": "Frase esatta e testuale dal documento che lo prova" },
      { "spiegazione": "Altra opzione es. Chiedi di pagare a rate", "citazione_esatta": "Frase esatta e testuale dal documento che lo prova" }
    ],
    "conseguenze": [
      { "spiegazione": "Cosa succede se non paghi o ignori", "citazione_esatta": "Frase esatta e testuale dal documento che lo prova" },
      { "spiegazione": "Es. Fermo amministrativo o sanzioni", "citazione_esatta": "Frase esatta e testuale dal documento che lo prova" }
    ],
    "diritti": [
      { "spiegazione": "Cosa può fare l'utente es. Ricorso entro 60 giorni", "citazione_esatta": "Frase esatta e testuale dal documento che lo prova" },
      { "spiegazione": "Es. Chiedere la sospensione o chiarimenti", "citazione_esatta": "Frase esatta e testuale dal documento che lo prova" }
    ],
    "informazioni_mancanti": [
      "Cosa il documento non dice es. Non indica un numero di telefono chiaro per assistenza",
      "Es. Non spiega come si calcola la cifra richiesta"
    ],
    "spiegazione_semplice": [
      "Il mittente dice che c'è una richiesta aperta.",
      "Viene chiesto l'importo indicato.",
      "Hai tempo fino alla data di scadenza.",
      "Se ignori la lettera scattano le procedure di recupero.",
      "Puoi contestare se ritieni sia un errore."
    ],
    "glossario": [
      { "termine": "Notifica", "spiegazione": "L'atto formale con cui ti viene consegnato il documento." },
      { "termine": "Mora", "spiegazione": "Una penale in denaro che si aggiunge se paghi in ritardo." }
    ]
  }
}
IMPORTANTE: Nel campo "citazione_esatta" devi riportare le parole TESTUALI PRECISE scritte nel documento in modo che un algoritmo di ricerca (indexOf) le trovi dentro "testoTrascritto". Ritorna SOLO il JSON valido.`;

    // Chiamata diretta ad Anthropic (senza bisogno di installare pacchetti npm!)
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 2500,
        temperature: 0.1,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'image',
                source: {
                  type: 'base64',
                  media_type: mediaType,
                  data: base64Data,
                },
              },
              {
                type: 'text',
                text: prompt,
              },
            ],
          },
        ],
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("Errore Anthropic:", errText);
      return res.status(response.status).json({ error: 'Errore nella chiamata al modello AI' });
    }

    const data = await response.json();
    const testoRisposta = data.content[0].text;

    // Pulisci eventuali tag markdown dal JSON
    const jsonPulito = testoRisposta.replace(/^```json\s*/i, '').replace(/\s*```$/i, '').trim();
    const risultato = JSON.parse(jsonPulito);

    return res.status(200).json(risultato);
  } catch (error) {
    console.error("Errore interno serverless:", error);
    return res.status(500).json({ error: 'Errore durante l\'estrazione dei dati' });
  }
}
