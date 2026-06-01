import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Copy, Clock, TrendingUp, Code2, ChevronRight } from 'lucide-react';
import { Layout } from '@/components/Layout';
import { Sidebar } from '@/components/Sidebar';
import { useSnippetStore } from '@/store';
import { snippetApi } from '@/services/api';
import { copyToClipboard } from '@/utils/copy';
import { useToast } from '@/components/Toast';
import type { Snippet } from '@/types';

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

const Home: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { collections, fetchCollections, loading } = useSnippetStore();
  const [hotSnippets, setHotSnippets] = useState<Snippet[]>([]);
  const [recentSnippets, setRecentSnippets] = useState<Snippet[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchCollections();
    loadData();
  }, [fetchCollections]);

  const loadData = async () => {
    try {
      const [hotRes, recentRes] = await Promise.all([
        snippetApi.getHotSnippets(10),
        snippetApi.getRecentSnippets(10),
      ]);
      setHotSnippets(hotRes.data);
      setRecentSnippets(recentRes.data);
    } catch {
      showToast('加载数据失败', 'error');
    }
  };

  const handleSearchClick = () => {
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      navigate('/search');
    }
  };

  const handleCardClick = (id: number) => {
    navigate(`/editor/${id}`);
  };

  const handleCopy = async (e: React.MouseEvent, snippet: Snippet) => {
    e.stopPropagation();
    const success = await copyToClipboard(snippet.code);
    if (success) {
      showToast('代码已复制到剪贴板', 'success');
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

  const sidebarCollections = collections.map((c) => ({
    id: c.id,
    name: c.name,
    type: 'folder' as const,
    children: [],
    expanded: false,
  }));

  const SnippetCard: React.FC<{ snippet: Snippet; index?: number }> = ({ snippet, index }) => (
    <div
      onClick={() => handleCardClick(snippet.id)}
      className="group p-4 rounded-xl border border-gray-700 cursor-pointer transition-all duration-300 hover:border-indigo-500/50 hover:shadow-lg hover:shadow-indigo-500/10 hover:-translate-y-1"
      style={{ backgroundColor: '#252535' }}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          {index !== undefined && (
            <span
              className="flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold text-white"
              style={{ backgroundColor: getLanguageColor(snippet.language) }}
            >
              {index + 1}
            </span>
          )}
          <h3 className="font-semibold text-white truncate max-w-[180px] group-hover:text-indigo-400 transition-colors">
            {snippet.title}
          </h3>
        </div>
        <span
          className="px-2 py-0.5 rounded-full text-xs font-medium text-white"
          style={{ backgroundColor: getLanguageColor(snippet.language) }}
        >
          {snippet.language}
        </span>
      </div>

      <div className="mb-3 p-3 rounded-lg overflow-hidden" style={{ backgroundColor: '#1e1e2e' }}>
        <pre className="text-xs text-gray-400 font-mono line-clamp-4 whitespace-pre-wrap break-all">
          {snippet.code || '// 空代码片段'}
        </pre>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1 text-gray-400 text-sm">
          <Copy size={14} />
          <span>{snippet.copy_count} 次复制</span>
        </div>
        <button
          onClick={(e) => handleCopy(e, snippet)}
          className="px-3 py-1 rounded-lg text-sm text-white opacity-0 group-hover:opacity-100 transition-opacity"
          style={{ backgroundColor: '#6366f1' }}
        >
          复制
        </button>
      </div>
    </div>
  );

  const RecentItem: React.FC<{ snippet: Snippet }> = ({ snippet }) => (
    <div
      onClick={() => handleCardClick(snippet.id)}
      className="group flex items-center gap-4 p-3 rounded-lg border border-transparent cursor-pointer transition-all duration-200 hover:border-gray-700 hover:bg-gray-800/50"
    >
      <div
        className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
        style={{ backgroundColor: getLanguageColor(snippet.language) + '20' }}
      >
        <Code2 size={20} style={{ color: getLanguageColor(snippet.language) }} />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <h4 className="font-medium text-white truncate group-hover:text-indigo-400 transition-colors">
            {snippet.title}
          </h4>
          <span
            className="px-1.5 py-0.5 rounded text-xs text-white flex-shrink-0"
            style={{ backgroundColor: getLanguageColor(snippet.language) }}
          >
            {snippet.language}
          </span>
        </div>
        <p className="text-sm text-gray-400 truncate">
          {snippet.description || '暂无描述'}
        </p>
      </div>

      <div className="flex items-center gap-3 text-sm text-gray-500">
        <div className="flex items-center gap-1">
          <Copy size={14} />
          <span>{snippet.copy_count}</span>
        </div>
        <ChevronRight size={16} className="opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>
    </div>
  );

  return (
    <Layout
      sidebar={
        <Sidebar
          collections={sidebarCollections}
          onSelect={(col) => navigate(`/editor?collection=${col.id}`)}
        />
      }
    >
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12 pt-8">
          <div className="inline-flex items-center gap-3 mb-4">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center"
              style={{ backgroundColor: '#6366f1' }}
            >
              <Code2 size={36} className="text-white" />
            </div>
          </div>
          <h1 className="text-5xl font-bold text-white mb-3 bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
            SnippetHub
          </h1>
          <p className="text-xl text-gray-400 mb-8">
            你的个人代码片段管理中心，高效存储、快速检索、一键复用
          </p>

          <div className="max-w-2xl mx-auto">
            <div className="relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-hover:text-indigo-400 transition-colors" size={22} />
              <input
                type="text"
                placeholder="搜索代码片段..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearchClick()}
                className="w-full pl-14 pr-4 py-4 bg-gray-800 border-2 border-gray-700 rounded-2xl text-lg text-gray-200 placeholder-gray-500 focus:outline-none focus:border-indigo-500 transition-all duration-300 hover:border-gray-600"
              />
            </div>
          </div>
        </div>

        <section className="mb-12">
          <div className="flex items-center gap-2 mb-6">
            <TrendingUp size={24} style={{ color: '#6366f1' }} />
            <h2 className="text-2xl font-bold text-white">热门片段 Top10</h2>
          </div>

          {loading && hotSnippets.length === 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="h-48 rounded-xl bg-gray-800 animate-pulse" />
              ))}
            </div>
          ) : hotSnippets.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {hotSnippets.map((snippet, index) => (
                <SnippetCard key={snippet.id} snippet={snippet} index={index} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              暂无热门片段
            </div>
          )}
        </section>

        <section className="mb-12">
          <div className="flex items-center gap-2 mb-6">
            <Clock size={24} style={{ color: '#6366f1' }} />
            <h2 className="text-2xl font-bold text-white">最近使用</h2>
          </div>

          {loading && recentSnippets.length === 0 ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-16 rounded-lg bg-gray-800 animate-pulse" />
              ))}
            </div>
          ) : recentSnippets.length > 0 ? (
            <div className="rounded-xl border border-gray-700 overflow-hidden" style={{ backgroundColor: '#252535' }}>
              {recentSnippets.map((snippet) => (
                <RecentItem key={snippet.id} snippet={snippet} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              暂无最近使用的片段
            </div>
          )}
        </section>
      </div>
    </Layout>
  );
};

export default Home;
