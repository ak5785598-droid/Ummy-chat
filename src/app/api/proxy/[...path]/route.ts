import { NextRequest, NextResponse } from 'next/server';

const TARGET_DOMAIN = 'https://netmirror.world';

export async function GET(request: NextRequest) {
  const path = request.nextUrl.pathname.replace('/api/proxy/', '');
  const search = request.nextUrl.search;
  const targetUrl = `${TARGET_DOMAIN}/${path}${search}`;

  try {
    const response = await fetch(targetUrl, {
      headers: {
        'User-Agent': request.headers.get('user-agent') || 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': request.headers.get('accept') || '*/*',
        'Referer': TARGET_DOMAIN,
      },
    });

    const contentType = response.headers.get('content-type') || '';

    // For non-HTML responses, pass through directly
    if (!contentType.includes('text/html')) {
      const body = await response.arrayBuffer();
      const res = new NextResponse(body, {
        status: response.status,
        headers: response.headers,
      });
      res.headers.delete('x-frame-options');
      res.headers.delete('content-security-policy');
      return res;
    }

    // For HTML, rewrite URLs to go through proxy
    let html = await response.text();

    // Rewrite absolute URLs pointing to netmirror.world
    html = html.replace(
      /https?:\/\/netmirror\.world\//gi,
      '/api/proxy/'
    );

    // Rewrite protocol-relative URLs (//netmirror.world/...)
    html = html.replace(
      /\/\/netmirror\.world\//gi,
      '/api/proxy/'
    );

    // Rewrite root-relative URLs (starting with / but not //)
    html = html.replace(
      /(src|href|action|data-src|poster)=["']\/(?!\/)/gi,
      '$1="/api/proxy/'
    );

    // Rewrite root-relative URLs in inline CSS url()
    html = html.replace(
      /url\(\s*["']?\/(?!\/)/gi,
      'url("/api/proxy/'
    );

    const proxyResponse = new NextResponse(html, {
      status: response.status,
      headers: response.headers,
    });

    proxyResponse.headers.delete('x-frame-options');
    proxyResponse.headers.delete('content-security-policy');

    return proxyResponse;
  } catch (error) {
    return new NextResponse('Proxy error', { status: 500 });
  }
}
