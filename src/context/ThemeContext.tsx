import React, { createContext, useState, useEffect, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Appearance } from 'react-native';

interface Colors {
  background: string;
  text: string;
  textSecondary: string;
  card: string;
  border: string;
  primary: string;
  danger: string;
}

interface ThemeContextData {
  isDarkMode: boolean;
  toggleTheme: () => void;
  colors: Colors;
}

const ThemeContext = createContext<ThemeContextData>({} as ThemeContextData);

export const lightColors: Colors = {
  background: '#f8fafc',
  text: '#0f172a',
  textSecondary: '#64748b',
  card: '#ffffff',
  border: '#cbd5e1',
  primary: '#3b82f6',
  danger: '#ef4444',
};

export const darkColors: Colors = {
  background: '#0f172a',
  text: '#f8fafc',
  textSecondary: '#94a3b8',
  card: '#1e293b',
  border: '#334155',
  primary: '#3b82f6',
  danger: '#ef4444',
};

const THEME_STORAGE_KEY = '@agenda_theme';

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const systemTheme = Appearance.getColorScheme();
  const [isDarkMode, setIsDarkMode] = useState<boolean>(systemTheme === 'dark');
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    loadTheme();
  }, []);

  const loadTheme = async () => {
    try {
      const storedTheme = await AsyncStorage.getItem(THEME_STORAGE_KEY);
      if (storedTheme !== null) {
        setIsDarkMode(storedTheme === 'dark');
      }
    } catch (e) {
      console.error('Failed to load theme preference', e);
    } finally {
      setIsLoaded(true);
    }
  };

  const toggleTheme = async () => {
    try {
      const newMode = !isDarkMode;
      setIsDarkMode(newMode);
      await AsyncStorage.setItem(THEME_STORAGE_KEY, newMode ? 'dark' : 'light');
    } catch (e) {
      console.error('Failed to save theme preference', e);
    }
  };

  const colors = isDarkMode ? darkColors : lightColors;

  if (!isLoaded) return null; // Avoid rendering until theme is known

  return (
    <ThemeContext.Provider value={{ isDarkMode, toggleTheme, colors }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
