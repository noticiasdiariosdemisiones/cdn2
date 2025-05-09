import React from 'react';
import { Gauge } from 'lucide-react';
import { PageSpeedResults } from '../types';
import { formatDistanceToNow } from 'date-fns';

interface PageSpeedIndicatorProps {
  results?: PageSpeedResults;
}

const PageSpeedIndicator: React.FC<PageSpeedIndicatorProps> = ({ results }) => {
  if (!results) {
    return (
      <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
        <Gauge className="h-4 w-4" />
        <span>PageSpeed: Pending</span>
      </div>
    );
  }

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-500';
    if (score >= 50) return 'text-yellow-500';
    return 'text-red-500';
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
        <Gauge className="h-4 w-4" />
        <span>PageSpeed Metrics</span>
        <span className="text-xs text-gray-500 dark:text-gray-400">
          ({formatDistanceToNow(results.timestamp, { addSuffix: true })})
        </span>
      </div>
      
      <div className="grid grid-cols-2 gap-2 text-sm">
        <div>
          <span className="text-gray-500 dark:text-gray-400">Performance: </span>
          <span className={getScoreColor(results.performance)}>{Math.round(results.performance)}</span>
        </div>
        <div>
          <span className="text-gray-500 dark:text-gray-400">Accessibility: </span>
          <span className={getScoreColor(results.accessibility)}>{Math.round(results.accessibility)}</span>
        </div>
        <div>
          <span className="text-gray-500 dark:text-gray-400">Best Practices: </span>
          <span className={getScoreColor(results.bestPractices)}>{Math.round(results.bestPractices)}</span>
        </div>
        <div>
          <span className="text-gray-500 dark:text-gray-400">SEO: </span>
          <span className={getScoreColor(results.seo)}>{Math.round(results.seo)}</span>
        </div>
      </div>
    </div>
  );
};

export default PageSpeedIndicator;