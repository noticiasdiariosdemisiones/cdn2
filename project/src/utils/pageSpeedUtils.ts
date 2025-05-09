import { PageSpeedResults } from '../types';

const PAGESPEED_API_KEY = 'YOUR_API_KEY'; // Replace with your API key

export const fetchPageSpeedResults = async (url: string): Promise<PageSpeedResults> => {
  const apiUrl = `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(url)}&key=${PAGESPEED_API_KEY}&strategy=mobile`;

  try {
    const response = await fetch(apiUrl);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error?.message || 'Failed to fetch PageSpeed results');
    }

    const { lighthouseResult } = data;
    const { categories } = lighthouseResult;

    return {
      performance: categories.performance.score * 100,
      accessibility: categories.accessibility.score * 100,
      bestPractices: categories['best-practices'].score * 100,
      seo: categories.seo.score * 100,
      timestamp: new Date(),
    };
  } catch (error) {
    console.error('PageSpeed API error:', error);
    throw error;
  }
};

export const shouldRunPageSpeedCheck = (lastCheck?: Date): boolean => {
  if (!lastCheck) return true;
  
  const oneDayAgo = new Date();
  oneDayAgo.setDate(oneDayAgo.getDate() - 1);
  
  return lastCheck < oneDayAgo;
};