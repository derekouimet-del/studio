import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { results, format, filename } = await request.json();

    if (!results || !Array.isArray(results)) {
      return NextResponse.json({ error: 'No results provided' }, { status: 400 });
    }

    let content: string;
    let mimeType: string;
    let extension: string;

    if (format === 'json') {
      content = JSON.stringify(results, null, 2);
      mimeType = 'application/json';
      extension = 'json';
    } else {
      // CSV format
      const headers = ['host', 'ip', 'port', 'protocol', 'country', 'country_name', 'region', 'city', 'as_organization', 'title', 'domain', 'server'];
      const csvRows = [
        headers.join(','),
        ...results.map((row: Record<string, string>) => 
          headers.map(header => {
            const value = row[header] || '';
            const escaped = String(value).replace(/"/g, '""');
            return escaped.includes(',') || escaped.includes('"') || escaped.includes('\n')
              ? `"${escaped}"`
              : escaped;
          }).join(',')
        )
      ];
      content = csvRows.join('\n');
      mimeType = 'text/csv';
      extension = 'csv';
    }

    const finalFilename = filename || `fofa-results-${Date.now()}.${extension}`;

    return new NextResponse(content, {
      status: 200,
      headers: {
        'Content-Type': mimeType,
        'Content-Disposition': `attachment; filename="${finalFilename}"`,
      },
    });
  } catch (error) {
    console.error('[FOFA Download] Error:', error);
    return NextResponse.json(
      { error: 'Failed to generate download' },
      { status: 500 }
    );
  }
}
