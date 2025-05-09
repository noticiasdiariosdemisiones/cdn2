import React, { useState, useCallback } from 'react';
import Header from './components/Header';
import UrlForm from './components/UrlForm';
import MonitoringControls from './components/MonitoringControls';
import CacheStatusCard from './components/CacheStatusCard';
import EmptyState from './components/EmptyState';
import Footer from './components/Footer';
import { useMonitoring } from './hooks/useMonitoring';
import { useTheme } from './hooks/useTheme';
import { IntervalOption, MonitoredSite } from './types';

// Available interval options
const INTERVAL_OPTIONS: IntervalOption[] = [
  { label: '5 seconds', value: 5000 },
  { label: '15 seconds', value: 15000 },
  { label: '30 seconds', value: 30000 },
  { label: '1 minute', value: 60000 },
  { label: '5 minutes', value: 300000 },
];

// Example sites for demo purposes
const EXAMPLE_SITES = [
  { url: 'https://cloudflare.com', interval: 'smart' as const },
  { url: 'https://wordpress.org', interval: 'smart' as const },
];

function App() {
  const { theme, toggleTheme } = useTheme();
  const { 
    sites, 
    stats, 
    isRunning, 
    addSite, 
    removeSite, 
    updateSite,
    toggleSiteActivity,
    refreshAll,
    toggleMonitoring 
  } = useMonitoring();

  // Add example sites
  const addExampleSites = useCallback(() => {
    EXAMPLE_SITES.forEach(site => {
      addSite({
        url: site.url,
        interval: site.interval,
        isActive: true,
      });
    });
  }, [addSite]);

  // Handle interval update
  const handleUpdateInterval = useCallback((site: MonitoredSite, interval: number | 'smart') => {
    updateSite({ ...site, interval });
  }, [updateSite]);

  return (
    <div className="min-h-screen flex flex-col bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100 transition-colors">
      <Header theme={theme} toggleTheme={toggleTheme} />
      
      <main className="container mx-auto px-4 py-6 flex-1">
        <div className="space-y-4">
          <UrlForm 
            onAddSite={addSite} 
            intervalOptions={INTERVAL_OPTIONS} 
          />
          
          <MonitoringControls 
            isRunning={isRunning}
            toggleMonitoring={toggleMonitoring}
            refreshAll={refreshAll}
            sitesCount={sites.length}
          />
          
          {sites.length > 0 ? (
            <div className="grid grid-cols-1 gap-4">
              {sites.map(site => (
                stats[site.id] ? (
                  <CacheStatusCard
                    key={site.id}
                    site={site}
                    stats={stats[site.id]}
                    intervalOptions={INTERVAL_OPTIONS}
                    onRemove={removeSite}
                    onToggleActive={toggleSiteActivity}
                    onUpdateInterval={handleUpdateInterval}
                  />
                ) : null
              ))}
            </div>
          ) : (
            <EmptyState onAddExample={addExampleSites} />
          )}
        </div>
      </main>
      
      <Footer />
    </div>
  );
}

export default App