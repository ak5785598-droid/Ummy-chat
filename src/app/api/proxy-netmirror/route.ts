import { NextRequest, NextResponse } from 'next/server';

const TARGET_DOMAIN = 'https://netmirror.world';

export async function GET(request: NextRequest) {
  const urlParam = request.nextUrl.searchParams.get('url') || '';
  const targetUrl = urlParam.startsWith('http') ? urlParam : `${TARGET_DOMAIN}${urlParam.startsWith('/') ? urlParam : '/' + urlParam}`;

  try {
    const response = await fetch(targetUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
      },
    });

    const contentType = response.headers.get('content-type') || '';

    if (!contentType.includes('text/html')) {
      const body = await response.arrayBuffer();
      const res = new NextResponse(body, {
        status: response.status,
        headers: {
          'content-type': contentType,
          'cache-control': 'public, max-age=3600',
        },
      });
      return res;
    }

    let html = await response.text();

    html = html.replace(/https?:\/\/netmirror\.world\//gi, '/api/proxy-netmirror/?url=https://netmirror.world/');
    html = html.replace(/\/\/netmirror\.world\//gi, '/api/proxy-netmirror/?url=https://netmirror.world/');

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
