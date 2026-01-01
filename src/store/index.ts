import { create } from 'zustand';
import { SecurityType } from '../services/types';

export type InvestmentType = SecurityType;

export interface Investment {
  id: string;
  name: string;
  code: string;
  type: InvestmentType;
  amount: number;
  targetPercentage: number;
  currentPrice?: number;
  lastUpdate?: Date;
  sector?: string;
  industry?: string;
}

interface InvestmentStore {
  investments: Investment[];
  addInvestment: (investment: Omit<Investment, 'id'>) => void;
  removeInvestment: (id: string) => void;
  updateInvestment: (id: string, investment: Partial<Investment>) => void;
  loadInvestments: () => Promise<void>;
  exportInvestments: () => Promise<void>;
  importInvestments: (data: Investment[], replace: boolean) => Promise<void>;
}

export const useInvestmentStore = create<InvestmentStore>((set, get) => ({
  investments: [],

  addInvestment: (investment) => {
    const newInvestment = {
      ...investment,
      id: Date.now().toString(),
    };
    set((state) => {
      const newInvestments = [...state.investments, newInvestment];
      chrome.storage.local.set({ investments: newInvestments });
      return { investments: newInvestments };
    });
  },

  removeInvestment: (id) => {
    set((state) => {
      const newInvestments = state.investments.filter((inv) => inv.id !== id);
      chrome.storage.local.set({ investments: newInvestments });
      return { investments: newInvestments };
    });
  },

  updateInvestment: (id, investment) => {
    set((state) => {
      const newInvestments = state.investments.map((inv) =>
        inv.id === id ? { ...inv, ...investment } : inv
      );
      chrome.storage.local.set({ investments: newInvestments });
      return { investments: newInvestments };
    });
  },

  loadInvestments: async () => {
    const result = await chrome.storage.local.get(['investments']);
    if (result.investments) {
      set({ investments: result.investments });
    }
  },

  exportInvestments: async () => {
    const state = get();
    const data = {
      version: '1.0',
      exportDate: new Date().toISOString(),
      investments: state.investments.map(inv => ({
        ...inv,
        lastUpdate: inv.lastUpdate ? new Date(inv.lastUpdate).toISOString() : undefined,
      })),
    };
    
    const jsonStr = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `portfolio-export-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  },

  importInvestments: async (data: Investment[], replace: boolean) => {
    if (replace) {
      // 替换模式：直接替换所有投资
      const importedInvestments = data.map(inv => ({
        ...inv,
        id: inv.id || Date.now().toString() + Math.random().toString(36).substr(2, 9),
        lastUpdate: inv.lastUpdate ? new Date(inv.lastUpdate) : undefined,
      }));
      set({ investments: importedInvestments });
      chrome.storage.local.set({ investments: importedInvestments });
    } else {
      // 合并模式：合并投资，避免重复
      set((state) => {
        const existingCodes = new Set(state.investments.map(inv => inv.code));
        const newInvestments = data
          .filter(inv => !existingCodes.has(inv.code))
          .map(inv => ({
            ...inv,
            id: inv.id || Date.now().toString() + Math.random().toString(36).substr(2, 9),
            lastUpdate: inv.lastUpdate ? new Date(inv.lastUpdate) : undefined,
          }));
        const mergedInvestments = [...state.investments, ...newInvestments];
        chrome.storage.local.set({ investments: mergedInvestments });
        return { investments: mergedInvestments };
      });
    }
  },
})); 