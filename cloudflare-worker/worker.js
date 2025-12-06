/**
 * Cloudflare Worker for OneDrive file proxy
 *
 * Environment Variables (set in Cloudflare Dashboard):
 * - ALLOWED_ORIGINS: Comma-separated list of allowed origins (e.g., "https://your-site.vercel.app,https://your-domain.com")
 * - RATE_LIMIT_PER_MINUTE: Max requests per IP per minute (default: 60)
 */

const DEFAULT_RATE_LIMIT = 60

// In-memory rate limiting (resets when worker restarts)
const rateLimitMap = new Map()

/**
 * Clean up expired rate limit entries
 */
function cleanupRateLimits() {
  const now = Date.now()
  for (const [key, value] of rateLimitMap.entries()) {
    if (now - value.timestamp > 60000) {
      rateLimitMap.delete(key)
    }
  }
}

/**
 * Check rate limit for an IP
 */
function checkRateLimit(ip, limit) {
  cleanupRateLimits()

  const now = Date.now()
  const record = rateLimitMap.get(ip)

  if (!record || now - record.timestamp > 60000) {
    rateLimitMap.set(ip, { count: 1, timestamp: now })
    return true
  }

  if (record.count >= limit) {
    return false
  }

  record.count++
  return true
}

/**
 * Validate request origin
 */
function validateOrigin(request, allowedOrigins) {
  const origin = request.headers.get('Origin')
  const referer = request.headers.get('Referer')

  // Allow direct access (no origin/referer) for download links
  if (!origin && !referer) {
    return true
  }

  const origins = allowedOrigins.split(',').map(o => o.trim().toLowerCase())

  if (origin && origins.some(o => origin.toLowerCase().startsWith(o))) {
    return true
  }

  if (referer) {
    try {
      const refererUrl = new URL(referer)
      const refererOrigin = `${refererUrl.protocol}//${refererUrl.host}`
      if (origins.some(o => refererOrigin.toLowerCase().startsWith(o))) {
        return true
      }
    } catch (e) {
      // Invalid referer URL
    }
  }

  return false
}

/**
 * Generate CORS headers
 */
function getCorsHeaders(request, allowedOrigins) {
  const origin = request.headers.get('Origin')
  const origins = allowedOrigins.split(',').map(o => o.trim())

  // Check if origin is in allowed list, or use wildcard
  let allowOrigin = '*'
  if (allowedOrigins !== '*' && origin) {
    if (origins.some(o => origin.toLowerCase().startsWith(o.toLowerCase()))) {
      allowOrigin = origin
    } else {
      allowOrigin = origins[0]
    }
  }

  return {
    'Access-Control-Allow-Origin': allowOrigin,
    'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-Proxy-Secret, Range',
    'Access-Control-Expose-Headers': 'Content-Length, Content-Range, Content-Type, Content-Disposition',
    'Access-Control-Max-Age': '86400',
  }
}

/**
 * Handle OPTIONS preflight request
 */
function handleOptions(request, env) {
  const allowedOrigins = env.ALLOWED_ORIGINS || '*'
  return new Response(null, {
    status: 204,
    headers: getCorsHeaders(request, allowedOrigins),
  })
}

/**
 * Main request handler
 */
async function handleRequest(request, env) {
  const allowedOrigins = env.ALLOWED_ORIGINS || '*'
  const rateLimit = parseInt(env.RATE_LIMIT_PER_MINUTE) || DEFAULT_RATE_LIMIT

  // Get client IP
  const clientIP = request.headers.get('CF-Connecting-IP') || 'unknown'

  // Check rate limit
  if (!checkRateLimit(clientIP, rateLimit)) {
    return new Response(JSON.stringify({ error: 'Rate limit exceeded' }), {
      status: 429,
      headers: {
        'Content-Type': 'application/json',
        'Retry-After': '60',
        ...getCorsHeaders(request, allowedOrigins),
      },
    })
  }

  // Validate origin
  if (allowedOrigins !== '*' && !validateOrigin(request, allowedOrigins)) {
    return new Response(JSON.stringify({ error: 'Origin not allowed' }), {
      status: 403,
      headers: {
        'Content-Type': 'application/json',
        ...getCorsHeaders(request, allowedOrigins),
      },
    })
  }

  // Parse request URL
  const url = new URL(request.url)
  const targetUrl = url.searchParams.get('url')

  if (!targetUrl) {
    return new Response(JSON.stringify({ error: 'Missing url parameter' }), {
      status: 400,
      headers: {
        'Content-Type': 'application/json',
        ...getCorsHeaders(request, allowedOrigins),
      },
    })
  }

  // Validate target URL is from OneDrive/SharePoint
  let parsedUrl
  try {
    parsedUrl = new URL(targetUrl)
  } catch (e) {
    return new Response(JSON.stringify({ error: 'Invalid url parameter' }), {
      status: 400,
      headers: {
        'Content-Type': 'application/json',
        ...getCorsHeaders(request, allowedOrigins),
      },
    })
  }

  // Only allow OneDrive/SharePoint domains
  const allowedHosts = [
    '.sharepoint.com',
    '.1drv.com',
    'onedrive.live.com',
    '.graph.microsoft.com',
    '.svc.ms', // Thumbnail service (e.g., southeastasia1-mediap.svc.ms)
  ]

  const isAllowedHost = allowedHosts.some(host =>
    parsedUrl.hostname.endsWith(host) || parsedUrl.hostname === host.replace('.', '')
  )

  if (!isAllowedHost) {
    return new Response(JSON.stringify({ error: 'URL host not allowed' }), {
      status: 403,
      headers: {
        'Content-Type': 'application/json',
        ...getCorsHeaders(request, allowedOrigins),
      },
    })
  }

  try {
    // Forward headers (especially Range for video streaming)
    const headers = new Headers()
    const rangeHeader = request.headers.get('Range')
    if (rangeHeader) {
      headers.set('Range', rangeHeader)
    }

    // Fetch from OneDrive
    const response = await fetch(targetUrl, {
      method: request.method,
      headers,
      redirect: 'follow',
    })

    // Build response headers
    const responseHeaders = new Headers(getCorsHeaders(request, allowedOrigins))

    // Copy relevant headers from OneDrive response
    const headersToForward = [
      'Content-Type',
      'Content-Length',
      'Content-Range',
      'Accept-Ranges',
      'Content-Disposition',
      'ETag',
      'Last-Modified',
    ]

    for (const header of headersToForward) {
      const value = response.headers.get(header)
      if (value) {
        responseHeaders.set(header, value)
      }
    }

    // Set cache headers
    responseHeaders.set('Cache-Control', 'public, max-age=3600')

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders,
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Proxy error', message: error.message }), {
      status: 502,
      headers: {
        'Content-Type': 'application/json',
        ...getCorsHeaders(request, allowedOrigins),
      },
    })
  }
}

export default {
  async fetch(request, env, ctx) {
    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return handleOptions(request, env)
    }

    // Only allow GET and HEAD
    if (request.method !== 'GET' && request.method !== 'HEAD') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    return handleRequest(request, env)
  },
}
