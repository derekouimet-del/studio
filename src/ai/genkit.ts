import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/google-genai';

const apiKey = process.env.GOOGLE_GENAI_API_KEY;
console.log('[v0] GOOGLE_GENAI_API_KEY is set:', !!apiKey);
console.log('[v0] GOOGLE_GENAI_API_KEY length:', apiKey?.length || 0);
console.log('[v0] GOOGLE_GENAI_API_KEY prefix:', apiKey?.substring(0, 10) || 'N/A');

export const ai = genkit({
  plugins: [googleAI({ apiKey })],
  model: 'googleai/gemini-2.0-flash',
});
