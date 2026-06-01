export interface Snippet {
  id: number;
  title: string;
  code: string;
  language: string;
  description: string;
  tags: string[];
  collection_id: number | null;
  is_template: boolean;
  template_variables: string[];
  copy_count: number;
  last_copied_at: string | null;
  last_used_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface SnippetCreate {
  title: string;
  code: string;
  language: string;
  description?: string;
  tags?: string[];
  collection_id?: number | null;
  is_template?: boolean;
  template_variables?: string[];
}

export interface SnippetUpdate {
  title?: string;
  code?: string;
  language?: string;
  description?: string;
  tags?: string[];
  collection_id?: number | null;
  is_template?: boolean;
  template_variables?: string[];
}

export interface SnippetSearchResult extends Snippet {
  relevance_score: number;
  matched_fields: string[];
}

export interface Collection {
  id: number;
  name: string;
  parent_id: number | null;
  level: number;
  children: Collection[];
  snippet_count: number;
  created_at: string;
  updated_at: string;
}

export interface CollectionTree extends Collection {
  children: CollectionTree[];
}

export interface Share {
  id: number;
  snippet_id: number;
  token: string;
  expires_at: string | null;
  created_at: string;
}

export interface SharedSnippet {
  title: string;
  code: string;
  language: string;
  description: string | null;
  tags: string[];
  created_at: string;
  share: {
    expires_at: string | null;
  };
}

export interface Language {
  value: string;
  label: string;
}

export interface SearchResult<T> {
  items: T[];
  total: number;
  query: string;
}

export interface SnippetFromTemplate {
  template_id: number;
  title: string;
  variables: Record<string, string>;
  collection_id?: number | null;
}
