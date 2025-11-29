import type { Handler } from '@netlify/functions';
import { GoogleGenAI } from '@google/genai';

export const handler: Handler = async (event) => {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Missing GEMINI_API_KEY in environment' })
      };
    }

    const ai = new GoogleGenAI({ apiKey });
    const body = event.body ? JSON.parse(event.body) : {};

    const {
      model = 'gemini-2.5-flash',
      contents,
      config
    } = body;

    const response = await ai.models.generateContent({
      model,
      contents,
      config
    });

    return {
      statusCode: 200,
      body: JSON.stringify({
        text: response.text,
        candidates: response.candidates,
        functionCalls: response.functionCalls,
      })
    };
  } catch (err: any) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err?.message || 'AI function error' })
    };
  }
};

export default handler;