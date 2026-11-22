import type { Category } from './types';

export const CATEGORIES: Category[] = [
  { id: 'finance', label: 'Finance', hi: 'वित्त', emoji: '💰', terms: ['finance', 'stock market', 'economy', 'investing'], hiTerms: ['वित्त', 'शेयर बाजार', 'अर्थव्यवस्था'] },
  { id: 'business', label: 'Business', hi: 'व्यापार', emoji: '📈', terms: ['business', 'startup', 'company strategy'], hiTerms: ['व्यापार', 'स्टार्टअप'] },
  { id: 'technology', label: 'Technology', hi: 'टेक्नोलॉजी', emoji: '💻', terms: ['technology', 'artificial intelligence', 'software'], hiTerms: ['टेक्नोलॉजी', 'कृत्रिम बुद्धिमत्ता'] },
  { id: 'ai', label: 'AI', hi: 'कृत्रिम बुद्धिमत्ता', emoji: '🤖', terms: ['artificial intelligence', 'AI model', 'machine learning', 'ChatGPT'], hiTerms: ['कृत्रिम बुद्धिमत्ता', 'एआई', 'मशीन लर्निंग', 'चैटजीपीटी'] },
  { id: 'science', label: 'Science', hi: 'विज्ञान', emoji: '🔬', terms: ['science', 'discovery', 'research study'], hiTerms: ['विज्ञान', 'नई खोज'] },
  { id: 'psychology', label: 'Psychology', hi: 'मनोविज्ञान', emoji: '🧠', terms: ['psychology', 'behavior', 'mental health research'], hiTerms: ['मनोविज्ञान', 'मानसिक स्वास्थ्य'] },
  { id: 'history', label: 'History', hi: 'इतिहास', emoji: '🏛️', terms: ['history', 'archaeology', 'ancient civilization'], hiTerms: ['इतिहास', 'पुरातत्व'] },
  { id: 'education', label: 'Education', hi: 'शिक्षा', emoji: '🎓', terms: ['education', 'learning', 'university'], hiTerms: ['शिक्षा', 'विश्वविद्यालय'] },
  { id: 'health', label: 'Health', hi: 'स्वास्थ्य', emoji: '🩺', terms: ['health', 'medicine', 'nutrition'], hiTerms: ['स्वास्थ्य', 'चिकित्सा'] },
  { id: 'space', label: 'Space', hi: 'अंतरिक्ष', emoji: '🚀', terms: ['space', 'NASA', 'astronomy'], hiTerms: ['अंतरिक्ष', 'इसरो'] },
  { id: 'other', label: 'Other', hi: 'अन्य', emoji: '✨', terms: ['news'], hiTerms: ['समाचार'] }
];

export const getCategory = (id: string) => CATEGORIES.find((c) => c.id === id) ?? CATEGORIES[CATEGORIES.length - 1];
