/**
 * Cloudflare Worker proxy utility for accelerating OneDrive file downloads
 */

// Get proxy configuration from environment
const CF_PROXY_URL = process.env.NEXT_PUBLIC_CF_PROXY_URL || ''

/**
 * Check if Cloudflare proxy is enabled
 */
export function isCfProxyEnabled(): boolean {
  return Boolean(CF_PROXY_URL)
}

/**
 * Convert a OneDrive download URL to a proxied URL through Cloudflare Worker
 *
 * @param originalUrl The original OneDrive download URL
 * @returns The proxied URL if proxy is enabled, otherwise the original URL
 */
export function getProxiedUrl(originalUrl: string): string {
  if (!isCfProxyEnabled() || !originalUrl) {
    return originalUrl
  }

  // Encode the original URL and append to proxy URL
  const encodedUrl = encodeURIComponent(originalUrl)
  return `${CF_PROXY_URL}?url=${encodedUrl}`
}
