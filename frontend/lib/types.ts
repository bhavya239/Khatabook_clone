// ──────────────────────────────────────────────
// Shared TypeScript types for the Khatabook app
// ──────────────────────────────────────────────

export interface User {
  _id: string;
  name: string;
  phone: string;
  avatar?: string;
  role?: 'user' | 'admin' | 'superadmin';
  businessId?: string;
  businessRole?: 'owner' | 'staff';
  createdAt: string;
}

export interface Contact {
  _id: string;
  name: string;
  phone: string;
  notes?: string;
  balance: number; // positive = they owe you, negative = you owe them
  score: number;
  totalTransactions: number;
  onTimePayments: number;
  latePayments: number;
  lastPaymentDate?: string;
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
  dueDate?: string;
  isOverdue?: boolean;
  penaltyApplied?: number;
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

export interface ProfitLossResponse {
  totalIncome: number;
  totalExpense: number;
  profit: number;
  monthlyBreakdown: { month: string; income: number; expense: number; profit: number }[];
  categoryBreakdown: { name: string; value: number }[];
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isUnlocked: boolean; // Hidden mode unlock state
}
