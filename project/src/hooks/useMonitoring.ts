import { useState, useEffect, useRef, useCallback } from 'react';
import { MonitoredSite, CacheStatus, MonitoringStats } from '../types';
import { fetchHeaders } from '../utils/headerUtils';
import { fetchPageSpeedResults, shouldRunPageSpeedCheck } from '../utils/pageSpeedUtils';
import { detectPlatform, getCacheExpiration, calculateSmartInterval } from '../utils/platformDetector';

// Maximum number of historical entries to keep per site
const MAX_HISTORY_SIZE = 100;

export const useMonitoring = (initialSites: MonitoredSite[] = []) => {
  const [sites, setSites] = useState<MonitoredSite[]>(initialSites);
  const [stats, setStats] = useState<Record<string, MonitoringStats>>({});
  const [isRunning, setIsRunning] = useState(true);
  const timersRef = useRef<Record<string, NodeJS.Timeout>>({});

  // Load sites from localStorage on initial mount
  useEffect(() => {
    try {
      const savedSites = localStorage.getItem('cachedSites');
      if (savedSites) {
        setSites(JSON.parse(savedSites));
      }
    } catch (error) {
      console.error('Failed to load sites from localStorage:', error);
    }
  }, []);

  // Save sites to localStorage when they change
  useEffect(() => {
    try {
      localStorage.setItem('cachedSites', JSON.stringify(sites));
    } catch (error) {
      console.error('Failed to save sites to localStorage:', error);
    }
  }, [sites]);

  // Function to add a new site
  const addSite = useCallback((newSite: Omit<MonitoredSite, 'id'>) => {
    const id = Date.now().toString();
    const site: MonitoredSite = {
      id,
      ...newSite,
    };
    
    setSites(prev => [...prev, site]);
    
    // Initialize stats for this site
    setStats(prev => ({
      ...prev,
      [id]: {
        siteId: id,
        hitRate: 0,
        missRate: 0,
        avgResponseTime: 0,
        lastStatus: null,
        history: [],
      },
    }));
    
    return id;
  }, []);

  // Function to remove a site
  const removeSite = useCallback((siteId: string) => {
    // Clear any existing timers
    if (timersRef.current[siteId]) {
      clearTimeout(timersRef.current[siteId]);
      delete timersRef.current[siteId];
    }
    
    setSites(prev => prev.filter(site => site.id !== siteId));
    
    // Remove stats for this site
    setStats(prev => {
      const newStats = { ...prev };
      delete newStats[siteId];
      return newStats;
    });
  }, []);

  // Function to update a site
  const updateSite = useCallback((updatedSite: MonitoredSite) => {
    setSites(prev => 
      prev.map(site => 
        site.id === updatedSite.id ? updatedSite : site
      )
    );
  }, []);

  // Function to update a site's activity status
  const toggleSiteActivity = useCallback((siteId: string, isActive: boolean) => {
    setSites(prev => 
      prev.map(site => 
        site.id === siteId ? { ...site, isActive } : site
      )
    );
  }, []);

  // Function to check a specific site
  const checkSite = useCallback(async (siteId: string) => {
    const site = sites.find(s => s.id === siteId);
    if (!site) return;
    
    try {
      // Check PageSpeed if needed
      if (shouldRunPageSpeedCheck(site.lastPageSpeedCheck)) {
        try {
          const pageSpeedResults = await fetchPageSpeedResults(site.url);
          updateSite({
            ...site,
            lastPageSpeedCheck: new Date(),
            pageSpeedResults,
          });
        } catch (error) {
          console.error('PageSpeed check failed:', error);
        }
      }

      // Fetch headers and analyze cache status
      const result = await fetchHeaders(site);
      
      // Detect platform and cache expiration
      const platform = detectPlatform(result.headers);
      const cacheExpiration = getCacheExpiration(result.headers);
      
      // Calculate next check time for smart interval
      let nextCheck: Date | undefined;
      if (site.interval === 'smart') {
        const smartInterval = calculateSmartInterval(cacheExpiration, result.responseTime);
        nextCheck = new Date(Date.now() + smartInterval);
      }
      
      // Update site with platform info and check times
      updateSite({
        ...site,
        lastChecked: new Date(),
        nextCheck,
        platform,
        cacheExpiration,
      });
      
      // Update stats
      setStats(prev => {
        const currentStats = prev[siteId] || {
          siteId,
          hitRate: 0,
          missRate: 0,
          avgResponseTime: 0,
          lastStatus: null,
          history: [],
        };
        
        const history = [result, ...currentStats.history].slice(0, MAX_HISTORY_SIZE);
        
        // Calculate new statistics
        const hits = history.filter(s => s.status === 'hit').length;
        const total = history.length;
        const hitRate = total > 0 ? (hits / total) * 100 : 0;
        const missRate = total > 0 ? 100 - hitRate : 0;
        
        const avgResponseTime = history.reduce((sum, s) => sum + s.responseTime, 0) / 
                               (history.length || 1);
        
        return {
          ...prev,
          [siteId]: {
            siteId,
            hitRate,
            missRate,
            avgResponseTime,
            lastStatus: result,
            history,
          },
        };
      });
    } catch (error) {
      console.error(`Error checking site ${site.url}:`, error);
    }
  }, [sites, updateSite]);

  // Function to manually refresh all active sites
  const refreshAll = useCallback(() => {
    sites
      .filter(site => site.isActive)
      .forEach(site => {
        checkSite(site.id);
      });
  }, [sites, checkSite]);

  // Function to start/stop monitoring
  const toggleMonitoring = useCallback((newState?: boolean) => {
    setIsRunning(prev => newState ?? !prev);
  }, []);

  // Setup and teardown monitoring timers
  useEffect(() => {
    if (!isRunning) {
      // Clear all timers
      Object.values(timersRef.current).forEach(timer => clearTimeout(timer));
      timersRef.current = {};
      return;
    }

    // Setup a monitoring timer for each active site
    const setupTimer = (site: MonitoredSite) => {
      // Clear any existing timer
      if (timersRef.current[site.id]) {
        clearTimeout(timersRef.current[site.id]);
      }
      
      // Don't set up timers for inactive sites
      if (!site.isActive) return;
      
      // For smart interval, use the next check time or calculate a new interval
      const interval = site.interval === 'smart'
        ? site.nextCheck
          ? Math.max(0, site.nextCheck.getTime() - Date.now())
          : calculateSmartInterval(site.cacheExpiration)
        : site.interval;
      
      // Check immediately if:
      // 1. Site hasn't been checked yet
      // 2. Using smart interval and no next check time is set
      if (!site.lastChecked || (site.interval === 'smart' && !site.nextCheck)) {
        checkSite(site.id);
      }
      
      // Set up the next check
      timersRef.current[site.id] = setTimeout(() => {
        checkSite(site.id).then(() => {
          // After checking, set up the next check if still active
          if (isRunning) {
            setupTimer(site);
          }
        });
      }, interval);
    };
    
    // Setup timers for all active sites
    sites.forEach(site => {
      if (site.isActive) {
        setupTimer(site);
      }
    });
    
    return () => {
      // Clean up all timers
      Object.values(timersRef.current).forEach(timer => clearTimeout(timer));
    };
  }, [sites, isRunning, checkSite]);

  return {
    sites,
    stats,
    isRunning,
    addSite,
    removeSite,
    updateSite,
    toggleSiteActivity,
    checkSite,
    refreshAll,
    toggleMonitoring,
  };
};