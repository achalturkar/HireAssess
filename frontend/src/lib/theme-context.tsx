'use client';

import { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'light' | 'dark';

interface ThemeContextValue {
  theme: Theme;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export function ThemeProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  // Default is dark
  const [theme, setTheme] = useState<Theme>('dark');

  // Load saved theme
  useEffect(() => {
    const stored = localStorage.getItem('hireassess-theme') as Theme | null;

    if (stored === 'light' || stored === 'dark') {
      setTheme(stored);
    } else {
      // First visit → Dark Mode
      setTheme('dark');
    }
  }, []);

  // Apply theme
  useEffect(() => {
    document.documentElement.classList.toggle(
      'dark',
      theme === 'dark'
    );

    localStorage.setItem('hireassess-theme', theme);
  }, [theme]);

  const toggleTheme = () =>
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }

  return context;
}