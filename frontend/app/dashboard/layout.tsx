'use client';
/**
 * Shared Sidebar + top nav for all authenticated pages.
 * Handles: navigation, logout, and unlocked-guard redirect.
 */
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';

const NAV = [
  { href: '/dashboard',          icon: '📊', label: 'Dashboard' },
  { href: '/contacts',           icon: '👥', label: 'Contacts' },
  { href: '/transactions',       icon: '💸', label: 'Transactions' },
  { href: '/reports',            icon: '📈', label: 'Reports' },
  { href: '/dashboard/business', icon: '🏢', label: 'Business' },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isUnlocked, logout, user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  // Guard: must be authenticated AND unlocked
  useEffect(() => {
    if (!isAuthenticated) { router.replace('/auth/login'); return; }
    if (!isUnlocked) { router.replace('/unlock'); }
  }, [isAuthenticated, isUnlocked, router]);

  if (!isAuthenticated || !isUnlocked) return null;

  return (
    <div className="flex min-h-screen">
      {/* ── Sidebar ── */}
      <aside className="w-60 bg-gray-900 border-r border-gray-800 flex flex-col fixed h-full z-10">
        {/* Brand */}
        <div className="px-6 py-5 border-b border-gray-800">
          <div className="flex items-center gap-2">
            <span className="text-2xl">📒</span>
            <span className="font-bold text-white text-lg">KhataBook</span>
          </div>
        </div>

        {/* Nav links */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {NAV.map(({ href, icon, label }) => {
            const active = pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  active
                    ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-600/30'
                    : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                }`}
              >
                <span className="text-lg">{icon}</span>
                {label}
              </Link>
            );
          })}
          
          {user?.role === 'admin' && (
            <Link
              href="/dashboard/admin"
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all mt-4 ${
                pathname.startsWith('/dashboard/admin')
                  ? 'bg-rose-600/20 text-rose-400 border border-rose-600/30'
                  : 'text-gray-400 hover:bg-gray-800 hover:text-white'
              }`}
            >
              <span className="text-lg">👑</span>
              Admin Portal
            </Link>
          )}
        </nav>

        {/* User + Logout */}
        <div className="px-4 py-4 border-t border-gray-800">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center text-xs font-bold text-white">
              {user?.name?.[0]?.toUpperCase() ?? '?'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm font-medium truncate">{user?.name}</p>
              <p className="text-gray-500 text-xs truncate">{user?.phone}</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="w-full text-left text-sm text-gray-500 hover:text-red-400 transition-colors px-2"
          >
            🚪 Lock & Exit
          </button>
        </div>
      </aside>

      {/* ── Main Content ── */}
      <main className="flex-1 ml-60 p-6 bg-gray-950 min-h-screen">
        {children}
      </main>
    </div>
  );
}
