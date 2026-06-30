/**
 * api/gemini.ts — Vercel Serverless Function
 *
 * Proxy seguro para llamadas a la Gemini API.
 * La GEMINI_API_KEY vive solo en el servidor (variables de entorno de Vercel).
 * El cliente nunca tiene acceso a la key directamente.
 *
 * Endpoint: POST /api/gemini
 * Body: { prompt: string, model?: string }
 * Response: { text: string } | { error: string }
 */
import type { VercelRequest, VercelResponse } from '@vercel/node';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const DEFAULT_MODEL = 'gemini-2.0-flash';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Solo aceptar POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  if (!GEMINI_API_KEY) {
    return res.status(500).json({ error: 'Gemini API key not configured on server.' });
  }

  const { prompt, model = DEFAULT_MODEL } = req.body as {
    prompt?: string;
    model?: string;
  };

  if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
    return res.status(400).json({ error: 'prompt es requerido y no puede estar vacío.' });
  }

  try {
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`;

    const geminiRes = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 2048,
        },
      }),
    });

    if (!geminiRes.ok) {
      const errBody = await geminiRes.text();
      console.error('Gemini API error:', errBody);
      return res.status(geminiRes.status).json({ error: 'Error en la API de Gemini.' });
    }

    const data = await geminiRes.json() as {
      candidates?: Array<{ content: { parts: Array<{ text: string }> } }>;
    };

    const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
    return res.status(200).json({ text });

  } catch (err) {
    console.error('Gemini proxy error:', err);
    return res.status(500).json({ error: 'Error interno del servidor.' });
  }
}
