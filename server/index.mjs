import express from 'express';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const app = express();
const port = Number(process.env.PORT || 8787);
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dist = path.join(root, 'dist');

app.use(express.json({ limit: '12kb' }));

const systemInstruction = [
  'You are Kiri, the concise privacy guide inside KageVote, a Midnight voting dApp demo.',
  'Explain selective disclosure, local witnesses, public proposal metadata, and aggregate tallies in clear language.',
  'Never ask for, process, or repeat wallet seeds, private keys, credentials, personal identity data, or the user’s ballot choice.',
  'This is a local simulator until a real Midnight Preprod contract and wallet are configured; do not imply a live vote happened.',
  'Keep replies below 110 words and do not give financial, legal, or political advice.',
].join(' ');

app.post('/api/kiri', async (request, response) => {
  const message = typeof request.body?.message === 'string' ? request.body.message.trim().slice(0, 500) : '';
  if (!message) return response.status(400).json({ error: 'A question is required.' });

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return response.status(503).json({ error: 'Gemini is not configured. Kiri will use local guide responses.' });

  try {
    const model = process.env.GEMINI_MODEL || 'gemini-3.5-flash';
    const geminiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: systemInstruction }] },
        contents: [{ role: 'user', parts: [{ text: message }] }],
        generationConfig: { maxOutputTokens: 220, temperature: 0.35 },
      }),
    });

    if (!geminiResponse.ok) {
      const detail = await geminiResponse.text();
      console.error('Gemini request failed:', geminiResponse.status, detail.slice(0, 300));
      return response.status(502).json({ error: 'Kiri is temporarily unavailable.' });
    }

    const result = await geminiResponse.json();
    const text = result?.candidates?.[0]?.content?.parts
      ?.map((part) => part.text)
      .filter(Boolean)
      .join('')
      ?.trim();

    if (!text) return response.status(502).json({ error: 'Kiri did not receive a usable response.' });
    return response.json({ text });
  } catch (error) {
    console.error('Kiri proxy error:', error instanceof Error ? error.message : error);
    return response.status(502).json({ error: 'Kiri is temporarily unavailable.' });
  }
});

if (existsSync(dist)) {
  app.use(express.static(dist));
  app.use((request, response) => {
    if (request.path.startsWith('/api/')) return response.status(404).json({ error: 'Not found.' });
    return response.sendFile(path.join(dist, 'index.html'));
  });
}

app.listen(port, () => {
  console.log(`KageVote API listening at http://localhost:${port}`);
});
