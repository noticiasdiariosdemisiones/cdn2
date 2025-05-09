import React from 'react';
import { ServerCrash } from 'lucide-react';

interface EmptyStateProps {
  onAddExample: () => void;
}

const EmptyState: React.FC<EmptyStateProps> = ({ onAddExample }) => {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8 text-center">
      <ServerCrash className="h-16 w-16 mx-auto text-gray-400 dark:text-gray-500 mb-4" />
      
      <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
        No sites being monitored
      </h3>
      
      <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-md mx-auto">
        Add a website using the form above to start monitoring its cache status. 
        You'll see detailed information about headers, cache hits, and performance.
      </p>
      
      <button
        onClick={onAddExample}
        className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
      >
        Try with an example site
      </button>
    </div>
  );
};

export default EmptyState;