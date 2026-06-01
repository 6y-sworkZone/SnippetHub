import React, { useState, useRef, useEffect, useMemo } from 'react';
import { X, Hash } from 'lucide-react';
import { twMerge } from 'tailwind-merge';

interface TagInputProps {
  value: string[];
  onChange: (tags: string[]) => void;
  availableTags?: string[];
  placeholder?: string;
  maxTags?: number;
}

export const TagInput: React.FC<TagInputProps> = ({
  value,
  onChange,
  availableTags = [],
  placeholder = '输入标签，回车添加...',
  maxTags = 10,
}) => {
  const [inputValue, setInputValue] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const filteredSuggestions = useMemo(() => {
    if (!inputValue.trim()) return availableTags.filter((tag) => !value.includes(tag));
    return availableTags.filter(
      (tag) =>
        tag.toLowerCase().includes(inputValue.toLowerCase()) && !value.includes(tag)
    );
  }, [inputValue, availableTags, value]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    setSelectedIndex(0);
  }, [filteredSuggestions]);

  const addTag = (tag: string) => {
    const trimmedTag = tag.trim().toLowerCase();
    if (!trimmedTag) return;
    if (value.includes(trimmedTag)) return;
    if (value.length >= maxTags) return;

    onChange([...value, trimmedTag]);
    setInputValue('');
    setShowSuggestions(false);
    inputRef.current?.focus();
  };

  const removeTag = (indexToRemove: number) => {
    onChange(value.filter((_, index) => index !== indexToRemove));
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredSuggestions.length > 0 && selectedIndex < filteredSuggestions.length) {
        addTag(filteredSuggestions[selectedIndex]);
      } else if (inputValue.trim()) {
        addTag(inputValue);
      }
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (filteredSuggestions.length > 0) {
        setSelectedIndex((prev) => (prev + 1) % filteredSuggestions.length);
      }
      return;
    }

    if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (filteredSuggestions.length > 0) {
        setSelectedIndex((prev) => (prev - 1 + filteredSuggestions.length) % filteredSuggestions.length);
      }
      return;
    }

    if (e.key === 'Escape') {
      setShowSuggestions(false);
      return;
    }

    if (e.key === 'Backspace' && !inputValue && value.length > 0) {
      removeTag(value.length - 1);
    }
  };

  return (
    <div className="relative" ref={containerRef}>
      <div
        className="flex flex-wrap gap-2 p-2 bg-gray-800 border border-gray-600 rounded-lg min-h-[42px] focus-within:border-indigo-500 focus-within:ring-1 focus-within:ring-indigo-500 transition-colors"
        onClick={() => inputRef.current?.focus()}
      >
        {value.map((tag, index) => (
          <span
            key={`${tag}-${index}`}
            className="inline-flex items-center gap-1 px-2.5 py-1 text-sm rounded-full text-white"
            style={{ backgroundColor: '#6366f1' }}
          >
            <Hash size={12} />
            <span>{tag}</span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                removeTag(index);
              }}
              className="ml-0.5 p-0.5 rounded-full hover:bg-white/20 transition-colors"
            >
              <X size={12} />
            </button>
          </span>
        ))}

        {value.length < maxTags && (
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => {
              setInputValue(e.target.value);
              setShowSuggestions(true);
            }}
            onFocus={() => setShowSuggestions(true)}
            onKeyDown={handleKeyDown}
            placeholder={value.length === 0 ? placeholder : ''}
            className="flex-1 min-w-[120px] bg-transparent text-gray-200 placeholder-gray-500 outline-none text-sm"
          />
        )}
      </div>

      {showSuggestions && filteredSuggestions.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 max-h-48 overflow-auto bg-gray-800 border border-gray-600 rounded-lg shadow-lg z-50">
          {filteredSuggestions.map((tag, index) => (
            <button
              key={tag}
              onClick={() => addTag(tag)}
              className={twMerge(
                'w-full flex items-center gap-2 px-3 py-2 text-sm text-left transition-colors',
                index === selectedIndex ? 'bg-indigo-500/20 text-indigo-400' : 'text-gray-300 hover:bg-gray-700'
              )}
            >
              <Hash size={14} style={{ color: '#6366f1' }} />
              <span>{tag}</span>
            </button>
          ))}
        </div>
      )}

      {maxTags > 0 && (
        <div className="mt-1 text-xs text-gray-500 text-right">
          {value.length}/{maxTags} 标签
        </div>
      )}
    </div>
  );
};
