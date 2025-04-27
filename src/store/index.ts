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
}

export const useInvestmentStore = create<InvestmentStore>((set) => ({
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
})); 