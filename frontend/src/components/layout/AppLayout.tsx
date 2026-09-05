import React, { Suspense } from 'react';
import { NavLink, Outlet } from 'react-router';
import {
  LayoutDashboard,
  FileCheck2,
  ShieldAlert,
  Building2,
  BarChart3,
  SlidersHorizontal,
  TreePine,
  ExternalLink,
  Bot,
} from 'lucide-react';

export default function AppLayout() {
  const navItems = [
    { label: 'Overview', path: '/', icon: LayoutDashboard },
    { label: 'Claims', path: '/claims', icon: FileCheck2 },
    { label: 'Risk & Anomalies', path: '/risk-anomalies', icon: ShieldAlert },
    { label: 'Districts', path: '/districts', icon: Building2 },
    { label: 'Analysis', path: '/analysis', icon: BarChart3 },
    { label: 'Settings', path: '/settings', icon: SlidersHorizontal },
  ];

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans text-slate-900 antialiased selection:bg-indigo-500 selection:text-white">
      {/* Top Government Header */}
      <header className="bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-50">
        <div className="max-w-[1600px] mx-auto px-4 py-2.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="size-9 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-xs">
              <TreePine className="size-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-sm font-bold tracking-tight">Forest Rights Act (FRA) Decision Support System</h1>
                <span className="bg-indigo-900/90 text-indigo-200 border border-indigo-700/60 text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full flex items-center gap-1">
                  <Bot className="size-3 text-indigo-400" />
                  AI Portal
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Ministry of Tribal Affairs / State Forest Department Decision Intelligence
              </p>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-4 text-xs">
            <div className="flex items-center gap-1.5 px-3 py-1 bg-slate-800 rounded-lg border border-slate-700 text-slate-300 font-mono">
              <span className="size-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>API Gateway: Active</span>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="bg-slate-950 border-t border-slate-800/80">
          <div className="max-w-[1600px] mx-auto px-4 flex items-center space-x-1 overflow-x-auto">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.path === '/'}
                  className={({ isActive }) =>
                    `flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition whitespace-nowrap cursor-pointer ${
                      isActive
                        ? 'border-indigo-500 text-white bg-slate-900/80'
                        : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/40'
                    }`
                  }
                >
                  <Icon className="size-3.5" />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </div>
        </nav>
      </header>

      {/* Main Content Viewport */}
      <main className="flex-1 max-w-[1600px] w-full mx-auto p-4 sm:p-6 space-y-6">
        <Suspense fallback={<div className="min-h-56 flex items-center justify-center text-sm text-slate-500">Loading dashboard section...</div>}>
          <Outlet />
        </Suspense>
      </main>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 text-xs py-4 border-t border-slate-800 mt-auto">
        <div className="max-w-[1600px] mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p>© 2026 AI-Powered FRA Decision Support System. Designed for easy backend API integration.</p>
          <p className="font-mono text-[11px] text-slate-400">
            Frontend Version 1.0 • Service Contract v1.2
          </p>
        </div>
      </footer>
    </div>
  );
}
