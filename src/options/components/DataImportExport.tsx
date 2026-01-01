import React, { useRef, useState } from 'react';
import { useInvestmentStore, Investment } from '../../store/index';

export const DataImportExport: React.FC = () => {
  const { exportInvestments, importInvestments, investments } = useInvestmentStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [importMode, setImportMode] = useState<'replace' | 'merge'>('merge');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleExport = async () => {
    try {
      await exportInvestments();
      setSuccess('数据导出成功！');
      setError(null);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError('导出失败：' + (err instanceof Error ? err.message : '未知错误'));
      setTimeout(() => setError(null), 5000);
    }
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    setError(null);
    setSuccess(null);

    try {
      const text = await file.text();
      const data = JSON.parse(text);

      // 支持两种格式：
      // 1. 新格式：{ version, exportDate, investments: [...] }
      // 2. 旧格式：直接是 Investment[] 数组
      let investmentsToImport: Investment[] = [];
      
      if (Array.isArray(data)) {
        investmentsToImport = data;
      } else if (data.investments && Array.isArray(data.investments)) {
        investmentsToImport = data.investments;
      } else {
        throw new Error('文件格式不正确，请确保是有效的 JSON 文件');
      }

      // 验证数据格式
      if (investmentsToImport.length === 0) {
        throw new Error('文件中没有找到投资数据');
      }

      // 基本验证
      const requiredFields = ['code', 'name', 'type', 'amount', 'targetPercentage'];
      for (const inv of investmentsToImport) {
        for (const field of requiredFields) {
          if (!(field in inv)) {
            throw new Error(`数据格式错误：缺少必需字段 "${field}"`);
          }
        }
      }

      await importInvestments(investmentsToImport, importMode === 'replace');
      
      const modeText = importMode === 'replace' ? '替换' : '合并';
      setSuccess(`数据导入成功！已${modeText} ${investmentsToImport.length} 条记录`);
      setTimeout(() => setSuccess(null), 3000);
      
      // 清空文件选择
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (err) {
      setError('导入失败：' + (err instanceof Error ? err.message : '未知错误'));
      setTimeout(() => setError(null), 5000);
    } finally {
      setIsImporting(false);
    }
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="bg-gray-800 rounded border border-gray-700 p-3">
      <h2 className="text-xl font-bold mb-3 text-gray-100">数据导入导出</h2>
      
      {/* 导出功能 */}
      <div className="mb-4">
        <button
          onClick={handleExport}
          disabled={investments.length === 0}
          className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded border border-blue-500 mb-2"
        >
          导出数据
        </button>
        <p className="text-xs text-gray-400">
          将当前投资组合导出为 JSON 文件
        </p>
      </div>

      {/* 导入功能 */}
      <div className="border-t border-gray-700 pt-4">
        <div className="mb-3">
          <label className="block text-sm mb-2 text-gray-300">导入模式</label>
          <div className="flex gap-2">
            <label className="flex items-center">
              <input
                type="radio"
                value="merge"
                checked={importMode === 'merge'}
                onChange={(e) => setImportMode(e.target.value as 'replace' | 'merge')}
                className="mr-2"
              />
              <span className="text-sm text-gray-300">合并（保留现有数据）</span>
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                value="replace"
                checked={importMode === 'replace'}
                onChange={(e) => setImportMode(e.target.value as 'replace' | 'merge')}
                className="mr-2"
              />
              <span className="text-sm text-gray-300">替换（清空现有数据）</span>
            </label>
          </div>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept=".json,application/json"
          onChange={handleFileSelect}
          className="hidden"
        />
        
        <button
          onClick={handleImportClick}
          disabled={isImporting}
          className="w-full px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded border border-green-500 mb-2"
        >
          {isImporting ? '导入中...' : '导入数据'}
        </button>
        
        <p className="text-xs text-gray-400">
          从 JSON 文件导入投资组合数据
        </p>
      </div>

      {/* 错误和成功提示 */}
      {error && (
        <div className="mt-3 p-2 bg-red-900 border border-red-700 rounded text-red-200 text-sm">
          {error}
        </div>
      )}
      {success && (
        <div className="mt-3 p-2 bg-green-900 border border-green-700 rounded text-green-200 text-sm">
          {success}
        </div>
      )}
    </div>
  );
};

