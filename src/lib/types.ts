export type CategoryId = 'finance' | 'business' | 'technology' | 'science' | 'psychology' | 'history' | 'education' | 'health' | 'space' | 'other';

export type Lang = 'hi' | 'en' | 'both';

export interface Category {
  id: CategoryId;
  label: string;
  hi: string;
  emoji: string;
  /** keyword terms used for keyless public search */
  terms: string[];
  /** Hindi search terms */
  hiTerms: string[];
}

export interface SourceItem {
  title: string;
  url: string;
  source: string; // provider/domain label
  date?: string; // ISO date from the provider, if available
  note?: string;
}

export interface ProviderResult {
  provider: string;
  kind: 'news' | 'discussion' | 'reference' | 'trend';
  ok: boolean;
  error?: string;
  items: SourceItem[];
}

export interface ResearchResult {
  category: CategoryId;
  lang: Lang;
  ranAt: string; // ISO timestamp (research date shown in UI)
  providers: ProviderResult[];
}

export interface Project {
  id: string;
  title: string;
  category: CategoryId;
  createdAt: number;
  updatedAt: number;
  stage: string; // workflow stage id
  research?: ResearchResult;
  /** language of research, topics and (later) script. Default 'hi' */
  lang?: Lang;
  /** topics the user tapped as candidates */
  selected?: SourceItem[];
}
