import React, { useState, useEffect, useRef } from 'react';
import { FinanceServiceFactory } from '../../services/factory';
import { SearchResult } from '../../services/types';
import { useConfigStore } from '../../store/configStore';
import { useInvestmentStore } from '../../store';

interface SecuritySearchProps {
  onSelect: (security: SearchResult) => void;
}

export const SecuritySearch: React.FC<SecuritySearchProps> = ({ onSelect }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { defaultSource } = useConfigStore();
  const { investments } = useInvestmentStore();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    const search = async () => {
      if (!query.trim()) {
        setShowDropdown(false);
        setResults([]);
        return;
      }

      setLoading(true);
      setError(null);
      try {
        const service = FinanceServiceFactory.getInstance(defaultSource);
        const searchResults = await service.search(query);
        setResults(searchResults);
        setShowDropdown(true);
      } catch (err) {
        console.error('Search failed:', err);
        setError('搜索失败，请稍后重试');
      } finally {
        setLoading(false);
      }
    };

    const timeoutId = setTimeout(search, 300);
    return () => clearTimeout(timeoutId);
  }, [query, defaultSource]);

  const handleSelect = (result: SearchResult) => {
    // 检查是否已存在
    const exists = investments.some(inv => inv.code === result.code);
    if (exists) {
      setError(`⚠️ ${result.name}(${result.code}) 已存在于投资组合中，请勿重复添加`);
      return;
    }
    
    onSelect(result);
    setQuery('');
    setShowDropdown(false);
  };

  return (
    <div className="relative">
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="输入股票代码或名称搜索"
        className="w-full p-2 border border-gray-600 rounded bg-gray-800 text-gray-100 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
      />

      {error && (
        <div className="mt-2 text-red-500 text-sm">
          {error}
        </div>
      )}

      {showDropdown && (
        <div
          ref={dropdownRef}
          className="absolute z-10 w-full mt-1 bg-gray-800 border border-gray-700 rounded shadow-lg"
        >
          {loading ? (
            <div className="p-2 text-gray-400">搜索中...</div>
          ) : results.length === 0 ? (
            <div className="p-2 text-gray-400">未找到结果</div>
          ) : (
            <div className="max-h-60 overflow-y-auto">
              {results.map((result) => (
                <div
                  key={result.code}
                  className="p-2 hover:bg-gray-700 cursor-pointer"
                  onClick={() => handleSelect(result)}
                >
                  <div className="text-gray-200">{result.name}</div>
                  <div className="text-sm text-gray-400">{result.code}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}; 