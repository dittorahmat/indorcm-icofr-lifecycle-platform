import { useState, useEffect } from 'react';

export function useTheme() {
  const [isDark] = useState(false);

  useEffect(() => {
    document.documentElement.classList.remove('dark');
    document.documentElement.style.colorScheme = 'light';
    localStorage.setItem('theme', 'light');

    let meta = document.querySelector('meta[name="color-scheme"]');
    if (!meta) {
      meta = document.createElement('meta');
      meta.setAttribute('name', 'color-scheme');
      document.head.appendChild(meta);
    }
    meta.setAttribute('content', 'light');
  }, []);

  const toggleTheme = () => {
    // Theme is locked to light mode
  };

  return { isDark, toggleTheme };
}
