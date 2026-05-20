import { createContext, useContext, useState, useEffect } from 'react';

const ThemeCtx = createContext(null);

export function useTheme() { return useContext(ThemeCtx); }

export default function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('questlog_theme') || 'light';
  });

  useEffect(() => {
    localStorage.setItem('questlog_theme', theme);
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  const toggleTheme = () => setTheme(t => t === 'light' ? 'dark' : 'light');

  return (
    <ThemeCtx.Provider value={{ theme, setTheme, toggleTheme }}>
      {children}
    </ThemeCtx.Provider>
  );
}
