// ──────────────────────────────────────────────
// Shared TypeScript types for the Khatabook App
// ──────────────────────────────────────────────

export interface User {
  _id: string;
  name: string;
  phone: string;
  avatar?: string;
  profileImage?: string;
  email?: string;
  role?: 'user' | 'admin' | 'superadmin';
  businessId?: string;
  businessRole?: 'owner' | 'staff';
  autoLockTime?: number | null;
  createdAt: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isUnlocked: boolean;
}
