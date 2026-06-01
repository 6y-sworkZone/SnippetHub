import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileCode,
  Layers,
  Copy,
  ChevronRight,
  Variable,
  Hash,
  FileText,
  Sparkles,
} from 'lucide-react';
import { Layout } from '@/components/Layout';
import { Sidebar } from '@/components/Sidebar';
import { Modal } from '@/components/Modal';
import { useToast } from '@/components/Toast';
import { useSnippetStore } from '@/store';
import { snippetApi } from '@/services/api';
import { copyToClipboard } from '@/utils/copy';
import { replaceVariables } from '@/utils/templates';
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

const Templates: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { collections, fetchCollections, loading } = useSnippetStore();

  const [templates, setTemplates] = useState<Snippet[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<Snippet | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [variables, setVariables] = useState<Record<string, string>>({});
  const [newTitle, setNewTitle] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    fetchCollections();
    loadTemplates();
  }, [fetchCollections]);

  const loadTemplates = async () => {
    try {
      const res = await snippetApi.getTemplates(0, 50);
      setTemplates(res.data.items);
    } catch {
      showToast('加载模板失败', 'error');
    }
  };

  const handleCreateFromTemplate = (template: Snippet) => {
    setSelectedTemplate(template);
    setNewTitle(`${template.title} - 副本`);
    const initialVariables: Record<string, string> = {};
    template.template_variables.forEach((v) => {
      initialVariables[v] = '';
    });
    setVariables(initialVariables);
    setModalOpen(true);
  };

  const handleVariableChange = (name: string, value: string) => {
    setVariables((prev) => ({ ...prev, [name]: value }));
  };

  const handleCreate = async () => {
    if (!selectedTemplate) return;

    const emptyVariables = Object.entries(variables).filter(([_, v]) => !v.trim());
    if (emptyVariables.length > 0) {
      showToast(`请填写变量: ${emptyVariables.map(([k]) => k).join(', ')}`, 'error');
      return;
    }

    if (!newTitle.trim()) {
      showToast('请输入标题', 'error');
      return;
    }

    setIsCreating(true);
    try {
      const res = await snippetApi.createFromTemplate({
        template_id: selectedTemplate.id,
        variables,
        title: newTitle,
        collection_id: selectedTemplate.collection_id,
      });
      showToast('创建成功', 'success');
      setModalOpen(false);
      navigate(`/editor/${res.data.id}`);
    } catch {
      showToast('创建失败', 'error');
    } finally {
      setIsCreating(false);
    }
  };

  const handlePreviewCode = (template: Snippet) => {
    const previewCode = replaceVariables(template.code, variables);
    return previewCode;
  };

  const handleCopy = async (e: React.MouseEvent, code: string) => {
    e.stopPropagation();
    const success = await copyToClipboard(code);
    if (success) {
      showToast('代码已复制到剪贴板', 'success');
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
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: '#6366f1' }}
            >
              <Layers size={24} className="text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">模板库</h1>
              <p className="text-gray-400 mt-1">使用模板快速创建代码片段</p>
            </div>
          </div>
        </div>

        {loading && templates.length === 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-56 rounded-xl bg-gray-800 animate-pulse" />
            ))}
          </div>
        ) : templates.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {templates.map((template) => (
              <div
                key={template.id}
                className="group rounded-xl border border-gray-700 overflow-hidden transition-all duration-300 hover:border-indigo-500/50 hover:shadow-lg hover:shadow-indigo-500/10 hover:-translate-y-1"
                style={{ backgroundColor: '#252535' }}
              >
                <div className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: getLanguageColor(template.language) + '20' }}
                      >
                        <FileCode size={20} style={{ color: getLanguageColor(template.language) }} />
                      </div>
                      <div>
                        <h3 className="font-semibold text-white group-hover:text-indigo-400 transition-colors">
                          {template.title}
                        </h3>
                        <span
                          className="inline-block px-2 py-0.5 rounded text-xs font-medium text-white mt-1"
                          style={{ backgroundColor: getLanguageColor(template.language) }}
                        >
                          {template.language}
                        </span>
                      </div>
                    </div>
                  </div>

                  {template.description && (
                    <p className="text-sm text-gray-400 mb-3 line-clamp-2">
                      {template.description}
                    </p>
                  )}

                  {template.template_variables && template.template_variables.length > 0 && (
                    <div className="mb-3">
                      <div className="flex items-center gap-1.5 text-xs text-gray-400 mb-2">
                        <Variable size={12} />
                        <span>模板变量 ({template.template_variables.length})</span>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {template.template_variables.map((v) => (
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

                  <div className="p-3 rounded-lg overflow-hidden mb-4" style={{ backgroundColor: '#1e1e2e' }}>
                    <pre className="text-xs text-gray-400 font-mono line-clamp-4 whitespace-pre-wrap break-all">
                      {template.code || '// 空模板'}
                    </pre>
                  </div>

                  {template.tags && template.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-4">
                      {template.tags.slice(0, 3).map((tag) => (
                        <span
                          key={tag}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs text-gray-300 bg-gray-700"
                        >
                          <Hash size={10} />
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1 text-sm text-gray-500">
                      <Copy size={14} />
                      <span>{template.copy_count} 次使用</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => handleCopy(e, template.code)}
                        className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-700 transition-colors"
                      >
                        <Copy size={16} />
                      </button>
                      <button
                        onClick={() => handleCreateFromTemplate(template)}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-white font-medium transition-colors hover:opacity-90"
                        style={{ backgroundColor: '#6366f1' }}
                      >
                        <Sparkles size={16} />
                        从模板创建
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <Layers size={48} className="mx-auto text-gray-600 mb-4" />
            <p className="text-lg text-gray-400">暂无模板</p>
            <p className="text-sm text-gray-500 mt-2">
              在编辑器中开启"模板模式"创建你的第一个模板
            </p>
            <button
              onClick={() => navigate('/editor')}
              className="mt-4 px-6 py-2 rounded-lg text-white font-medium transition-colors hover:opacity-90"
              style={{ backgroundColor: '#6366f1' }}
            >
              创建模板
            </button>
          </div>
        )}
      </div>

      <Modal
        isOpen={modalOpen}
        onClose={() => !isCreating && setModalOpen(false)}
        title="从模板创建"
        size="xl"
        closeOnOverlayClick={!isCreating}
        showCloseButton={!isCreating}
        buttons={[
          {
            label: '取消',
            onClick: () => setModalOpen(false),
            variant: 'secondary',
            disabled: isCreating,
          },
          {
            label: '创建',
            onClick: handleCreate,
            variant: 'primary',
            disabled: isCreating,
          },
        ]}
      >
        {selectedTemplate && (
          <div className="space-y-6">
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-300 mb-2">
                <FileText size={16} style={{ color: '#6366f1' }} />
                新片段标题
              </label>
              <input
                type="text"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="输入片段标题..."
                className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-gray-200 placeholder-gray-500 focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </div>

            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-300 mb-3">
                <Variable size={16} style={{ color: '#6366f1' }} />
                模板变量
              </label>
              <div className="space-y-3">
                {selectedTemplate.template_variables.map((variable) => (
                  <div key={variable}>
                    <label className="block text-xs text-gray-400 mb-1">
                      <span
                        className="px-1.5 py-0.5 rounded font-mono text-white"
                        style={{ backgroundColor: '#6366f1' }}
                      >
                        {`{{${variable}}}`}
                      </span>
                    </label>
                    <input
                      type="text"
                      value={variables[variable] || ''}
                      onChange={(e) => handleVariableChange(variable, e.target.value)}
                      placeholder={`输入 ${variable} 的值...`}
                      className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-gray-200 placeholder-gray-500 focus:outline-none focus:border-indigo-500 transition-colors"
                    />
                  </div>
                ))}
              </div>
            </div>

            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-300 mb-3">
                <ChevronRight size={16} style={{ color: '#6366f1' }} />
                预览
              </label>
              <div className="p-4 rounded-lg overflow-auto max-h-60" style={{ backgroundColor: '#1e1e2e' }}>
                <pre className="text-sm text-gray-300 font-mono whitespace-pre-wrap break-all">
                  {handlePreviewCode(selectedTemplate)}
                </pre>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </Layout>
  );
};

export default Templates;
