import React, { useRef, useEffect } from 'react';
import Editor, { OnMount, EditorProps } from '@monaco-editor/react';
import type { editor } from 'monaco-editor';
import { ChevronDown } from 'lucide-react';
import { twMerge } from 'tailwind-merge';

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

interface CodeEditorProps {
  value: string;
  onChange: (value: string) => void;
  language?: string;
  onLanguageChange?: (language: string) => void;
  height?: string | number;
  readOnly?: boolean;
  showLanguageSelector?: boolean;
  options?: EditorProps['options'];
}

export const CodeEditor: React.FC<CodeEditorProps> = ({
  value,
  onChange,
  language = 'javascript',
  onLanguageChange,
  height = '100%',
  readOnly = false,
  showLanguageSelector = true,
  options = {},
}) => {
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
  const [dropdownOpen, setDropdownOpen] = React.useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const handleEditorDidMount: OnMount = (editor) => {
    editorRef.current = editor;
  };

  const handleEditorChange = (value: string | undefined) => {
    if (value !== undefined) {
      onChange(value);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const currentLanguage = LANGUAGES.find((lang) => lang.value === language) || LANGUAGES[0];

  return (
    <div className="h-full flex flex-col" style={{ backgroundColor: '#1e1e2e' }}>
      {showLanguageSelector && (
        <div className="flex items-center justify-between px-3 py-2 border-b border-gray-700" style={{ backgroundColor: '#252535' }}>
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-800 border border-gray-600 rounded-lg text-sm text-gray-300 hover:bg-gray-700 transition-colors"
            >
              {currentLanguage.label}
              <ChevronDown size={14} className={twMerge('transition-transform', dropdownOpen && 'rotate-180')} />
            </button>

            {dropdownOpen && (
              <div className="absolute top-full left-0 mt-1 w-40 max-h-60 overflow-auto bg-gray-800 border border-gray-600 rounded-lg shadow-lg z-50">
                {LANGUAGES.map((lang) => (
                  <button
                    key={lang.value}
                    onClick={() => {
                      onLanguageChange?.(lang.value);
                      setDropdownOpen(false);
                    }}
                    className={twMerge(
                      'w-full text-left px-3 py-2 text-sm transition-colors',
                      language === lang.value
                        ? 'text-indigo-400 bg-indigo-500/20'
                        : 'text-gray-300 hover:bg-gray-700'
                    )}
                  >
                    {lang.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="text-xs text-gray-500">
            {value.length} 字符
          </div>
        </div>
      )}

      <div className="flex-1 overflow-hidden">
        <Editor
          height={height}
          language={language}
          value={value}
          onChange={handleEditorChange}
          onMount={handleEditorDidMount}
          theme="vs-dark"
          options={{
            minimap: { enabled: true },
            fontSize: 14,
            fontFamily: 'JetBrains Mono, Consolas, monospace',
            lineNumbers: 'on',
            renderLineHighlight: 'all',
            scrollBeyondLastLine: false,
            automaticLayout: true,
            tabSize: 2,
            wordWrap: 'on',
            padding: { top: 10, bottom: 10 },
            readOnly,
            ...options,
          }}
        />
      </div>
    </div>
  );
};
