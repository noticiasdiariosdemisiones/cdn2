export const detectPlatform = (headers: Record<string, string>) => {
  // WordPress detection
  if (
    headers['x-powered-by']?.toLowerCase().includes('wordpress') ||
    headers['link']?.includes('wp-json') ||
    headers['x-pingback']?.includes('/xmlrpc.php')
  ) {
    return 'wordpress';
  }
  
  // Cloudflare detection
  if (
    headers['cf-ray'] ||
    headers['server']?.toLowerCase().includes('cloudflare')
  ) {
    return 'cloudflare';
  }
  
  // Nginx detection
  if (
    headers['server']?.toLowerCase().includes('nginx') ||
    headers['x-powered-by']?.toLowerCase().includes('nginx')
  ) {
    return 'nginx';
  }
  
  // Varnish detection
  if (
    headers['x-varnish'] ||
    headers['via']?.toLowerCase().includes('varnish')
  ) {
    return 'varnish';
  }
  
  return 'unknown';
};

export const getCacheExpiration = (headers: Record<string, string>): Date | undefined => {
  // Try Cache-Control max-age
  const cacheControl = headers['cache-control'];
  if (cacheControl) {
    const maxAgeMatch = cacheControl.match(/max-age=(\d+)/);
    if (maxAgeMatch) {
      const maxAge = parseInt(maxAgeMatch[1], 10);
      const expiration = new Date();
      expiration.setSeconds(expiration.getSeconds() + maxAge);
      return expiration;
    }
  }
  
  // Try Expires header
  const expires = headers['expires'];
  if (expires) {
    const expirationDate = new Date(expires);
    if (!isNaN(expirationDate.getTime())) {
      return expirationDate;
    }
  }
  
  return undefined;
};

export const calculateSmartInterval = (
  cacheExpiration?: Date,
  responseTime: number = 0
): number => {
  if (!cacheExpiration) {
    return 30000; // Default to 30 seconds if no expiration found
  }
  
  const now = new Date();
  const timeUntilExpiration = cacheExpiration.getTime() - now.getTime();
  
  if (timeUntilExpiration <= 0) {
    return 30000; // Already expired, check every 30 seconds
  }
  
  // Check 30 seconds before expiration and right after
  if (timeUntilExpiration < 60000) { // Less than 1 minute until expiration
    return Math.max(5000, Math.min(timeUntilExpiration / 2, 30000));
  }
  
  // For longer cache times, check periodically
  return Math.min(timeUntilExpiration / 4, 300000); // Max 5 minutes
};