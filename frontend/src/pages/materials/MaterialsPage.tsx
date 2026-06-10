import React, { useEffect, useState } from 'react';
import { Package2, AlertTriangle, CheckCircle2, Pencil, TrendingDown, Save, MessageSquare } from 'lucide-react';
import { materialsAPI, notificationsAPI } from '../../services/api';
import type { RawMaterial } from '../../types';
import { useAuthStore } from '../../store/authStore';
import {
  Badge, StatCard, SearchInput, Table, PageLoader,
  ErrorState, EmptyState, Modal, PermissionGuard
} from '../../components/ui';
import { formatDate } from '../../utils';

export function MaterialsPage() {
  const { permissions } = useAuthStore();
  const perms = permissions?.materials;

  const [materials, setMaterials]       = useState<RawMaterial[]>([]);
  const [alerts, setAlerts]             = useState<any[]>([]);
  const [stockNotifs, setStockNotifs]   = useState<any[]>([]);
  const [_stats, setStats]              = useState<any>(null);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState('');
  const [search, setSearch]             = useState('');
  const [selected, setSelected]         = useState<RawMaterial | null>(null);
  const [showEdit, setShowEdit]         = useState(false);
  const [showReserve, setShowReserve]   = useState(false);

  // Notes en cours d'édition { [notifId]: texte }
  const [editNotes, setEditNotes]       = useState<Record<number, string>>({});
  const [savingNote, setSavingNote]     = useState<number | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const [matRes, alertRes, statsRes, notifRes] = await Promise.all([
        materialsAPI.getAll(),
        materialsAPI.getAlerts(),
        materialsAPI.getStats(),
        notificationsAPI.getStockAlerts(),
      ]);
      setMaterials(matRes.data.data || []);
      setAlerts(alertRes.data.data   || []);
      setStats(statsRes.data.data);
      setStockNotifs(notifRes.data.data || []);
    } catch (e: any) {
      setError(e.response?.data?.message || 'Erreur');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  // Cherche la notification (et sa note) liée à une matière
  const notifFor = (matId: string) => stockNotifs.find(n => n.materialId === matId);

  const handleSaveNote = async (notifId: number) => {
    const note = editNotes[notifId] ?? '';
    setSavingNote(notifId);
    try {
      await notificationsAPI.updateNote(notifId, note);
      // Mettre à jour localement sans re-fetch complet
      setStockNotifs(prev => prev.map(n => n.id === notifId ? { ...n, note } : n));
      setEditNotes(prev => { const next = { ...prev }; delete next[notifId]; return next; });
    } finally {
      setSavingNote(null);
    }
  };

  const filtered = materials.filter(m =>
    !search ||
    m.description.toLowerCase().includes(search.toLowerCase()) ||
    m.id.toLowerCase().includes(search.toLowerCase()) ||
    m.supplier.toLowerCase().includes(search.toLowerCase())
  );

  const getStockStatus = (m: RawMaterial) => {
    const available = m.currentStock - m.reservedStock;
    if (available <= 0)             return { label: 'Rupture',  color: 'bg-red-100    text-red-800    dark:bg-red-900/30    dark:text-red-300'    };
    if (available <= m.minimumStock) return { label: 'Critique', color: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300' };
    if (available <= m.minimumStock * 1.5) return { label: 'Bas', color: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300' };
    return { label: 'OK', color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' };
  };

  if (loading) return <PageLoader />;
  if (error)   return <ErrorState message={error} onRetry={load} />;

  return (
    <div className="space-y-4 page-enter">

      {/* ── Section alertes de rupture ── */}
      {alerts.length > 0 && (
        <div className="card overflow-hidden">
          {/* En-tête */}
          <div className="flex items-center gap-2 px-4 py-3 bg-amber-50 dark:bg-amber-900/20 border-b border-amber-200 dark:border-amber-800/40">
            <AlertTriangle size={14} className="text-amber-500 flex-shrink-0" />
            <h2 className="text-sm font-semibold text-amber-800 dark:text-amber-300 flex-1 uppercase tracking-[0.06em]">
              Ruptures de stock
            </h2>
            <span className="bg-red-500 text-white text-[10px] font-bold rounded-full px-1.5 py-0.5">
              {alerts.length}
            </span>
          </div>

          {/* Cartes */}
          <div className="divide-y divide-amber-100 dark:divide-amber-800/20">
            {alerts.map((m: any) => {
              const dispo  = m.stockDisponible ?? (m.currentStock - m.reservedStock);
              const manque = m.manque          ?? (m.minimumStock - dispo);
              const pct    = Math.min(100, Math.round((dispo / (m.minimumStock || 1)) * 100));
              const notif  = notifFor(m.id);
              const noteId = notif?.id;

              // Note affichée : en cours d'édition > sauvegardée > vide
              const savedNote   = notif?.note  || '';
              const editingNote = noteId !== undefined ? (editNotes[noteId] ?? null) : null;
              const displayNote = editingNote !== null ? editingNote : savedNote;
              const isEditing   = noteId !== undefined && editNotes[noteId] !== undefined;

              return (
                <div key={m.id} className="px-4 py-3 bg-white dark:bg-slate-900">
                  <div className="flex flex-wrap items-start gap-4">

                    {/* Info matière */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-mono text-[11px] text-brand-600 font-semibold">{m.id}</span>
                        <span className="text-[13px] font-semibold text-slate-800 dark:text-slate-100 truncate">{m.description}</span>
                      </div>
                      <div className="flex flex-wrap gap-3 text-[12px]">
                        <span className="text-slate-500">Disponible : <strong className="text-red-500">{dispo} {m.unit}</strong></span>
                        <span className="text-slate-400">·</span>
                        <span className="text-slate-500">Minimum : <strong className="text-slate-700 dark:text-slate-200">{m.minimumStock} {m.unit}</strong></span>
                        <span className="text-slate-400">·</span>
                        <span className="text-slate-500">Manque : <strong className="text-red-500">{manque.toFixed(1)} {m.unit}</strong></span>
                        <span className="text-slate-400">·</span>
                        <span className="text-slate-500">{m.supplier}</span>
                      </div>
                    </div>

                    {/* Jauge */}
                    <div className="flex items-center gap-2 flex-shrink-0 self-center">
                      <div className="w-24 h-1.5 rounded-full bg-slate-200 dark:bg-slate-700">
                        <div className="h-1.5 rounded-full bg-red-400 transition-all" style={{ width: `${pct}%` }} />
                      </div>
                      <span className="text-[11px] font-mono text-red-500 font-bold w-8 text-right">{pct}%</span>
                    </div>
                  </div>

                  {/* Note — toujours visible */}
                  <div className="mt-2 flex items-start gap-2">
                    <MessageSquare size={13} className="text-slate-300 dark:text-slate-600 mt-1 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      {!isEditing && savedNote ? (
                        /* Note sauvegardée : lecture seule cliquable */
                        <button
                          className="text-left w-full"
                          onClick={() => noteId !== undefined && setEditNotes(prev => ({ ...prev, [noteId]: savedNote }))}
                        >
                          <p className="text-[12px] text-slate-600 dark:text-slate-400 italic bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded px-2 py-1 hover:border-blue-300 transition-colors">
                            {savedNote}
                          </p>
                        </button>
                      ) : (
                        /* Textarea si en édition ou si pas de note */
                        <div className="flex items-center gap-2">
                          <textarea
                            value={displayNote}
                            onChange={e => noteId !== undefined && setEditNotes(prev => ({ ...prev, [noteId]: e.target.value }))}
                            onClick={() => noteId !== undefined && !isEditing && setEditNotes(prev => ({ ...prev, [noteId]: savedNote }))}
                            rows={1}
                            placeholder={noteId ? 'Ajouter une note (réapprovisionnement prévu, fournisseur contacté…)' : 'Aucune alerte de notification liée'}
                            readOnly={!noteId}
                            className="flex-1 px-2 py-1 text-[12px] bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-slate-800 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-400 resize-none disabled:opacity-50"
                          />
                          {noteId && isEditing && (
                            <button
                              onClick={() => handleSaveNote(noteId)}
                              disabled={savingNote === noteId}
                              className="flex items-center gap-1 text-[11px] h-7 px-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors flex-shrink-0 disabled:opacity-50"
                            >
                              <Save size={11} />
                              {savingNote === noteId ? '…' : 'Sauver'}
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total matières"  value={materials.length}               icon={<Package2 size={15} />}     color="blue"   />
        <StatCard title="Alertes rupture" value={alerts.length}                  icon={<AlertTriangle size={15} />} color={alerts.length > 0 ? 'red' : 'green'} />
        <StatCard title="Stock sain"      value={materials.length - alerts.length} icon={<CheckCircle2 size={15} />} color="green"  />
        <StatCard
          title="Unités réservées"
          value={materials.reduce((s, m) => s + m.reservedStock, 0).toLocaleString('fr-FR')}
          icon={<TrendingDown size={15} />}
          color="orange"
        />
      </div>

      {/* Table */}
      <div className="card">
        <div className="flex flex-wrap items-center gap-3 px-4 py-3 border-b border-slate-200 dark:border-slate-700">
          <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100 flex-1">
            Matières premières <span className="text-slate-400 font-normal ml-1 font-mono">({filtered.length})</span>
          </h2>
          <SearchInput value={search} onChange={setSearch} placeholder="Référence, description, fournisseur..." className="w-60" />
        </div>

        {filtered.length === 0 ? (
          <EmptyState icon={<Package2 size={24} />} title="Aucune matière" />
        ) : (
          <Table headers={['Référence', 'Description', 'Stock actuel', 'Réservé', 'Disponible', 'Stock min.', 'Fournisseur', 'Dernière MàJ', 'Statut', 'Actions']}>
            {filtered.map((m) => {
              const available = m.currentStock - m.reservedStock;
              const status    = getStockStatus(m);
              return (
                <tr key={m.id} className="table-row-hover">
                  <td className="py-2 px-3 font-mono text-xs text-brand-600 font-semibold">{m.id}</td>
                  <td className="py-2 px-3 text-sm text-slate-900 dark:text-slate-100 max-w-[200px] truncate">{m.description}</td>
                  <td className="py-2 px-3 text-sm font-semibold text-slate-900 dark:text-slate-100">
                    {m.currentStock.toLocaleString('fr-FR')} <span className="text-xs text-slate-400 font-normal">{m.unit}</span>
                  </td>
                  <td className="py-2 px-3 text-sm text-amber-600">{m.reservedStock.toLocaleString('fr-FR')}</td>
                  <td className="py-2 px-3 text-sm font-semibold" style={{ color: available <= m.minimumStock ? '#ef4444' : '#10b981' }}>
                    {available.toLocaleString('fr-FR')}
                  </td>
                  <td className="py-2 px-3 text-xs text-slate-500">{m.minimumStock.toLocaleString('fr-FR')}</td>
                  <td className="py-2 px-3 text-xs text-slate-600 dark:text-slate-400 max-w-[140px] truncate">{m.supplier}</td>
                  <td className="py-2 px-3 text-xs text-slate-500">{formatDate(m.lastReplenishment)}</td>
                  <td className="py-2 px-3"><Badge className={status.color} dot>{status.label}</Badge></td>
                  <td className="py-2 px-3">
                    <div className="flex items-center gap-1">
                      <PermissionGuard allowed={!!perms?.canUpdate}>
                        <button
                          onClick={() => { setSelected(m); setShowEdit(true); }}
                          className="w-7 h-7 rounded flex items-center justify-center hover:bg-amber-50 text-slate-400 hover:text-amber-600 transition-colors"
                          title="Modifier stock"
                        ><Pencil size={14} /></button>
                        <button
                          onClick={() => { setSelected(m); setShowReserve(true); }}
                          className="w-7 h-7 rounded flex items-center justify-center hover:bg-blue-50 text-slate-400 hover:text-blue-600 transition-colors"
                          title="Réserver"
                        ><TrendingDown size={14} /></button>
                      </PermissionGuard>
                    </div>
                  </td>
                </tr>
              );
            })}
          </Table>
        )}
      </div>

      {/* Edit stock modal */}
      <Modal isOpen={showEdit} onClose={() => setShowEdit(false)} title="Modifier le stock" size="sm">
        {selected && (
          <EditStockForm material={selected} onSuccess={() => { setShowEdit(false); load(); }} />
        )}
      </Modal>

      {/* Reserve stock modal */}
      <Modal isOpen={showReserve} onClose={() => setShowReserve(false)} title="Réserver du stock" size="sm">
        {selected && (
          <ReserveStockForm material={selected} onSuccess={() => { setShowReserve(false); load(); }} />
        )}
      </Modal>
    </div>
  );
}

function EditStockForm({ material, onSuccess }: { material: RawMaterial; onSuccess: () => void }) {
  const [currentStock, setCurrentStock] = useState(material.currentStock.toString());
  const [minimumStock, setMinimumStock] = useState(material.minimumStock.toString());
  const [loading, setLoading]           = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    try {
      await materialsAPI.update(material.id, {
        currentStock: parseFloat(currentStock),
        minimumStock: parseFloat(minimumStock),
      });
      onSuccess();
    } catch (e: any) {
      alert(e.response?.data?.message || 'Erreur');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <p className="text-sm font-medium text-slate-700 dark:text-slate-300">{material.description}</p>
      <div>
        <label className="label">Stock actuel ({material.unit})</label>
        <input type="number" value={currentStock} onChange={e => setCurrentStock(e.target.value)} className="input" required />
      </div>
      <div>
        <label className="label">Stock minimum ({material.unit})</label>
        <input type="number" value={minimumStock} onChange={e => setMinimumStock(e.target.value)} className="input" required />
      </div>
      <button type="submit" disabled={loading} className="btn-primary w-full justify-center">
        {loading ? 'Mise à jour...' : 'Mettre à jour'}
      </button>
    </form>
  );
}

function ReserveStockForm({ material, onSuccess }: { material: RawMaterial; onSuccess: () => void }) {
  const [quantity, setQuantity] = useState('');
  const [loading, setLoading]   = useState(false);
  const available = material.currentStock - material.reservedStock;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (parseFloat(quantity) > available) { alert('Quantité supérieure au stock disponible'); return; }
    setLoading(true);
    try {
      await materialsAPI.reserve(material.id, { quantity: parseFloat(quantity) });
      onSuccess();
    } catch (e: any) {
      alert(e.response?.data?.message || 'Erreur');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <p className="text-sm font-medium text-slate-700 dark:text-slate-300">{material.description}</p>
      <p className="text-xs text-slate-500">Stock disponible : <strong>{available.toLocaleString('fr-FR')} {material.unit}</strong></p>
      <div>
        <label className="label">Quantité à réserver ({material.unit})</label>
        <input type="number" max={available} value={quantity} onChange={e => setQuantity(e.target.value)} className="input" required />
      </div>
      <button type="submit" disabled={loading} className="btn-primary w-full justify-center">
        {loading ? 'Réservation...' : 'Réserver'}
      </button>
    </form>
  );
}
