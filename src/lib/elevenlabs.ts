/**
 * ElevenLabs API client for text-to-speech and voice cloning.
 * Uses direct API calls for reliable serverless compatibility.
 */

import FormData from 'form-data';

const ELEVENLABS_API_BASE = 'https://api.elevenlabs.io/v1';

export interface ElevenLabsVoice {
  voice_id: string;
  name: string;
  category: string;
  description?: string;
  preview_url?: string;
  labels?: Record<string, string>;
}

export interface GenerateSpeechOptions {
  model_id?: string;
  voice_settings?: {
    stability?: number;
    similarity_boost?: number;
    style?: number;
    use_speaker_boost?: boolean;
  };
}

export interface VoiceCloneOptions {
  name: string;
  description?: string;
  labels?: Record<string, string>;
}

function getApiKey(): string {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) {
    throw new Error('ELEVENLABS_API_KEY environment variable is not set');
  }
  return apiKey;
}

/**
 * Generate speech from text using ElevenLabs TTS API.
 * Returns audio as a base64-encoded MP3 data URI.
 */
export async function generateSpeech(
  text: string,
  voiceId: string,
  options: GenerateSpeechOptions = {}
): Promise<string> {
  const apiKey = getApiKey();
  
  const response = await fetch(`${ELEVENLABS_API_BASE}/text-to-speech/${voiceId}`, {
    method: 'POST',
    headers: {
      'Accept': 'audio/mpeg',
      'Content-Type': 'application/json',
      'xi-api-key': apiKey,
    },
    body: JSON.stringify({
      text,
      model_id: options.model_id || 'eleven_multilingual_v2',
      voice_settings: options.voice_settings || {
        stability: 0.5,
        similarity_boost: 0.75,
        style: 0.0,
        use_speaker_boost: true,
      },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    let errorMessage = `ElevenLabs API error: ${response.status}`;
    try {
      const errorJson = JSON.parse(errorText);
      errorMessage = errorJson.detail?.message || errorJson.detail || errorMessage;
    } catch {
      errorMessage = errorText || errorMessage;
    }
    throw new Error(errorMessage);
  }

  const audioBuffer = await response.arrayBuffer();
  const base64Audio = Buffer.from(audioBuffer).toString('base64');
  
  return `data:audio/mpeg;base64,${base64Audio}`;
}

/**
 * Get list of available voices from ElevenLabs.
 */
export async function getVoices(): Promise<ElevenLabsVoice[]> {
  const apiKey = getApiKey();
  
  const response = await fetch(`${ELEVENLABS_API_BASE}/voices`, {
    method: 'GET',
    headers: {
      'xi-api-key': apiKey,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to fetch voices: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  return data.voices as ElevenLabsVoice[];
}

/**
 * Clone a voice using audio samples (Instant Voice Cloning).
 * Requires at least 1 audio file, ideally 1-3 minutes of clear speech.
 * Uses form-data package with proper stream handling for Node.js.
 */
export async function cloneVoice(
  audioFiles: { data: string; filename: string }[],
  options: VoiceCloneOptions
): Promise<{ voice_id: string }> {
  const apiKey = getApiKey();
  
  // Create FormData for multipart upload using form-data package
  const formData = new FormData();
  formData.append('name', options.name);
  
  if (options.description) {
    formData.append('description', options.description);
  }

  // Convert base64 data URIs to Buffers and append to FormData
  for (const file of audioFiles) {
    const base64Data = file.data.split(',')[1] || file.data;
    const mimeMatch = file.data.match(/^data:([^;]+);/);
    const mimeType = mimeMatch ? mimeMatch[1] : 'audio/mpeg';
    
    const buffer = Buffer.from(base64Data, 'base64');
    
    // Append buffer with filename and content type
    formData.append('files', buffer, {
      filename: file.filename,
      contentType: mimeType,
    });
  }

  console.log('[v0] Sending voice clone request to ElevenLabs...');
  
  // Use form-data's submit method or convert to buffer for fetch
  const formBuffer = formData.getBuffer();
  const formHeaders = formData.getHeaders();
  
  const response = await fetch(`${ELEVENLABS_API_BASE}/voices/add`, {
    method: 'POST',
    headers: {
      'xi-api-key': apiKey,
      ...formHeaders,
    },
    body: formBuffer,
  });

  const responseText = await response.text();
  console.log('[v0] ElevenLabs response status:', response.status);
  console.log('[v0] ElevenLabs response:', responseText.substring(0, 500));

  if (!response.ok) {
    let errorMessage = `ElevenLabs API error: ${response.status}`;
    try {
      const errorJson = JSON.parse(responseText);
      errorMessage = errorJson.detail?.message || errorJson.detail || errorJson.error || errorMessage;
    } catch {
      errorMessage = responseText || errorMessage;
    }
    throw new Error(errorMessage);
  }

  try {
    const data = JSON.parse(responseText);
    return { voice_id: data.voice_id };
  } catch (e) {
    console.error('[v0] Failed to parse response:', responseText);
    throw new Error('Invalid response from ElevenLabs API');
  }
}

/**
 * Delete a cloned voice.
 */
export async function deleteVoice(voiceId: string): Promise<void> {
  const apiKey = getApiKey();
  
  const response = await fetch(`${ELEVENLABS_API_BASE}/voices/${voiceId}`, {
    method: 'DELETE',
    headers: {
      'xi-api-key': apiKey,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to delete voice: ${response.status} - ${errorText}`);
  }
}

/**
 * Get voice details by ID.
 */
export async function getVoice(voiceId: string): Promise<ElevenLabsVoice> {
  const apiKey = getApiKey();
  
  const response = await fetch(`${ELEVENLABS_API_BASE}/voices/${voiceId}`, {
    method: 'GET',
    headers: {
      'xi-api-key': apiKey,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to get voice: ${response.status} - ${errorText}`);
  }

  return await response.json();
}
