import React, { useState } from 'react';
import { ChevronRight, ChevronDown, Folder, FolderOpen, FileCode, Plus, GripVertical } from 'lucide-react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { twMerge } from 'tailwind-merge';

export interface Collection {
  id: number | string;
  name: string;
  type: 'folder' | 'file';
  children?: Collection[];
  expanded?: boolean;
}

interface SidebarProps {
  collections: Collection[];
  onCollectionsChange?: (collections: Collection[]) => void;
  onSelect?: (collection: Collection) => void;
  selectedId?: number | string;
  onNewCollection?: () => void;
}

interface SortableItemProps {
  collection: Collection;
  level?: number;
  onToggle: (id: number | string) => void;
  onSelect: (collection: Collection) => void;
  selectedId?: number | string;
}

const SortableItem: React.FC<SortableItemProps> = ({ collection, level = 0, onToggle, onSelect, selectedId }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: collection.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    paddingLeft: `${level * 16 + 8}px`,
  };

  const hasChildren = collection.children && collection.children.length > 0;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={twMerge(
        'group flex items-center gap-1 py-1.5 px-2 rounded-lg cursor-pointer transition-colors',
        selectedId === collection.id ? 'bg-indigo-500/20' : 'hover:bg-gray-700/50',
        isDragging && 'opacity-50'
      )}
    >
      <button
        className="p-0.5 rounded hover:bg-gray-600 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity"
        {...attributes}
        {...listeners}
      >
        <GripVertical size={14} />
      </button>

      {collection.type === 'folder' && hasChildren && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggle(collection.id);
          }}
          className="p-0.5 rounded hover:bg-gray-600 text-gray-400"
        >
          {collection.expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        </button>
      )}
      {collection.type === 'folder' && !hasChildren && <div className="w-5" />}

      <span className="text-gray-400">
        {collection.type === 'folder' ? (
          collection.expanded ? <FolderOpen size={16} style={{ color: '#6366f1' }} /> : <Folder size={16} style={{ color: '#6366f1' }} />
        ) : (
          <FileCode size={16} className="text-gray-400" />
        )}
      </span>

      <span
        onClick={() => onSelect(collection)}
        className={twMerge(
          'flex-1 text-sm truncate',
          selectedId === collection.id ? 'text-indigo-400 font-medium' : 'text-gray-300'
        )}
      >
        {collection.name}
      </span>
    </div>
  );
};

const renderTree = (
  items: Collection[],
  level: number,
  onToggle: (id: number | string) => void,
  onSelect: (collection: Collection) => void,
  selectedId?: number | string
): React.ReactNode => {
  return items.map((item) => (
    <React.Fragment key={item.id}>
      <SortableItem
        collection={item}
        level={level}
        onToggle={onToggle}
        onSelect={onSelect}
        selectedId={selectedId}
      />
      {item.type === 'folder' && item.expanded && item.children && (
        <SortableContext items={item.children.map((c) => c.id)} strategy={verticalListSortingStrategy}>
          {renderTree(item.children, level + 1, onToggle, onSelect, selectedId)}
        </SortableContext>
      )}
    </React.Fragment>
  ));
};

const findAndUpdate = (
  items: Collection[],
  id: number | string,
  updater: (col: Collection) => Collection
): Collection[] => {
  return items.map((item) => {
    if (item.id === id) {
      return updater(item);
    }
    if (item.children) {
      return { ...item, children: findAndUpdate(item.children, id, updater) };
    }
    return item;
  });
};

const flatternItems = (items: Collection[]): Collection[] => {
  const result: Collection[] = [];
  const traverse = (items: Collection[]) => {
    items.forEach((item) => {
      result.push(item);
      if (item.children) {
        traverse(item.children);
      }
    });
  };
  traverse(items);
  return result;
};

export const Sidebar: React.FC<SidebarProps> = ({
  collections,
  onCollectionsChange,
  onSelect,
  selectedId,
  onNewCollection,
}) => {
  const [activeId, setActiveId] = useState<number | string | null>(null);
  const [items, setItems] = useState<Collection[]>(collections);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleToggle = (id: number | string) => {
    const updated = findAndUpdate(items, id, (col) => ({ ...col, expanded: !col.expanded }));
    setItems(updated);
    onCollectionsChange?.(updated);
  };

  const handleSelect = (collection: Collection) => {
    onSelect?.(collection);
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over || active.id === over.id) return;

    const allItems = flatternItems(items);
    const oldIndex = allItems.findIndex((item) => item.id === active.id);
    const newIndex = allItems.findIndex((item) => item.id === over.id);

    if (oldIndex === -1 || newIndex === -1) return;

    const activeItem = allItems[oldIndex];
    const overItem = allItems[newIndex];

    if (activeItem.type === 'file' && overItem.type === 'folder') {
      const removeFromParent = (items: Collection[], id: string): Collection[] => {
        return items
          .filter((item) => item.id !== id)
          .map((item) => ({
            ...item,
            children: item.children ? removeFromParent(item.children, id) : undefined,
          }));
      };

      const addToFolder = (items: Collection[], targetId: string, newItem: Collection): Collection[] => {
        return items.map((item) => {
          if (item.id === targetId) {
            return {
              ...item,
              children: [...(item.children || []), newItem],
              expanded: true,
            };
          }
          if (item.children) {
            return { ...item, children: addToFolder(item.children, targetId, newItem) };
          }
          return item;
        });
      };

      let updated = removeFromParent(items, String(active.id));
      updated = addToFolder(updated, String(over.id), activeItem);
      setItems(updated);
      onCollectionsChange?.(updated);
      return;
    }

    const sameLevelItems = (() => {
      const findParent = (items: Collection[], id: string): Collection[] | null => {
        for (const item of items) {
          if (item.children?.some((c) => c.id === id)) return item.children;
          if (item.children) {
            const found = findParent(item.children, id);
            if (found) return found;
          }
        }
        return null;
      };

      const parent = findParent(items, active.id as string);
      return parent || items;
    })();

    const oldIdx = sameLevelItems.findIndex((item) => item.id === active.id);
    const newIdx = sameLevelItems.findIndex((item) => item.id === over.id);

    if (oldIdx === -1 || newIdx === -1) return;

    const reordered = arrayMove(sameLevelItems, oldIdx, newIdx);

    const updateReordered = (items: Collection[]): Collection[] => {
      const hasActive = items.some((item) => item.id === active.id);
      if (hasActive) return reordered;
      return items.map((item) => ({
        ...item,
        children: item.children ? updateReordered(item.children) : undefined,
      }));
    };

    const updated = updateReordered(items);
    setItems(updated);
    onCollectionsChange?.(updated);
  };

  const activeItem = activeId ? flatternItems(items).find((item) => item.id === activeId) : null;

  return (
    <div className="h-full flex flex-col" style={{ backgroundColor: '#1a1a2e' }}>
      <div className="p-3 border-b border-gray-700 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-gray-300">集合</h2>
        <button
          onClick={onNewCollection}
          className="p-1.5 rounded-lg hover:bg-gray-700 text-gray-400 hover:text-indigo-400 transition-colors"
        >
          <Plus size={18} />
        </button>
      </div>

      <div className="flex-1 overflow-auto p-2">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={items.map((c) => c.id)} strategy={verticalListSortingStrategy}>
            {renderTree(items, 0, handleToggle, handleSelect, selectedId)}
          </SortableContext>
          <DragOverlay>
            {activeItem ? (
              <div className="flex items-center gap-2 py-1.5 px-3 bg-gray-800 rounded-lg shadow-lg border border-gray-600">
                {activeItem.type === 'folder' ? (
                  <Folder size={16} style={{ color: '#6366f1' }} />
                ) : (
                  <FileCode size={16} className="text-gray-400" />
                )}
                <span className="text-sm text-gray-200">{activeItem.name}</span>
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      </div>
    </div>
  );
};
