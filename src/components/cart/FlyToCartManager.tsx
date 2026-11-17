'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Pill, CheckCircle2, ShoppingBag } from 'lucide-react';
import { useLocaleStore } from '@/lib/store/useLocaleStore';

export interface FlyToCartDetail {
  startX: number;
  startY: number;
  productNameAr?: string;
  productNameEn?: string;
}

export function triggerFlyToCart(
  sourceElement: HTMLElement,
  productNameAr?: string,
  productNameEn?: string
) {
  if (typeof window === 'undefined') return;

  const rect = sourceElement.getBoundingClientRect();
  const startX = rect.left + rect.width / 2;
  const startY = rect.top + rect.height / 2;

  const event = new CustomEvent<FlyToCartDetail>('dawaak-fly-to-cart', {
    detail: { startX, startY, productNameAr, productNameEn },
  });
  window.dispatchEvent(event);
}

interface ToastNotice {
  id: number;
  nameAr: string;
  nameEn: string;
}

export function FlyToCartManager() {
  const { locale } = useLocaleStore();
  const [toast, setToast] = useState<ToastNotice | null>(null);

  const handleFly = useCallback((e: Event) => {
    const customEvent = e as CustomEvent<FlyToCartDetail>;
    const { startX, startY, productNameAr, productNameEn } = customEvent.detail;

    // Show Egyptian dialect confirmation toast
    const toastId = Date.now();
    setToast({
      id: toastId,
      nameAr: productNameAr || 'المستحضر',
      nameEn: productNameEn || 'Product',
    });
    setTimeout(() => {
      setToast((current) => (current?.id === toastId ? null : current));
    }, 2800);

    // Check if target cart element exists
    const headerCart = document.getElementById('header-cart-icon');
    const bottomCart = document.getElementById('bottom-nav-cart-icon');
    const targetElement = (window.innerWidth < 768 && bottomCart) ? bottomCart : (headerCart || bottomCart);

    if (!targetElement) return;

    // Check reduced motion
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      targetElement.classList.add('animate-bounce');
      setTimeout(() => targetElement.classList.remove('animate-bounce'), 600);
      return;
    }

    const targetRect = targetElement.getBoundingClientRect();
    const endX = targetRect.left + targetRect.width / 2;
    const endY = targetRect.top + targetRect.height / 2;

    // Create glowing flying capsule node
    const flyingNode = document.createElement('div');
    flyingNode.className =
      'fixed z-50 pointer-events-none w-8 h-8 rounded-full bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center shadow-lg shadow-emerald-500/50';
    flyingNode.style.left = `${startX - 16}px`;
    flyingNode.style.top = `${startY - 16}px`;
    flyingNode.style.transform = 'scale(1) rotate(0deg)';
    flyingNode.innerHTML = `
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <path d="m10.5 20.5 10-10a4.95 4.95 0 1 0-7-7l-10 10a4.95 4.95 0 1 0 7 7Z"/>
        <path d="m8.5 8.5 7 7"/>
      </svg>
    `;

    document.body.appendChild(flyingNode);

    const deltaX = endX - startX;
    const deltaY = endY - startY;

    // Animate parabolic trajectory with Web Animations API
    const animation = flyingNode.animate(
      [
        {
          transform: 'translate(0px, 0px) scale(1) rotate(0deg)',
          opacity: 1,
        },
        {
          transform: `translate(${deltaX * 0.45}px, ${deltaY * 0.25 - 75}px) scale(1.15) rotate(180deg)`,
          opacity: 0.95,
          offset: 0.45,
        },
        {
          transform: `translate(${deltaX}px, ${deltaY}px) scale(0.2) rotate(360deg)`,
          opacity: 0.2,
        },
      ],
      {
        duration: 620,
        easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
        fill: 'forwards',
      }
    );

    animation.onfinish = () => {
      flyingNode.remove();
      // Elastic cart icon impact bounce
      targetElement.classList.add('animate-bounce');
      setTimeout(() => {
        targetElement.classList.remove('animate-bounce');
      }, 650);
    };
  }, []);

  useEffect(() => {
    window.addEventListener('dawaak-fly-to-cart', handleFly);
    return () => {
      window.removeEventListener('dawaak-fly-to-cart', handleFly);
    };
  }, [handleFly]);

  if (!toast) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-20 md:bottom-6 start-1/2 -translate-x-1/2 z-50 flex items-center gap-2.5 px-4 py-2.5 rounded-2xl bg-slate-900/95 dark:bg-emerald-950/95 text-white text-xs font-semibold shadow-xl border border-emerald-500/40 backdrop-blur-md animate-in slide-in-from-bottom-3 font-cairo"
    >
      <div className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center shrink-0 shadow-sm">
        <CheckCircle2 className="w-4 h-4 text-white" />
      </div>
      <div>
        <span className="font-bold text-emerald-300">
          {locale === 'ar' ? 'اتضافت للسلة يا فندم!' : 'Added to Cart!'}
        </span>
        <span className="mx-1 text-slate-400">•</span>
        <span className="text-slate-200">
          {locale === 'ar' ? `${toast.nameAr} - صحتك أمانة` : toast.nameEn}
        </span>
      </div>
    </div>
  );
}
