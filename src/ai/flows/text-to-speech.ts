'use server';

/**
 * @fileOverview Text-to-speech using ElevenLabs API.
 *
 * - textToSpeech - A function that converts text to spoken audio.
 * - TextToSpeechInput - The input type for the function.
 * - TextToSpeechOutput - The return type for the function.
 */

import { generateSpeech } from '@/lib/elevenlabs';
import { z } from 'zod';

const TextToSpeechInputSchema = z.object({
  text: z.string().describe('The text to convert to speech.'),
  voice: z.string().describe('The ElevenLabs voice ID to use for generation.'),
});
export type TextToSpeechInput = z.infer<typeof TextToSpeechInputSchema>;

const TextToSpeechOutputSchema = z.object({
  audioDataUri: z.string().describe("A data URI of the generated MP3 audio file. Format: 'data:audio/mpeg;base64,<encoded_data>'."),
});
export type TextToSpeechOutput = z.infer<typeof TextToSpeechOutputSchema>;

export async function textToSpeech(input: TextToSpeechInput): Promise<TextToSpeechOutput> {
  const validated = TextToSpeechInputSchema.parse(input);
  
  const audioDataUri = await generateSpeech(validated.text, validated.voice, {
    model_id: 'eleven_multilingual_v2',
    voice_settings: {
      stability: 0.5,
      similarity_boost: 0.75,
      style: 0.0,
      use_speaker_boost: true,
    },
  });

  return { audioDataUri };
}
