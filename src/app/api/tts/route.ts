import { textToSpeech } from '@/ai/flows/text-to-speech';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { text, voice } = await request.json();
    
    if (!text || !voice) {
      return NextResponse.json(
        { error: 'Missing required fields: text and voice' },
        { status: 400 }
      );
    }
    
    const result = await textToSpeech({ text, voice });
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Text-to-speech failed:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate speech' },
      { status: 500 }
    );
  }
}
