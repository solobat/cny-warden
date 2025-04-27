import React from 'react';
import { Portfolio } from './components/Portfolio';

const App: React.FC = () => {
  return (
    <div className="min-h-screen bg-base-100">
      <div className="max-w-8xl mx-auto px-6 py-8">
        <h1 className="text-3xl font-bold mb-6">投资组合管理</h1>
        <div className="bg-base-200 rounded-lg shadow-lg p-6">
          <Portfolio />
        </div>
      </div>
    </div>
  );
};

export default App; 