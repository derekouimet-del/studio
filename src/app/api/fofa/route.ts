import { NextRequest, NextResponse } from 'next/server';

// FOFA API base URL
const FOFA_API_BASE = 'https://fofa.info/api/v1';

export interface FofaSearchResult {
  host: string;
  ip: string;
  port: string;
  protocol: string;
  country: string;
  country_name: string;
  region: string;
  city: string;
  as_organization: string;
  title: string;
  domain: string;
  server: string;
  banner?: string;
  cert?: string;
}

export interface FofaApiResponse {
  error: boolean;
  errmsg?: string;
  size: number;
  page: number;
  mode: string;
  query: string;
  results: string[][];
}

export interface FofaSearchResponse {
  success: boolean;
  error?: string;
  data?: {
    total: number;
    page: number;
    results: FofaSearchResult[];
    query: string;
  };
}

// Fields to retrieve from FOFA
const FOFA_FIELDS = 'host,ip,port,protocol,country,country_name,region,city,as_organization,title,domain,server';

export async function POST(request: NextRequest): Promise<NextResponse<FofaSearchResponse>> {
  try {
    const { query, page = 1, size = 100 } = await request.json();

    if (!query) {
      return NextResponse.json({ success: false, error: 'Query is required' }, { status: 400 });
    }

    const email = process.env.FOFA_EMAIL;
    const apiKey = process.env.FOFA_API_KEY;

    if (!email || !apiKey) {
      return NextResponse.json(
        { success: false, error: 'FOFA credentials not configured. Please set FOFA_EMAIL and FOFA_API_KEY environment variables.' },
        { status: 500 }
      );
    }

    // Base64 encode the query (FOFA API requirement)
    const encodedQuery = Buffer.from(query).toString('base64');

    // Build the API URL
    const url = new URL(`${FOFA_API_BASE}/search/all`);
    url.searchParams.set('email', email);
    url.searchParams.set('key', apiKey);
    url.searchParams.set('qbase64', encodedQuery);
    url.searchParams.set('fields', FOFA_FIELDS);
    url.searchParams.set('page', String(page));
    url.searchParams.set('size', String(Math.min(size, 10000))); // FOFA max is 10000

    console.log('[FOFA API] Executing search:', query);

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[FOFA API] HTTP Error:', response.status, errorText);
      return NextResponse.json(
        { success: false, error: `FOFA API error: ${response.status} - ${errorText}` },
        { status: response.status }
      );
    }

    const data: FofaApiResponse = await response.json();

    if (data.error) {
      console.error('[FOFA API] Error:', data.errmsg);
      return NextResponse.json(
        { success: false, error: data.errmsg || 'Unknown FOFA API error' },
        { status: 400 }
      );
    }

    // Transform results array to objects
    const fieldNames = FOFA_FIELDS.split(',');
    const results: FofaSearchResult[] = (data.results || []).map((row) => {
      const result: Record<string, string> = {};
      fieldNames.forEach((field, index) => {
        result[field] = row[index] || '';
      });
      return result as unknown as FofaSearchResult;
    });

    console.log(`[FOFA API] Found ${data.size} results, returning ${results.length}`);

    return NextResponse.json({
      success: true,
      data: {
        total: data.size,
        page: data.page || page,
        results,
        query: data.query || query,
      },
    });
  } catch (error) {
    console.error('[FOFA API] Error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}

// GET endpoint for account info
export async function GET(): Promise<NextResponse> {
  try {
    const email = process.env.FOFA_EMAIL;
    const apiKey = process.env.FOFA_API_KEY;

    if (!email || !apiKey) {
      return NextResponse.json(
        { success: false, error: 'FOFA credentials not configured' },
        { status: 500 }
      );
    }

    const url = new URL(`${FOFA_API_BASE}/info/my`);
    url.searchParams.set('email', email);
    url.searchParams.set('key', apiKey);

    const response = await fetch(url.toString());
    const data = await response.json();

    if (data.error) {
      return NextResponse.json({ success: false, error: data.errmsg }, { status: 400 });
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to fetch account info' },
      { status: 500 }
    );
  }
}
