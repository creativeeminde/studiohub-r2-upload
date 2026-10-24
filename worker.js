
const ALLOWED = new Set(['mp4', 'webm', 'mov', 'm4v']);
const MAX_BYTES = 95 * 1024 * 1024;

export default {
  async fetch(request, env) {
    const headers = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, X-File-Name'
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers });
    }

    const url = new URL(request.url);

    if (url.pathname !== '/upload' || request.method !== 'POST') {
      return Response.json(
        { error: 'Not found' },
        { status: 404, headers }
      );
    }

    const filename = request.headers.get('X-File-Name') || 'video.mp4';
    const extension = filename.split('.').pop().toLowerCase();
    const contentType = request.headers.get('Content-Type') || '';

    if (!ALLOWED.has(extension) || !contentType.startsWith('video/')) {
      return Response.json(
        { error: 'Unsupported video format' },
        { status: 400, headers }
      );
    }

    const size = Number(request.headers.get('Content-Length'));

    if (!Number.isFinite(size) || size <= 0 || size > MAX_BYTES) {
      return Response.json(
        { error: 'Invalid file size or file too large' },
        { status: 413, headers }
      );
    }

    const key = `clips/${crypto.randomUUID()}.${extension}`;

    try {
      await env.VIDEOS.put(key, request.body, {
        httpMetadata: { contentType }
      });

      return Response.json({ success: true, key }, { headers });
    } catch (error) {
      return Response.json(
        { error: 'Upload failed' },
        { status: 500, headers }
      );
    }
  }
};
