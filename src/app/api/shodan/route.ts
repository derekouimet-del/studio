import { NextRequest, NextResponse } from 'next/server';

// Shodan API base URL
const SHODAN_API_BASE = 'https://api.shodan.io';

export interface ShodanSearchResult {
  ip: string;
  port: string;
  transport: string;
  hostnames: string;
  domain: string;
  org: string;
  isp: string;
  os: string;
  product: string;
  version: string;
  country: string;
  country_name: string;
  city: string;
  title: string;
  banner?: string;
  timestamp: string;
}

export interface ShodanSearchResponse {
  success: boolean;
  error?: string;
  data?: {
    total: number;
    page: number;
    results: ShodanSearchResult[];
    query: string;
  };
}

function transformMatch(match: any): ShodanSearchResult {
  const location = match.location || {};
  const hostnames: string[] = match.hostnames || [];
  const domains: string[] = match.domains || [];
  const banner: string = typeof match.data === 'string' ? match.data : '';

  return {
    ip: match.ip_str || '',
    port: String(match.port ?? ''),
    transport: match.transport || 'tcp',
    hostnames: hostnames.join(', '),
    domain: domains.join(', '),
    org: match.org || '',
    isp: match.isp || '',
    os: match.os || '',
    product: match.product || '',
    version: match.version || '',
    country: location.country_code || '',
    country_name: location.country_name || '',
    city: location.city || '',
    title: match.http?.title || '',
    banner: banner ? banner.slice(0, 2000) : undefined,
    timestamp: match.timestamp || '',
  };
}

export async function POST(request: NextRequest): Promise<NextResponse<ShodanSearchResponse>> {
  try {
    const { query, page = 1 } = await request.json();

    if (!query) {
      return NextResponse.json({ success: false, error: 'Query is required' }, { status: 400 });
    }

    const apiKey = process.env.SHODAN_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { success: false, error: 'Shodan credentials not configured. Please set the SHODAN_API_KEY environment variable.' },
        { status: 500 }
      );
    }

    // Build the API URL for the search endpoint.
    const url = new URL(`${SHODAN_API_BASE}/shodan/host/search`);
    url.searchParams.set('key', apiKey);
    url.searchParams.set('query', query);
    url.searchParams.set('page', String(page));

    console.log('[Shodan API] Executing search:', query);

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: { Accept: 'application/json' },
    });

    const data = await response.json();

    if (!response.ok || data.error) {
      const rawError = data?.error || `Shodan API error: ${response.status}`;
      console.error('[Shodan API] Error:', rawError);

      // Provide friendlier messages for the most common Shodan errors.
      let errorMessage = rawError;
      if (/query credits/i.test(rawError)) {
        errorMessage = 'Insufficient Shodan query credits. Your plan is out of search credits — upgrade your API plan or wait for the monthly reset at account.shodan.io.';
      } else if (/invalid api key/i.test(rawError) || response.status === 401) {
        errorMessage = 'Invalid Shodan API key. Please verify SHODAN_API_KEY is correct.';
      } else if (/membership/i.test(rawError)) {
        errorMessage = 'This search requires a paid Shodan membership (e.g. filters or pagination beyond the first page).';
      }

      return NextResponse.json(
        { success: false, error: errorMessage },
        { status: response.ok ? 400 : response.status }
      );
    }

    const results: ShodanSearchResult[] = (data.matches || []).map(transformMatch);

    console.log(`[Shodan API] Found ${data.total} results, returning ${results.length}`);

    return NextResponse.json({
      success: true,
      data: {
        total: data.total || 0,
        page,
        results,
        query,
      },
    });
  } catch (error) {
    console.error('[Shodan API] Error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}

// GET endpoint for account / API plan info
export async function GET(): Promise<NextResponse> {
  try {
    const apiKey = process.env.SHODAN_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { success: false, error: 'Shodan credentials not configured' },
        { status: 500 }
      );
    }

    const url = new URL(`${SHODAN_API_BASE}/api-info`);
    url.searchParams.set('key', apiKey);

    const response = await fetch(url.toString());
    const data = await response.json();

    if (!response.ok || data.error) {
      return NextResponse.json({ success: false, error: data.error || `Shodan API error: ${response.status}` }, { status: 400 });
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to fetch account info' },
      { status: 500 }
    );
  }
}
