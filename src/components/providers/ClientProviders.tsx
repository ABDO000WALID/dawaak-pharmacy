'use client';

import React, { useEffect, useState } from 'react';
import { useLocaleStore } from '@/lib/store/useLocaleStore';
import { useThemeStore } from '@/lib/store/useThemeStore';
import { useCartStore } from '@/lib/store/useCartStore';
import { FlyToCartManager } from '@/components/cart/FlyToCartManager';

export function ClientProviders({ children }: { children: React.ReactNode }) {
  const { dir, locale } = useLocaleStore();
  const { theme } = useThemeStore();
  const setHasHydrated = useCartStore((state) => state.setHasHydrated);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setHasHydrated(true);

    // Synchronize HTML attributes on client
    document.documentElement.dir = dir;
    document.documentElement.lang = locale;
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [dir, locale, theme, setHasHydrated]);

  return (
    <>
      {children}
      <FlyToCartManager />
    </>
  );
}
