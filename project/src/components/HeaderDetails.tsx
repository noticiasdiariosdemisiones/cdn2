import React from 'react';

interface HeaderDetailsProps {
  headers: Record<string, string>;
}

// Headers that should be highlighted as important for cache analysis
const IMPORTANT_CACHE_HEADERS = [
  'cache-control',
  'cf-cache-status',
  'x-cache',
  'x-fastcgi-cache',
  'age',
  'expires',
  'etag',
  'last-modified',
];

const HeaderDetails: React.FC<HeaderDetailsProps> = ({ headers }) => {
  if (!headers || Object.keys(headers).length === 0) {
    return (
      <div className="text-sm text-gray-500 dark:text-gray-400 italic">
        No headers available
      </div>
    );
  }
  
  // Sort headers: important ones first, then alphabetically
  const sortedHeaders = Object.entries(headers).sort((a, b) => {
    const aKey = a[0].toLowerCase();
    const bKey = b[0].toLowerCase();
    
    const aIsImportant = IMPORTANT_CACHE_HEADERS.includes(aKey);
    const bIsImportant = IMPORTANT_CACHE_HEADERS.includes(bKey);
    
    if (aIsImportant && !bIsImportant) return -1;
    if (!aIsImportant && bIsImportant) return 1;
    
    return aKey.localeCompare(bKey);
  });
  
  return (
    <div className="overflow-hidden rounded-md border border-gray-200 dark:border-gray-700">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-800">
            <tr>
              <th 
                scope="col" 
                className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
              >
                Header
              </th>
              <th 
                scope="col" 
                className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
              >
                Value
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-800">
            {sortedHeaders.map(([key, value]) => {
              const isImportant = IMPORTANT_CACHE_HEADERS.includes(key.toLowerCase());
              
              return (
                <tr 
                  key={key}
                  className={`${
                    isImportant ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                  } hover:bg-gray-50 dark:hover:bg-gray-800`}
                >
                  <td className="px-4 py-2 text-sm font-medium text-gray-900 dark:text-gray-100">
                    {isImportant ? (
                      <span className="font-semibold">{key}</span>
                    ) : (
                      key
                    )}
                  </td>
                  <td className="px-4 py-2 text-sm text-gray-500 dark:text-gray-400 font-mono break-all">
                    {value}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default HeaderDetails;