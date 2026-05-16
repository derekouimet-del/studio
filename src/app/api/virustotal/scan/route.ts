import { NextRequest, NextResponse } from 'next/server';

// Configure route segment for larger file uploads
export const runtime = 'nodejs';
export const maxDuration = 60;
// This allows the route to accept larger request bodies
export const dynamic = 'force-dynamic';

const VIRUSTOTAL_API_BASE = 'https://www.virustotal.com/api/v3';

export interface VirusTotalScanResponse {
  success: boolean;
  error?: string;
  data?: {
    analysisId: string;
    status: 'queued' | 'completed';
    stats?: {
      malicious: number;
      suspicious: number;
      undetected: number;
      harmless: number;
      timeout: number;
      failure: number;
    };
    results?: Record<string, {
      engine_name: string;
      category: string;
      result: string | null;
      method: string;
      engine_version?: string;
      engine_update?: string;
    }>;
    fileInfo?: {
      sha256: string;
      sha1: string;
      md5: string;
      size: number;
      type_description?: string;
      type_tag?: string;
      magic?: string;
      meaningful_name?: string;
    };
  };
}

export async function POST(request: NextRequest): Promise<NextResponse<VirusTotalScanResponse>> {
  try {
    const apiKey = process.env.VIRUSTOTAL_API_KEY;
    console.log('[v0] VirusTotal scan - API key present:', !!apiKey);

    if (!apiKey) {
      return NextResponse.json(
        { success: false, error: 'VirusTotal API key not configured. Please set VIRUSTOTAL_API_KEY environment variable.' },
        { status: 500 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ success: false, error: 'No file provided' }, { status: 400 });
    }

    // Check file size (Vercel serverless limit ~2MB with FormData overhead)
    const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { success: false, error: 'File size exceeds 2MB limit. Please use a smaller file.' },
        { status: 400 }
      );
    }

    console.log('[VirusTotal API] Uploading file:', file.name, 'Size:', file.size);

    // Upload file to VirusTotal
    const uploadFormData = new FormData();
    uploadFormData.append('file', file);

    const uploadResponse = await fetch(`${VIRUSTOTAL_API_BASE}/files`, {
      method: 'POST',
      headers: {
        'x-apikey': apiKey,
      },
      body: uploadFormData,
    });

    if (!uploadResponse.ok) {
      const errorData = await uploadResponse.json().catch(() => ({}));
      console.error('[VirusTotal API] Upload error:', uploadResponse.status, errorData);
      
      if (uploadResponse.status === 401) {
        return NextResponse.json(
          { success: false, error: 'Invalid VirusTotal API key. Please check your credentials.' },
          { status: 401 }
        );
      }
      if (uploadResponse.status === 429) {
        return NextResponse.json(
          { success: false, error: 'VirusTotal API rate limit exceeded. Please wait and try again.' },
          { status: 429 }
        );
      }
      
      return NextResponse.json(
        { success: false, error: `VirusTotal API error: ${uploadResponse.status}` },
        { status: uploadResponse.status }
      );
    }

    const uploadData = await uploadResponse.json();
    const analysisId = uploadData.data?.id;

    if (!analysisId) {
      return NextResponse.json(
        { success: false, error: 'Failed to get analysis ID from VirusTotal' },
        { status: 500 }
      );
    }

    console.log('[VirusTotal API] Analysis ID:', analysisId);

    return NextResponse.json({
      success: true,
      data: {
        analysisId,
        status: 'queued',
      },
    });
  } catch (error) {
    console.error('[VirusTotal API] Error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
