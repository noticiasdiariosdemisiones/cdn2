import React from 'react';
import { Play, Pause, RefreshCw } from 'lucide-react';

interface MonitoringControlsProps {
  isRunning: boolean;
  toggleMonitoring: (newState?: boolean) => void;
  refreshAll: () => void;
  sitesCount: number;
}

const MonitoringControls: React.FC<MonitoringControlsProps> = ({
  isRunning,
  toggleMonitoring,
  refreshAll,
  sitesCount,
}) => {
  return (
    <div className="flex items-center gap-3 bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md">
      <button
        onClick={() => toggleMonitoring()}
        disabled={sitesCount === 0}
        className={`px-4 py-2 rounded-md flex items-center gap-2 transition-colors ${
          isRunning 
            ? 'bg-yellow-500 hover:bg-yellow-600 text-white' 
            : 'bg-green-500 hover:bg-green-600 text-white'
        } ${sitesCount === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        {isRunning ? (
          <>
            <Pause size={18} />
            <span>Pause</span>
          </>
        ) : (
          <>
            <Play size={18} />
            <span>Resume</span>
          </>
        )}
      </button>
      
      <button
        onClick={refreshAll}
        disabled={sitesCount === 0}
        className={`px-4 py-2 bg-blue-500 text-white rounded-md flex items-center gap-2 hover:bg-blue-600 transition-colors ${
          sitesCount === 0 ? 'opacity-50 cursor-not-allowed' : ''
        }`}
      >
        <RefreshCw size={18} />
        <span>Refresh All</span>
      </button>
      
      <div className="ml-auto text-sm text-gray-600 dark:text-gray-400">
        {sitesCount} {sitesCount === 1 ? 'site' : 'sites'} monitored
      </div>
    </div>
  );
};

export default MonitoringControls;