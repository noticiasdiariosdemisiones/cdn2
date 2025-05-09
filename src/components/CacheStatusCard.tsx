import React, { useState } from 'react';
import { 
  Clock, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  ChevronDown, 
  ChevronUp, 
  Trash2, 
  ExternalLink,
  ToggleLeft,
  ToggleRight,
  BarChart2,
  History,
  Gauge
} from 'lucide-react';
import { CacheStatus, MonitoredSite, MonitoringStats, IntervalOption } from '../types';
import HeaderDetails from './HeaderDetails';
import MonitoringLog from './MonitoringLog';
import PageSpeedIndicator from './PageSpeedIndicator';

interface CacheStatusCardProps {
  site: MonitoredSite;
  stats: MonitoringStats;
  intervalOptions: IntervalOption[];
  onRemove: (siteId: string) => void;
  onToggleActive: (siteId: string, isActive: boolean) => void;
  onUpdateInterval: (site: MonitoredSite, interval: number | 'smart') => void;
}

const CacheStatusCard: React.FC<CacheStatusCardProps> = ({
  site,
  stats,
  intervalOptions,
  onRemove,
  onToggleActive,
  onUpdateInterval,
}) => {
  const [expanded, setExpanded] = useState(false);
  const [showLog, setShowLog] = useState(false);
  const { lastStatus } = stats;
  
  if (!lastStatus) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4">
        <div className="animate-pulse flex flex-col">
          <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-4"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-2"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
        </div>
      </div>
    );
  }
  
  const getStatusColor = (status: CacheStatus['status']) => {
    switch (status) {
      case 'hit':
        return 'text-green-500';
      case 'miss':
        return 'text-yellow-500';
      case 'expired':
        return 'text-orange-500';
      case 'revalidated':
        return 'text-blue-500';
      default:
        return 'text-gray-500';
    }
  };
  
  const getStatusBgColor = (status: CacheStatus['status']) => {
    switch (status) {
      case 'hit':
        return 'bg-green-100 dark:bg-green-900/30';
      case 'miss':
        return 'bg-yellow-100 dark:bg-yellow-900/30';
      case 'expired':
        return 'bg-orange-100 dark:bg-orange-900/30';
      case 'revalidated':
        return 'bg-blue-100 dark:bg-blue-900/30';
      default:
        return 'bg-gray-100 dark:bg-gray-700';
    }
  };
  
  const getStatusIcon = (status: CacheStatus['status'], isError: boolean) => {
    if (isError) return <AlertTriangle className="h-5 w-5 text-red-500" />;
    
    switch (status) {
      case 'hit':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'miss':
        return <XCircle className="h-5 w-5 text-yellow-500" />;
      case 'expired':
        return <AlertTriangle className="h-5 w-5 text-orange-500" />;
      case 'revalidated':
        return <Clock className="h-5 w-5 text-blue-500" />;
      default:
        return <Clock className="h-5 w-5 text-gray-500" />;
    }
  };
  
  const formatTime = (date?: Date) => {
    if (!date) return 'Never';
    
    return new Intl.DateTimeFormat('default', {
      hour: 'numeric',
      minute: 'numeric',
      second: 'numeric',
    }).format(date);
  };
  
  const getResponseTimeBadge = (time: number) => {
    const getBadgeColor = () => {
      if (time < 300) return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
      if (time < 1000) return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300';
      return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
    };
    
    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getBadgeColor()}`}>
        {time}ms
      </span>
    );
  };
  
  const getTypeLabel = (type?: CacheStatus['type']) => {
    switch (type) {
      case 'cloudflare':
        return 'Cloudflare';
      case 'wordpress':
        return 'WordPress';
      case 'nginx':
        return 'Nginx';
      case 'varnish':
        return 'Varnish';
      default:
        return 'Unknown';
    }
  };
  
  const formatHitRate = (rate: number) => {
    return `${Math.round(rate)}%`;
  };
  
  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden transition-all ${
      expanded ? 'ring-2 ring-blue-500' : ''
    }`}>
      {/* Header */}
      <div className="p-4 border-b dark:border-gray-700">
        <div className="flex justify-between">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <a 
              href={site.url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="hover:underline flex items-center gap-1"
            >
              {new URL(site.url).hostname}
              <ExternalLink size={16} className="inline-block opacity-60" />
            </a>
          </h3>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => onToggleActive(site.id, !site.isActive)}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
              aria-label={site.isActive ? 'Pause monitoring' : 'Resume monitoring'}
            >
              {site.isActive ? (
                <ToggleRight className="h-5 w-5 text-green-500" />
              ) : (
                <ToggleLeft className="h-5 w-5 text-gray-500" />
              )}
            </button>
            
            <button
              onClick={() => setExpanded(!expanded)}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
              aria-label={expanded ? 'Collapse details' : 'Expand details'}
            >
              {expanded ? (
                <ChevronUp className="h-5 w-5" />
              ) : (
                <ChevronDown className="h-5 w-5" />
              )}
            </button>
            
            <button
              onClick={() => onRemove(site.id)}
              className="text-gray-500 hover:text-red-500 dark:text-gray-400 dark:hover:text-red-400"
              aria-label="Remove site"
            >
              <Trash2 className="h-5 w-5" />
            </button>
          </div>
        </div>
        
        {/* PageSpeed Results */}
        {site.pageSpeedResults && (
          <div className="mt-2">
            <PageSpeedIndicator results={site.pageSpeedResults} />
          </div>
        )}
      </div>
      
      {/* Status Summary */}
      <div className="p-4">
        <div className="flex flex-col md:flex-row justify-between gap-4">
          <div className="flex items-center gap-3">
            <div 
              className={`p-2 rounded-full ${getStatusBgColor(lastStatus.status)}`}
            >
              {getStatusIcon(lastStatus.status, lastStatus.isError)}
            </div>
            
            <div>
              <p className={`font-medium ${getStatusColor(lastStatus.status)}`}>
                {lastStatus.isError ? 'Error' : `Cache ${lastStatus.status.toUpperCase()}`}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {lastStatus.isError 
                  ? lastStatus.errorMessage 
                  : `${getTypeLabel(lastStatus.type)} detected`}
              </p>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-x-6 gap-y-2">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Response Time</p>
              <p className="font-medium">{getResponseTimeBadge(lastStatus.responseTime)}</p>
            </div>
            
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Cache Hit Rate</p>
              <p className="font-medium">
                {formatHitRate(stats.hitRate)}
                <span className="ml-1 text-sm text-gray-500 dark:text-gray-400">
                  ({stats.history.length} checks)
                </span>
              </p>
            </div>
            
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Last Checked</p>
              <p className="font-medium">{formatTime(site.lastChecked)}</p>
            </div>
          </div>
        </div>
        
        {/* Log Toggle Button */}
        <button
          onClick={() => setShowLog(!showLog)}
          className="mt-4 flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
        >
          <History className="h-4 w-4" />
          {showLog ? 'Hide History' : 'Show History'}
          {showLog ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>
        
        {/* Monitoring Log */}
        {showLog && (
          <div className="mt-4 border-t dark:border-gray-700 pt-4">
            <MonitoringLog history={stats.history} />
          </div>
        )}
      </div>
      
      {/* Expanded Details */}
      {expanded && (
        <div className="border-t dark:border-gray-700">
          <div className="p-4">
            <div className="mb-4">
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Monitoring Settings
              </h4>
              <div className="flex items-center gap-3">
                <div>
                  <label 
                    htmlFor={`interval-${site.id}`} 
                    className="block text-xs text-gray-500 dark:text-gray-400"
                  >
                    Check Interval
                  </label>
                  <select
                    id={`interval-${site.id}`}
                    value={site.interval}
                    onChange={(e) => onUpdateInterval(site, e.target.value === 'smart' ? 'smart' : Number(e.target.value))}
                    className="mt-1 block w-full pl-3 pr-10 py-1 text-sm border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  >
                    <option value="smart">Smart Interval</option>
                    {intervalOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  {site.interval === 'smart' && site.cacheExpiration && (
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      Cache expires: {formatTime(site.cacheExpiration)}
                    </p>
                  )}
                </div>
                
                <div className="flex-1">
                  <p className="text-xs text-gray-500 dark:text-gray-400">Status</p>
                  <p className="text-sm font-medium">
                    {site.isActive ? (
                      <span className="text-green-500">Active</span>
                    ) : (
                      <span className="text-gray-500">Paused</span>
                    )}
                  </p>
                </div>
              </div>
            </div>
            
            <div>
              <div className="flex items-center gap-2 mb-2">
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Cache Performance
                </h4>
                <BarChart2 className="h-4 w-4 text-gray-400" />
              </div>
              
              <div className="h-6 w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-green-500 transition-all duration-500"
                  style={{ width: `${stats.hitRate}%` }}
                ></div>
              </div>
              <div className="flex justify-between mt-1 text-xs text-gray-500 dark:text-gray-400">
                <span>Cache Hit: {formatHitRate(stats.hitRate)}</span>
                <span>Cache Miss: {formatHitRate(stats.missRate)}</span>
              </div>
            </div>
          </div>
          
          {/* Headers Section */}
          <div className="border-t dark:border-gray-700 p-4">
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Response Headers
            </h4>
            <HeaderDetails headers={lastStatus.headers} />
          </div>
        </div>
      )}
    </div>
  );
};

export default CacheStatusCard;