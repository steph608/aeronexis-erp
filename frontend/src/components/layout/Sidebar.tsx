import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, ShoppingCart, Factory, Package2,
  AlertTriangle, Users2, BoxSelect, Users, Brain,
  LogOut, ChevronLeft, ChevronRight,
  Plane,
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { ROLE_LABELS, ROLE_COLORS } from '../../lib/permissions';
import type { Role } from '../../types';
import { Badge } from '../ui';
import { cn } from '../../utils';

interface NavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  path: string;
  badge?: string;
}

const ALL_NAV_ITEMS: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={18} />, path: '/dashboard' },
  { id: 'orders', label: 'Commandes', icon: <ShoppingCart size={18} />, path: '/orders' },
  { id: 'manufacturing', label: 'Production', icon: <Factory size={18} />, path: '/manufacturing' },
  { id: 'materials', label: 'Stock & Matières', icon: <Package2 size={18} />, path: '/materials' },
  { id: 'incidents', label: 'Qualité & Incidents', icon: <AlertTriangle size={18} />, path: '/incidents' },
  { id: 'customers', label: 'Clients', icon: <Users2 size={18} />, path: '/customers' },
  { id: 'products', label: 'Catalogue Produits', icon: <BoxSelect size={18} />, path: '/products' },
  { id: 'users', label: 'Utilisateurs', icon: <Users size={18} />, path: '/users' },
  { id: 'ai', label: 'Intelligence IA', icon: <Brain size={18} />, path: '/ai' },
];

interface SidebarProps {
  collapsed: boolean;
  setCollapsed: (v: boolean) => void;
  mobileOpen: boolean;
  setMobileOpen: (v: boolean) => void;
}

export function Sidebar({ collapsed, setCollapsed, mobileOpen, setMobileOpen }: SidebarProps) {
  const { user, accessibleModules, logout } = useAuthStore();
  const navigate = useNavigate();

  const visibleItems = ALL_NAV_ITEMS.filter(item => accessibleModules.includes(item.id));

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className={cn('flex items-center px-4 py-5 border-b border-slate-200 dark:border-slate-700', collapsed ? 'justify-center' : 'gap-3')}>
        <div className="w-8 h-8 rounded-xl bg-brand-600 flex items-center justify-center flex-shrink-0">
          <Plane size={16} className="text-white rotate-45" />
        </div>
        {!collapsed && (
          <div>
            <p className="text-sm font-bold text-slate-900 dark:text-white font-display tracking-tight">AERONEXIS</p>
            <p className="text-[10px] text-slate-500 uppercase tracking-widest">ERP Platform</p>
          </div>
        )}
      </div>

      {/* User info */}
      {!collapsed && user && (
        <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-700/50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-brand-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
              {user.firstName[0]}{user.lastName[0]}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">{user.firstName} {user.lastName}</p>
              <Badge className={cn('text-[10px] mt-0.5', ROLE_COLORS[user.role as Role])}>
                {ROLE_LABELS[user.role as Role]}
              </Badge>
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {visibleItems.map((item) => (
          <NavLink
            key={item.id}
            to={item.path}
            onClick={() => setMobileOpen(false)}
            className={({ isActive }) => cn(
              'sidebar-link',
              isActive ? 'sidebar-link-active' : 'sidebar-link-inactive',
              collapsed && 'justify-center px-2'
            )}
          >
            <span className="flex-shrink-0">{item.icon}</span>
            {!collapsed && <span className="truncate">{item.label}</span>}
            {!collapsed && item.badge && (
              <span className="ml-auto bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                {item.badge}
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Bottom actions */}
      <div className="px-3 py-3 border-t border-slate-200 dark:border-slate-700 space-y-0.5">
        <button
          onClick={handleLogout}
          className={cn('sidebar-link sidebar-link-inactive w-full text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600',
            collapsed && 'justify-center px-2'
          )}
        >
          <LogOut size={18} />
          {!collapsed && <span>Déconnexion</span>}
        </button>

        {/* Collapse toggle (desktop) */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="hidden lg:flex sidebar-link sidebar-link-inactive w-full"
        >
          {collapsed ? <ChevronRight size={18} /> : <><ChevronLeft size={18} /><span>Réduire</span></>}
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className={cn(
        'hidden lg:flex flex-col bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-700 transition-all duration-300 flex-shrink-0',
        collapsed ? 'w-16' : 'w-64'
      )}>
        {sidebarContent}
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMobileOpen(false)} />
          <aside className="relative w-72 bg-white dark:bg-slate-900 flex flex-col animate-slide-in">
            {sidebarContent}
          </aside>
        </div>
      )}
    </>
  );
}
