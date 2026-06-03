import { useTheme } from '../context/ThemeContext';

export function useDarkMode() {
  return useTheme();
}
