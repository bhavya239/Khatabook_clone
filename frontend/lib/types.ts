// ──────────────────────────────────────────────
// Shared TypeScript types for the Khatabook app
// ──────────────────────────────────────────────

export interface User {
  _id: string;
  name: string;
  phone: string;
  avatar?: string;
  createdAt: string;
}

export interface Contact {
  _id: string;
  name: string;
  phone: string;
  notes?: string;
  balance: number; // positive = they owe you, negative = you owe them
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Transaction {
  _id: string;
  user: string;
  contact: {
    _id: string;
    name: string;
    phone: string;
  };
  type: 'given' | 'received';
  amount: number;
  description?: string;
  date: string;
  category: 'loan' | 'business' | 'personal' | 'rent' | 'food' | 'other';
  balanceAfter: number;
  whatsappSent: boolean;
  createdAt: string;
}

export interface Summary {
  totalGiven: number;
  totalReceived: number;
  netBalance: number;
  transactionCount: number;
}

export interface SummaryResponse {
  period: { month: number; year: number };
  summary: Summary;
  contactBalances: Pick<Contact, '_id' | 'name' | 'phone' | 'balance'>[];
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isUnlocked: boolean; // Hidden mode unlock state
}
