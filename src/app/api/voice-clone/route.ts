import { cloneVoice } from '@/lib/elevenlabs';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
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
