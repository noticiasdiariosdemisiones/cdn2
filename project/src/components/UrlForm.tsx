import React, { useState } from 'react';
import { PlusCircle } from 'lucide-react';
import { MonitoredSite, IntervalOption } from '../types';

interface UrlFormProps {
  onAddSite: (site: Omit<MonitoredSite, 'id'>) => string;
  intervalOptions: IntervalOption[];
}

const UrlForm: React.FC<UrlFormProps> = ({ onAddSite, intervalOptions }) => {
  const [url, setUrl] = useState('');
  const [interval, setInterval] = useState<number | 'smart'>('smart'); // Default to smart
  const [isValid, setIsValid] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  
  const validateUrl = (value: string): boolean => {
    if (!value) {
      setErrorMessage('URL is required');
      return false;
    }
    
    try {
      // Add protocol if missing
      let urlToCheck = value;
      if (!urlToCheck.startsWith('http://') && !urlToCheck.startsWith('https://')) {
        urlToCheck = 'https://' + urlToCheck;
      }
      
      new URL(urlToCheck);
      
      // Simple additional validation for common issues
      if (!urlToCheck.includes('.')) {
        setErrorMessage('URL should include a domain name');
        return false;
      }
      
      return true;
    } catch (error) {
      setErrorMessage('Please enter a valid URL');
      return false;
    }
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Format URL if needed
    let formattedUrl = url;
    if (!formattedUrl.startsWith('http://') && !formattedUrl.startsWith('https://')) {
      formattedUrl = 'https://' + formattedUrl;
    }
    
    // Validate URL
    if (!validateUrl(formattedUrl)) {
      setIsValid(false);
      return;
    }
    
    // Add site
    onAddSite({
      url: formattedUrl,
      interval,
      isActive: true,
    });
    
    // Reset form
    setUrl('');
    setIsValid(true);
    setErrorMessage('');
  };
  
  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUrl(e.target.value);
    
    // Reset validation state when the user types
    if (!isValid) {
      setIsValid(true);
      setErrorMessage('');
    }
  };
  
  return (
    <form 
      onSubmit={handleSubmit} 
      className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow-md"
    >
      <div className="flex flex-col md:flex-row gap-3">
        <div className="flex-1">
          <label htmlFor="url" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Website URL
          </label>
          <input
            type="text"
            id="url"
            value={url}
            onChange={handleUrlChange}
            placeholder="Enter website URL (e.g., example.com)"
            className={`w-full px-3 py-2 border ${
              isValid ? 'border-gray-300 dark:border-gray-600' : 'border-red-500'
            } rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white`}
          />
          {!isValid && (
            <p className="mt-1 text-sm text-red-500">{errorMessage}</p>
          )}
        </div>
        
        <div className="w-full md:w-40">
          <label htmlFor="interval" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Check Interval
          </label>
          <select
            id="interval"
            value={interval}
            onChange={(e) => setInterval(e.target.value === 'smart' ? 'smart' : Number(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
          >
            <option value="smart">Smart Interval</option>
            {intervalOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        
        <div className="flex items-end">
          <button
            type="submit"
            className="w-full md:w-auto px-4 py-2 bg-blue-500 text-white rounded-md flex items-center justify-center gap-2 hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
          >
            <PlusCircle size={18} />
            <span>Add Site</span>
          </button>
        </div>
      </div>
    </form>
  );
};

export default UrlForm;