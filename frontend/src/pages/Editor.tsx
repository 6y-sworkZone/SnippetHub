import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import {
  Plus,
  Save,
  Trash2,
  Copy,
  Share2,
  Search,
  FileCode,
  ChevronDown,
  Tag,
  FolderOpen,
  FileText,
  Code,
  ToggleLeft,
  ToggleRight,
} from 'lucide-react';
import { twMerge } from 'tailwind-merge';
import { Layout } from '@/components/Layout';
import { Sidebar } from '@/components/Sidebar';
import { CodeEditor } from '@/components/CodeEditor';
import { TagInput } from '@/components/TagInput';
import { Modal } from '@/components/Modal';
import { useToast } from '@/components/Toast';
import { useSnippetStore } from '@/store';
import { snippetApi, shareApi } from '@/services/api';
import { copyToClipboard } from '@/utils/copy';
import { extractVariables } from '@/utils/templates';
import type { Snippet, SnippetCreate } from '@/types';

const LANGUAGES = [
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

const Editor: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const idNum = id ? parseInt(id) : undefined;
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { showToast } = useToast();

  const {
    snippets,
    collections,
    currentSnippet,
    loading,
    languages,
    tags,
    fetchSnippets,
    fetchCollections,
    fetchLanguages,
    fetchTags,
    setCurrentSnippet,
    addSnippet,
    updateSnippet,
    deleteSnippet,
  } = useSnippetStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [shareUrl, setShareUrl] = useState('');

  const [formData, setFormData] = useState<Partial<SnippetCreate>>({
    title: '',
    code: '',
    language: 'javascript',
    description: '',
    tags: [],
    collection_id: null,
    is_template: false,
    template_variables: [],
  });

  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    fetchSnippets();
    fetchCollections();
    fetchLanguages();
    fetchTags();
  }, [fetchSnippets, fetchCollections, fetchLanguages, fetchTags]);

  useEffect(() => {
    if (idNum) {
      const snippet = snippets.find((s) => s.id === idNum);
      if (snippet) {
        setFormData({
          title: snippet.title,
          code: snippet.code,
          language: snippet.language,
          description: snippet.description,
          tags: snippet.tags,
          collection_id: snippet.collection_id,
          is_template: snippet.is_template,
          template_variables: snippet.template_variables,
        });
        setCurrentSnippet(snippet);
        setHasChanges(false);
      } else {
        snippetApi.getSnippet(idNum).then((res) => {
          const snippet = res.data;
          setFormData({
            title: snippet.title,
            code: snippet.code,
            language: snippet.language,
            description: snippet.description,
            tags: snippet.tags,
            collection_id: snippet.collection_id,
            is_template: snippet.is_template,
            template_variables: snippet.template_variables,
          });
          setCurrentSnippet(snippet);
          setHasChanges(false);
        }).catch(() => {
          showToast('加载片段失败', 'error');
        });
      }
    } else {
      const collectionId = searchParams.get('collection');
      setFormData({
        title: '未命名片段',
        code: '',
        language: 'javascript',
        description: '',
        tags: [],
        collection_id: collectionId ? parseInt(collectionId) : null,
        is_template: false,
        template_variables: [],
      });
      setCurrentSnippet(null);
      setHasChanges(false);
    }
  }, [idNum, snippets, setCurrentSnippet, showToast, searchParams]);

  useEffect(() => {
    if (formData.is_template && formData.code) {
      const variables = extractVariables(formData.code);
      setFormData((prev) => ({ ...prev, template_variables: variables }));
    }
  }, [formData.code, formData.is_template]);

  const filteredSnippets = useMemo(() => {
    if (!searchQuery.trim()) return snippets;
    const query = searchQuery.toLowerCase();
    return snippets.filter(
      (s) =>
        s.title.toLowerCase().includes(query) ||
        s.code.toLowerCase().includes(query) ||
        s.tags.some((t) => t.toLowerCase().includes(query))
    );
  }, [snippets, searchQuery]);

  const handleSnippetSelect = (snippet: Snippet) => {
    navigate(`/editor/${snippet.id}`);
  };

  const handleNewSnippet = () => {
    navigate('/editor');
  };

  const handleFormChange = (key: keyof SnippetCreate, value: unknown) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    if (!formData.title?.trim()) {
      showToast('请输入标题', 'error');
      return;
    }
    if (formData.code === undefined) {
      showToast('请输入代码', 'error');
      return;
    }

    try {
      if (currentSnippet) {
        await updateSnippet(currentSnippet.id, formData);
        showToast('保存成功', 'success');
      } else {
        const newSnippet = await addSnippet(formData as SnippetCreate);
        showToast('创建成功', 'success');
        navigate(`/editor/${newSnippet.id}`);
      }
      setHasChanges(false);
    } catch {
      showToast('保存失败', 'error');
    }
  };

  const handleDelete = async () => {
    if (!currentSnippet) return;
    try {
      await deleteSnippet(currentSnippet.id);
      showToast('删除成功', 'success');
      setDeleteModalOpen(false);
      navigate('/editor');
    } catch {
      showToast('删除失败', 'error');
    }
  };

  const handleCopy = async () => {
    if (!formData.code) return;
    const success = await copyToClipboard(formData.code);
    if (success) {
      showToast('代码已复制到剪贴板', 'success');
      if (currentSnippet) {
        try {
          await snippetApi.recordCopy(currentSnippet.id);
        } catch {
          // ignore
        }
      }
    } else {
      showToast('复制失败', 'error');
    }
  };

  const handleShare = async () => {
    if (!currentSnippet) return;
    try {
      const res = await shareApi.createShare(currentSnippet.id);
      const shareLink = `${window.location.origin}/share/${res.data.token}`;
      setShareUrl(shareLink);
      setShareModalOpen(true);
    } catch {
      showToast('创建分享链接失败', 'error');
    }
  };

  const handleCopyShareUrl = async () => {
    const success = await copyToClipboard(shareUrl);
    if (success) {
      showToast('分享链接已复制', 'success');
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

  return (
    <Layout
      sidebar={
        <Sidebar
          collections={sidebarCollections}
          onSelect={(col) => navigate(`/editor?collection=${col.id}`)}
        />
      }
    >
      <div className="h-full flex gap-4 -m-6 p-6" style={{ backgroundColor: '#1e1e2e' }}>
        <div className="w-64 flex-shrink-0 flex flex-col rounded-xl border border-gray-700 overflow-hidden" style={{ backgroundColor: '#252535' }}>
          <div className="p-3 border-b border-gray-700">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-white">片段列表</h3>
              <button
                onClick={handleNewSnippet}
                className="p-1.5 rounded-lg hover:bg-gray-700 text-gray-400 hover:text-indigo-400 transition-colors"
              >
                <Plus size={18} />
              </button>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input
                type="text"
                placeholder="搜索片段..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </div>
          </div>

          <div className="flex-1 overflow-auto p-2">
            {loading ? (
              <div className="space-y-2 p-2">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-12 rounded-lg bg-gray-800 animate-pulse" />
                ))}
              </div>
            ) : filteredSnippets.length > 0 ? (
              <div className="space-y-1">
                {filteredSnippets.map((snippet) => (
                  <div
                    key={snippet.id}
                    onClick={() => handleSnippetSelect(snippet)}
                    className={twMerge(
                      'flex items-center gap-2 px-3 py-2.5 rounded-lg cursor-pointer transition-all duration-200',
                      currentSnippet?.id === snippet.id
                        ? 'bg-indigo-500/20 border border-indigo-500/50'
                        : 'hover:bg-gray-800 border border-transparent'
                    )}
                  >
                    <FileCode
                      size={16}
                      style={{ color: getLanguageColor(snippet.language) }}
                    />
                    <div className="flex-1 min-w-0">
                      <p className={twMerge(
                        'text-sm truncate',
                        currentSnippet?.id === snippet.id ? 'text-indigo-400 font-medium' : 'text-gray-300'
                      )}>
                        {snippet.title}
                      </p>
                      <p className="text-xs text-gray-500 truncate">
                        {snippet.language}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500 text-sm">
                {searchQuery ? '未找到匹配的片段' : '暂无片段'}
              </div>
            )}
          </div>
        </div>

        <div className="w-72 flex-shrink-0 flex flex-col rounded-xl border border-gray-700 overflow-hidden" style={{ backgroundColor: '#252535' }}>
          <div className="p-4 border-b border-gray-700">
            <h3 className="font-semibold text-white">属性面板</h3>
          </div>

          <div className="flex-1 overflow-auto p-4 space-y-5">
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-300 mb-2">
                <FileText size={16} style={{ color: '#6366f1' }} />
                标题
              </label>
              <input
                type="text"
                value={formData.title || ''}
                onChange={(e) => handleFormChange('title', e.target.value)}
                placeholder="输入片段标题..."
                className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-gray-200 placeholder-gray-500 focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </div>

            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-300 mb-2">
                <Code size={16} style={{ color: '#6366f1' }} />
                语言
              </label>
              <div className="relative">
                <select
                  value={formData.language || 'javascript'}
                  onChange={(e) => handleFormChange('language', e.target.value)}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-gray-200 focus:outline-none focus:border-indigo-500 transition-colors appearance-none cursor-pointer"
                >
                  {LANGUAGES.map((lang) => (
                    <option key={lang.value} value={lang.value}>
                      {lang.label}
                    </option>
                  ))}
                </select>
                <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              </div>
            </div>

            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-300 mb-2">
                <FileText size={16} style={{ color: '#6366f1' }} />
                描述
              </label>
              <textarea
                value={formData.description || ''}
                onChange={(e) => handleFormChange('description', e.target.value)}
                placeholder="输入片段描述..."
                rows={3}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-gray-200 placeholder-gray-500 focus:outline-none focus:border-indigo-500 transition-colors resize-none"
              />
            </div>

            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-300 mb-2">
                <Tag size={16} style={{ color: '#6366f1' }} />
                标签
              </label>
              <TagInput
                value={formData.tags || []}
                onChange={(tags) => handleFormChange('tags', tags)}
                availableTags={tags}
                placeholder="输入标签，回车添加..."
              />
            </div>

            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-300 mb-2">
                <FolderOpen size={16} style={{ color: '#6366f1' }} />
                集合
              </label>
              <div className="relative">
                <select
                  value={formData.collection_id || ''}
                  onChange={(e) => handleFormChange('collection_id', e.target.value || null)}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-gray-200 focus:outline-none focus:border-indigo-500 transition-colors appearance-none cursor-pointer"
                >
                  <option value="">未分类</option>
                  {collections.map((col) => (
                    <option key={col.id} value={col.id}>
                      {col.name}
                    </option>
                  ))}
                </select>
                <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              </div>
            </div>

            <div>
              <label className="flex items-center justify-between cursor-pointer">
                <div className="flex items-center gap-2 text-sm font-medium text-gray-300">
                  {formData.is_template ? (
                    <ToggleRight size={20} style={{ color: '#6366f1' }} />
                  ) : (
                    <ToggleLeft size={20} className="text-gray-500" />
                  )}
                  模板模式
                </div>
                <button
                  type="button"
                  onClick={() => handleFormChange('is_template', !formData.is_template)}
                  className={twMerge(
                    'w-12 h-6 rounded-full transition-colors',
                    formData.is_template ? 'bg-indigo-500' : 'bg-gray-600'
                  )}
                >
                  <div
                    className={twMerge(
                      'w-5 h-5 rounded-full bg-white shadow transition-transform',
                      formData.is_template ? 'translate-x-6' : 'translate-x-0.5'
                    )}
                  />
                </button>
              </label>
              {formData.is_template && formData.template_variables && formData.template_variables.length > 0 && (
                <div className="mt-2 p-3 rounded-lg bg-gray-800 border border-gray-600">
                  <p className="text-xs text-gray-400 mb-2">检测到的模板变量：</p>
                  <div className="flex flex-wrap gap-1">
                    {formData.template_variables.map((v) => (
                      <span
                        key={v}
                        className="px-2 py-0.5 rounded text-xs font-mono text-white"
                        style={{ backgroundColor: '#6366f1' }}
                      >
                        {`{{${v}}}`}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="p-4 border-t border-gray-700 space-y-2">
            <div className="flex gap-2">
              <button
                onClick={handleSave}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-white font-medium transition-colors hover:opacity-90"
                style={{ backgroundColor: '#6366f1' }}
              >
                <Save size={18} />
                保存
                {hasChanges && <span className="w-2 h-2 rounded-full bg-white" />}
              </button>
              {currentSnippet && (
                <button
                  onClick={() => setDeleteModalOpen(true)}
                  className="p-2.5 rounded-lg text-white bg-red-600 hover:bg-red-700 transition-colors"
                >
                  <Trash2 size={18} />
                </button>
              )}
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleCopy}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-gray-300 bg-gray-700 hover:bg-gray-600 transition-colors"
              >
                <Copy size={16} />
                复制
              </button>
              {currentSnippet && (
                <button
                  onClick={handleShare}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-gray-300 bg-gray-700 hover:bg-gray-600 transition-colors"
                >
                  <Share2 size={16} />
                  分享
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="flex-1 flex flex-col rounded-xl border border-gray-700 overflow-hidden">
          <CodeEditor
            value={formData.code || ''}
            onChange={(code) => handleFormChange('code', code)}
            language={formData.language}
            onLanguageChange={(lang) => handleFormChange('language', lang)}
            showLanguageSelector={false}
          />
        </div>
      </div>

      <Modal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title="确认删除"
        size="sm"
        buttons={[
          {
            label: '取消',
            onClick: () => setDeleteModalOpen(false),
            variant: 'secondary',
          },
          {
            label: '删除',
            onClick: handleDelete,
            variant: 'danger',
          },
        ]}
      >
        <p className="text-gray-300">确定要删除这个片段吗？此操作不可撤销。</p>
      </Modal>

      <Modal
        isOpen={shareModalOpen}
        onClose={() => setShareModalOpen(false)}
        title="分享片段"
        size="lg"
        buttons={[
          {
            label: '复制链接',
            onClick: handleCopyShareUrl,
            variant: 'primary',
          },
          {
            label: '关闭',
            onClick: () => setShareModalOpen(false),
            variant: 'secondary',
          },
        ]}
      >
        <div className="space-y-4">
          <p className="text-gray-300">
            分享链接允许任何人查看此片段。链接将永久有效。
          </p>
          <div className="p-3 rounded-lg bg-gray-800 border border-gray-600">
            <code className="text-sm text-indigo-400 break-all">{shareUrl}</code>
          </div>
        </div>
      </Modal>
    </Layout>
  );
};

export default Editor;
