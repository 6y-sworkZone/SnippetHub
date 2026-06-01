import { create } from 'zustand';
import type { Snippet, Collection, CollectionTree, Language } from '../types';
import { snippetApi, collectionApi, metaApi } from '../services/api';

interface SnippetState {
  snippets: Snippet[];
  collections: CollectionTree[];
  collectionsFlat: Collection[];
  currentSnippet: Snippet | null;
  loading: boolean;
  languages: Language[];
  tags: string[];
  fetchSnippets: (params?: { collection_id?: number; is_template?: boolean; skip?: number; limit?: number }) => Promise<void>;
  fetchCollections: () => Promise<void>;
  fetchLanguages: () => Promise<void>;
  fetchTags: () => Promise<void>;
  setCurrentSnippet: (snippet: Snippet | null) => void;
  addSnippet: (data: Parameters<typeof snippetApi.createSnippet>[0]) => Promise<Snippet>;
  updateSnippet: (id: number, data: Parameters<typeof snippetApi.updateSnippet>[1]) => Promise<Snippet>;
  deleteSnippet: (id: number) => Promise<void>;
}

export const useSnippetStore = create<SnippetState>((set, get) => ({
  snippets: [],
  collections: [],
  collectionsFlat: [],
  currentSnippet: null,
  loading: false,
  languages: [],
  tags: [],

  fetchSnippets: async (params) => {
    set({ loading: true });
    try {
      const response = await snippetApi.getSnippets(params);
      set({ snippets: response.data.items });
    } finally {
      set({ loading: false });
    }
  },

  fetchCollections: async () => {
    set({ loading: true });
    try {
      const [treeRes, flatRes] = await Promise.all([
        collectionApi.getCollections(),
        collectionApi.getCollectionsFlat(),
      ]);
      set({ collections: treeRes.data, collectionsFlat: flatRes.data });
    } finally {
      set({ loading: false });
    }
  },

  fetchLanguages: async () => {
    set({ loading: true });
    try {
      const response = await metaApi.getLanguages();
      set({ languages: response.data });
    } finally {
      set({ loading: false });
    }
  },

  fetchTags: async () => {
    set({ loading: true });
    try {
      const response = await metaApi.getTags();
      set({ tags: response.data });
    } finally {
      set({ loading: false });
    }
  },

  setCurrentSnippet: (snippet) => {
    set({ currentSnippet: snippet });
  },

  addSnippet: async (data) => {
    const response = await snippetApi.createSnippet(data);
    const newSnippet = response.data;
    set((state) => ({
      snippets: [newSnippet, ...state.snippets],
    }));
    return newSnippet;
  },

  updateSnippet: async (id, data) => {
    const response = await snippetApi.updateSnippet(id, data);
    const updatedSnippet = response.data;
    set((state) => ({
      snippets: state.snippets.map((s) => (s.id === id ? updatedSnippet : s)),
      currentSnippet: state.currentSnippet?.id === id ? updatedSnippet : state.currentSnippet,
    }));
    return updatedSnippet;
  },

  deleteSnippet: async (id) => {
    await snippetApi.deleteSnippet(id);
    set((state) => ({
      snippets: state.snippets.filter((s) => s.id !== id),
      currentSnippet: state.currentSnippet?.id === id ? null : state.currentSnippet,
    }));
  },
}));
