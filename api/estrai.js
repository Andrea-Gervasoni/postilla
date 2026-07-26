export default async function handler(req, res) {
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

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'Chiave API non configurata su Vercel' });
  }

  try {
    const { immagine } = req.body;
    if (!immagine) {
      return res.status(400).json({ error: 'Nessuna immagine fornita' });
    }

    let mediaType = 'image/jpeg';
    let base64Data = immagine;

    if (immagine.includes('data:') && immagine.includes('base64,')) {
      const match = immagine.match(/^data:(.+);base64,(.+)$/);
      if (match) {
        mediaType = match[1];
        base64Data = match[2];
      }
    }

    const prompt = `Analizza l'immagine di questo documento burocratico, fiscale o legale italiano.
Compila ESATTAMENTE e SOLO il seguente formato JSON (senza commenti o testo fuori dal JSON):
{
  "testoTrascritto": "Trascrizione INTEGRALE e fedele di tutto il testo leggibile del documento, mantenendo le frasi complete e la loro forma originale, con a capo tra i paragrafi",
  "estratto": {
    "mittente": "Nome dell'ente o azienda che invia",
    "citazione_mittente": "La frase esatta nel testo che indica il mittente",
    "oggetto": "Di cosa si tratta in 3 o 4 parole",
    "citazione_oggetto": "La frase esatta nel testo che indica l'oggetto",
    "sintesi_operativa": "Una frase chiara su cosa deve fare l'utente",
    "importo_totale": "L'importo da pagare o Nessuna richiesta economica",
    "data_scadenza": "Entro quando o Nessuna scadenza",
    "data_scadenza_iso": "YYYY-MM-DD",
    "obblighi": [
      { "spiegazione": "Cosa fare", "citazione_esatta": "Frase testuale dal documento" }
    ],
    "conseguenze": [
      { "spiegazione": "Cosa succede se ignori", "citazione_esatta": "Frase testuale dal documento" }
    ],
    "diritti": [
      { "spiegazione": "Cosa può fare l'utente", "citazione_esatta": "Frase testuale dal documento" }
    ],
    "informazioni_mancanti": [
      "Cosa il documento non dice"
    ],
    "spiegazione_semplice": [
      "Il mittente richiede un'azione.",
      "Verifica la scadenza indicata."
    ],
    "glossario": [
      { "termine": "Notifica", "spiegazione": "Consegna formale dell'atto." }
    ]
  }
}
REGOLE FONDAMENTALI:
1. "testoTrascritto" deve contenere TUTTO il testo del documento, trascritto parola per parola. Non riassumere, non abbreviare, non usare puntini di sospensione.
2. Ogni "citazione_esatta", "citazione_mittente" e "citazione_oggetto" deve essere una sottostringa COPIATA ALLA LETTERA da "testoTrascritto", identica carattere per carattere. Prima di rispondere verifica che ogni citazione compaia davvero dentro "testoTrascritto".
3. Le citazioni devono essere brevi (da 3 a 15 parole) e prese da un unico punto contiguo del testo, mai ricomposte da frasi diverse.
4. Se un'informazione non e' presente nel documento, non inventarla: omettila dalla lista e segnalala in "informazioni_mancanti".
Ritorna SOLO il JSON valido.`;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5',
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
    const jsonPulito = testoRisposta.replace(/^```json\s*/i, '').replace(/\s*```$/i, '').trim();
    const risultato = JSON.parse(jsonPulito);

    return res.status(200).json(risultato);
  } catch (error) {
    console.error("Errore interno serverless:", error);
    return res.status(500).json({ error: 'Errore durante l\'estrazione dei dati' });
  }
}
