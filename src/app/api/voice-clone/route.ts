import { cloneVoice } from '@/lib/elevenlabs';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { name, description, audioFiles } = await request.json();
    
    if (!name) {
      return NextResponse.json(
        { error: 'Voice name is required' },
        { status: 400 }
      );
    }
    
    if (!audioFiles || audioFiles.length === 0) {
      return NextResponse.json(
        { error: 'At least one audio file is required' },
        { status: 400 }
      );
    }
    
    const result = await cloneVoice(audioFiles, { name, description });
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Voice cloning failed:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to clone voice' },
      { status: 500 }
    );
  }
}
