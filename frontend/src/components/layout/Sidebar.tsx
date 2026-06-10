import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, ShoppingCart, Factory, Package2,
  AlertTriangle, Users2, BoxSelect, Users, Brain,
  LogOut, ChevronLeft, ChevronRight, Truck, ClipboardList,
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { ROLE_LABELS } from '../../lib/permissions';
import type { Role } from '../../types';
import { cn } from '../../utils';

interface NavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  path: string;
}

const NAV_ITEMS: NavItem[] = [
  { id: 'dashboard',     label: 'Tableau de bord',    icon: <LayoutDashboard size={16} />, path: '/dashboard' },
  { id: 'orders',        label: 'Commandes',           icon: <ShoppingCart size={16} />,    path: '/orders' },
  { id: 'manufacturing', label: 'Production',          icon: <Factory size={16} />,         path: '/manufacturing' },
  { id: 'materials',     label: 'Stock & Matières',    icon: <Package2 size={16} />,        path: '/materials' },
  { id: 'incidents',     label: 'Qualité & Incidents', icon: <AlertTriangle size={16} />,   path: '/incidents' },
  { id: 'customers',     label: 'Clients',             icon: <Users2 size={16} />,          path: '/customers' },
  { id: 'products',      label: 'Catalogue Produits',  icon: <BoxSelect size={16} />,       path: '/products' },
  { id: 'users',         label: 'Utilisateurs',        icon: <Users size={16} />,           path: '/users' },
  { id: 'shipments',     label: 'Expéditions',         icon: <Truck size={16} />,           path: '/shipments' },
  { id: 'audit',         label: 'Historique',          icon: <ClipboardList size={16} />,   path: '/audit' },
  { id: 'ai',            label: 'Intelligence IA',     icon: <Brain size={16} />,           path: '/ai' },
];

const NAV_GROUPS = [
  { label: null,          ids: ['dashboard', 'orders', 'manufacturing'] },
  { label: 'Opérations',  ids: ['materials', 'incidents', 'customers', 'products'] },
  { label: 'Système',     ids: ['users', 'shipments', 'audit', 'ai'] },
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

  const handleLogout = () => { logout(); navigate('/login'); };

  const sidebarContent = (
    <div
      className="flex flex-col h-full"
      style={{ background: 'linear-gradient(180deg, #1e293b 0%, #0f172a 100%)' }}
    >
      {/* Logo */}
      <div className={cn(
        'flex items-center px-4 py-5',
        'border-b border-white/15',
        collapsed ? 'justify-center' : 'gap-3'
      )}>
        <div className="w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center flex-shrink-0 shadow-lg shadow-brand-600/30">
          <span className="text-white font-bold text-xs font-display">AX</span>
        </div>
        {!collapsed && (
          <div>
            <p className="text-sm font-bold text-white font-display tracking-tight leading-none">AERONEXIS</p>
            <p className="text-[9px] text-slate-400 uppercase tracking-widest mt-0.5">
              {user ? ROLE_LABELS[user.role as Role] : 'ERP'}
            </p>
          </div>
        )}
      </div>

      {/* Navigation groupée */}
      <nav className="flex-1 px-3 py-3 overflow-y-auto space-y-4">
        {NAV_GROUPS.map((group, gi) => {
          const items = NAV_ITEMS.filter(
            item => group.ids.includes(item.id) && accessibleModules.includes(item.id)
          );
          if (items.length === 0) return null;
          return (
            <div key={gi}>
              {group.label && !collapsed && (
                <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest px-3 mb-1.5">
                  {group.label}
                </p>
              )}
              <div className="space-y-0.5">
                {items.map(item => (
                  <NavLink
                    key={item.id}
                    to={item.path}
                    onClick={() => setMobileOpen(false)}
                    className={({ isActive }) => cn(
                      'flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all duration-150',
                      isActive
                        ? 'bg-brand-600/30 text-white border border-brand-500/40 shadow-sm'
                        : 'text-slate-400 hover:bg-white/6 hover:text-white',
                      collapsed && 'justify-center px-2'
                    )}
                  >
                    <span className="flex-shrink-0">{item.icon}</span>
                    {!collapsed && <span className="truncate text-[13px] font-medium">{item.label}</span>}
                  </NavLink>
                ))}
              </div>
            </div>
          );
        })}
      </nav>

      {/* Bas */}
      <div className="px-3 py-3 border-t border-white/8 space-y-0.5">
        <button
          onClick={handleLogout}
          className={cn(
            'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium w-full transition-all duration-150',
            'text-slate-500 hover:bg-red-500/15 hover:text-red-400',
            collapsed && 'justify-center px-2'
          )}
        >
          <LogOut size={16} />
          {!collapsed && <span className="text-[13px]">Déconnexion</span>}
        </button>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className={cn(
            'hidden lg:flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium w-full transition-all',
            'text-slate-600 hover:bg-white/6 hover:text-slate-300',
            collapsed && 'justify-center px-2'
          )}
        >
          {collapsed ? <ChevronRight size={15} /> : <><ChevronLeft size={15} /><span>Réduire</span></>}
        </button>
      </div>
    </div>
  );

  return (
    <>
      <aside className={cn(
        'hidden lg:flex flex-col border-r border-white/15 transition-all duration-300 flex-shrink-0',
        collapsed ? 'w-16' : 'w-60'
      )}
        style={{ background: 'linear-gradient(180deg, #1e293b 0%, #0f172a 100%)' }}
      >
        {sidebarContent}
      </aside>

      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <aside className="relative w-64 flex flex-col animate-slide-in shadow-2xl border-r border-white/15" style={{ background: 'linear-gradient(180deg, #1e293b 0%, #0f172a 100%)' }}>
            {sidebarContent}
          </aside>
        </div>
      )}
    </>
  );
}
