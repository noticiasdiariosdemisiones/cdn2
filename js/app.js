// Constants
const STORAGE_KEY = 'cacheMonitor';
const EXAMPLE_SITES = [
    { url: 'https://cloudflare.com', interval: 'smart' },
    { url: 'https://wordpress.org', interval: 'smart' }
];

// State
let state = {
    sites: [],
    stats: {},
    isRunning: true,
    theme: 'light'
};

// Cache for monitoring timers
const timers = new Map();

// DOM Elements
const urlForm = document.getElementById('urlForm');
const sitesList = document.getElementById('sitesList');
const emptyState = document.getElementById('emptyState');
const toggleMonitoringBtn = document.getElementById('toggleMonitoring');
const refreshAllBtn = document.getElementById('refreshAll');
const siteCount = document.getElementById('siteCount');
const themeToggle = document.getElementById('themeToggle');

// Theme Management
function initTheme() {
    const savedTheme = localStorage.getItem('theme') || 'light';
    setTheme(savedTheme);
}

function setTheme(theme) {
    state.theme = theme;
    document.body.className = `theme-${theme}`;
    localStorage.setItem('theme', theme);
}

function toggleTheme() {
    setTheme(state.theme === 'light' ? 'dark' : 'light');
}

// Site Management
function addSite(url, interval = 'smart') {
    const site = {
        id: Date.now().toString(),
        url: url.startsWith('http') ? url : `https://${url}`,
        interval,
        isActive: true,
        lastChecked: null,
        nextCheck: null
    };
    
    state.sites.push(site);
    state.stats[site.id] = {
        hitRate: 0,
        missRate: 0,
        avgResponseTime: 0,
        history: []
    };
    
    saveState();
    startMonitoring(site);
    updateUI();
}

function removeSite(id) {
    stopMonitoring(id);
    state.sites = state.sites.filter(site => site.id !== id);
    delete state.stats[id];
    saveState();
    updateUI();
}

function toggleSiteActive(id) {
    const site = state.sites.find(s => s.id === id);
    if (site) {
        site.isActive = !site.isActive;
        if (site.isActive) {
            startMonitoring(site);
        } else {
            stopMonitoring(id);
        }
        saveState();
        updateUI();
    }
}

// Monitoring
async function checkSite(site) {
    try {
        const startTime = performance.now();
        const response = await fetch(site.url, {
            method: 'HEAD',
            mode: 'cors'
        });
        
        const responseTime = Math.round(performance.now() - startTime);
        const headers = {};
        response.headers.forEach((value, key) => headers[key] = value);
        
        const result = analyzeCacheHeaders(headers, responseTime);
        updateStats(site.id, result);
        
        if (site.interval === 'smart') {
            const expiration = getCacheExpiration(headers);
            if (expiration) {
                site.nextCheck = new Date(expiration.getTime() - 5000); // Check 5s before expiration
            }
        }
        
        site.lastChecked = new Date();
        saveState();
        updateUI();
        
    } catch (error) {
        console.error(`Error checking ${site.url}:`, error);
        updateStats(site.id, {
            status: 'error',
            responseTime: 0,
            error: error.message
        });
    }
}

function startMonitoring(site) {
    if (!site.isActive || timers.has(site.id)) return;
    
    const check = () => {
        checkSite(site);
        
        // Schedule next check
        const interval = site.interval === 'smart'
            ? calculateSmartInterval(site)
            : parseInt(site.interval);
            
        timers.set(site.id, setTimeout(check, interval));
    };
    
    check(); // Initial check
}

function stopMonitoring(id) {
    const timer = timers.get(id);
    if (timer) {
        clearTimeout(timer);
        timers.delete(id);
    }
}

function toggleMonitoring() {
    state.isRunning = !state.isRunning;
    
    if (state.isRunning) {
        state.sites.forEach(site => {
            if (site.isActive) startMonitoring(site);
        });
    } else {
        timers.forEach((timer) => clearTimeout(timer));
        timers.clear();
    }
    
    updateUI();
}

function refreshAll() {
    state.sites.forEach(site => {
        if (site.isActive) checkSite(site);
    });
}

// Header Analysis
function analyzeCacheHeaders(headers, responseTime) {
    let type = 'unknown';
    let status = 'unknown';
    
    // Detect platform
    if (headers['cf-ray']) {
        type = 'cloudflare';
        status = headers['cf-cache-status']?.toLowerCase() || 'unknown';
    } else if (headers['x-powered-by']?.toLowerCase().includes('wordpress')) {
        type = 'wordpress';
        status = headers['x-cache']?.toLowerCase().includes('hit') ? 'hit' : 'miss';
    } else if (headers['server']?.toLowerCase().includes('nginx')) {
        type = 'nginx';
        status = headers['x-fastcgi-cache']?.toLowerCase() || 'unknown';
    } else if (headers['x-varnish']) {
        type = 'varnish';
        status = headers['x-cache']?.toLowerCase().includes('hit') ? 'hit' : 'miss';
    }
    
    return { type, status, responseTime, headers };
}

function getCacheExpiration(headers) {
    const cacheControl = headers['cache-control'];
    if (cacheControl) {
        const maxAge = cacheControl.match(/max-age=(\d+)/);
        if (maxAge) {
            const expires = new Date();
            expires.setSeconds(expires.getSeconds() + parseInt(maxAge[1]));
            return expires;
        }
    }
    
    const expires = headers['expires'];
    if (expires) {
        const date = new Date(expires);
        if (!isNaN(date.getTime())) return date;
    }
    
    return null;
}

function calculateSmartInterval(site) {
    if (!site.nextCheck) return 30000; // Default to 30s
    
    const now = new Date();
    const timeUntilNext = site.nextCheck.getTime() - now.getTime();
    
    return Math.max(5000, Math.min(timeUntilNext, 300000)); // Between 5s and 5m
}

// Stats Management
function updateStats(siteId, result) {
    const stats = state.stats[siteId];
    if (!stats) return;
    
    stats.history.unshift({
        timestamp: new Date(),
        ...result
    });
    
    // Keep last 100 entries
    if (stats.history.length > 100) {
        stats.history.pop();
    }
    
    // Calculate rates
    const hits = stats.history.filter(h => h.status === 'hit').length;
    stats.hitRate = (hits / stats.history.length) * 100;
    stats.missRate = 100 - stats.hitRate;
    
    // Calculate average response time
    const validTimes = stats.history.filter(h => h.responseTime > 0);
    if (validTimes.length > 0) {
        stats.avgResponseTime = validTimes.reduce((sum, h) => sum + h.responseTime, 0) / validTimes.length;
    }
}

// UI Updates
function updateUI() {
    sitesList.innerHTML = '';
    siteCount.textContent = `${state.sites.length} sites monitored`;
    
    if (state.sites.length === 0) {
        emptyState.style.display = 'block';
        sitesList.style.display = 'none';
    } else {
        emptyState.style.display = 'none';
        sitesList.style.display = 'grid';
        state.sites.forEach(renderSite);
    }
    
    toggleMonitoringBtn.querySelector('.button-text').textContent = state.isRunning ? 'Pause' : 'Resume';
    toggleMonitoringBtn.classList.toggle('active', state.isRunning);
}

function renderSite(site) {
    const stats = state.stats[site.id];
    const lastCheck = stats.history[0];
    
    const card = document.createElement('div');
    card.className = 'site-card';
    card.innerHTML = `
        <div class="site-card-header">
            <h3>${new URL(site.url).hostname}</h3>
            <div class="actions">
                <button class="btn" onclick="toggleSiteActive('${site.id}')">${site.isActive ? '⏸' : '▶'}</button>
                <button class="btn" onclick="removeSite('${site.id}')">🗑</button>
            </div>
        </div>
        <div class="site-card-content">
            ${lastCheck ? `
                <div class="status ${lastCheck.status}">
                    <strong>Cache ${lastCheck.status.toUpperCase()}</strong>
                    <span>${lastCheck.type} detected</span>
                </div>
                <div class="metrics">
                    <div>Response Time: ${lastCheck.responseTime}ms</div>
                    <div>Hit Rate: ${Math.round(stats.hitRate)}%</div>
                    <div>Last Check: ${formatTime(site.lastChecked)}</div>
                </div>
            ` : '<div class="loading">Checking...</div>'}
        </div>
    `;
    
    sitesList.appendChild(card);
}

// Utilities
function formatTime(date) {
    if (!date) return 'Never';
    return new Intl.DateTimeFormat('default', {
        hour: 'numeric',
        minute: 'numeric',
        second: 'numeric'
    }).format(new Date(date));
}

function saveState() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
        sites: state.sites,
        stats: state.stats,
        isRunning: state.isRunning
    }));
}

function loadState() {
    try {
        const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
        if (saved) {
            state.sites = saved.sites;
            state.stats = saved.stats;
            state.isRunning = saved.isRunning;
            
            // Convert date strings back to Date objects
            state.sites.forEach(site => {
                if (site.lastChecked) site.lastChecked = new Date(site.lastChecked);
                if (site.nextCheck) site.nextCheck = new Date(site.nextCheck);
            });
            
            Object.values(state.stats).forEach(stat => {
                stat.history.forEach(h => {
                    h.timestamp = new Date(h.timestamp);
                });
            });
        }
    } catch (error) {
        console.error('Error loading state:', error);
    }
}

// Event Listeners
urlForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const url = e.target.url.value;
    const interval = e.target.interval.value;
    addSite(url, interval);
    e.target.reset();
});

document.getElementById('addExample').addEventListener('click', () => {
    EXAMPLE_SITES.forEach(site => addSite(site.url, site.interval));
});

themeToggle.addEventListener('click', toggleTheme);
toggleMonitoringBtn.addEventListener('click', toggleMonitoring);
refreshAllBtn.addEventListener('click', refreshAll);

// Initialization
initTheme();
loadState();
updateUI();

if (state.isRunning) {
    state.sites.forEach(site => {
        if (site.isActive) startMonitoring(site);
    });
}