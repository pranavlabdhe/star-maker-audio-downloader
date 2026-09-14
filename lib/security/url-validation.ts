// lib/security/url-validation.ts
/**
 * Validate that a URL is safe to fetch for the StarMaker resolver.
 * Allows only whitelisted domains and prevents SSRF attacks.
 */
export const ALLOWED_DOMAINS = [
  'starmaker.onelink.me',
  'star-maker.com',
  'm.starmakerstudios.com',
];

/** Hosts used by StarMaker to serve public recording media. */
const ALLOWED_MEDIA_DOMAIN_SUFFIXES = [
  'starmakerstudios.com',
  'smintro.com',
  'ushow.media',
];

export function isValidStarMakerUrl(urlString: string): boolean {
  try {
    const url = new URL(urlString);

    // Only allow http/https
    if (!['http:', 'https:'].includes(url.protocol)) return false;

    const hostname = url.hostname.toLowerCase().replace(/^www\./, '');

    // Allow the existing StarMaker short-link domain
    if (hostname === 'starmaker.onelink.me') {
      return true;
    }

    // Allow the existing star-maker.com domain
    if (hostname === 'star-maker.com') {
      return true;
    }

    // Allow StarMaker's direct public recording page
    if (hostname === 'm.starmakerstudios.com') {
      return url.pathname === '/a-vue3/playrecording';
    }

    return false;
  } catch {
    return false;
  }
}

/**
 * Simple SSRF guard – ensure the URL does not resolve to a private IP address.
 * This function performs a DNS lookup via fetch to a known service; however,
 * for simplicity we just block obviously suspicious hostnames.
 */
export function isSafeHost(hostname: string): boolean {
  // Reject localhost and typical private network names
  const unsafe = ['localhost', '127.0.0.1', '::1'];
  if (unsafe.includes(hostname)) return false;
  // Reject internal domains ending with .local or .internal
  if (hostname.endsWith('.local') || hostname.endsWith('.internal')) return false;
  return true;
}

/**
 * Media URLs are fetched by the server before being streamed to the browser.
 * Keep this allowlist separate from shared-page validation to avoid turning the
 * download route into an open proxy.
 */
export function isAllowedStarMakerMediaUrl(urlString: string): boolean {
  try {
    const url = new URL(urlString);
    if (!['http:', 'https:'].includes(url.protocol)) return false;

    const hostname = url.hostname.toLowerCase().replace(/^www\./, '');
    return ALLOWED_MEDIA_DOMAIN_SUFFIXES.some(
      (domain) => hostname === domain || hostname.endsWith(`.${domain}`),
    );
  } catch {
    return false;
  }
}
