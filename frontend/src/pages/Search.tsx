import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Search as SearchIcon,
  Filter,
  ChevronDown,
  Copy,
  FileCode,
  Hash,
  Check,
  X,
  TrendingUp,
} from 'lucide-react';
import { twMerge } from 'tailwind-merge';
import { Layout } from '@/components/Layout';
import { Sidebar } from '@/components/Sidebar';
import { useToast } from '@/components/Toast';
import { useSnippetStore } from '@/store';
import { searchApi, snippetApi } from '@/services/api';
import { copyToClipboard } from '@/utils/copy';
import { highlightText } from '@/utils/highlight';
import type { SnippetSearchResult } from '@/types';

const LANGUAGES = [
  { value: '', label: '全部语言' },
  { value: 'javascript', label: 'JavaScript' },
  { value: 'typescript', label: 'TypeScript' },
  { value: 'python', label: 'Python' },
  { value: 'java', label: 'Java' },
  { value: 'cpp', label: 'C++' },
  { value: 'csharp', label: 'C#' },
  { value: 'go', label: 'Go' },
  { value: 'rust', label: 'Rust' },
  { value: 'html', label: 'HTML' },
  { value: 'css', label: 'CSS' },
  { value: 'json', label: 'JSON' },
  { value: 'sql', label: 'SQL' },
  { value: 'bash', label: 'Bash' },
  { value: 'ruby', label: 'Ruby' },
  { value: 'php', label: 'PHP' },
  { value: 'swift', label: 'Swift' },
  { value: 'kotlin', label: 'Kotlin' },
  { value: 'markdown', label: 'Markdown' },
  { value: 'xml', label: 'XML' },
  { value: 'yaml', label: 'YAML' },
];

const LANGUAGE_COLORS: Record<string, string> = {
  javascript: '#f7df1e',
  typescript: '#3178c6',
  python: '#3776ab',
  java: '#007396',
  cpp: '#00599c',
  csharp: '#512bd4',
  go: '#00add8',
  rust: '#dea584',
  html: '#e34f26',
  css: '#1572b6',
  json: '#292929',
  sql: '#e38c00',
  bash: '#4eaa25',
  ruby: '#cc342d',
  php: '#777bb4',
  swift: '#fa7343',
  kotlin: '#7f52ff',
  markdown: '#083fa1',
  xml: '#0060ac',
  yaml: '#cb171e',
};

const FIELD_LABELS: Record<string, string> = {
  title: '标题',
  code: '代码',
  description: '描述',
  tags: '标签',
};

const Search: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { showToast } = useToast();
  const { collections, fetchCollections, tags, fetchTags, loading } = useSnippetStore();

  const initialQuery = (location.state as { q?: string })?.q || '';

  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [selectedLanguage, setSelectedLanguage] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [results, setResults] = useState<SnippetSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [languageDropdownOpen, setLanguageDropdownOpen] = useState(false);
  const [tagDropdownOpen, setTagDropdownOpen] = useState(false);
  const [copiedId, setCopiedId] = useState<number | null>(null);

  useEffect(() => {
    fetchCollections();
    fetchTags();
  }, [fetchCollections, fetchTags]);

  const search = useCallback(async () => {
    if (!searchQuery.trim()) {
      setResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const params: {
        q: string;
        language?: string;
        tags?: string;
        page: number;
        page_size: number;
      } = {
        q: searchQuery,
        page: 1,
        page_size: 50,
      };

      if (selectedLanguage) {
        params.language = selectedLanguage;
      }

      if (selectedTags.length > 0) {
        params.tags = selectedTags.join(',');
      }

      const res = await searchApi.searchSnippets(params);
      setResults(res.data.items.sort((a, b) => b.relevance_score - a.relevance_score));
    } catch {
      showToast('搜索失败', 'error');
    } finally {
      setIsSearching(false);
    }
  }, [searchQuery, selectedLanguage, selectedTags, showToast]);

  useEffect(() => {
    const timer = setTimeout(() => {
      search();
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const handleTagToggle = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleCopy = async (snippet: SnippetSearchResult) => {
    const success = await copyToClipboard(snippet.code);
    if (success) {
      setCopiedId(snippet.id);
      showToast('代码已复制到剪贴板', 'success');
      setTimeout(() => setCopiedId(null), 2000);
      try {
        await snippetApi.recordCopy(snippet.id);
      } catch {
        // ignore
      }
    } else {
      showToast('复制失败', 'error');
    }
  };

  const getLanguageColor = (lang: string) => {
    return LANGUAGE_COLORS[lang] || '#6366f1';
  };

  const sortedResults = useMemo(() => {
    return [...results].sort((a, b) => b.relevance_score - a.relevance_score);
  }, [results]);

  const renderHighlightedContent = (text: string, keyword: string) => {
    const highlighted = highlightText(text, keyword);
    return (
      <span
        dangerouslySetInnerHTML={{
          __html: highlighted.replace(
            /<mark>([^<]+)<\/mark>/g,
            '<mark class="bg-yellow-500/40 text-yellow-200 px-0.5 rounded">$1</mark>'
          ),
        }}
      />
    );
  };

  return (
    <Layout
      sidebar={
        <Sidebar
          collections={collections}
          onSelect={(col) => navigate(`/editor?collection=${col.id === 0 ? '' : col.id}`)}
        />
      }
    >
      <div className="max-w-5xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-6">搜索片段</h1>

          <div className="relative mb-4">
            <SearchIcon className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400" size={22} />
            <input
              type="text"
              placeholder="输入关键词搜索代码片段..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              autoFocus
              className="w-full pl-14 pr-4 py-4 bg-gray-800 border-2 border-gray-700 rounded-xl text-lg text-gray-200 placeholder-gray-500 focus:outline-none focus:border-indigo-500 transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-gray-700 text-gray-400 transition-colors"
              >
                <X size={18} />
              </button>
            )}
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-gray-400">
              <Filter size={18} />
              <span className="text-sm">筛选：</span>
            </div>

            <div className="relative">
              <button
                onClick={() => {
                  setLanguageDropdownOpen(!languageDropdownOpen);
                  setTagDropdownOpen(false);
                }}
                className="flex items-center gap-2 px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-300 hover:bg-gray-700 transition-colors"
              >
                <span className="text-sm">
                  {LANGUAGES.find((l) => l.value === selectedLanguage)?.label || '全部语言'}
                </span>
                <ChevronDown size={16} className={twMerge('transition-transform', languageDropdownOpen && 'rotate-180')} />
              </button>

              {languageDropdownOpen && (
                <div className="absolute top-full left-0 mt-1 w-48 max-h-60 overflow-auto bg-gray-800 border border-gray-700 rounded-lg shadow-lg z-50">
                  {LANGUAGES.map((lang) => (
                    <button
                      key={lang.value}
                      onClick={() => {
                        setSelectedLanguage(lang.value);
                        setLanguageDropdownOpen(false);
                      }}
                      className={twMerge(
                        'w-full flex items-center gap-2 px-3 py-2 text-sm text-left transition-colors',
                        selectedLanguage === lang.value
                          ? 'text-indigo-400 bg-indigo-500/20'
                          : 'text-gray-300 hover:bg-gray-700'
                      )}
                    >
                      {selectedLanguage === lang.value && <Check size={14} />}
                      <span className={selectedLanguage !== lang.value ? 'ml-6' : ''}>
                        {lang.label}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="relative">
              <button
                onClick={() => {
                  setTagDropdownOpen(!tagDropdownOpen);
                  setLanguageDropdownOpen(false);
                }}
                className="flex items-center gap-2 px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-300 hover:bg-gray-700 transition-colors"
              >
                <Hash size={16} />
                <span className="text-sm">
                  {selectedTags.length > 0 ? `${selectedTags.length} 个标签` : '选择标签'}
                </span>
                <ChevronDown size={16} className={twMerge('transition-transform', tagDropdownOpen && 'rotate-180')} />
              </button>

              {tagDropdownOpen && (
                <div className="absolute top-full left-0 mt-1 w-56 max-h-60 overflow-auto bg-gray-800 border border-gray-700 rounded-lg shadow-lg z-50 p-2">
                  {tags.length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {tags.map((tag) => (
                        <button
                          key={tag}
                          onClick={() => handleTagToggle(tag)}
                          className={twMerge(
                            'px-2.5 py-1 rounded-full text-xs font-medium transition-colors',
                            selectedTags.includes(tag)
                              ? 'text-white'
                              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                          )}
                          style={selectedTags.includes(tag) ? { backgroundColor: '#6366f1' } : {}}
                        >
                          {tag}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500 text-center py-2">暂无标签</p>
                  )}
                  {selectedTags.length > 0 && (
                    <button
                      onClick={() => setSelectedTags([])}
                      className="w-full mt-2 pt-2 border-t border-gray-700 text-xs text-gray-400 hover:text-gray-300 transition-colors"
                    >
                      清除已选标签
                    </button>
                  )}
                </div>
              )}
            </div>

            {(selectedLanguage || selectedTags.length > 0) && (
              <button
                onClick={() => {
                  setSelectedLanguage('');
                  setSelectedTags([]);
                }}
                className="flex items-center gap-1 text-sm text-gray-400 hover:text-gray-300 transition-colors"
              >
                <X size={14} />
                清除筛选
              </button>
            )}
          </div>
        </div>

        {searchQuery && (
          <div className="mb-4 text-sm text-gray-400">
            {isSearching ? (
              <span>搜索中...</span>
            ) : (
              <span>找到 {sortedResults.length} 个结果</span>
            )}
          </div>
        )}

        <div className="space-y-3">
          {isSearching ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-32 rounded-xl bg-gray-800 animate-pulse" />
              ))}
            </div>
          ) : sortedResults.length > 0 ? (
            sortedResults.map((snippet) => (
              <div
                key={snippet.id}
                className="group rounded-xl border border-gray-700 overflow-hidden transition-all duration-200 hover:border-indigo-500/50 hover:shadow-lg hover:shadow-indigo-500/5"
                style={{ backgroundColor: '#252535' }}
              >
                <div
                  className="p-5 cursor-pointer"
                  onClick={() => navigate(`/editor/${snippet.id}`)}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: getLanguageColor(snippet.language) + '20' }}
                      >
                        <FileCode size={20} style={{ color: getLanguageColor(snippet.language) }} />
                      </div>
                      <div>
                        <h3 className="font-semibold text-white group-hover:text-indigo-400 transition-colors">
                          {renderHighlightedContent(snippet.title, searchQuery)}
                        </h3>
                        <div className="flex items-center gap-2 mt-1">
                          <span
                            className="px-2 py-0.5 rounded text-xs font-medium text-white"
                            style={{ backgroundColor: getLanguageColor(snippet.language) }}
                          >
                            {snippet.language}
                          </span>
                          <div className="flex items-center gap-1 text-sm text-gray-400">
                            <TrendingUp size={12} style={{ color: '#6366f1' }} />
                            <span>相关度: {(snippet.relevance_score * 100).toFixed(0)}%</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCopy(snippet);
                      }}
                      className={twMerge(
                        'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all',
                        copiedId === snippet.id
                          ? 'bg-green-600 text-white'
                          : 'bg-gray-700 text-gray-300 hover:bg-gray-600 opacity-0 group-hover:opacity-100'
                      )}
                    >
                      {copiedId === snippet.id ? (
                        <>
                          <Check size={14} />
                          已复制
                        </>
                      ) : (
                        <>
                          <Copy size={14} />
                          复制
                        </>
                      )}
                    </button>
                  </div>

                  {snippet.matched_fields && snippet.matched_fields.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      {snippet.matched_fields.map((field) => (
                        <span
                          key={field}
                          className="px-2 py-0.5 rounded text-xs font-medium bg-indigo-500/20 text-indigo-400"
                        >
                          匹配: {FIELD_LABELS[field] || field}
                        </span>
                      ))}
                    </div>
                  )}

                  {snippet.description && (
                    <p className="text-sm text-gray-400 mb-3 line-clamp-2">
                      {renderHighlightedContent(snippet.description, searchQuery)}
                    </p>
                  )}

                  <div className="p-3 rounded-lg overflow-hidden mb-3" style={{ backgroundColor: '#1e1e2e' }}>
                    <pre className="text-xs text-gray-400 font-mono line-clamp-3 whitespace-pre-wrap break-all">
                      {renderHighlightedContent(snippet.code, searchQuery)}
                    </pre>
                  </div>

                  {snippet.tags && snippet.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {snippet.tags.map((tag) => (
                        <span
                          key={tag}
                          className="px-2 py-0.5 rounded-full text-xs font-medium text-white"
                          style={{ backgroundColor: '#6366f1' }}
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))
          ) : searchQuery ? (
            <div className="text-center py-16">
              <SearchIcon size={48} className="mx-auto text-gray-600 mb-4" />
              <p className="text-lg text-gray-400">未找到匹配的片段</p>
              <p className="text-sm text-gray-500 mt-2">尝试使用不同的关键词或调整筛选条件</p>
            </div>
          ) : (
            <div className="text-center py-16">
              <SearchIcon size={48} className="mx-auto text-gray-600 mb-4" />
              <p className="text-lg text-gray-400">输入关键词开始搜索</p>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default Search;
