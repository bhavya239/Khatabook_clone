'use client';
/**
 * Shared layout for contacts, transactions, and reports.
 * Re-uses the sidebar guard from /dashboard layout.
 */
import DashboardLayout from '@/app/dashboard/layout';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return <DashboardLayout>{children}</DashboardLayout>;
}
