import { NextRequest, NextResponse } from 'next/server';

const VIRUSTOTAL_API_BASE = 'https://www.virustotal.com/api/v3';

export interface AnalysisResponse {
  success: boolean;
  error?: string;
  data?: {
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
      names?: string[];
    };
  };
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<AnalysisResponse>> {
  try {
    const apiKey = process.env.VIRUSTOTAL_API_KEY;
    const { id: analysisId } = await params;

    if (!apiKey) {
      return NextResponse.json(
        { success: false, error: 'VirusTotal API key not configured.' },
        { status: 500 }
      );
    }

    if (!analysisId) {
      return NextResponse.json(
        { success: false, error: 'Analysis ID is required' },
        { status: 400 }
      );
    }

    console.log('[VirusTotal API] Fetching analysis:', analysisId);

    // Get analysis results
    const analysisResponse = await fetch(`${VIRUSTOTAL_API_BASE}/analyses/${analysisId}`, {
      method: 'GET',
      headers: {
        'x-apikey': apiKey,
      },
    });

    if (!analysisResponse.ok) {
      const errorData = await analysisResponse.json().catch(() => ({}));
      console.error('[VirusTotal API] Analysis error:', analysisResponse.status, errorData);
      return NextResponse.json(
        { success: false, error: `Failed to fetch analysis: ${analysisResponse.status}` },
        { status: analysisResponse.status }
      );
    }

    const analysisData = await analysisResponse.json();
    const attributes = analysisData.data?.attributes;

    if (!attributes) {
      return NextResponse.json(
        { success: false, error: 'Invalid analysis response' },
        { status: 500 }
      );
    }

    const status = attributes.status === 'completed' ? 'completed' : 'queued';

    if (status !== 'completed') {
      return NextResponse.json({
        success: true,
        data: { status },
      });
    }

    // Get file info using the SHA256 from the analysis
    const sha256 = analysisData.meta?.file_info?.sha256;
    let fileInfo = undefined;

    if (sha256) {
      try {
        const fileResponse = await fetch(`${VIRUSTOTAL_API_BASE}/files/${sha256}`, {
          method: 'GET',
          headers: {
            'x-apikey': apiKey,
          },
        });

        if (fileResponse.ok) {
          const fileData = await fileResponse.json();
          const fileAttributes = fileData.data?.attributes;
          if (fileAttributes) {
            fileInfo = {
              sha256: fileAttributes.sha256,
              sha1: fileAttributes.sha1,
              md5: fileAttributes.md5,
              size: fileAttributes.size,
              type_description: fileAttributes.type_description,
              type_tag: fileAttributes.type_tag,
              magic: fileAttributes.magic,
              meaningful_name: fileAttributes.meaningful_name,
              names: fileAttributes.names,
            };
          }
        }
      } catch (error) {
        console.error('[VirusTotal API] Error fetching file info:', error);
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        status: 'completed',
        stats: attributes.stats,
        results: attributes.results,
        fileInfo,
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
