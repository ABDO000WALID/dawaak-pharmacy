/**
 * Normalizes Arabic text by decomposing presentation ligatures, stripping Tashkeel
 * diacritics, Tanween Fath accusative Alefs, Tatweel (Kashida), and unifying variant letterforms
 * (Alefs with hamza/wasla, Taa Marbuta to Haa, and Yaa maqsoora to standard Yaa).
 * Matches Egyptian dialect and pharmaceutical search criteria.
 */
export function normalizeArabic(text: string): string {
  if (typeof text !== 'string') return '';
  return text
    // Decompose Unicode ligatures & presentation forms (e.g., ﻻ -> لا)
    .normalize('NFKC')
    // Strip Tanween Fath with its orthographic Alef (e.g. سِينترافولاً -> سِينترافول)
    .replace(/(?:[\u0640]*\u0627[\u0640]*\u064B|[\u0640]*\u064B[\u0640]*\u0627)/g, '')
    // Remove Tashkeel (Fatha, Damma, Kasra, Sukun, Shadda, Tanween, Dagger Alef) AND Tatweel (\u0640)
    .replace(/[\u064B-\u065F\u0670\u0640]/g, '')
    // Normalize Alefs (أ, إ, آ, ٱ -> ا)
    .replace(/[أإآٱ]/g, 'ا')
    // Normalize Taa Marbuta (ة -> ه)
    .replace(/ة/g, 'ه')
    // Normalize Yaa (ى -> ي)
    .replace(/[ىي]/g, 'ي')
    .trim()
    .toLowerCase();
}
