import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Plus, Menu, X, Code2 } from 'lucide-react';
import { twMerge } from 'tailwind-merge';

interface LayoutProps {
  children: React.ReactNode;
  sidebar: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children, sidebar }) => {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#1e1e2e' }}>
      <header className="h-14 border-b border-gray-700 flex items-center px-4 gap-4 flex-shrink-0">
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-2 rounded-lg hover:bg-gray-700 transition-colors text-gray-300"
        >
          {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
        </button>

        <div className="flex items-center gap-2">
          <Code2 size={28} style={{ color: '#6366f1' }} />
          <span className="text-xl font-bold text-white">SnippetHub</span>
        </div>

        <div className="flex-1 max-w-xl mx-auto">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="搜索代码片段..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && searchQuery.trim()) {
                  navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
                }
              }}
              className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-gray-200 placeholder-gray-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
            />
          </div>
        </div>

        <button
          onClick={() => navigate('/editor')}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-white font-medium transition-colors hover:opacity-90"
          style={{ backgroundColor: '#6366f1' }}
        >
          <Plus size={18} />
          <span>新建</span>
        </button>
      </header>

      <div className="flex-1 flex overflow-hidden">
        <aside
          className={twMerge(
            'w-64 border-r border-gray-700 flex-shrink-0 transition-all duration-300 overflow-hidden',
            !sidebarOpen && 'w-0 border-r-0'
          )}
        >
          <div className="w-64 h-full">{sidebar}</div>
        </aside>

        <main className="flex-1 overflow-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
};
