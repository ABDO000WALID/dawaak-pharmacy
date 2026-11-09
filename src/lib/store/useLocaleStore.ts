import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { Locale, Direction } from '@/types/common';

interface LocaleState {
  locale: Locale;
  dir: Direction;
  setLocale: (locale: Locale) => void;
  toggleLocale: () => void;
}

export const useLocaleStore = create<LocaleState>()(
  persist(
    (set, get) => ({
      locale: 'ar',
      dir: 'rtl',

      setLocale: (newLocale: Locale) => {
        const newDir: Direction = newLocale === 'ar' ? 'rtl' : 'ltr';
        if (typeof document !== 'undefined') {
          document.documentElement.dir = newDir;
          document.documentElement.lang = newLocale;
        }
        set({ locale: newLocale, dir: newDir });
      },

      toggleLocale: () => {
        const nextLocale: Locale = get().locale === 'ar' ? 'en' : 'ar';
        get().setLocale(nextLocale);
      },
    }),
    {
      name: 'dawaak-locale-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
