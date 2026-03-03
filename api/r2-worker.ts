/**
 * Cloudflare Worker for R2 Storage Operations
 * 
 * This worker provides a server-side API for R2 operations,
 * avoiding exposure of R2 credentials in the browser bundle.
 * 
 * Endpoints:
 * - POST /api/r2/upload - Upload a file
 * - GET /api/r2/presigned-url - Get a presigned URL for download
 * - DELETE /api/r2/delete - Delete a file
 * - GET /api/r2/list - List files in a folder
 */

export interface Env {
  R2_BUCKET: R2Bucket;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;

    // CORS headers
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    };

    // Handle preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    try {
      // Route handling
      if (path.startsWith('/api/r2/upload') && request.method === 'POST') {
        return await handleUpload(request, env);
      } else if (path.startsWith('/api/r2/presigned-url') && request.method === 'GET') {
        return await handlePresignedUrl(request, env);
      } else if (path.startsWith('/api/r2/delete') && request.method === 'DELETE') {
        return await handleDelete(request, env);
      } else if (path.startsWith('/api/r2/list') && request.method === 'GET') {
        return await handleList(request, env);
      } else if (path.startsWith('/api/r2/exists') && request.method === 'GET') {
        return await handleExists(request, env);
      } else if (path.startsWith('/api/r2/metadata') && request.method === 'GET') {
        return await handleMetadata(request, env);
      }

      return new Response('Not Found', { status: 404 });
    } catch (error) {
      console.error('R2 Worker Error:', error);
      return new Response(JSON.stringify({ error: String(error) }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
  }
};

async function handleUpload(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  const key = url.searchParams.get('key') || '';
  
  if (!key) {
    return new Response(JSON.stringify({ error: 'Missing key parameter' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }

  const contentType = request.headers.get('Content-Type') || 'application/octet-stream';
  const arrayBuffer = await request.arrayBuffer();

  await env.R2_BUCKET.put(key, arrayBuffer, {
    httpMetadata: {
      contentType
    }
  });

  const publicUrl = `https://fce57ea059c228c5cec72d0b7055c268.r2.cloudflarestorage.com/architex/${key}`;

  return new Response(JSON.stringify({
    success: true,
    key,
    url: publicUrl
  }), {
    headers: { 'Content-Type': 'application/json', ...corsHeaders }
  });
}

async function handlePresignedUrl(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  const key = url.searchParams.get('key');
  const expiration = parseInt(url.searchParams.get('expiration') || '3600');

  if (!key) {
    return new Response(JSON.stringify({ error: 'Missing key parameter' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }

  // For R2, we can use a public URL since the bucket is configured for public access
  // Alternatively, we could implement proper presigned URLs using a library
  const publicUrl = `https://fce57ea059c228c5cec72d0b7055c268.r2.cloudflarestorage.com/architex/${key}`;

  return new Response(JSON.stringify({
    url: publicUrl,
    expiresIn: expiration
  }), {
    headers: { 'Content-Type': 'application/json', ...corsHeaders }
  });
}

async function handleDelete(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  const key = url.searchParams.get('key');

  if (!key) {
    return new Response(JSON.stringify({ error: 'Missing key parameter' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }

  await env.R2_BUCKET.delete(key);

  return new Response(JSON.stringify({
    success: true,
    key
  }), {
    headers: { 'Content-Type': 'application/json', ...corsHeaders }
  });
}

async function handleList(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  const prefix = url.searchParams.get('prefix') || '';

  const listed = await env.R2_BUCKET.list({
    prefix
  });

  const files = listed.objects.map(obj => ({
    key: obj.key,
    size: obj.size,
    uploaded: obj.uploaded
  }));

  return new Response(JSON.stringify({ files }), {
    headers: { 'Content-Type': 'application/json', ...corsHeaders }
  });
}

async function handleExists(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  const key = url.searchParams.get('key');

  if (!key) {
    return new Response(JSON.stringify({ error: 'Missing key parameter' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }

  const object = await env.R2_BUCKET.get(key);
  const exists = object !== null;

  return new Response(JSON.stringify({ exists }), {
    headers: { 'Content-Type': 'application/json', ...corsHeaders }
  });
}

async function handleMetadata(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  const key = url.searchParams.get('key');

  if (!key) {
    return new Response(JSON.stringify({ error: 'Missing key parameter' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }

  const object = await env.R2_BUCKET.get(key);
  
  if (!object) {
    return new Response(JSON.stringify({ error: 'File not found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }

  return new Response(JSON.stringify({
    metadata: object.customMetadata,
    httpMetadata: {
      contentType: object.httpMetadata?.contentType
    },
    size: object.size,
    uploaded: object.uploaded
  }), {
    headers: { 'Content-Type': 'application/json', ...corsHeaders }
  });
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};
