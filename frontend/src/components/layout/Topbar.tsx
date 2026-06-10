import { useState, useEffect, useRef } from 'react';
import { Menu, Bell, Sun, Moon, Check, CheckCheck, X, Settings, AlertTriangle } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { ROLE_LABELS } from '../../lib/permissions';
import type { Role } from '../../types';
import { useLocation } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notificationsAPI } from '../../services/api';
import { StockAlertsModal } from '../ui/StockAlertsModal';
import { SettingsModal } from '../ui/SettingsModal';

const PAGE_TITLES: Record<string, string> = {
  '/dashboard':     'Vue d\'ensemble',
  '/orders':        'Commandes',
  '/manufacturing': 'Ordres de Fabrication',
  '/materials':     'Stock & Matières Premières',
  '/incidents':     'Qualité & Incidents',
  '/customers':     'Clients',
  '/products':      'Catalogue Produits',
  '/users':         'Gestion Utilisateurs',
  '/ai':            'Intelligence Artificielle',
  '/shipments':     'Expéditions',
  '/audit':         'Historique',
};

const TYPE_DOT: Record<string, string> = {
  info:                  'bg-blue-500',
  warning:               'bg-yellow-500',
  error:                 'bg-red-500',
  success:               'bg-emerald-500',
  'stock-alert':         'bg-amber-500',
  'incident-critique':   'bg-red-600',
  'incident-majeur':     'bg-orange-500',
  'incident-mineur':     'bg-yellow-500',
  'incident-observation':'bg-blue-400',
  'incident-resolu':     'bg-emerald-500',
  'incident-comment':    'bg-brand-500',
};

const INCIDENT_TYPES = ['incident-critique', 'incident-majeur', 'incident-mineur', 'incident-observation', 'incident-resolu'];

interface TopbarProps { onMenuClick: () => void; }

export function Topbar({ onMenuClick }: TopbarProps) {
  const { user }    = useAuthStore();
  const location    = useLocation();
  const queryClient = useQueryClient();
  const [dark, setDark]               = useState(() => localStorage.getItem('theme') === 'dark');
  const [notifOpen, setNotifOpen]         = useState(false);
  const [showStockAlerts, setShowStockAlerts] = useState(false);
  const [showSettings, setShowSettings]   = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
    localStorage.setItem('theme', dark ? 'dark' : 'light');
  }, [dark]);

  useEffect(() => {
    if (localStorage.getItem('theme') === 'dark') document.documentElement.classList.add('dark');
  }, []);

  useEffect(() => {
    const handle = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) closeNotifPanel();
    };
    if (notifOpen) document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, [notifOpen]);

  // Déclencher la vérification des alertes stock au démarrage + toutes les 2 min
  useEffect(() => {
    notificationsAPI.checkStock().catch(() => {});
    const interval = setInterval(() => {
      notificationsAPI.checkStock().catch(() => {});
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    }, 120_000);
    return () => clearInterval(interval);
  }, [queryClient]);

  const { data: notifData } = useQuery({
    queryKey: ['notifications', 'unread'],
    queryFn:  () => notificationsAPI.getUnread(),
    refetchInterval: 30000,
  });

  const unread: any[] = notifData?.data?.data ?? [];
  const stockAlerts     = unread.filter(n => n.type === 'stock-alert');
  const incidentNotifs  = unread.filter(n => INCIDENT_TYPES.includes(n.type));
  const otherNotifs     = unread.filter(n => n.type !== 'stock-alert' && !INCIDENT_TYPES.includes(n.type));

  const markRead    = useMutation({ mutationFn: (id: number) => notificationsAPI.markRead(id),    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }) });
  const markAllRead = useMutation({ mutationFn: () => notificationsAPI.markAllRead(),              onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }) });

  const closeNotifPanel = () => {
    setNotifOpen(false);
    markAllRead.mutate();
  };

  const title    = PAGE_TITLES[location.pathname] ?? 'AERONEXIS ERP';
  const roleLabel = user ? ROLE_LABELS[user.role as Role] : '';
  const dateStr  = new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  const openStockAlerts = () => {
    closeNotifPanel();
    setShowStockAlerts(true);
  };

  return (
    <>
      <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 sticky top-0 z-40">
        <div className="h-px w-full bg-brand-600" />

        <div className="h-16 flex items-center px-5 gap-4">
          {/* Menu mobile */}
          <button onClick={onMenuClick} className="lg:hidden w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-500">
            <Menu size={18} />
          </button>

          {/* Titre + sous-titre */}
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-bold text-slate-900 dark:text-white font-display leading-none">{title}</h1>
            <p className="text-xs text-slate-400 mt-0.5 capitalize">
              {dateStr} · Connecté en tant qu'{roleLabel}
            </p>
          </div>


          {/* Actions */}
          <div className="flex items-center gap-1">

            {/* Mode sombre */}
            <button onClick={() => setDark(!dark)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 transition-colors">
              {dark ? <Sun size={16} /> : <Moon size={16} />}
            </button>

            {/* Notifications */}
            <div className="relative" ref={notifRef}>
              <button
                onClick={() => notifOpen ? closeNotifPanel() : setNotifOpen(true)}
                className="relative w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 transition-colors"
              >
                <Bell size={16} />
                {unread.length > 0 && (
                  <span className="absolute top-0.5 right-0.5 min-w-[15px] h-[15px] bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center px-0.5">
                    {unread.length > 9 ? '9+' : unread.length}
                  </span>
                )}
              </button>

              {notifOpen && (
                <div className="absolute right-0 top-11 w-80 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl z-50 overflow-hidden">
                  {/* Header panneau */}
                  <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
                    <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                      Notifications
                      {unread.length > 0 && <span className="ml-1.5 text-xs bg-red-100 text-red-600 rounded-full px-1.5 py-0.5">{unread.length}</span>}
                    </span>
                    <div className="flex items-center gap-2">
                      {unread.length > 0 && (
                        <button onClick={() => markAllRead.mutate()} disabled={markAllRead.isPending} className="text-xs text-brand-600 hover:text-brand-700 flex items-center gap-1 font-medium disabled:opacity-50">
                          <CheckCheck size={12} /> Tout lire
                        </button>
                      )}
                      <button onClick={closeNotifPanel} className="text-slate-400 hover:text-slate-600"><X size={14} /></button>
                    </div>
                  </div>

                  {/* Bloc alertes stock — mis en avant */}
                  {stockAlerts.length > 0 && (
                    <button
                      onClick={openStockAlerts}
                      className="w-full flex items-center gap-3 px-4 py-3 bg-amber-50 dark:bg-amber-900/20 border-b border-amber-200 dark:border-amber-800/40 hover:bg-amber-100 dark:hover:bg-amber-900/30 transition-colors text-left"
                    >
                      <AlertTriangle size={16} className="text-amber-500 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-semibold text-slate-800 dark:text-slate-100">
                          {stockAlerts.length} rupture{stockAlerts.length > 1 ? 's' : ''} de stock
                        </p>
                        <p className="text-[11px] text-slate-500">Cliquer pour voir les alertes détaillées</p>
                      </div>
                      <span className="bg-amber-500 text-white text-[10px] font-bold rounded-full px-1.5 py-0.5 flex-shrink-0">
                        {stockAlerts.length}
                      </span>
                    </button>
                  )}

                  {/* Bloc incidents — mis en avant */}
                  {incidentNotifs.length > 0 && (
                    <div className="border-b border-red-200 dark:border-red-800/40">
                      {incidentNotifs.map((n: any) => (
                        <div
                          key={n.id}
                          className={`flex items-start gap-3 px-4 py-3 ${
                            n.type === 'incident-critique'
                              ? 'bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30'
                              : n.type === 'incident-majeur'
                              ? 'bg-orange-50 dark:bg-orange-900/20 hover:bg-orange-100 dark:hover:bg-orange-900/30'
                              : n.type === 'incident-resolu'
                              ? 'bg-emerald-50 dark:bg-emerald-900/20 hover:bg-emerald-100'
                              : 'bg-yellow-50 dark:bg-yellow-900/10 hover:bg-yellow-100'
                          } transition-colors`}
                        >
                          <AlertTriangle size={15} className={`flex-shrink-0 mt-0.5 ${
                            n.type === 'incident-critique' ? 'text-red-600' :
                            n.type === 'incident-majeur'   ? 'text-orange-500' :
                            n.type === 'incident-resolu'   ? 'text-emerald-500' :
                            'text-yellow-500'
                          }`} />
                          <div className="flex-1 min-w-0">
                            <p className="text-[13px] font-semibold text-slate-800 dark:text-slate-100">{n.title}</p>
                            <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-2">{n.message}</p>
                            <p className="text-[10px] text-slate-400 mt-1">{new Date(n.createdAt).toLocaleString('fr-FR')}</p>
                          </div>
                          <button onClick={() => markRead.mutate(n.id)} disabled={markRead.isPending} className="text-slate-300 hover:text-emerald-500 transition-colors mt-0.5 disabled:opacity-50">
                            <Check size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Autres notifications */}
                  <div className="max-h-60 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-700/50">
                    {otherNotifs.length === 0 && stockAlerts.length === 0 && incidentNotifs.length === 0 && (
                      <div className="py-10 text-center text-sm text-slate-400">
                        <Bell size={22} className="mx-auto mb-2 opacity-30" />
                        Aucune notification
                      </div>
                    )}
                    {otherNotifs.length === 0 && (stockAlerts.length > 0 || incidentNotifs.length > 0) && (
                      <div className="py-4 text-center text-xs text-slate-400">
                        Aucune autre notification
                      </div>
                    )}
                    {otherNotifs.map((n: any) => (
                      <div key={n.id} className="flex items-start gap-3 px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/50">
                        <span className={`mt-1.5 w-2 h-2 rounded-full flex-shrink-0 ${TYPE_DOT[n.type] ?? TYPE_DOT.info}`} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">{n.title}</p>
                          <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{n.message}</p>
                          <p className="text-[10px] text-slate-400 mt-1">{new Date(n.createdAt).toLocaleString('fr-FR')}</p>
                        </div>
                        <button onClick={() => markRead.mutate(n.id)} disabled={markRead.isPending} className="text-slate-300 hover:text-emerald-500 transition-colors mt-0.5 disabled:opacity-50">
                          <Check size={14} />
                        </button>
                      </div>
                    ))}
                  </div>

                  {/* Footer : lien alertes stock */}
                  {stockAlerts.length > 0 && (
                    <div className="px-4 py-2.5 border-t border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/30">
                      <button
                        onClick={openStockAlerts}
                        className="text-xs text-amber-600 hover:text-amber-700 font-medium flex items-center gap-1.5"
                      >
                        <AlertTriangle size={11} />
                        Voir les alertes de rupture →
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Paramètres */}
            <button onClick={() => setShowSettings(true)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 transition-colors">
              <Settings size={16} />
            </button>

            {/* Avatar utilisateur */}
            {user && (
              <div className="flex items-center gap-2.5 pl-3 ml-1 border-l border-slate-200 dark:border-slate-700">
                <div className="w-8 h-8 rounded-full bg-brand-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0 shadow-sm">
                  {user.firstName[0]}{user.lastName[0]}
                </div>
                <div className="hidden sm:block">
                  <p className="text-xs font-semibold text-slate-800 dark:text-slate-100 leading-none">{user.firstName} {user.lastName}</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">{roleLabel} · {user.site ?? 'Site Toulouse'}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {showStockAlerts && <StockAlertsModal onClose={() => setShowStockAlerts(false)} />}
      {showSettings    && <SettingsModal    onClose={() => setShowSettings(false)} />}
    </>
  );
}
