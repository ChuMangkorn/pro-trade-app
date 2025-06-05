'use client';
import { useEffect, useState } from 'react';

export function useIsDarkMode() {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const check = () => {
      setIsDark(document.documentElement.classList.contains('dark'));
    };

    // Initial check
    check();

    // Listen for changes to the class attribute on the html element
    const observer = new MutationObserver(check);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });

    // Optional: Listen for storage events if dark mode can be toggled from other tabs/windows
    // window.addEventListener('storage', check);

    return () => {
      observer.disconnect();
      // window.removeEventListener('storage', check);
    };
  }, []);

  return isDark;
} 