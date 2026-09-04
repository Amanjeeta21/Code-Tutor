import { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'Dark' | 'Light' | 'System';

interface ThemeContextType {
  theme: Theme;
  isDark: boolean;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('skill-lens-theme');
      if (stored === 'Dark' || stored === 'Light' || stored === 'System') return stored as Theme;
      return 'Dark'; // default theme is Dark
    }
    return 'Dark';
  });

  const [systemIsDark, setSystemIsDark] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return true;
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleSystemThemeChange = (event: MediaQueryListEvent) => {
      setSystemIsDark(event.matches);
    };
    mediaQuery.addEventListener('change', handleSystemThemeChange);
    return () => mediaQuery.removeEventListener('change', handleSystemThemeChange);
  }, []);

  const isDark = theme === 'System' ? systemIsDark : theme === 'Dark';

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    localStorage.setItem('skill-lens-theme', newTheme);
    
    // Dispatch custom event to notify other potential listeners
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('skill-lens:theme-changed'));
    }
  };

  const toggleTheme = () => {
    // If system is active or current is dark, toggle to light. Else to dark.
    setTheme(isDark ? 'Light' : 'Dark');
  };

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(isDark ? 'dark' : 'light');
  }, [isDark]);

  return (
    <ThemeContext.Provider value={{ theme, isDark, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
