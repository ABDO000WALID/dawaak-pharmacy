'use client';

import React from 'react';
import { useLocaleStore } from '@/lib/store/useLocaleStore';
import { Sparkles, Mic } from 'lucide-react';

interface DialectSymptomChipsProps {
  onSelectSymptom: (symptom: string) => void;
  onOpenVoice: () => void;
}

const SYMPTOMS = [
  { ar: '💊 صداع', en: '💊 Headache', query: 'صداع' },
  { ar: '🔥 سخونية وحرارة', en: '🔥 High Fever', query: 'سخونية' },
  { ar: '🤢 مغص وحموضة', en: '🤢 Heartburn & Colic', query: 'حموضة' },
  { ar: '👶 أدوية أطفال', en: '👶 Pediatric Care', query: 'أطفال' },
  { ar: '⚡ إرهاق وفيتامينات', en: '⚡ Daily Vitamins', query: 'فيتامينات' },
  { ar: '🫀 أدوية الضغط والسكر', en: '🫀 Cardio & Diabetes', query: 'ضغط' },
  { ar: '🦵 آلام المفاصل والركبة', en: '🦵 Joint & Knee Pain', query: 'مفاصل' },
];

export function DialectSymptomChips({
  onSelectSymptom,
  onOpenVoice,
}: DialectSymptomChipsProps) {
  const { locale } = useLocaleStore();

  return (
    <div className="my-4 space-y-2">
      <div className="flex items-center justify-between text-xs">
        <span className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1 font-cairo">
          <Sparkles className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
          {locale === 'ar' ? 'دور باللي حاسس بيه (لهجة مصرية):' : 'Colloquial Egyptian Symptom Shortcuts:'}
        </span>
        <button
          type="button"
          onClick={onOpenVoice}
          className="text-teal-700 dark:text-teal-400 font-bold hover:underline flex items-center gap-1 text-[11px]"
        >
          <Mic className="w-3 h-3" />
          <span>{locale === 'ar' ? 'جرّب البحث الصوتي 🎙️' : 'Try Voice Search'}</span>
        </button>
      </div>

      <div className="flex items-center gap-2 overflow-x-auto pb-1.5 scrollbar-none">
        {SYMPTOMS.map((item) => (
          <button
            key={item.query}
            type="button"
            onClick={() => onSelectSymptom(item.query)}
            className="px-3 py-1.5 rounded-full bg-slate-100 hover:bg-teal-50 dark:bg-slate-800 dark:hover:bg-teal-950/60 border border-slate-200 dark:border-slate-700 hover:border-teal-400 text-slate-700 dark:text-slate-200 hover:text-teal-800 dark:hover:text-teal-300 text-xs font-semibold whitespace-nowrap transition active:scale-95 shadow-sm font-cairo"
          >
            {locale === 'ar' ? item.ar : item.en}
          </button>
        ))}
      </div>
    </div>
  );
}
