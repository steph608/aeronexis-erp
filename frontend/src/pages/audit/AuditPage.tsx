import React, { useEffect, useState } from 'react';
import {
  ShieldCheck, LogIn, LogOut, Plus, Pencil, Trash2,
  AlertTriangle, Package, Users2, ShoppingCart, Factory,
  Search, Filter, Download, RefreshCw, ToggleRight,
  Hash, ArrowRight, MessageSquare, User, MapPin, Calendar,
  GitBranch, ChevronDown, ChevronRight,
} from 'lucide-react';
import { auditAPI, manufacturingAPI, ordersAPI } from '../../services/api';
import { SearchInput } from '../../components/ui';
import * as XLSX from 'xlsx';

// ─── Types de vues ────────────────────────────────────────────────────────────
type ViewMode = 'lot' | 'commande' | 'autres';

// ─── Helpers ──────────────────────────────────────────────────────────────────
function fmtDT(d: string) {
  return new Date(d).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}
function fmtD(d: string) {
  return new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });
}

function getEventLabel(log: any): { label: string; icon: React.ReactNode; color: string } {
  const { action, module, description } = log;
  if (module === 'auth' && action === 'LOGIN')   return { label: 'Connexion utilisateur',           icon: <LogIn size={13} />,       color: 'bg-purple-100 text-purple-700' };
  if (module === 'auth' && action === 'LOGOUT')  return { label: 'Déconnexion utilisateur',         icon: <LogOut size={13} />,      color: 'bg-slate-100 text-slate-600' };
  if (module === 'auth' && action === 'REGISTER')return { label: 'Création de compte',              icon: <Plus size={13} />,        color: 'bg-blue-100 text-blue-700' };
  if (module === 'orders' && action === 'CREATE')return { label: 'Nouvelle commande créée',         icon: <ShoppingCart size={13} />,color: 'bg-green-100 text-green-700' };
  if (module === 'orders' && action === 'UPDATE' && description?.includes('Statut'))
    return { label: 'Changement de statut commande', icon: <Pencil size={13} />, color: 'bg-blue-100 text-blue-700' };
  if (module === 'orders' && action === 'UPDATE' && description?.includes('Priorité'))
    return { label: 'Changement de priorité commande', icon: <Pencil size={13} />, color: 'bg-amber-100 text-amber-700' };
  if (module === 'orders' && action === 'UPDATE')  return { label: 'Modification commande',         icon: <Pencil size={13} />,      color: 'bg-blue-100 text-blue-700' };
  if (module === 'orders' && action === 'DELETE')  return { label: 'Suppression commande',          icon: <Trash2 size={13} />,      color: 'bg-red-100 text-red-700' };
  if (module === 'incidents' && action === 'CREATE')return { label: 'Détection d\'un incident qualité', icon: <AlertTriangle size={13} />, color: 'bg-red-100 text-red-700' };
  if (module === 'incidents' && action === 'UPDATE' && description?.includes('Statut'))
    return { label: 'Mise à jour statut incident', icon: <AlertTriangle size={13} />, color: 'bg-orange-100 text-orange-700' };
  if (module === 'incidents' && action === 'UPDATE')return { label: 'Modification incident qualité', icon: <AlertTriangle size={13} />, color: 'bg-orange-100 text-orange-700' };
  if (module === 'customers' && action === 'CREATE') return { label: 'Nouveau client ajouté',       icon: <Users2 size={13} />,      color: 'bg-green-100 text-green-700' };
  if (module === 'customers' && action === 'UPDATE' && description?.includes('Statut'))
    return { label: 'Changement de statut client', icon: <ToggleRight size={13} />, color: 'bg-amber-100 text-amber-700' };
  if (module === 'customers' && action === 'UPDATE') return { label: 'Modification fiche client',  icon: <Pencil size={13} />,      color: 'bg-blue-100 text-blue-700' };
  if (module === 'customers' && action === 'DELETE') return { label: 'Suppression client',         icon: <Trash2 size={13} />,      color: 'bg-red-100 text-red-700' };
  if (module === 'products'  && action === 'CREATE') return { label: 'Nouveau produit au catalogue',icon: <Package size={13} />,     color: 'bg-green-100 text-green-700' };
  if (module === 'products'  && action === 'UPDATE') return { label: 'Modification produit catalogue',icon:<Package size={13} />,   color: 'bg-blue-100 text-blue-700' };
  if (module === 'manufacturing' && action === 'CREATE') return { label: 'Création d\'un OF',      icon: <Factory size={13} />,     color: 'bg-indigo-100 text-indigo-700' };
  if (module === 'manufacturing' && action === 'UPDATE' && description?.includes('Statut'))
    return { label: 'Changement de statut OF', icon: <ArrowRight size={13} />, color: 'bg-blue-100 text-blue-700' };
  if (module === 'manufacturing' && action === 'UPDATE' && description?.includes('Opérateur'))
    return { label: 'Changement d\'opérateur OF', icon: <User size={13} />, color: 'bg-cyan-100 text-cyan-700' };
  if (module === 'manufacturing' && action === 'UPDATE') return { label: 'Modification d\'un OF',  icon: <Pencil size={13} />,      color: 'bg-blue-100 text-blue-700' };
  const actionLabels: Record<string, string> = { CREATE: 'Création', UPDATE: 'Modification', DELETE: 'Suppression', VIEW: 'Consultation', LOGIN: 'Connexion' };
  return { label: `${actionLabels[action] || action} — ${module}`, icon: <ShieldCheck size={13} />, color: 'bg-slate-100 text-slate-600' };
}

// ─── Composant mini-timeline (réutilisé par les 3 vues) ──────────────────────
function AuditTimeline({ items }: { items: any[] }) {
  if (items.length === 0)
    return <p className="text-xs text-slate-400 py-4 text-center">Aucun événement enregistré</p>;

  return (
    <div className="relative pl-5">
      <div className="absolute left-2 top-0 bottom-0 w-px bg-slate-200 dark:bg-slate-700" />
      <div className="space-y-2">
        {items.map((item: any, idx: number) => {
          // Incident
          if (item._type === 'incident') {
            const sevColor: Record<string, string> = {
              Critique:    'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800',
              Majeur:      'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800',
              Mineur:      'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800',
              Observation: 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700',
            };
            const dotColor: Record<string, string> = {
              Critique: 'bg-red-100 border-red-400', Majeur: 'bg-orange-100 border-orange-400',
              Mineur: 'bg-yellow-100 border-yellow-400', Observation: 'bg-slate-100 border-slate-400',
            };
            const textColor: Record<string, string> = {
              Critique: 'text-red-700 dark:text-red-300', Majeur: 'text-orange-700 dark:text-orange-300',
              Mineur: 'text-yellow-700 dark:text-yellow-300', Observation: 'text-slate-700 dark:text-slate-300',
            };
            return (
              <div key={`inc-${item.id ?? idx}`} className="relative">
                <div className={`absolute -left-3 top-2 w-4 h-4 rounded-full border-2 flex items-center justify-center ${dotColor[item.severity] || 'bg-slate-100 border-slate-400'}`}>
                  <AlertTriangle size={8} className={textColor[item.severity] || 'text-slate-600'} />
                </div>
                <div className={`ml-3 p-2.5 rounded-lg border ${sevColor[item.severity] || sevColor.Observation}`}>
                  <div className="flex items-start justify-between gap-2 flex-wrap mb-0.5">
                    <p className={`text-[11px] font-semibold ${textColor[item.severity] || 'text-slate-700'}`}>
                      Incident {item.severity} — {item.anomalyType}
                    </p>
                    <span className="text-[10px] text-slate-400 flex-shrink-0">{fmtDT(item.createdAt)}</span>
                  </div>
                  {item.description && <p className="text-xs text-slate-600 dark:text-slate-400">{item.description}</p>}
                  {item.correctiveAction && (
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      <span className="font-medium">Action corrective :</span> {item.correctiveAction}
                    </p>
                  )}
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${item.status === 'Résolu' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{item.status}</span>
                    {item.responsible && <p className="text-[10px] text-slate-400">{item.responsible.firstName} {item.responsible.lastName}</p>}
                  </div>
                </div>
              </div>
            );
          }
          // Commentaire incident
          if (item._type === 'comment') {
            return (
              <div key={`c-${item.id ?? idx}`} className="relative">
                <div className="absolute -left-3 top-2 w-4 h-4 rounded-full bg-purple-100 border-2 border-purple-300 flex items-center justify-center">
                  <MessageSquare size={8} className="text-purple-600" />
                </div>
                <div className="ml-3 p-2.5 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-100 dark:border-purple-800">
                  <div className="flex items-start justify-between gap-2 flex-wrap mb-0.5">
                    <p className="text-[11px] font-semibold text-purple-700 dark:text-purple-300">
                      Commentaire — {item._incidentType}
                    </p>
                    <span className="text-[10px] text-slate-400 flex-shrink-0">{fmtDT(item.createdAt)}</span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 italic">"{item.content}"</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    {item.firstName ? `${item.firstName} ${item.lastName}` : item.userEmail}
                  </p>
                </div>
              </div>
            );
          }
          // Log d'audit
          const style = getEventLabel(item);
          const userName = item.user
            ? `${item.user.firstName} ${item.user.lastName}`
            : (item.userEmail?.split('@')[0] || 'Système');
          return (
            <div key={`a-${item.id ?? idx}`} className="relative">
              <div className={`absolute -left-3 top-2 w-4 h-4 rounded-full border-2 flex items-center justify-center ${style.color}`}>
                {style.icon}
              </div>
              <div className="ml-3 p-2.5 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                <div className="flex items-start justify-between gap-2 flex-wrap">
                  <p className="text-xs font-semibold text-slate-800 dark:text-slate-100">{style.label}</p>
                  <span className="text-[10px] text-slate-400 flex-shrink-0">{fmtDT(item.createdAt)}</span>
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">{item.description}</p>
                <p className="text-[10px] text-slate-400 mt-0.5">{userName}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Helper Excel ─────────────────────────────────────────────────────────────
function downloadXLSX(rows: any[][], headers: string[], filename: string) {
  const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
  // Largeur automatique des colonnes
  ws['!cols'] = headers.map((_, i) => ({
    wch: Math.max(headers[i].length, ...rows.map(r => String(r[i] ?? '').length), 10),
  }));
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Historique');
  XLSX.writeFile(wb, filename);
}

// ─── VUE 1 : Par LOT ─────────────────────────────────────────────────────────
function ViewParLot({ allLogs: _allLogs }: { allLogs: any[] }) {
  const [allOFs, setAllOFs]     = useState<any[]>([]);
  const [search, setSearch]     = useState('');
  const [_selected, setSelected] = useState('');
  const [traceData, setTraceData] = useState<any>(null);
  const [loading, setLoading]   = useState(false);
  const [showSugg, setShowSugg] = useState(false);

  useEffect(() => {
    manufacturingAPI.getAll().then(r => setAllOFs(r.data.data || [])).catch(() => {});
  }, []);

  const suggestions = search.length >= 2
    ? allOFs.filter(o =>
        o.batchNumber.toLowerCase().includes(search.toLowerCase()) ||
        o.product?.description?.toLowerCase().includes(search.toLowerCase())
      ).slice(0, 8)
    : [];

  const loadLot = async (batchNumber: string) => {
    setLoading(true); setTraceData(null);
    try {
      const res = await manufacturingAPI.getTraceability(batchNumber);
      setTraceData(res.data.data);
    } catch { alert('Lot introuvable'); }
    finally { setLoading(false); }
  };

  const handleSelect = (batch: string) => {
    setSelected(batch); setSearch(batch); setShowSugg(false); loadLot(batch);
  };

  // Construire la timeline du lot (audit logs + incidents + commentaires)
  const buildTimeline = (data: any) => {
    const items: any[] = [...(data.auditLogs || []).map((l: any) => ({ ...l, _type: 'audit' }))];
    (data.incidents || []).forEach((inc: any) => {
      items.push({ ...inc, _type: 'incident' });
      (inc.comments || []).forEach((c: any) => items.push({ ...c, _type: 'comment', _incidentType: inc.anomalyType }));
    });
    return items.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  };

  const exportLotCSV = () => {
    if (!traceData) return;
    const timeline = buildTimeline(traceData);

    // Onglet 1 : timeline complète
    const headers = ['Date', 'Type', 'Anomalie / Événement', 'Sévérité', 'Statut', 'Action corrective', 'Utilisateur / Responsable', 'Détail'];
    const rows = timeline.map((item: any) => {
      if (item._type === 'incident') return [
        fmtDT(item.createdAt),
        'Incident',
        item.anomalyType,
        item.severity,
        item.status,
        item.correctiveAction || '—',
        item.responsible ? `${item.responsible.firstName} ${item.responsible.lastName}` : '—',
        item.id,
      ];
      if (item._type === 'comment') return [
        fmtDT(item.createdAt),
        'Commentaire',
        `Commentaire — ${item._incidentType}`,
        '', '', '',
        item.firstName ? `${item.firstName} ${item.lastName}` : (item.userEmail || '—'),
        item.content,
      ];
      return [
        fmtDT(item.createdAt),
        'Événement',
        getEventLabel(item).label,
        '', '', '',
        item.user ? `${item.user.firstName} ${item.user.lastName}` : (item.userEmail || 'Système'),
        item.description,
      ];
    });

    // Onglet 2 : incidents détaillés
    const incHeaders = ['ID', 'Date', 'Anomalie', 'Sévérité', 'Statut', 'Action corrective', 'Responsable'];
    const incRows = (traceData.incidents || []).map((inc: any) => [
      inc.id,
      fmtDT(inc.createdAt),
      inc.anomalyType,
      inc.severity,
      inc.status,
      inc.correctiveAction || '—',
      inc.responsible ? `${inc.responsible.firstName} ${inc.responsible.lastName}` : '—',
    ]);

    const autoWidth = (hdrs: string[], rws: any[][]) =>
      hdrs.map((_, i) => ({ wch: Math.max(hdrs[i].length, ...rws.map(r => String(r[i] ?? '').length), 10) }));

    const wb = XLSX.utils.book_new();
    const ws1 = XLSX.utils.aoa_to_sheet([headers, ...rows]);
    ws1['!cols'] = autoWidth(headers, rows);
    XLSX.utils.book_append_sheet(wb, ws1, 'Timeline');

    if (incRows.length > 0) {
      const ws2 = XLSX.utils.aoa_to_sheet([incHeaders, ...incRows]);
      ws2['!cols'] = autoWidth(incHeaders, incRows);
      XLSX.utils.book_append_sheet(wb, ws2, 'Incidents');
    }

    XLSX.writeFile(wb, `tracabilite_lot_${traceData.of?.batchNumber}_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  return (
    <div className="space-y-5">
      {/* Recherche */}
      <div className="card p-4">
        <p className="text-xs font-semibold text-slate-600 dark:text-slate-300 mb-3 flex items-center gap-2">
          <Hash size={13} /> Rechercher par numéro de lot ou produit
        </p>
        <div className="relative flex gap-2">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={e => { setSearch(e.target.value); setShowSugg(true); }}
              onFocus={() => setShowSugg(true)}
              placeholder="Ex: LOT-H-2024-001 ou Turbine T7..."
              className="input pl-9 h-9 text-xs w-full"
            />
            {showSugg && suggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 z-20 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 py-1 max-h-48 overflow-y-auto">
                {suggestions.map(of => (
                  <button
                    key={of.id}
                    onMouseDown={() => handleSelect(of.batchNumber)}
                    className="w-full text-left px-4 py-2 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center justify-between"
                  >
                    <span className="text-xs font-mono font-semibold text-brand-600">{of.batchNumber}</span>
                    <span className="text-[11px] text-slate-400 truncate max-w-[180px]">{of.product?.description}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
          <button
            onClick={() => { if (search) { setShowSugg(false); loadLot(search); } }}
            className="btn-primary h-9 px-4 text-xs"
            disabled={loading || !search}
          >
            {loading ? 'Chargement...' : 'Voir l\'historique'}
          </button>
        </div>
      </div>

      {/* Résultat */}
      {traceData && (() => {
        const { of: ofData, incidents = [] } = traceData;
        const timeline = buildTimeline(traceData);
        return (
          <div className="space-y-4">
            {/* Carte OF */}
            <div className="card p-4">
              <div className="flex items-start justify-between mb-3 flex-wrap gap-2">
                <div>
                  <p className="text-sm font-bold text-slate-900 dark:text-slate-100 font-mono">{ofData.batchNumber}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{ofData.product?.description} · {ofData.product?.category}</p>
                </div>
                <div className="flex items-center gap-2">
                  {incidents.length > 0 && (
                    <span className="flex items-center gap-1 text-xs font-medium text-red-600 bg-red-50 dark:bg-red-900/20 px-2 py-1 rounded-full">
                      <AlertTriangle size={11} /> {incidents.length} incident{incidents.length > 1 ? 's' : ''}
                    </span>
                  )}
                  <button onClick={exportLotCSV} className="btn-secondary text-xs flex items-center gap-1.5 h-8 px-3">
                    <Download size={13} /> Télécharger Excel
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                {[
                  { icon: <MapPin size={11} />, label: 'Site', value: ofData.site },
                  { icon: <User size={11} />, label: 'Opérateur', value: ofData.operator ? `${ofData.operator.firstName} ${ofData.operator.lastName}` : '—' },
                  { icon: <Calendar size={11} />, label: 'Lancement', value: fmtD(ofData.launchDate) },
                  { icon: <Factory size={11} />, label: 'Statut', value: ofData.status },
                ].map(f => (
                  <div key={f.label} className="flex items-center gap-1.5 text-slate-500">
                    <span className="text-slate-400">{f.icon}</span>
                    <span className="text-slate-400">{f.label} :</span>
                    <span className="font-medium text-slate-700 dark:text-slate-300">{f.value}</span>
                  </div>
                ))}
              </div>
              {ofData.order && (
                <div className="mt-2 flex items-center gap-1.5 text-xs text-slate-500">
                  <GitBranch size={11} className="text-slate-400" />
                  Commande liée : <span className="font-mono font-semibold text-brand-600">{ofData.order.id}</span>
                  <span className="text-slate-300">·</span> Statut : {ofData.order.status}
                </div>
              )}
            </div>

            {/* Timeline */}
            <div className="card p-4">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                <ShieldCheck size={12} /> Historique complet — {timeline.length} événement{timeline.length > 1 ? 's' : ''}
              </p>
              <AuditTimeline items={timeline} />
            </div>
          </div>
        );
      })()}
    </div>
  );
}

// ─── VUE 2 : Par commande ─────────────────────────────────────────────────────
function ViewParCommande({ allLogs: _allLogs }: { allLogs: any[] }) {
  const [orders, setOrders]               = useState<any[]>([]);
  const [selectedOrder, setSelectedOrder] = useState('');
  const [lotsForOrder, setLotsForOrder]   = useState<any[]>([]);
  const [lotDataMap, setLotDataMap]       = useState<Record<string, any>>({});
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [loadingLots, setLoadingLots]     = useState(false);
  const [expanded, setExpanded]           = useState<Record<string, boolean>>({});

  useEffect(() => {
    ordersAPI.getAll()
      .then(r => setOrders(r.data.data || []))
      .catch(() => {})
      .finally(() => setLoadingOrders(false));
  }, []);

  const loadOrder = async (orderId: string) => {
    setSelectedOrder(orderId);
    setLotsForOrder([]);
    setLotDataMap({});
    if (!orderId) return;
    setLoadingLots(true);
    try {
      // Utilise le nouvel endpoint qui trouve TOUS les lots liés à cette commande
      const lotsRes = await ordersAPI.getManufacturing(orderId);
      const lots: any[] = lotsRes.data.data || [];
      setLotsForOrder(lots);

      if (lots.length === 0) return;

      // Charge la traçabilité complète de chaque lot en parallèle
      const results = await Promise.all(
        lots.map(of => manufacturingAPI.getTraceability(of.batchNumber).catch(() => null))
      );
      const map: Record<string, any> = {};
      results.forEach(r => {
        if (r?.data?.data) map[r.data.data.of.batchNumber] = r.data.data;
      });
      setLotDataMap(map);
      const init: Record<string, boolean> = {};
      lots.forEach(of => { init[of.batchNumber] = true; });
      setExpanded(init);
    } catch {}
    finally { setLoadingLots(false); }
  };

  const exportCommandeCSV = () => {
    const headers = ['Lot', 'Produit', 'Date', 'Type', 'Anomalie / Événement', 'Sévérité', 'Statut', 'Action corrective', 'Utilisateur / Responsable', 'Détail'];
    const rows: any[][] = [];
    Object.values(lotDataMap).forEach((data: any) => {
      const items: any[] = [
        ...(data.auditLogs || []).map((l: any) => ({ ...l, _type: 'audit' })),
        ...(data.incidents || []).flatMap((inc: any) => [
          { ...inc, _type: 'incident' },
          ...(inc.comments || []).map((c: any) => ({ ...c, _type: 'comment', _incidentType: inc.anomalyType })),
        ]),
      ].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

      items.forEach(item => {
        if (item._type === 'incident') {
          rows.push([
            data.of.batchNumber,
            data.of.product?.description,
            fmtDT(item.createdAt),
            'Incident',
            item.anomalyType,
            item.severity,
            item.status,
            item.correctiveAction || '—',
            item.responsible ? `${item.responsible.firstName} ${item.responsible.lastName}` : '—',
            item.id,
          ]);
        } else if (item._type === 'comment') {
          rows.push([
            data.of.batchNumber,
            data.of.product?.description,
            fmtDT(item.createdAt),
            'Commentaire',
            `Commentaire — ${item._incidentType}`,
            '', '', '',
            item.firstName ? `${item.firstName} ${item.lastName}` : (item.userEmail || '—'),
            item.content,
          ]);
        } else {
          rows.push([
            data.of.batchNumber,
            data.of.product?.description,
            fmtDT(item.createdAt),
            'Événement',
            getEventLabel(item).label,
            '', '', '',
            item.user ? `${item.user.firstName} ${item.user.lastName}` : 'Système',
            item.description,
          ]);
        }
      });
    });
    downloadXLSX(rows, headers, `historique_commande_${selectedOrder}_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  return (
    <div className="space-y-5">
      {/* Sélecteur commande */}
      <div className="card p-4">
        <p className="text-xs font-semibold text-slate-600 dark:text-slate-300 mb-3 flex items-center gap-2">
          <ShoppingCart size={13} /> Sélectionner une commande
        </p>
        <div className="flex gap-2">
          <select
            value={selectedOrder}
            onChange={e => loadOrder(e.target.value)}
            className="input h-9 text-xs flex-1"
            disabled={loadingOrders}
          >
            <option value="">— Choisir une commande —</option>
            {orders.map(o => (
              <option key={o.id} value={o.id}>
                {o.id} — {o.customer?.name || o.customerId}
              </option>
            ))}
          </select>
          {selectedOrder && lotsForOrder.length > 0 && Object.keys(lotDataMap).length > 0 && (
            <button onClick={exportCommandeCSV} className="btn-secondary text-xs flex items-center gap-1.5 h-9 px-3">
              <Download size={13} /> Télécharger Excel
            </button>
          )}
        </div>
        {selectedOrder && lotsForOrder.length > 0 && (
          <p className="text-xs text-slate-400 mt-2">
            {lotsForOrder.length} lot{lotsForOrder.length > 1 ? 's' : ''} trouvé{lotsForOrder.length > 1 ? 's' : ''} pour cette commande
          </p>
        )}
      </div>

      {loadingLots && (
        <div className="text-center py-8 text-slate-400 text-sm">Chargement des lots...</div>
      )}

      {selectedOrder && !loadingLots && lotsForOrder.length === 0 && (
        <div className="text-center py-8 text-slate-400 text-sm">Aucun lot trouvé pour cette commande.</div>
      )}

      {lotsForOrder.map(of => {
        const data = lotDataMap[of.batchNumber];
        const isOpen = expanded[of.batchNumber] ?? true;
        const incidents = data?.incidents || [];
        const timeline: any[] = data
          ? [
              ...(data.auditLogs || []).map((l: any) => ({ ...l, _type: 'audit' })),
              ...incidents.flatMap((inc: any) =>
                (inc.comments || []).map((c: any) => ({ ...c, _type: 'comment', _incidentType: inc.anomalyType }))
              ),
            ].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
          : [];

        return (
          <div key={of.batchNumber} className="card overflow-hidden">
            <button
              onClick={() => setExpanded(p => ({ ...p, [of.batchNumber]: !isOpen }))}
              className="w-full flex items-center justify-between p-4 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors text-left"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center">
                  <Factory size={15} className="text-indigo-600" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 font-mono">{of.batchNumber}</p>
                  <p className="text-xs text-slate-500">
                    {of.product?.description} · Qté : {of.quantity} · {of.site}
                    {!of.orderId && <span className="ml-2 text-amber-500 text-[10px]">(correspondance produit)</span>}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {incidents.length > 0 && (
                  <span className="flex items-center gap-1 text-xs text-red-600 bg-red-50 dark:bg-red-900/20 px-2 py-0.5 rounded-full">
                    <AlertTriangle size={10} /> {incidents.length}
                  </span>
                )}
                <span className="text-xs text-slate-400">{timeline.length} evt</span>
                {isOpen ? <ChevronDown size={14} className="text-slate-400" /> : <ChevronRight size={14} className="text-slate-400" />}
              </div>
            </button>

            {isOpen && (
              <div className="px-4 pb-4 border-t border-slate-100 dark:border-slate-700 pt-3">
                {!data ? (
                  <p className="text-xs text-slate-400 py-2 text-center">Chargement de la traçabilité...</p>
                ) : (
                  <AuditTimeline items={timeline} />
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── VUE 3 : Autres actions ───────────────────────────────────────────────────
const OTHER_MODULES = ['auth', 'orders', 'customers', 'products', 'shipments'];

function ViewAutresActions({ logs }: { logs: any[] }) {
  const [search, setSearch]       = useState('');
  const [moduleFilter, setModule] = useState('');
  const [actionFilter, setAction] = useState('');

  const filtered = logs
    .filter(l => OTHER_MODULES.includes(l.module))
    .filter(l => {
      const ms = !search ||
        l.description?.toLowerCase().includes(search.toLowerCase()) ||
        l.userEmail?.toLowerCase().includes(search.toLowerCase()) ||
        (l.user ? `${l.user.firstName} ${l.user.lastName}`.toLowerCase().includes(search.toLowerCase()) : false);
      return ms && (!moduleFilter || l.module === moduleFilter) && (!actionFilter || l.action === actionFilter);
    });

  const grouped: Record<string, any[]> = {};
  filtered.forEach(l => {
    const day = new Date(l.createdAt).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    if (!grouped[day]) grouped[day] = [];
    grouped[day].push(l);
  });

  const exportCSV = () => {
    const headers = ['Date', 'Utilisateur', 'Email', 'Événement', 'Module', 'Action', 'Détail', 'IP'];
    const rows = filtered.map(l => [
      fmtDT(l.createdAt),
      l.user ? `${l.user.firstName} ${l.user.lastName}` : (l.userEmail?.split('@')[0] || 'Système'),
      l.userEmail || '',
      getEventLabel(l).label,
      l.module,
      l.action,
      l.description || '',
      l.ipAddress || '',
    ]);
    downloadXLSX(rows, headers, `historique_autres_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const availableModules = [...new Set(logs.filter(l => OTHER_MODULES.includes(l.module)).map(l => l.module))].sort();
  const MODULE_LABELS: Record<string, string> = {
    auth: 'Connexions', orders: 'Commandes', customers: 'Clients', products: 'Catalogue', shipments: 'Expéditions',
  };

  return (
    <div className="space-y-4">
      <div className="card p-4 flex flex-wrap gap-3 items-center">
        <Filter size={13} className="text-slate-400" />
        <SearchInput value={search} onChange={setSearch} placeholder="Rechercher..." className="w-60" />
        <select value={moduleFilter} onChange={e => setModule(e.target.value)} className="input h-9 text-xs w-40">
          <option value="">Tous les modules</option>
          {availableModules.map(m => <option key={m} value={m}>{MODULE_LABELS[m] || m}</option>)}
        </select>
        <select value={actionFilter} onChange={e => setAction(e.target.value)} className="input h-9 text-xs w-32">
          <option value="">Toutes actions</option>
          {['CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT'].map(a => <option key={a}>{a}</option>)}
        </select>
        <span className="text-xs text-slate-400 ml-auto">{filtered.length} événement(s)</span>
        <button onClick={exportCSV} className="btn-secondary text-xs flex items-center gap-1.5 h-8 px-3">
          <Download size={13} /> Télécharger Excel
        </button>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16 text-slate-400 text-sm">Aucun événement trouvé</div>
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([day, dayLogs]) => (
            <div key={day}>
              <div className="flex items-center gap-3 mb-3">
                <div className="h-px flex-1 bg-slate-200 dark:bg-slate-700" />
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider capitalize">{day}</span>
                <div className="h-px flex-1 bg-slate-200 dark:bg-slate-700" />
              </div>
              <div className="space-y-2">
                {dayLogs.map((log: any) => {
                  const event = getEventLabel(log);
                  const userName = log.user
                    ? `${log.user.firstName} ${log.user.lastName}`
                    : (log.userEmail?.split('@')[0] || 'Système');
                  const time = new Date(log.createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
                  return (
                    <div key={log.id} className="card p-3.5 flex items-start gap-3 hover:shadow-md transition-shadow">
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${event.color}`}>
                        {event.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 flex-wrap">
                          <p className="text-xs font-semibold text-slate-800 dark:text-slate-100">{event.label}</p>
                          <span className="text-[10px] text-slate-400 flex-shrink-0">{time}</span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">{log.description}</p>
                        <div className="flex items-center gap-2 mt-1.5">
                          <div className="w-4 h-4 rounded-full bg-brand-100 dark:bg-brand-900/40 flex items-center justify-center text-[8px] font-bold text-brand-700">
                            {userName[0]?.toUpperCase()}
                          </div>
                          <span className="text-[10px] text-slate-500">{userName}</span>
                          <span className="text-slate-300">·</span>
                          <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${event.color}`}>
                            {MODULE_LABELS[log.module] || log.module}
                          </span>
                          {log.ipAddress && (
                            <><span className="text-slate-300">·</span><span className="text-[10px] text-slate-400 font-mono">{log.ipAddress}</span></>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Page principale ───────────────────────────────────────────────────────────
export default function AuditPage() {
  const [logs, setLogs]       = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView]       = useState<ViewMode>('lot');

  const load = async () => {
    setLoading(true);
    try {
      const res = await auditAPI.getAll();
      setLogs(res.data.data || []);
    } catch {}
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const tabs: { key: ViewMode; label: string; icon: React.ReactNode; desc: string }[] = [
    { key: 'lot',      label: 'Par LOT',      icon: <Hash size={14} />,          desc: 'Tout l\'historique d\'un lot spécifique' },
    { key: 'commande', label: 'Par commande', icon: <ShoppingCart size={14} />,  desc: 'Tous les lots d\'une commande, groupés par produit' },
    { key: 'autres',   label: 'Autres actions', icon: <ShieldCheck size={14} />, desc: 'Connexions, clients, produits, expéditions' },
  ];

  return (
    <div className="space-y-6 page-enter">
      {/* Header */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex-1">
          <h1 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <ShieldCheck size={20} className="text-brand-600" /> Historique & Traçabilité
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">Traçabilité complète par lot, par commande, ou par catégorie d'action</p>
        </div>
        <button onClick={load} disabled={loading} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 transition-colors" title="Actualiser">
          <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* Sélecteur de vue */}
      <div className="grid grid-cols-3 gap-3">
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setView(tab.key)}
            className={`p-4 rounded-xl border-2 text-left transition-all ${
              view === tab.key
                ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/20'
                : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-brand-300'
            }`}
          >
            <div className={`flex items-center gap-2 font-semibold text-sm mb-1 ${view === tab.key ? 'text-brand-700 dark:text-brand-300' : 'text-slate-700 dark:text-slate-200'}`}>
              {tab.icon} {tab.label}
            </div>
            <p className="text-[11px] text-slate-400 leading-snug">{tab.desc}</p>
          </button>
        ))}
      </div>

      {/* Vue active */}
      {loading ? (
        <div className="text-center py-16 text-slate-400 text-sm">Chargement...</div>
      ) : (
        <>
          {view === 'lot'      && <ViewParLot allLogs={logs} />}
          {view === 'commande' && <ViewParCommande allLogs={logs} />}
          {view === 'autres'   && <ViewAutresActions logs={logs} />}
        </>
      )}
    </div>
  );
}
