import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { Theme } from '@/types/common';

interface ThemeState {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      theme: 'light',

      setTheme: (newTheme: Theme) => {
        if (typeof document !== 'undefined') {
          if (newTheme === 'dark') {
            document.documentElement.classList.add('dark');
          } else {
            document.documentElement.classList.remove('dark');
          }
        }
        set({ theme: newTheme });
      },

      toggleTheme: () => {
        const nextTheme: Theme = get().theme === 'light' ? 'dark' : 'light';
        get().setTheme(nextTheme);
      },
    }),
    {
      name: 'dawaak-theme-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
