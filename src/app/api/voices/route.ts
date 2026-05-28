import { getVoices } from '@/lib/elevenlabs';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const voices = await getVoices();
    return NextResponse.json({ voices });
  } catch (error: any) {
    console.error('Failed to fetch voices:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch voices' },
      { status: 500 }
    );
  }
}
