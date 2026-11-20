import type { Category } from './types';

export const CATEGORIES: Category[] = [
  { id: 'finance', label: 'Finance', hi: 'वित्त', emoji: '💰', terms: ['finance', 'stock market', 'economy', 'investing'] },
  { id: 'business', label: 'Business', hi: 'व्यापार', emoji: '📈', terms: ['business', 'startup', 'company strategy'] },
  { id: 'technology', label: 'Technology', hi: 'टेक्नोलॉजी', emoji: '💻', terms: ['technology', 'artificial intelligence', 'software'] },
  { id: 'science', label: 'Science', hi: 'विज्ञान', emoji: '🔬', terms: ['science', 'discovery', 'research study'] },
  { id: 'psychology', label: 'Psychology', hi: 'मनोविज्ञान', emoji: '🧠', terms: ['psychology', 'behavior', 'mental health research'] },
  { id: 'history', label: 'History', hi: 'इतिहास', emoji: '🏛️', terms: ['history', 'archaeology', 'ancient civilization'] },
  { id: 'education', label: 'Education', hi: 'शिक्षा', emoji: '🎓', terms: ['education', 'learning', 'university'] },
  { id: 'health', label: 'Health', hi: 'स्वास्थ्य', emoji: '🩺', terms: ['health', 'medicine', 'nutrition'] },
  { id: 'space', label: 'Space', hi: 'अंतरिक्ष', emoji: '🚀', terms: ['space', 'NASA', 'astronomy'] },
  { id: 'other', label: 'Other', hi: 'अन्य', emoji: '✨', terms: ['news'] }
];

export const getCategory = (id: string) => CATEGORIES.find((c) => c.id === id) ?? CATEGORIES[CATEGORIES.length - 1];
