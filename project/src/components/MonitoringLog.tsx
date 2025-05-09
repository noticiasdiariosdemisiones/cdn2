import React from 'react';
import { CacheStatus } from '../types';
import { CheckCircle, XCircle, AlertTriangle, Clock } from 'lucide-react';

interface MonitoringLogProps {
  history: CacheStatus[];
}

const MonitoringLog: React.FC<MonitoringLogProps> = ({ history }) => {
  const formatTime = (date: Date) => {
    return new Intl.DateTimeFormat('default', {
      hour: 'numeric',
      minute: 'numeric',
      second: 'numeric',
    }).format(date);
  };

  const getStatusIcon = (status: CacheStatus['status'], isError: boolean) => {
    if (isError) return <AlertTriangle className="h-4 w-4 text-red-500" />;
    
    switch (status) {
      case 'hit':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'miss':
        return <XCircle className="h-4 w-4 text-yellow-500" />;
      case 'expired':
        return <AlertTriangle className="h-4 w-4 text-orange-500" />;
      case 'revalidated':
        return <Clock className="h-4 w-4 text-blue-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

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

  return (
    <div className="space-y-2 max-h-60 overflow-y-auto">
      {history.map((check, index) => (
        <div 
          key={index}
          className="flex items-center gap-3 p-2 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
        >
          {getStatusIcon(check.status, check.isError)}
          
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className={`text-sm font-medium ${getStatusColor(check.status)}`}>
                {check.isError ? 'Error' : `Cache ${check.status.toUpperCase()}`}
              </span>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {formatTime(check.timestamp)}
              </span>
            </div>
            
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {check.isError 
                ? check.errorMessage 
                : `Response time: ${check.responseTime}ms`}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
};

export default MonitoringLog;