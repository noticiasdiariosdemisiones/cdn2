export interface MonitoredSite {
  id: string;
  url: string;
  interval: number | 'smart'; // in milliseconds or 'smart' for automatic
  isActive: boolean;
  lastChecked?: Date;
  nextCheck?: Date;
  lastPageSpeedCheck?: Date;
  pageSpeedResults?: PageSpeedResults;
  cacheExpiration?: Date;
  platform?: 'wordpress' | 'cloudflare' | 'nginx' | 'varnish' | 'unknown';
}

export interface PageSpeedResults {
  performance: number;
  accessibility: number;
  bestPractices: number;
  seo: number;
  timestamp: Date;
}

export interface CacheStatus {
  siteId: string;
  timestamp: Date;
  headers: Record<string, string>;
  type?: 'cloudflare' | 'wordpress' | 'nginx' | 'varnish' | 'unknown';
  status: 'hit' | 'miss' | 'expired' | 'revalidated' | 'unknown';
  responseTime: number; // in milliseconds
  isError: boolean;
  errorMessage?: string;
  cacheExpiration?: Date;
}

export interface MonitoringStats {
  siteId: string;
  hitRate: number; // percentage
  missRate: number; // percentage
  avgResponseTime: number;
  lastStatus: CacheStatus | null;
  history: CacheStatus[];
}

export type IntervalOption = {
  label: string;
  value: number | 'smart'; // in milliseconds or 'smart' for automatic
};

export type Theme = 'light' | 'dark';