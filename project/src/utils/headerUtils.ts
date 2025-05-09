import { CacheStatus, MonitoredSite } from '../types';
import { analyzeCacheHeaders, getRelevantHeaders } from './cacheAnalyzer';

/**
 * Fetches headers from a URL with proper error handling
 */
export const fetchHeaders = async (site: MonitoredSite): Promise<CacheStatus> => {
  const startTime = performance.now();
  
  try {
    // Create a controller to timeout if needed
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout
    
    const response = await fetch(site.url, {
      method: 'HEAD',
      signal: controller.signal,
      mode: 'cors',
    });
    
    clearTimeout(timeoutId);
    
    const responseTime = Math.round(performance.now() - startTime);
    
    // Convert headers to a plain object
    const headers: Record<string, string> = {};
    response.headers.forEach((value, key) => {
      headers[key] = value;
    });
    
    // Extract relevant headers and analyze them
    const relevantHeaders = getRelevantHeaders(headers);
    const analysis = analyzeCacheHeaders(relevantHeaders, responseTime);
    
    return {
      siteId: site.id,
      timestamp: new Date(),
      headers: relevantHeaders,
      responseTime,
      ...analysis
    };
  } catch (error) {
    const responseTime = Math.round(performance.now() - startTime);
    
    return {
      siteId: site.id,
      timestamp: new Date(),
      headers: {},
      type: 'unknown',
      status: 'unknown',
      responseTime,
      isError: true,
      errorMessage: error instanceof Error ? error.message : 'Unknown error fetching headers',
    };
  }
};

/**
 * For demo purposes, this simulates fetching headers
 * In a real app, we would use the fetchHeaders function above
 */
export const simulateFetchHeaders = async (site: MonitoredSite): Promise<CacheStatus> => {
  const delay = Math.random() * 1000 + 200; // 200-1200ms
  await new Promise(resolve => setTimeout(resolve, delay));
  
  const responseTime = Math.round(delay);
  const timestamp = new Date();
  
  // Simulate different cache types and responses
  const cacheTypes = ['cloudflare', 'wordpress', 'nginx', 'varnish', 'unknown'] as const;
  const cacheStatuses = ['hit', 'miss', 'expired', 'revalidated', 'unknown'] as const;
  
  // Weighted random selection to favor certain values
  const type = Math.random() < 0.7 
    ? cacheTypes[Math.floor(Math.random() * 4)] 
    : 'unknown';
    
  const status = Math.random() < 0.6 
    ? 'hit' 
    : cacheStatuses[Math.floor(Math.random() * 4)];
  
  // Generate mock headers based on cache type
  const headers: Record<string, string> = {
    'date': timestamp.toUTCString(),
    'content-type': 'text/html; charset=UTF-8',
    'cache-control': 'max-age=3600, public',
    'vary': 'Accept-Encoding',
  };
  
  if (type === 'cloudflare') {
    headers['server'] = 'cloudflare';
    headers['cf-ray'] = Math.random().toString(36).substring(2, 10) + '-IAD';
    headers['cf-cache-status'] = status.toUpperCase();
  } else if (type === 'wordpress') {
    headers['x-powered-by'] = 'WordPress/6.2';
    headers['link'] = '<https://example.com/wp-json/>; rel="https://api.w.org/"';
    headers['x-cache'] = status === 'hit' ? 'HIT' : 'MISS';
  } else if (type === 'nginx') {
    headers['server'] = 'nginx/1.20.1';
    headers['x-fastcgi-cache'] = status.toUpperCase();
  } else if (type === 'varnish') {
    headers['via'] = '1.1 varnish (Varnish/6.0)';
    headers['x-varnish'] = '123456 987654';
    headers['x-cache'] = status === 'hit' ? 'HIT' : 'MISS';
    headers['age'] = status === 'hit' ? '1234' : '0';
  }
  
  const isError = Math.random() < 0.05; // 5% chance of error
  
  return {
    siteId: site.id,
    timestamp,
    headers,
    type,
    status,
    responseTime,
    isError,
    errorMessage: isError ? 'Simulated error fetching headers' : undefined,
  };
};