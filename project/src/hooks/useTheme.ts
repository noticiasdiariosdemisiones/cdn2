import { useState, useEffect } from 'react';
import { Theme } from '../types';

export const useTheme = (initialTheme: Theme = 'dark') => {
  // Try to get theme from localStorage, fallback to initialTheme
  const [theme, setTheme] = useState<Theme>(() => {
    try {
      const savedTheme = localStorage.getItem('theme');
      return (savedTheme as Theme) || initialTheme;
    } catch {
      return initialTheme;
    }
  });

  // Effect to apply theme to document and save to localStorage
  useEffect(() => {
    // Apply theme to document element
    document.documentElement.classList.remove('light', 'dark');
    document.documentElement.classList.add(theme);
    
    // Save to localStorage
    try {
      localStorage.setItem('theme', theme);
    } catch (error) {
      console.error('Failed to save theme preference:', error);
    }
  }, [theme]);

  // Function to toggle theme
  const toggleTheme = () => {
    setTheme(current => (current === 'dark' ? 'light' : 'dark'));
  };

  return { theme, setTheme, toggleTheme };
};