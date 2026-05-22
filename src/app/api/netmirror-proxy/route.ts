import { NextRequest, NextResponse } from 'next/server';

const LANDING_URL = 'https://netmirror.gg/4/en-in';
const TARGET_DOMAIN = 'https://netmirror.gg';

export async function GET(request: NextRequest) {
  const urlParam = request.nextUrl.searchParams.get('url') || LANDING_URL;
  const targetUrl = urlParam.startsWith('http') ? urlParam : `${TARGET_DOMAIN}${urlParam}`;

  try {
    const response = await fetch(targetUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Referer': TARGET_DOMAIN,
      },
    });

    const contentType = response.headers.get('content-type') || '';

    if (!contentType.includes('text/html')) {
      const body = await response.arrayBuffer();
      return new NextResponse(body, {
        status: response.status,
        headers: {
          'content-type': contentType,
          'cache-control': 'public, max-age=3600',
        },
      });
    }

    let html = await response.text();

    // Add base tag so relative URLs resolve against netmirror.gg
    html = html.replace(
      '<head>',
      `<head><base href="${TARGET_DOMAIN}/">`
    );

    // Replace location.href navigations with window.open (opens in new tab)
    html = html.replace(
      /location\.href\s*=\s*['"]([^'"]+)['"]/gi,
      `window.open('$1', '_blank')`
    );

    // Make external links open in new tab
    html = html.replace(
      /<a\s+([^>]*?)href=["'](https?:\/\/[^"']+)["']([^>]*)>/gi,
      '<a $1href="$2"$3 target="_blank" rel="noopener noreferrer">'
    );

    const res = new NextResponse(html, {
      status: response.status,
      headers: {
        'content-type': 'text/html; charset=utf-8',
        'cache-control': 'no-cache',
      },
    });

    return res;
  } catch (error) {
    return new NextResponse('Proxy error', { status: 500 });
  }
}
