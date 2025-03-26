import { createContext, useContext, useEffect, useState, ReactNode, createElement } from 'react';

type ColorMode = 'light' | 'dark';

interface ColorModeContextType {
  colorMode: ColorMode;
  toggleColorMode: () => void;
}

export const ColorModeContext = createContext<ColorModeContextType>({
  colorMode: 'light',
  toggleColorMode: () => {},
});

export const useColorMode = () => useContext(ColorModeContext);

interface ThemeProviderProps {
  children: ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const [colorMode, setColorMode] = useState<ColorMode>('light');

  useEffect(() => {
    // Check for saved theme preference or use system preference
    const savedTheme = localStorage.getItem('theme') as ColorMode | null;
    
    if (savedTheme) {
      setColorMode(savedTheme);
      applyTheme(savedTheme);
    } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setColorMode('dark');
      applyTheme('dark');
    }
  }, []);

  const applyTheme = (theme: ColorMode) => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  };

  const toggleColorMode = () => {
    setColorMode((prevMode) => {
      const newMode = prevMode === 'light' ? 'dark' : 'light';
      applyTheme(newMode);
      return newMode;
    });
  };

  const contextValue = { colorMode, toggleColorMode };
  
  // Using createElement instead of JSX
  return createElement(
    ColorModeContext.Provider,
    { value: contextValue },
    children
  );
}