'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { BrandLogo } from '@/components/ui/BrandLogo';
import { useCartStore } from '@/lib/store/useCartStore';
import { useLocaleStore } from '@/lib/store/useLocaleStore';
import { useThemeStore } from '@/lib/store/useThemeStore';
import { VoiceSearchModal } from '@/components/home/VoiceSearchModal';
import { ProductService } from '@/lib/services/product-service';
import { SyntheticProduct } from '@/types/product';
import { formatEGP } from '@/lib/utils/currency';
import { Search, ShoppingBag, Moon, Sun, Globe, Mic, X } from 'lucide-react';

export function Header() {
  const router = useRouter();
  const { locale, toggleLocale } = useLocaleStore();
  const { theme, toggleTheme } = useThemeStore();
  const { getItemCount, hasHydrated } = useCartStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [suggestions, setSuggestions] = useState<SyntheticProduct[]>([]);
  const [totalMatchesCount, setTotalMatchesCount] = useState(0);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const [isVoiceOpen, setIsVoiceOpen] = useState(false);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);

  const desktopContainerRef = useRef<HTMLDivElement>(null);
  const mobileContainerRef = useRef<HTMLDivElement>(null);

  const cartItemCount = hasHydrated ? getItemCount() : 0;

  // 200ms debounce on search keystrokes
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 200);

    return () => clearTimeout(handler);
  }, [searchQuery]);

  // Query suggestions when debounced query has >= 1 char
  useEffect(() => {
    const trimmed = debouncedQuery.trim();
    if (trimmed.length >= 1) {
      const allMatches = ProductService.getAllProducts({ search: trimmed });
      setTotalMatchesCount(allMatches.length);
      setSuggestions(allMatches.slice(0, 6));
      setIsDropdownOpen(true);
    } else {
      setSuggestions([]);
      setTotalMatchesCount(0);
      setIsDropdownOpen(false);
    }
  }, [debouncedQuery]);

  // Handle outside click and Escape key to close suggestions dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      const clickedDesktop = desktopContainerRef.current?.contains(target);
      const clickedMobile = mobileContainerRef.current?.contains(target);
      if (!clickedDesktop && !clickedMobile) {
        setIsDropdownOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const handleSearchSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = searchQuery.trim();
    if (trimmed) {
      setIsDropdownOpen(false);
      setIsMobileSearchOpen(false);
      router.push(`/search?q=${encodeURIComponent(trimmed)}`);
    }
  };

  const handleVoiceSelect = (phrase: string) => {
    setSearchQuery(phrase);
    setIsDropdownOpen(false);
    setIsMobileSearchOpen(false);
    router.push(`/search?q=${encodeURIComponent(phrase)}`);
  };

  const renderDropdown = () => {
    if (!isDropdownOpen || debouncedQuery.trim().length < 1) return null;

    return (
      <div className="absolute top-full start-0 end-0 mt-2 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200/90 dark:border-slate-800 z-50 overflow-hidden divide-y divide-slate-100 dark:divide-slate-800 animate-in fade-in zoom-in-95 duration-150">
        {totalMatchesCount === 0 ? (
          <div className="p-4 text-center space-y-1">
            <p className="font-bold text-sm text-slate-800 dark:text-slate-200 font-cairo">
              {locale === 'ar'
                ? `مفيش نتائج لـ "${debouncedQuery}"`
                : `No results for "${debouncedQuery}"`}
            </p>
            <p className="text-xs text-slate-500">
              {locale === 'ar'
                ? 'تأكد من كتابة الاسم أو جرب البحث باسم العَرَض (مثلاً: صداع، سخونية، مغص)'
                : 'Try searching by active ingredient or common symptom'}
            </p>
          </div>
        ) : (
          <>
            <div className="py-1 max-h-80 overflow-y-auto">
              {suggestions.map((item) => (
                <Link
                  key={item.id}
                  href={`/product/${item.id}`}
                  onClick={() => {
                    setIsDropdownOpen(false);
                    setIsMobileSearchOpen(false);
                  }}
                  className="flex items-center gap-3 px-3.5 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-800/70 transition group"
                >
                  {/* Product thumbnail */}
                  <div className="relative w-11 h-11 rounded-lg bg-slate-100 dark:bg-slate-800 overflow-hidden shrink-0 border border-slate-200/60 dark:border-slate-700/60 flex items-center justify-center">
                    <Image
                      src={item.images[0] || '/placeholders/default-medicine.svg'}
                      alt={locale === 'ar' ? item.nameAr : item.nameEn}
                      fill
                      sizes="44px"
                      unoptimized
                      className="object-contain p-1 group-hover:scale-105 transition-transform"
                    />
                  </div>

                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline justify-between gap-2">
                      <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate group-hover:text-teal-700 dark:group-hover:text-teal-400 font-cairo">
                        {locale === 'ar' ? item.nameAr : item.nameEn}
                      </h4>
                      <span className="text-xs font-extrabold text-teal-700 dark:text-teal-400 shrink-0 font-cairo">
                        {formatEGP(item.salePriceEgp ?? item.priceEgp, locale)}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 dark:text-slate-500 truncate">
                      {locale === 'ar' ? item.nameEn : item.nameAr}
                    </p>
                    <div className="mt-0.5">
                      <span className="inline-block px-1.5 py-0.5 text-[9px] font-semibold bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 rounded border border-teal-200/50 dark:border-teal-800/40 truncate max-w-full">
                        {locale === 'ar' ? item.activeIngredientAr : item.activeIngredientEn}
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            <Link
              href={`/search?q=${encodeURIComponent(searchQuery.trim())}`}
              onClick={() => {
                setIsDropdownOpen(false);
                setIsMobileSearchOpen(false);
              }}
              className="block text-center py-2.5 px-3 bg-slate-50 hover:bg-teal-50/80 dark:bg-slate-800/50 dark:hover:bg-teal-950/40 text-xs font-bold text-teal-700 dark:text-teal-400 transition font-cairo"
            >
              {locale === 'ar'
                ? `عرض كل نتائج البحث (${totalMatchesCount})`
                : `View all search results (${totalMatchesCount})`}
            </Link>
          </>
        )}
      </div>
    );
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 transition-colors shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-3 md:gap-6">
          {/* Brand Logo */}
          <div className="shrink-0">
            <BrandLogo size="md" />
          </div>

          {/* Desktop Search Bar with Voice Trigger & Suggestions Dropdown */}
          <div ref={desktopContainerRef} className="hidden md:flex flex-1 max-w-xl mx-auto relative">
            <form onSubmit={handleSearchSubmit} className="relative w-full">
              <input
                type="text"
                value={searchQuery}
                onFocus={() => {
                  if (debouncedQuery.trim().length >= 1) {
                    setIsDropdownOpen(true);
                  }
                }}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={
                  locale === 'ar'
                    ? 'ابحث باسم الدواء، المادة الفعالة، أو العَرَض (مثلاً: صداع، سخونية، فوار)...'
                    : 'Search by medicine, active ingredient, or symptom (e.g. headache)...'
                }
                className="w-full h-11 ps-10 pe-20 text-xs rounded-full border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-600 focus:bg-white dark:focus:bg-slate-800 transition shadow-inner font-cairo"
              />
              <button
                type="submit"
                className="absolute start-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-teal-600 dark:hover:text-teal-400 transition"
                aria-label={locale === 'ar' ? 'تنفيذ البحث' : 'Submit search'}
              >
                <Search className="w-4 h-4" />
              </button>

              <div className="absolute end-1.5 top-1/2 -translate-y-1/2 flex items-center gap-1">
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery('');
                      setIsDropdownOpen(false);
                    }}
                    className="p-1 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                    aria-label={locale === 'ar' ? 'مسح البحث' : 'Clear search'}
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setIsVoiceOpen(true)}
                  title={locale === 'ar' ? 'بحث صوتي باللهجة المصرية' : 'Voice Search'}
                  aria-label={locale === 'ar' ? 'بحث صوتي باللهجة المصرية' : 'Voice Search'}
                  className="w-8 h-8 rounded-full flex items-center justify-center bg-teal-50 dark:bg-teal-950 text-teal-700 dark:text-teal-400 hover:bg-teal-100 dark:hover:bg-teal-900 transition"
                >
                  <Mic className="w-3.5 h-3.5" />
                </button>
              </div>
            </form>

            {/* Desktop Suggestions Dropdown */}
            {renderDropdown()}
          </div>

          {/* Action Icons (Language, Dark Mode, Cart) */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Mobile Search Toggle Button */}
            <button
              type="button"
              onClick={() => setIsMobileSearchOpen(!isMobileSearchOpen)}
              className="md:hidden p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              aria-label={locale === 'ar' ? 'فتح البحث' : 'Open Search'}
            >
              <Search className="w-5 h-5" />
            </button>

            {/* Language Toggle (AR / EN) */}
            <button
              type="button"
              onClick={toggleLocale}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold transition active:scale-95"
              aria-label={locale === 'ar' ? 'تبديل اللغة للإنجليزية' : 'Switch to Arabic'}
            >
              <Globe className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
              <span>{locale === 'ar' ? 'EN' : 'عربي'}</span>
            </button>

            {/* Dark Mode Toggle */}
            <button
              type="button"
              onClick={toggleTheme}
              className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition active:scale-95"
              aria-label={theme === 'dark' ? 'الوضع النهاري' : 'الوضع الليلي'}
            >
              {theme === 'dark' ? (
                <Sun className="w-4 h-4 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4 text-slate-600" />
              )}
            </button>

            {/* Cart Counter Button */}
            <Link
              href="/cart"
              className="relative p-2 rounded-xl bg-teal-700 hover:bg-teal-800 text-white transition active:scale-95 shadow-sm shadow-teal-700/20 flex items-center justify-center"
              aria-label={locale === 'ar' ? `سلة المشتريات (${cartItemCount} عناصر)` : `Cart (${cartItemCount} items)`}
            >
              <ShoppingBag className="w-5 h-5" />
              {cartItemCount > 0 && (
                <span className="absolute -top-1 -end-1 min-w-[20px] h-5 px-1 rounded-full bg-emerald-500 text-white text-[11px] font-extrabold flex items-center justify-center border-2 border-white dark:border-slate-900 animate-in zoom-in-50">
                  {cartItemCount}
                </span>
              )}
            </Link>
          </div>
        </div>

        {/* Mobile Search Bar Dropdown */}
        {isMobileSearchOpen && (
          <div ref={mobileContainerRef} className="md:hidden pb-3 pt-1 animate-in slide-in-from-top-2 relative">
            <form onSubmit={handleSearchSubmit} className="relative w-full">
              <input
                type="text"
                value={searchQuery}
                onFocus={() => {
                  if (debouncedQuery.trim().length >= 1) {
                    setIsDropdownOpen(true);
                  }
                }}
                onChange={(e) => setSearchQuery(e.target.value)}
                autoFocus
                placeholder={
                  locale === 'ar'
                    ? 'ابحث باسم الدواء، المادة، أو العَرَض...'
                    : 'Search by medicine, molecule, or symptom...'
                }
                className="w-full h-10 ps-10 pe-16 text-xs rounded-full border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-600"
              />
              <button
                type="submit"
                className="absolute start-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-teal-600"
                aria-label={locale === 'ar' ? 'بحث' : 'Search'}
              >
                <Search className="w-4 h-4" />
              </button>
              <div className="absolute end-1.5 top-1/2 -translate-y-1/2 flex items-center gap-1">
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery('');
                      setIsDropdownOpen(false);
                    }}
                    className="p-1 rounded-full text-slate-400"
                    aria-label={locale === 'ar' ? 'مسح' : 'Clear'}
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setIsVoiceOpen(true)}
                  className="p-1.5 rounded-full bg-teal-50 dark:bg-teal-950 text-teal-700 dark:text-teal-400"
                >
                  <Mic className="w-3.5 h-3.5" />
                </button>
              </div>
            </form>

            {/* Mobile Suggestions Dropdown */}
            {renderDropdown()}
          </div>
        )}
      </div>

      {/* Voice Search Modal */}
      <VoiceSearchModal
        isOpen={isVoiceOpen}
        onClose={() => setIsVoiceOpen(false)}
        onSelectPhrase={handleVoiceSelect}
      />
    </header>
  );
}
