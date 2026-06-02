import { useState, useEffect } from 'react';
import { Menu, Bell, Sun, Moon } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { ROLE_LABELS } from '../../lib/permissions';
import type { Role } from '../../types';
import { useLocation } from 'react-router-dom';

const PAGE_TITLES: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/orders': 'Commandes',
  '/manufacturing': 'Ordres de Fabrication',
  '/materials': 'Stock & Matières Premières',
  '/incidents': 'Qualité & Incidents',
  '/customers': 'Clients',
  '/products': 'Catalogue Produits',
  '/users': 'Gestion Utilisateurs',
  '/ai': 'Intelligence Artificielle',
};

interface TopbarProps {
  onMenuClick: () => void;
}

export function Topbar({ onMenuClick }: TopbarProps) {
  const { user } = useAuthStore();
  const location = useLocation();
  const [dark, setDark] = useState(() => localStorage.getItem('theme') === 'dark');
  const [notifications] = useState(3);

  useEffect(() => {
    if (dark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [dark]);

  useEffect(() => {
    const saved = localStorage.getItem('theme');
    if (saved === 'dark') document.documentElement.classList.add('dark');
  }, []);

  const title = PAGE_TITLES[location.pathname] || 'AERONEXIS ERP';

  return (
    <header className="h-14 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 flex items-center px-4 gap-4 sticky top-0 z-40">
      <button
        onClick={onMenuClick}
        className="lg:hidden w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400"
      >
        <Menu size={18} />
      </button>

      <div className="flex-1 min-w-0">
        <h1 className="text-base font-semibold text-slate-900 dark:text-slate-100 font-display truncate">
          {title}
        </h1>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={() => setDark(!dark)}
          className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 transition-colors"
        >
          {dark ? <Sun size={16} /> : <Moon size={16} />}
        </button>

        <button className="relative w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 transition-colors">
          <Bell size={16} />
          {notifications > 0 && (
            <span className="absolute top-1 right-1 w-3.5 h-3.5 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
              {notifications}
            </span>
          )}
        </button>

        {user && (
          <div className="flex items-center gap-2 pl-2 border-l border-slate-200 dark:border-slate-700">
            <div className="w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center text-white text-xs font-bold">
              {user.firstName[0]}{user.lastName[0]}
            </div>
            <div className="hidden sm:block">
              <p className="text-xs font-medium text-slate-900 dark:text-slate-100 leading-none">
                {user.firstName} {user.lastName}
              </p>
              <p className="text-[10px] text-slate-500 leading-none mt-0.5">
                {ROLE_LABELS[user.role as Role]}
              </p>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
