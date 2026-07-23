const systemInstruction = [
  'You are Kiri, the concise privacy guide inside KageVote, a Midnight voting dApp demo.',
  'Explain selective disclosure, local witnesses, public proposal metadata, and aggregate tallies in clear language.',
  'Never ask for, process, or repeat wallet seeds, private keys, credentials, personal identity data, or the user ballot choice.',
  'This is a simulator until a real Midnight Preview or Preprod contract is configured; do not imply a live vote happened.',
  'Keep replies below 110 words and do not give financial, legal, or political advice.',
].join(' ');

const maxQuestionLength = 500;
const upstreamTimeoutMs = 15_000;

function sendJson(response, status, payload) {
  response.setHeader('Cache-Control', 'no-store');
  return response.status(status).json(payload);
}

export default async function kiriHandler(request, response) {
  if (request.method !== 'POST') {
    response.setHeader('Allow', 'POST');
    return sendJson(response, 405, { error: 'Method not allowed.' });
  }

  let message = '';
  try {
    message = typeof request.body?.message === 'string' ? request.body.message.trim().slice(0, maxQuestionLength) : '';
  } catch {
    return sendJson(response, 400, { error: 'The request body must be valid JSON.' });
  }

  if (!message) return sendJson(response, 400, { error: 'A question is required.' });

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return sendJson(response, 503, { error: 'Gemini is not configured. Kiri will use local guide responses.' });

  const timeout = new AbortController();
  const timeoutId = setTimeout(() => timeout.abort(), upstreamTimeoutMs);

  try {
    const model = process.env.GEMINI_MODEL || 'gemini-3.5-flash';
    const geminiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
      signal: timeout.signal,
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: systemInstruction }] },
        contents: [{ role: 'user', parts: [{ text: message }] }],
        generationConfig: { maxOutputTokens: 220, temperature: 0.35 },
      }),
    });

    if (!geminiResponse.ok) {
      console.error('Gemini request failed with status', geminiResponse.status);
      return sendJson(response, 502, { error: 'Kiri is temporarily unavailable.' });
    }

    const result = await geminiResponse.json();
    const text = result?.candidates?.[0]?.content?.parts
      ?.map((part) => part.text)
      .filter(Boolean)
      .join('')
      ?.trim();

    if (!text) return sendJson(response, 502, { error: 'Kiri did not receive a usable response.' });
    return sendJson(response, 200, { text });
  } catch (error) {
    const reason = error instanceof Error && error.name === 'AbortError' ? 'timed out' : 'failed';
    console.error(`Kiri proxy ${reason}.`);
    return sendJson(response, 502, { error: 'Kiri is temporarily unavailable.' });
  } finally {
    clearTimeout(timeoutId);
  }
}
