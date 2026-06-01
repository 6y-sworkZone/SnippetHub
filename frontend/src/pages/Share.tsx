import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import {
  Copy,
  Check,
  FileCode,
  Hash,
  FileText,
  Code2,
  ExternalLink,
} from 'lucide-react';
import hljs from 'highlight.js/lib/core';
import javascript from 'highlight.js/lib/languages/javascript';
import typescript from 'highlight.js/lib/languages/typescript';
import python from 'highlight.js/lib/languages/python';
import java from 'highlight.js/lib/languages/java';
import cpp from 'highlight.js/lib/languages/cpp';
import csharp from 'highlight.js/lib/languages/csharp';
import go from 'highlight.js/lib/languages/go';
import rust from 'highlight.js/lib/languages/rust';
import html from 'highlight.js/lib/languages/xml';
import css from 'highlight.js/lib/languages/css';
import json from 'highlight.js/lib/languages/json';
import sql from 'highlight.js/lib/languages/sql';
import bash from 'highlight.js/lib/languages/bash';
import ruby from 'highlight.js/lib/languages/ruby';
import php from 'highlight.js/lib/languages/php';
import swift from 'highlight.js/lib/languages/swift';
import kotlin from 'highlight.js/lib/languages/kotlin';
import markdown from 'highlight.js/lib/languages/markdown';
import xml from 'highlight.js/lib/languages/xml';
import yaml from 'highlight.js/lib/languages/yaml';
import 'highlight.js/styles/atom-one-dark.css';
import { useToast } from '@/components/Toast';
import { shareApi } from '@/services/api';
import { copyToClipboard } from '@/utils/copy';
import type { SharedSnippet } from '@/types';

hljs.registerLanguage('javascript', javascript);
hljs.registerLanguage('typescript', typescript);
hljs.registerLanguage('python', python);
hljs.registerLanguage('java', java);
hljs.registerLanguage('cpp', cpp);
hljs.registerLanguage('csharp', csharp);
hljs.registerLanguage('go', go);
hljs.registerLanguage('rust', rust);
hljs.registerLanguage('html', html);
hljs.registerLanguage('css', css);
hljs.registerLanguage('json', json);
hljs.registerLanguage('sql', sql);
hljs.registerLanguage('bash', bash);
hljs.registerLanguage('ruby', ruby);
hljs.registerLanguage('php', php);
hljs.registerLanguage('swift', swift);
hljs.registerLanguage('kotlin', kotlin);
hljs.registerLanguage('markdown', markdown);
hljs.registerLanguage('xml', xml);
hljs.registerLanguage('yaml', yaml);

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

const LANGUAGE_ALIASES: Record<string, string> = {
  javascript: 'javascript',
  typescript: 'typescript',
  python: 'python',
  java: 'java',
  cpp: 'cpp',
  csharp: 'csharp',
  go: 'go',
  rust: 'rust',
  html: 'html',
  css: 'css',
  json: 'json',
  sql: 'sql',
  bash: 'bash',
  ruby: 'ruby',
  php: 'php',
  swift: 'swift',
  kotlin: 'kotlin',
  markdown: 'markdown',
  xml: 'xml',
  yaml: 'yaml',
};

const Share: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const { showToast } = useToast();
  const codeRef = useRef<HTMLPreElement>(null);

  const [snippet, setSnippet] = useState<SharedSnippet | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    loadSnippet();
  }, [token]);

  useEffect(() => {
    if (snippet && codeRef.current) {
      const language = LANGUAGE_ALIASES[snippet.language] || 'plaintext';
      try {
        hljs.highlightElement(codeRef.current);
      } catch {
        // ignore
      }
    }
  }, [snippet]);

  const loadSnippet = async () => {
    if (!token) return;

    setLoading(true);
    setError(null);
    try {
      const res = await shareApi.getSharedSnippet(token);
      setSnippet(res.data);
    } catch {
      setError('分享链接无效或已过期');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    if (!snippet) return;
    const success = await copyToClipboard(snippet.code);
    if (success) {
      setCopied(true);
      showToast('代码已复制到剪贴板', 'success');
      setTimeout(() => setCopied(false), 2000);
    } else {
      showToast('复制失败', 'error');
    }
  };

  const getLanguageColor = (lang: string) => {
    return LANGUAGE_COLORS[lang] || '#6366f1';
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#1e1e2e' }}>
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-400">加载中...</p>
        </div>
      </div>
    );
  }

  if (error || !snippet) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#1e1e2e' }}>
        <div className="text-center max-w-md mx-auto px-4">
          <div
            className="w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6"
            style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)' }}
          >
            <ExternalLink size={40} className="text-red-400" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-3">链接无效</h1>
          <p className="text-gray-400 mb-6">{error || '该分享链接不存在或已被删除'}</p>
          <button
            onClick={() => window.location.href = '/'}
            className="px-6 py-2.5 rounded-lg text-white font-medium transition-colors hover:opacity-90"
            style={{ backgroundColor: '#6366f1' }}
          >
            返回首页
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#1e1e2e' }}>
      <header className="border-b border-gray-700 sticky top-0 z-10" style={{ backgroundColor: '#252535' }}>
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: '#6366f1' }}
            >
              <Code2 size={20} className="text-white" />
            </div>
            <div>
              <h1 className="font-bold text-white">SnippetHub</h1>
              <p className="text-xs text-gray-500">代码片段分享</p>
            </div>
          </div>

          <button
            onClick={handleCopy}
            className={
              'flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium transition-all duration-200' +
              ' ' +
              (copied
                ? 'bg-green-600 text-white'
                : 'text-white hover:opacity-90')
            }
            style={!copied ? { backgroundColor: '#6366f1' } : {}}
          >
            {copied ? (
              <>
                <Check size={18} />
                已复制
              </>
            ) : (
              <>
                <Copy size={18} />
                复制代码
              </>
            )}
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8">
        <div className="rounded-2xl border border-gray-700 overflow-hidden mb-6" style={{ backgroundColor: '#252535' }}>
          <div className="p-6 border-b border-gray-700">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: getLanguageColor(snippet.language) + '20' }}
                >
                  <FileCode size={24} style={{ color: getLanguageColor(snippet.language) }} />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white">{snippet.title}</h2>
                  <div className="flex items-center gap-2 mt-1">
                    <span
                      className="px-2.5 py-0.5 rounded-full text-xs font-medium text-white"
                      style={{ backgroundColor: getLanguageColor(snippet.language) }}
                    >
                      {snippet.language}
                    </span>
                    {snippet.share?.expires_at && (
                      <span className="text-xs text-gray-500">
                        过期时间: {new Date(snippet.share.expires_at).toLocaleString()}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {snippet.description && (
              <div className="flex items-start gap-2 mb-4">
                <FileText size={16} className="text-gray-500 mt-0.5 flex-shrink-0" />
                <p className="text-gray-300">{snippet.description}</p>
              </div>
            )}

            {snippet.tags && snippet.tags.length > 0 && (
              <div className="flex items-start gap-2">
                <Hash size={16} className="text-gray-500 mt-0.5 flex-shrink-0" />
                <div className="flex flex-wrap gap-1.5">
                  {snippet.tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium text-white"
                      style={{ backgroundColor: '#6366f1' }}
                    >
                      <Hash size={10} />
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="p-1">
            <div className="rounded-xl overflow-hidden">
              <div className="px-4 py-2 flex items-center justify-between" style={{ backgroundColor: '#2d2d3f' }}>
                <span className="text-xs text-gray-400 font-mono">{snippet.language}</span>
                <span className="text-xs text-gray-500">{snippet.code.length} 字符</span>
              </div>
              <div className="overflow-auto max-h-[70vh]">
                <pre
                  ref={codeRef}
                  className="p-4 m-0 text-sm font-mono leading-relaxed"
                  style={{ backgroundColor: '#1e1e2e' }}
                >
                  <code className={`language-${LANGUAGE_ALIASES[snippet.language] || 'plaintext'}`}>
                    {snippet.code || '// 空代码片段'}
                  </code>
                </pre>
              </div>
            </div>
          </div>
        </div>

        <div className="text-center text-sm text-gray-500">
          <p>此链接由 SnippetHub 分享生成 · 无需登录即可查看</p>
        </div>
      </main>
    </div>
  );
};

export default Share;
