'use client';
/**
 * Shared Sidebar + top nav for all authenticated pages.
 * Mobile: collapsible drawer triggered by hamburger button.
 * Desktop: fixed 240px sidebar.
 */
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';

// Base nav visible to all authenticated users
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
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Guard: must be authenticated AND unlocked
  useEffect(() => {
    if (!isAuthenticated) { router.replace('/auth/login'); return; }
    if (!isUnlocked) { router.replace('/unlock'); }
  }, [isAuthenticated, isUnlocked, router]);

  // Close drawer on route change
  useEffect(() => { setDrawerOpen(false); }, [pathname]);

  if (!isAuthenticated || !isUnlocked) return null;

  const NavLinks = () => (
    <nav className="flex-1 px-3 py-4 space-y-1">
      {NAV.map(({ href, icon, label }) => {
        const active = pathname === href || (href !== '/dashboard' && pathname.startsWith(href));
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

      {/* Admin link — only for 'admin' or 'superadmin' role */}
      {(user?.role === 'admin' || user?.role === 'superadmin') && (
        <Link
          href="/dashboard/admin"
          className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all mt-4 ${
            pathname === '/dashboard/admin'
              ? 'bg-rose-600/20 text-rose-400 border border-rose-600/30'
              : 'text-gray-400 hover:bg-gray-800 hover:text-white'
          }`}
        >
          <span className="text-lg">👑</span>
          Admin Portal
        </Link>
      )}

      {/* Super Admin link — only for 'superadmin' role */}
      {user?.role === 'superadmin' && (
        <Link
          href="/dashboard/superadmin"
          className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
            pathname.startsWith('/dashboard/superadmin')
              ? 'bg-purple-600/20 text-purple-400 border border-purple-600/30'
              : 'text-gray-400 hover:bg-gray-800 hover:text-white'
          }`}
        >
          <span className="text-lg">🛡️</span>
          Super Admin
        </Link>
      )}
    </nav>
  );

  const UserFooter = () => (
    <div className="px-4 py-4 border-t border-gray-800">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0">
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
        🚪 Lock &amp; Exit
      </button>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-gray-950">

      {/* ── Mobile overlay ── */}
      {drawerOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/60 lg:hidden"
          onClick={() => setDrawerOpen(false)}
        />
      )}

      {/* ── Sidebar (desktop: fixed | mobile: slide-in drawer) ── */}
      <aside
        className={`
          fixed top-0 left-0 h-full z-30 w-64
          bg-gray-900 border-r border-gray-800 flex flex-col
          transition-transform duration-300
          ${drawerOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0
        `}
      >
        {/* Brand */}
        <div className="px-6 py-5 border-b border-gray-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">📒</span>
            <span className="font-bold text-white text-lg">KhataBook</span>
          </div>
          {/* Close button visible only on mobile */}
          <button
            className="lg:hidden text-gray-400 hover:text-white p-1"
            onClick={() => setDrawerOpen(false)}
          >
            ✕
          </button>
        </div>

        <NavLinks />
        <UserFooter />
      </aside>

      {/* ── Main content area ── */}
      <div className="flex-1 flex flex-col lg:ml-64">

        {/* ── Mobile top bar ── */}
        <header className="lg:hidden sticky top-0 z-10 bg-gray-900/95 backdrop-blur border-b border-gray-800 px-4 py-3 flex items-center gap-3">
          <button
            onClick={() => setDrawerOpen(true)}
            className="text-gray-300 hover:text-white p-1 rounded-lg hover:bg-gray-800 transition-colors"
            aria-label="Open menu"
          >
            {/* Hamburger icon */}
            <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <span className="text-white font-semibold text-base">KhataBook</span>
        </header>

        {/* ── Page content ── */}
        <main className="flex-1 p-4 sm:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
