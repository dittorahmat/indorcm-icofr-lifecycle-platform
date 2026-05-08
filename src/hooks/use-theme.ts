import { useState, useEffect } from 'react';

export function useTheme() {
  const [isDark] = useState(false);

  useEffect(() => {
    document.documentElement.classList.remove('dark');
    localStorage.setItem('theme', 'light');
  }, []);

  const toggleTheme = () => {
    // Theme is locked to light mode
  };

  return { isDark, toggleTheme };
}
