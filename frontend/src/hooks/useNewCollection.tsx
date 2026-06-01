import React from 'react';
import { ChevronDown } from 'lucide-react';
import { Modal } from '@/components/Modal';
import { useToast } from '@/components/Toast';
import { collectionApi } from '@/services/api';
import { useSnippetStore } from '@/store';
import type { Collection } from '@/types';

export function useNewCollection() {
  const [modalOpen, setModalOpen] = React.useState(false);
  const [name, setName] = React.useState('');
  const [parentId, setParentId] = React.useState<number | ''>('');
  const { showToast } = useToast();
  const { collectionsFlat, fetchCollections } = useSnippetStore();

  const openModal = React.useCallback(() => {
    setName('');
    setParentId('');
    setModalOpen(true);
  }, []);

  const closeModal = React.useCallback(() => {
    setModalOpen(false);
  }, []);

  const handleCreate = React.useCallback(async () => {
    if (!name.trim()) {
      showToast('请输入集合名称', 'error');
      return;
    }
    try {
      await collectionApi.createCollection({
        name: name.trim(),
        parent_id: parentId === '' ? null : parentId,
      });
      showToast('集合创建成功', 'success');
      setModalOpen(false);
      fetchCollections();
    } catch {
      showToast('创建集合失败', 'error');
    }
  }, [name, parentId, showToast, fetchCollections]);

  const renderModal = () => (
    <Modal
      isOpen={modalOpen}
      onClose={closeModal}
      title="新建集合"
      size="md"
      buttons={[
        { label: '取消', onClick: closeModal, variant: 'secondary' },
        { label: '创建', onClick: handleCreate, variant: 'primary' },
      ]}
    >
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            集合名称
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="输入集合名称..."
            className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-gray-200 placeholder-gray-500 focus:outline-none focus:border-indigo-500 transition-colors"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            父集合（可选）
          </label>
          <div className="relative">
            <select
              value={parentId}
              onChange={(e) => setParentId(e.target.value === '' ? '' : parseInt(e.target.value))}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-gray-200 focus:outline-none focus:border-indigo-500 transition-colors appearance-none cursor-pointer"
            >
              <option value="">无（顶级集合）</option>
              {collectionsFlat.filter((c: Collection) => (c.level || 0) < 2).map((col: Collection) => (
                <option key={col.id} value={col.id}>
                  {'  '.repeat(col.level || 0)}{col.name}
                </option>
              ))}
            </select>
            <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>
          <p className="text-xs text-gray-500 mt-1">最多支持3层嵌套集合</p>
        </div>
      </div>
    </Modal>
  );

  return { openModal, renderModal };
}
