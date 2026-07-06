// Vercel Serverless Function — veilige tussenlaag naar de Anthropic API.
//
// Waarom dit bestand bestaat:
//   De browser mag de API-sleutel nooit zien (die zou publiek staan en
//   misbruikt kunnen worden). Deze functie draait op de server van Vercel,
//   bewaart de sleutel veilig in een Environment Variable, en stuurt de
//   aanvraag namens de site door naar Anthropic. De sleutel verlaat de
//   server dus nooit.
//
// De site (index.html) stuurt exact dezelfde JSON-body die anders naar
// api.anthropic.com zou gaan. Deze functie voegt enkel de sleutel + de
// verplichte headers toe en geeft het antwoord ongewijzigd terug.

export default async function handler(req, res) {
  // Alleen POST toestaan.
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'ANTHROPIC_API_KEY ontbreekt op de server.' });
  }

  try {
    // De body van de aanvraag doorsturen zoals hij is. Vercel parse't JSON
    // meestal automatisch; val terug op de ruwe body als dat niet zo is.
    const payload = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);

    const anthropicRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: payload,
    });

    const data = await anthropicRes.json();

    // Statuscode van Anthropic overnemen zodat de site fouten juist ziet.
    return res.status(anthropicRes.status).json(data);
  } catch (err) {
    return res.status(502).json({ error: 'Kon Anthropic niet bereiken.', detail: String(err) });
  }
}
