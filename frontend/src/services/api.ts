import axios from 'axios';
import type {
  Snippet,
  SnippetCreate,
  SnippetUpdate,
  SnippetSearchResult,
  Collection,
  CollectionTree,
  Share,
  SharedSnippet,
  Language,
  SearchResult,
  SnippetFromTemplate,
} from '../types';

const api = axios.create({
  baseURL: '',
  headers: {
    'Content-Type': 'application/json',
  },
});

export const snippetApi = {
  getSnippets: (params?: { collection_id?: number; is_template?: boolean; skip?: number; limit?: number }) =>
    api.get<{ items: Snippet[]; total: number }>('/api/snippets', { params }),

  getSnippet: (id: number) =>
    api.get<Snippet>(`/api/snippets/${id}`),

  createSnippet: (data: SnippetCreate) =>
    api.post<Snippet>('/api/snippets', data),

  updateSnippet: (id: number, data: SnippetUpdate) =>
    api.put<Snippet>(`/api/snippets/${id}`, data),

  deleteSnippet: (id: number) =>
    api.delete<void>(`/api/snippets/${id}`),

  recordCopy: (id: number) =>
    api.post<{ success: boolean; new_count: number }>(`/api/snippets/${id}/copy`),

  recordUse: (id: number) =>
    api.post<{ success: boolean }>(`/api/snippets/${id}/use`),

  getHotSnippets: (limit: number = 10) =>
    api.get<Snippet[]>('/api/snippets/hot', { params: { limit } }),

  getRecentSnippets: (limit: number = 10) =>
    api.get<Snippet[]>('/api/snippets/recent', { params: { limit } }),

  getTemplates: (skip?: number, limit?: number) =>
    api.get<{ items: Snippet[]; total: number }>('/api/snippets/templates', { params: { skip, limit } }),

  createFromTemplate: (data: SnippetFromTemplate) =>
    api.post<Snippet>('/api/snippets/from-template', data),

  moveSnippet: (id: number, target_collection_id: number | null) =>
    api.put<{ success: boolean }>(`/api/snippets/${id}/move`, null, { params: { target_collection_id } }),
};

export const collectionApi = {
  getCollections: () =>
    api.get<CollectionTree[]>('/api/collections'),

  getCollectionsFlat: () =>
    api.get<Collection[]>('/api/collections/flat'),

  createCollection: (data: { name: string; parent_id?: number | null }) =>
    api.post<Collection>('/api/collections', data),

  updateCollection: (id: number, data: { name?: string; parent_id?: number | null }) =>
    api.put<Collection>(`/api/collections/${id}`, data),

  deleteCollection: (id: number) =>
    api.delete<void>(`/api/collections/${id}`),
};

export const shareApi = {
  createShare: (snippet_id: number, expires_at?: string | null) =>
    api.post<Share>('/api/shares', { snippet_id, expires_at }),

  getSharedSnippet: (token: string) =>
    api.get<SharedSnippet>(`/api/shares/${token}`),

  deleteShare: (token: string) =>
    api.delete<void>(`/api/shares/${token}`),
};

export const searchApi = {
  searchSnippets: (params: { q: string; language?: string; tags?: string[]; limit?: number }) =>
    api.get<SearchResult<SnippetSearchResult>>('/api/search', { params }),
};

export const metaApi = {
  getLanguages: () =>
    api.get<Language[]>('/api/languages'),

  getTags: () =>
    api.get<string[]>('/api/tags'),
};

export default api;
