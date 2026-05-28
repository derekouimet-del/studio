import { cloneVoice } from '@/lib/elevenlabs';
import { NextResponse } from 'next/server';

// Allow up to 60 seconds for processing large audio files
export const maxDuration = 60;

export async function POST(request: Request) {
  try {
    // Parse the request body manually to handle large payloads
    const text = await request.text();
    
    // Check size before parsing
    const sizeInMB = Buffer.byteLength(text, 'utf8') / (1024 * 1024);
    console.log('[v0] Request body size:', sizeInMB.toFixed(2), 'MB');
    
    if (sizeInMB > 50) {
      return NextResponse.json(
        { error: 'Request too large. Maximum size is 50MB.' },
        { status: 413 }
      );
    }
    
    const body = JSON.parse(text);
    const { name, description, audioFiles } = body;
    
    console.log('[v0] Voice clone request received:', { name, description, fileCount: audioFiles?.length });
    
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

    // Log file details
    for (const file of audioFiles) {
      console.log('[v0] Audio file:', { filename: file.filename, dataLength: file.data?.length });
    }
    
    const result = await cloneVoice(audioFiles, { name, description });
    console.log('[v0] Clone result:', result);
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('[v0] Voice cloning failed:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to clone voice' },
      { status: 500 }
    );
  }
}
