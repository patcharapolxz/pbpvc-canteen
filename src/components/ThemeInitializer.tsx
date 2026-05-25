'use client';

import { useEffect } from 'react';
import { useAppStore } from '@/lib/store';

export default function ThemeInitializer() {
  const { theme, fontSize } = useAppStore();

  useEffect(() => {
    if (typeof document !== 'undefined') {
      // Apply theme to document element
      document.documentElement.setAttribute('data-theme', theme);
      
      // Apply font size class to body
      const body = document.body;
      body.classList.remove('font-sm', 'font-md', 'font-lg');
      body.classList.add(`font-${fontSize}`);
    }
  }, [theme, fontSize]);

  return null;
}
