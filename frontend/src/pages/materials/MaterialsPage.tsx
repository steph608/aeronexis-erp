import React, { useEffect, useState } from 'react';
import { Package2, AlertTriangle, CheckCircle2, Pencil, TrendingDown } from 'lucide-react';
import { materialsAPI } from '../../services/api';
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
  const [materials, setMaterials] = useState<RawMaterial[]>([]);
  const [alerts, setAlerts] = useState<RawMaterial[]>([]);
  const [_stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [showAlert, setShowAlert] = useState(false);
  const [selected, setSelected] = useState<RawMaterial | null>(null);
  const [showEdit, setShowEdit] = useState(false);
  const [showReserve, setShowReserve] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const [matRes, alertRes, statsRes] = await Promise.all([
        materialsAPI.getAll(),
        materialsAPI.getAlerts(),
        materialsAPI.getStats(),
      ]);
      setMaterials(matRes.data.data || []);
      setAlerts(alertRes.data.data || []);
      setStats(statsRes.data.data);
    } catch (e: any) {
      setError(e.response?.data?.message || 'Erreur');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const filtered = materials.filter(m =>
    !search ||
    m.description.toLowerCase().includes(search.toLowerCase()) ||
    m.id.toLowerCase().includes(search.toLowerCase()) ||
    m.supplier.toLowerCase().includes(search.toLowerCase())
  );

  const getStockStatus = (m: RawMaterial) => {
    const available = m.currentStock - m.reservedStock;
    if (available <= 0) return { label: 'Rupture', color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' };
    if (available <= m.minimumStock) return { label: 'Critique', color: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300' };
    if (available <= m.minimumStock * 1.5) return { label: 'Bas', color: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300' };
    return { label: 'OK', color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' };
  };

  if (loading) return <PageLoader />;
  if (error) return <ErrorState message={error} onRetry={load} />;

  return (
    <div className="space-y-6 page-enter">
      {/* Alerts banner */}
      {alerts.length > 0 && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800">
          <AlertTriangle size={18} className="text-orange-500 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-orange-800 dark:text-orange-300">
              {alerts.length} matière(s) en alerte de stock
            </p>
            <p className="text-xs text-orange-600 dark:text-orange-400">
              {alerts.map(a => a.description).slice(0, 3).join(', ')}{alerts.length > 3 ? '...' : ''}
            </p>
          </div>
          <button onClick={() => setShowAlert(true)} className="text-xs font-medium text-orange-600 underline">
            Voir les alertes
          </button>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total matières" value={materials.length} icon={<Package2 size={18} />} color="blue" />
        <StatCard title="Alertes rupture" value={alerts.length} icon={<AlertTriangle size={18} />} color={alerts.length > 0 ? 'red' : 'green'} />
        <StatCard title="Stock sain" value={materials.length - alerts.length} icon={<CheckCircle2 size={18} />} color="green" />
        <StatCard title="Valeur réservée" value={`${materials.reduce((s, m) => s + m.reservedStock, 0).toLocaleString('fr-FR')}`} subtitle="unités" icon={<TrendingDown size={18} />} color="orange" />
      </div>

      {/* Table */}
      <div className="card">
        <div className="flex flex-wrap items-center gap-3 p-5 border-b border-slate-200 dark:border-slate-700">
          <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100 flex-1">
            Matières premières <span className="text-slate-400 font-normal ml-1">({filtered.length})</span>
          </h2>
          <SearchInput value={search} onChange={setSearch} placeholder="Référence, description, fournisseur..." className="w-60" />
        </div>

        {filtered.length === 0 ? (
          <EmptyState icon={<Package2 size={24} />} title="Aucune matière" />
        ) : (
          <Table headers={['Référence', 'Description', 'Stock actuel', 'Réservé', 'Disponible', 'Stock min.', 'Fournisseur', 'Dernière MàJ', 'Statut', 'Actions']}>
            {filtered.map((m) => {
              const available = m.currentStock - m.reservedStock;
              const status = getStockStatus(m);
              return (
                <tr key={m.id} className="table-row-hover">
                  <td className="py-3 px-4 font-mono text-xs text-brand-600 font-semibold">{m.id}</td>
                  <td className="py-3 px-4 text-sm text-slate-900 dark:text-slate-100 max-w-[200px] truncate">{m.description}</td>
                  <td className="py-3 px-4 text-sm font-semibold text-slate-900 dark:text-slate-100">
                    {m.currentStock.toLocaleString('fr-FR')} <span className="text-xs text-slate-400 font-normal">{m.unit}</span>
                  </td>
                  <td className="py-3 px-4 text-sm text-amber-600">{m.reservedStock.toLocaleString('fr-FR')}</td>
                  <td className="py-3 px-4 text-sm font-semibold" style={{ color: available <= m.minimumStock ? '#ef4444' : '#10b981' }}>
                    {available.toLocaleString('fr-FR')}
                  </td>
                  <td className="py-3 px-4 text-xs text-slate-500">{m.minimumStock.toLocaleString('fr-FR')}</td>
                  <td className="py-3 px-4 text-xs text-slate-600 dark:text-slate-400 max-w-[140px] truncate">{m.supplier}</td>
                  <td className="py-3 px-4 text-xs text-slate-500">{formatDate(m.lastReplenishment)}</td>
                  <td className="py-3 px-4"><Badge className={status.color} dot>{status.label}</Badge></td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-1">
                      <PermissionGuard allowed={!!perms?.canUpdate}>
                        <button
                          onClick={() => { setSelected(m); setShowEdit(true); }}
                          className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-amber-50 text-slate-400 hover:text-amber-600 transition-colors"
                          title="Modifier stock"
                        ><Pencil size={14} /></button>
                        <button
                          onClick={() => { setSelected(m); setShowReserve(true); }}
                          className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-blue-50 text-slate-400 hover:text-blue-600 transition-colors"
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

      {/* Alerts modal */}
      <Modal isOpen={showAlert} onClose={() => setShowAlert(false)} title={`Alertes stock (${alerts.length})`} size="md">
        <div className="space-y-3">
          {alerts.map((m) => {
            const available = m.currentStock - m.reservedStock;
            return (
              <div key={m.id} className="p-4 rounded-xl border border-orange-200 dark:border-orange-800 bg-orange-50 dark:bg-orange-900/10">
                <div className="flex items-start justify-between mb-1">
                  <p className="text-sm font-semibold text-orange-900 dark:text-orange-300">{m.description}</p>
                  <Badge className="bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300 text-[10px]">{m.id}</Badge>
                </div>
                <p className="text-xs text-orange-600 dark:text-orange-400">
                  Disponible: <strong>{available.toLocaleString('fr-FR')} {m.unit}</strong> · Minimum requis: {m.minimumStock.toLocaleString('fr-FR')} {m.unit}
                </p>
                <p className="text-xs text-orange-500 mt-0.5">Fournisseur: {m.supplier}</p>
              </div>
            );
          })}
        </div>
      </Modal>

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
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
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
  const [loading, setLoading] = useState(false);
  const available = material.currentStock - material.reservedStock;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (parseFloat(quantity) > available) {
      alert('Quantité supérieure au stock disponible');
      return;
    }
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
      <p className="text-xs text-slate-500">Stock disponible: <strong>{available.toLocaleString('fr-FR')} {material.unit}</strong></p>
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
