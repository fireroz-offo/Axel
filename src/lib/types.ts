export type CategoryId = 'finance' | 'business' | 'technology' | 'science' | 'psychology' | 'history' | 'education' | 'health' | 'space' | 'other';

export interface Category {
  id: CategoryId;
  label: string;
  hi: string;
  emoji: string;
  /** keyword terms used for keyless public search */
  terms: string[];
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
}
