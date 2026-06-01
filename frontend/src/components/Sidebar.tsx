import React, { useState } from 'react';
import { ChevronRight, ChevronDown, Folder, FolderOpen, Plus, FileCode } from 'lucide-react';
import { useDroppable } from '@dnd-kit/core';
import { twMerge } from 'tailwind-merge';
import type { CollectionTree } from '@/types';

interface SidebarProps {
  collections: CollectionTree[];
  onSelect?: (collection: CollectionTree) => void;
  selectedId?: number | string;
  onNewCollection?: () => void;
}

interface CollectionItemProps {
  collection: CollectionTree;
  level: number;
  onToggle: (id: number) => void;
  expandedIds: Set<number>;
  onSelect: (collection: CollectionTree) => void;
  selectedId?: number | string;
}

const CollectionItem: React.FC<CollectionItemProps> = ({
  collection,
  level,
  onToggle,
  expandedIds,
  onSelect,
  selectedId,
}) => {
  const hasChildren = collection.children && collection.children.length > 0;
  const isExpanded = expandedIds.has(collection.id);
  const isSelected = String(selectedId) === String(collection.id);

  const { setNodeRef, isOver } = useDroppable({
    id: `collection-${collection.id}`,
    data: { type: 'collection', collection },
  });

  return (
    <div>
      <div
        ref={setNodeRef}
        className={twMerge(
          'group flex items-center gap-1 py-1.5 px-2 rounded-lg cursor-pointer transition-all duration-200',
          isSelected ? 'bg-indigo-500/20' : 'hover:bg-gray-700/50',
          isOver && 'bg-indigo-500/30 border-2 border-indigo-500'
        )}
        style={{ paddingLeft: `${level * 16 + 8}px` }}
      >
        {hasChildren ? (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggle(collection.id);
            }}
            className="p-0.5 rounded hover:bg-gray-600 text-gray-400"
          >
            {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          </button>
        ) : (
          <div className="w-5" />
        )}

        <span className="text-gray-400">
          {isExpanded ? (
            <FolderOpen size={16} style={{ color: '#6366f1' }} />
          ) : (
            <Folder size={16} style={{ color: '#6366f1' }} />
          )}
        </span>

        <span
          onClick={() => onSelect(collection)}
          className={twMerge(
            'flex-1 text-sm truncate',
            isSelected ? 'text-indigo-400 font-medium' : 'text-gray-300'
          )}
        >
          {collection.name}
          {collection.snippet_count !== undefined && (
            <span className="text-xs text-gray-500 ml-2">({collection.snippet_count})</span>
          )}
        </span>
      </div>

      {hasChildren && isExpanded && (
        <div>
          {collection.children.map((child) => (
            <CollectionItem
              key={child.id}
              collection={child}
              level={level + 1}
              onToggle={onToggle}
              expandedIds={expandedIds}
              onSelect={onSelect}
              selectedId={selectedId}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export const Sidebar: React.FC<SidebarProps> = ({
  collections,
  onSelect,
  selectedId,
  onNewCollection,
}) => {
  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set());

  const { setNodeRef: setAllRef, isOver: isOverAll } = useDroppable({
    id: 'collection-0',
    data: { type: 'collection', collection: { id: 0, name: '全部' } },
  });

  const handleToggle = (id: number) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleSelect = (collection: CollectionTree) => {
    onSelect?.(collection);
  };

  return (
    <div className="h-full flex flex-col" style={{ backgroundColor: '#1a1a2e' }}>
      <div className="p-3 border-b border-gray-700 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-gray-300">集合</h2>
        <button
          onClick={onNewCollection}
          className="p-1.5 rounded-lg hover:bg-gray-700 text-gray-400 hover:text-indigo-400 transition-colors"
          title="新建集合"
        >
          <Plus size={18} />
        </button>
      </div>

      <div className="flex-1 overflow-auto p-2">
        <div
          ref={setAllRef}
          onClick={() => onSelect?.({ id: 0, name: '全部', parent_id: null, level: 0, children: [], snippet_count: 0, created_at: '', updated_at: '' } as any)}
          className={twMerge(
            'flex items-center gap-1 py-1.5 px-2 rounded-lg cursor-pointer transition-colors',
            selectedId === 0 || selectedId === '0' ? 'bg-indigo-500/20' : 'hover:bg-gray-700/50',
            isOverAll && 'bg-indigo-500/30 border-2 border-indigo-500'
          )}
        >
          <div className="w-5" />
          <span className="text-gray-400">
            <FileCode size={16} className="text-gray-400" />
          </span>
          <span
            className={twMerge(
              'flex-1 text-sm truncate',
              selectedId === 0 || selectedId === '0' ? 'text-indigo-400 font-medium' : 'text-gray-300'
            )}
          >
            全部片段
          </span>
        </div>

        {collections.map((collection) => (
          <CollectionItem
            key={collection.id}
            collection={collection}
            level={0}
            onToggle={handleToggle}
            expandedIds={expandedIds}
            onSelect={handleSelect}
            selectedId={selectedId}
          />
        ))}
      </div>
    </div>
  );
};
