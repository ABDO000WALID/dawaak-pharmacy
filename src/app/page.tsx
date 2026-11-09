'use client';

import React, { Suspense, useState, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { ProductService } from '@/lib/services/product-service';
import { HeroBanner } from '@/components/home/HeroBanner';
import { CategoryChips } from '@/components/home/CategoryChips';
import { PromoBanner } from '@/components/home/PromoBanner';
import { DialectSymptomChips } from '@/components/home/DialectSymptomChips';
import { VoiceSearchModal } from '@/components/home/VoiceSearchModal';
import { ProductCard } from '@/components/product/ProductCard';
import { SubstituteFinderModal } from '@/components/product/SubstituteFinderModal';
import { SyntheticProduct } from '@/types/product';
import { useLocaleStore } from '@/lib/store/useLocaleStore';
import { Filter, X, Search, Sparkles } from 'lucide-react';

function HomeContent() {
  const searchParams = useSearchParams();
  const { locale } = useLocaleStore();

  const urlSearch = searchParams.get('search') || '';
  const urlCategory = searchParams.get('category') || '';

  const [activeCategory, setActiveCategory] = useState<string | undefined>(
    urlCategory || undefined
  );
  const [activeSearch, setActiveSearch] = useState<string>(urlSearch);
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false);

  // Substitute modal state
  const [substituteTarget, setSubstituteTarget] = useState<SyntheticProduct | null>(null);

  const categories = useMemo(() => ProductService.getCategories(), []);

  // Filter products based on search or category
  const filteredProducts = useMemo(() => {
    return ProductService.getAllProducts({
      category: activeCategory,
      search: activeSearch,
    });
  }, [activeCategory, activeSearch]);

  const handleSelectSymptom = (symptomQuery: string) => {
    setActiveSearch(symptomQuery);
    setActiveCategory(undefined);
  };

  const handleVoiceSearch = (phrase: string) => {
    setActiveSearch(phrase);
    setActiveCategory(undefined);
  };

  const handleOpenSubstitute = (product: SyntheticProduct) => {
    setSubstituteTarget(product);
  };

  const activeCategoryObject = useMemo(() => {
    if (!activeCategory) return undefined;
    return categories.find((c) => c.id === activeCategory);
  }, [activeCategory, categories]);

  const substituteProduct = useMemo(() => {
    if (!substituteTarget) return undefined;
    return ProductService.getSubstitute(substituteTarget.id);
  }, [substituteTarget]);

  return (
    <div className="space-y-6">
      {/* Hero Showcase Banner */}
      <HeroBanner />

      {/* Egyptian Dialect Symptom Quick Chips */}
      <DialectSymptomChips
        onSelectSymptom={handleSelectSymptom}
        onOpenVoice={() => setIsVoiceModalOpen(true)}
      />

      {/* Category Navigation Carousel / Grid */}
      <CategoryChips
        categories={categories}
        selectedCategory={activeCategory}
        onSelectCategory={(catId) => {
          setActiveCategory(catId);
          setActiveSearch('');
        }}
      />

      {/* Active Search / Filter Feedback Bar */}
      {(activeSearch || activeCategory) && (
        <div className="p-3.5 rounded-2xl bg-teal-50/80 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800 flex items-center justify-between text-xs animate-in fade-in">
          <div className="flex items-center gap-2 text-teal-900 dark:text-teal-200">
            <Filter className="w-4 h-4 text-teal-600 shrink-0" />
            <span className="font-semibold font-cairo">
              {activeSearch ? (
                <>
                  {locale === 'ar' ? 'نتائج البحث عن:' : 'Search results for:'}{' '}
                  <span className="font-black underline">&ldquo;{activeSearch}&rdquo;</span>
                </>
              ) : (
                <>
                  {locale === 'ar' ? 'قسم:' : 'Category:'}{' '}
                  <span className="font-black">{locale === 'ar' ? activeCategoryObject?.nameAr : activeCategoryObject?.nameEn}</span>
                </>
              )}
              {' '}({filteredProducts.length} {locale === 'ar' ? 'مستحضر' : 'products'})
            </span>
          </div>

          <button
            type="button"
            onClick={() => {
              setActiveSearch('');
              setActiveCategory(undefined);
            }}
            className="flex items-center gap-1 font-bold text-teal-800 dark:text-teal-300 hover:text-teal-950 p-1 rounded-lg"
          >
            <X className="w-4 h-4" />
            <span>{locale === 'ar' ? 'إلغاء التصفية' : 'Reset'}</span>
          </button>
        </div>
      )}

      {/* Promotional Flash Deal Banner */}
      {!activeSearch && !activeCategory && <PromoBanner />}

      {/* Products Section Header */}
      <div className="flex items-center justify-between pt-2">
        <div>
          <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-slate-100 font-cairo">
            {activeSearch || activeCategory
              ? (locale === 'ar' ? 'الأدوية المتاحة' : 'Matching Medicines')
              : (locale === 'ar' ? 'الأدوية الأكثر طلباً في مصر' : 'Popular Essential Medicines')}
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {locale === 'ar'
              ? 'أدوية تركيبية معتمدة مع ضمان أعلى معايير التخزين والبدائل الموفرة'
              : 'Certified synthetic pharmaceutical catalog with bioequivalent generic savings'}
          </p>
        </div>
      </div>

      {/* Products Grid (2-cols on mobile, 4-cols on desktop) */}
      {filteredProducts.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 space-y-3">
          <Search className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-700" />
          <h3 className="font-bold text-base text-slate-800 dark:text-slate-200 font-cairo">
            {locale === 'ar' ? 'مفيش نتائج.. لم نجد دواء يطابق بحثك' : 'No medicines matched your query'}
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {locale === 'ar'
              ? 'جرب البحث باسم العَرَض العام (مثلاً: صداع، سخونية، فوار، كحة) أو تصفح الأقسام مباشرة.'
              : 'Try searching by a general symptom (e.g. headache, fever, cough) or browse categories.'}
          </p>
          <button
            type="button"
            onClick={() => {
              setActiveSearch('');
              setActiveCategory(undefined);
            }}
            className="px-5 py-2.5 rounded-xl bg-teal-700 text-white font-bold text-xs hover:bg-teal-800 transition"
          >
            {locale === 'ar' ? 'عرض جميع الأدوية' : 'Show All Medicines'}
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-5">
          {filteredProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onOpenSubstitute={handleOpenSubstitute}
            />
          ))}
        </div>
      )}

      {/* Voice Search Modal */}
      <VoiceSearchModal
        isOpen={isVoiceModalOpen}
        onClose={() => setIsVoiceModalOpen(false)}
        onSelectPhrase={handleVoiceSearch}
      />

      {/* Substitute Finder Modal */}
      {substituteTarget && (
        <SubstituteFinderModal
          isOpen={!!substituteTarget}
          onClose={() => setSubstituteTarget(null)}
          product={substituteTarget}
          substituteProduct={substituteProduct}
        />
      )}
    </div>
  );
}

export default function HomePage() {
  return (
    <Suspense
      fallback={
        <div className="py-20 text-center font-cairo text-sm text-slate-500 flex flex-col items-center justify-center gap-2">
          <div className="w-8 h-8 rounded-full border-2 border-teal-600 border-t-transparent animate-spin" />
          <span>جاري تحميل صيدلية دواك...</span>
        </div>
      }
    >
      <HomeContent />
    </Suspense>
  );
}
