import { CacheStatus } from '../types';

/**
 * Analyzes HTTP headers to determine cache status
 */
export const analyzeCacheHeaders = (
  headers: Record<string, string>,
  responseTime: number
): Pick<CacheStatus, 'type' | 'status' | 'isError' | 'errorMessage'> => {
  // Default result
  let result: Pick<CacheStatus, 'type' | 'status' | 'isError' | 'errorMessage'> = {
    type: 'unknown',
    status: 'unknown',
    isError: false,
  };

  try {
    // Check for Cloudflare headers
    if (
      headers['cf-cache-status'] ||
      headers['cf-ray'] ||
      headers['server']?.toLowerCase().includes('cloudflare')
    ) {
      result.type = 'cloudflare';
      const cfStatus = headers['cf-cache-status']?.toLowerCase();
      
      if (cfStatus === 'hit') result.status = 'hit';
      else if (cfStatus === 'miss') result.status = 'miss';
      else if (cfStatus === 'expired') result.status = 'expired';
      else if (cfStatus === 'revalidated') result.status = 'revalidated';
    }
    
    // Check for WordPress headers
    else if (
      headers['x-powered-by']?.toLowerCase().includes('wordpress') ||
      headers['link']?.includes('wp-json')
    ) {
      result.type = 'wordpress';
      // WordPress typically uses Cache-Control and ETag
      if (headers['x-cache']?.toLowerCase().includes('hit')) result.status = 'hit';
      else if (headers['x-cache']?.toLowerCase().includes('miss')) result.status = 'miss';
      else {
        // Check standard cache headers
        const cacheControl = headers['cache-control']?.toLowerCase() || '';
        if (cacheControl.includes('max-age') && !cacheControl.includes('no-cache')) {
          result.status = headers['age'] ? 'hit' : 'miss';
        } else {
          result.status = 'miss';
        }
      }
    }
    
    // Check for Nginx headers
    else if (
      headers['server']?.toLowerCase().includes('nginx') ||
      headers['x-powered-by']?.toLowerCase().includes('nginx')
    ) {
      result.type = 'nginx';
      if (headers['x-cache']?.toLowerCase().includes('hit')) result.status = 'hit';
      else if (headers['x-cache']?.toLowerCase().includes('miss')) result.status = 'miss';
      else {
        // Nginx FastCGI cache
        const fastcgiCache = headers['x-fastcgi-cache']?.toLowerCase();
        if (fastcgiCache === 'hit') result.status = 'hit';
        else if (fastcgiCache === 'miss') result.status = 'miss';
        else result.status = 'unknown';
      }
    }
    
    // Check for Varnish headers
    else if (
      headers['x-varnish'] ||
      headers['via']?.toLowerCase().includes('varnish')
    ) {
      result.type = 'varnish';
      if (headers['x-cache']?.toLowerCase().includes('hit')) result.status = 'hit';
      else if (headers['x-cache']?.toLowerCase().includes('miss')) result.status = 'miss';
      else result.status = 'unknown';
    }
    
    // Generic cache headers
    else {
      // Check standard cache headers
      const cacheControl = headers['cache-control']?.toLowerCase() || '';
      if (cacheControl.includes('max-age') && !cacheControl.includes('no-cache')) {
        result.status = headers['age'] ? 'hit' : 'miss';
      }
    }
    
    return result;
  } catch (error) {
    return {
      type: 'unknown',
      status: 'unknown',
      isError: true,
      errorMessage: error instanceof Error ? error.message : 'Unknown error analyzing headers',
    };
  }
};

/**
 * Extracts important cache-related headers from the full headers object
 */
export const getRelevantHeaders = (allHeaders: Record<string, string>): Record<string, string> => {
  const relevantHeaderNames = [
    // Common cache headers
    'cache-control',
    'etag',
    'age',
    'expires',
    'last-modified',
    'date',
    // CDN specific
    'cf-cache-status',
    'cf-ray',
    'x-cache',
    'x-cache-hits',
    'x-fastcgi-cache',
    'x-varnish',
    'x-served-by',
    // Server identification
    'server',
    'x-powered-by',
    'via',
    // Security
    'strict-transport-security',
    'content-security-policy',
    // Content
    'content-type',
    'content-encoding',
    'content-length',
    'transfer-encoding',
    'vary',
  ];

  // Create a new object with only relevant headers
  const relevantHeaders: Record<string, string> = {};
  for (const [key, value] of Object.entries(allHeaders)) {
    if (relevantHeaderNames.includes(key.toLowerCase())) {
      relevantHeaders[key] = value;
    }
  }

  return relevantHeaders;
};