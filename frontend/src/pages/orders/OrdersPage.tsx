import React, { useEffect, useState } from 'react';
import { Plus, Eye, Pencil, Trash2, TrendingUp, Clock, CheckCircle2, ShoppingCart } from 'lucide-react';
import { ordersAPI } from '../../services/api';
import type { Order } from '../../types';
import { useAuthStore } from '../../store/authStore';
import {
  Badge, StatCard, SearchInput, Table, PageLoader,
  ErrorState, EmptyState, Modal, PermissionGuard
} from '../../components/ui';
import { formatCurrency, formatDate, getOrderStatusColor, getPriorityColor, daysUntil } from '../../utils';

export function OrdersPage() {
  const { permissions } = useAuthStore();
  const perms = permissions?.orders;
  const [orders, setOrders] = useState<Order[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selected, setSelected] = useState<Order | null>(null);
  const [showDetail, setShowDetail] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [showEdit, setShowEdit] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const [ordersRes, statsRes] = await Promise.all([
        ordersAPI.getAll(),
        ordersAPI.getStats(),
      ]);
      setOrders(ordersRes.data.data || []);
      setStats(statsRes.data.data);
    } catch (e: any) {
      setError(e.response?.data?.message || 'Erreur de chargement');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const filtered = orders.filter(o => {
    const matchSearch = !search ||
      o.id.toLowerCase().includes(search.toLowerCase()) ||
      o.customer?.name?.toLowerCase().includes(search.toLowerCase()) ||
      o.salesManager.toLowerCase().includes(search.toLowerCase());
    const matchStatus = !statusFilter || o.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const handleDelete = async (id: string) => {
    if (!confirm('Supprimer cette commande ?')) return;
    try {
      await ordersAPI.delete(id);
      await load();
    } catch (e: any) {
      alert(e.response?.data?.message || 'Erreur de suppression');
    }
  };

  if (loading) return <PageLoader />;
  if (error) return <ErrorState message={error} onRetry={load} />;

  const statuses = ['En production', 'Planifiée', 'Terminée', 'Annulée'];

  return (
    <div className="space-y-6 page-enter">
      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard title="Total commandes" value={stats.total || orders.length} icon={<ShoppingCart size={18} />} color="blue" />
          <StatCard title="CA total" value={formatCurrency(stats.totalRevenue || 0)} icon={<TrendingUp size={18} />} color="green" />
          <StatCard title="En production" value={orders.filter(o => o.status === 'En production').length} icon={<Clock size={18} />} color="orange" />
          <StatCard title="Terminées" value={orders.filter(o => o.status === 'Terminée').length} icon={<CheckCircle2 size={18} />} color="green" />
        </div>
      )}

      {/* Table card */}
      <div className="card">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 p-5 border-b border-slate-200 dark:border-slate-700">
          <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100 flex-1">
            Commandes <span className="text-slate-400 font-normal ml-1">({filtered.length})</span>
          </h2>
          <SearchInput value={search} onChange={setSearch} placeholder="Rechercher commande, client..." className="w-56" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="input h-9 text-xs w-40"
          >
            <option value="">Tous les statuts</option>
            {statuses.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <PermissionGuard allowed={!!perms?.canCreate}>
            <button onClick={() => setShowCreate(true)} className="btn-primary">
              <Plus size={15} /> Nouvelle commande
            </button>
          </PermissionGuard>
        </div>

        {filtered.length === 0 ? (
          <EmptyState
            icon={<ShoppingCart size={24} />}
            title="Aucune commande"
            description={search ? 'Aucun résultat pour votre recherche' : 'Créez votre première commande'}
          />
        ) : (
          <Table headers={['Numéro de commande', 'ID client', 'Montant', 'Priorité', 'Livraison', 'Statut', 'Responsable', 'Actions']}>
            {filtered.map((order) => {
              const days = daysUntil(order.expectedDeliveryDate);
              const isTerminee = order.status === 'Terminée';
              const completionDelay = isTerminee && order.updatedAt
                ? Math.ceil((new Date(order.updatedAt).getTime() - new Date(order.expectedDeliveryDate).getTime()) / 86400000)
                : null;
              return (
                <tr key={order.id} className="table-row-hover">
                  <td className="py-3 px-4 font-mono text-xs text-brand-600 font-semibold">{order.id}</td>
                  <td className="py-3 px-4">
                    <p className="text-xs font-mono font-semibold text-brand-600">{order.customerId}</p>
                    <p className="text-xs text-slate-400">{order.customer?.name}</p>
                  </td>
                  <td className="py-3 px-4 text-sm font-semibold text-slate-900 dark:text-slate-100">{formatCurrency(order.totalAmount)}</td>
                  <td className="py-3 px-4"><Badge className={getPriorityColor(order.priority)}>{order.priority}</Badge></td>
                  <td className="py-3 px-4">
                    <p className="text-xs text-slate-700 dark:text-slate-300">{formatDate(order.expectedDeliveryDate)}</p>
                    {isTerminee ? (
                      completionDelay != null && completionDelay > 0
                        ? <p className="text-xs font-medium text-red-500">Terminée en retard de {completionDelay}j</p>
                        : <p className="text-xs font-medium text-green-600">Terminée à temps</p>
                    ) : (
                      <p className={`text-xs font-medium ${days < 0 ? 'text-red-500' : days <= 7 ? 'text-orange-500' : 'text-slate-400'}`}>
                        {days < 0 ? `⚠ Retard ${Math.abs(days)}j` : `J-${days}`}
                      </p>
                    )}
                  </td>
                  <td className="py-3 px-4"><Badge className={getOrderStatusColor(order.status)}>{order.status}</Badge></td>
                  <td className="py-3 px-4 text-xs text-slate-500">{order.salesManager}</td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => { setSelected(order); setShowDetail(true); }}
                        className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-brand-50 dark:hover:bg-brand-900/20 text-slate-400 hover:text-brand-600 transition-colors"
                      >
                        <Eye size={14} />
                      </button>
                      <PermissionGuard allowed={!!perms?.canUpdate}>
                        <button
                          onClick={() => { setSelected(order); setShowEdit(true); }}
                          className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-amber-50 dark:hover:bg-amber-900/20 text-slate-400 hover:text-amber-600 transition-colors"
                        >
                          <Pencil size={14} />
                        </button>
                      </PermissionGuard>
                      <PermissionGuard allowed={!!perms?.canDelete}>
                        <button
                          onClick={() => handleDelete(order.id)}
                          className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-red-50 dark:hover:bg-red-900/20 text-slate-400 hover:text-red-600 transition-colors"
                        >
                          <Trash2 size={14} />
                        </button>
                      </PermissionGuard>
                    </div>
                  </td>
                </tr>
              );
            })}
          </Table>
        )}
      </div>

      {/* Detail modal */}
      <Modal isOpen={showDetail} onClose={() => setShowDetail(false)} title={`Commande ${selected?.id}`} size="lg">
        {selected && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: 'Client', value: selected.customer?.name || selected.customerId },
                { label: 'Pays', value: selected.customer?.country || '—' },
                { label: 'Montant total', value: formatCurrency(selected.totalAmount) },
                { label: 'Responsable commercial', value: selected.salesManager },
                { label: 'Date commande', value: formatDate(selected.orderDate) },
                { label: 'Livraison prévue', value: formatDate(selected.expectedDeliveryDate) },
              ].map((f) => (
                <div key={f.label}>
                  <p className="text-xs text-slate-500 mb-0.5">{f.label}</p>
                  <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{f.value}</p>
                </div>
              ))}
            </div>
            <div className="flex gap-2 pt-2">
              <Badge className={getOrderStatusColor(selected.status)}>{selected.status}</Badge>
              <Badge className={getPriorityColor(selected.priority)}>{selected.priority}</Badge>
            </div>
            {selected.orderLines && selected.orderLines.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wide mb-2">Lignes de commande</p>
                <div className="space-y-2">
                  {selected.orderLines.map((line) => (
                    <div key={line.id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700 rounded-lg text-xs">
                      <span className="text-slate-700 dark:text-slate-300">{line.product?.description || line.productId}</span>
                      <span className="font-medium">×{line.quantity}</span>
                      <span className="font-semibold text-brand-600">{formatCurrency(line.lineAmount)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Edit status modal */}
      <Modal isOpen={showEdit} onClose={() => setShowEdit(false)} title="Modifier la commande" size="sm">
        {selected && (
          <EditOrderForm
            order={selected}
            onSuccess={() => { setShowEdit(false); load(); }}
          />
        )}
      </Modal>

      {/* Create modal */}
      <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title="Nouvelle commande" size="md">
        <CreateOrderForm onSuccess={() => { setShowCreate(false); load(); }} />
      </Modal>
    </div>
  );
}

// ── Edit form ────────────────────────────────
function EditOrderForm({ order, onSuccess }: { order: Order; onSuccess: () => void }) {
  const [status, setStatus] = useState(order.status);
  const [priority, setPriority] = useState(order.priority);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await ordersAPI.update(order.id, { status, priority });
      onSuccess();
    } catch (e: any) {
      alert(e.response?.data?.message || 'Erreur');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="label">Statut</label>
        <select value={status} onChange={(e) => setStatus(e.target.value)} className="input">
          {['En production', 'Planifiée', 'Terminée', 'Annulée', 'Livrée'].map(s => <option key={s}>{s}</option>)}
        </select>
      </div>
      <div>
        <label className="label">Priorité</label>
        <select value={priority} onChange={(e) => setPriority(e.target.value)} className="input">
          {['Normale', 'Standard', 'Haute', 'Urgente', 'Basse'].map(p => <option key={p}>{p}</option>)}
        </select>
      </div>
      <div className="flex gap-3 pt-2">
        <button type="submit" disabled={loading} className="btn-primary flex-1 justify-center">
          {loading ? 'Enregistrement...' : 'Enregistrer'}
        </button>
      </div>
    </form>
  );
}

// ── Create form ──────────────────────────────
function CreateOrderForm({ onSuccess }: { onSuccess: () => void }) {
  const [form, setForm] = useState({
    id: `CMD-2026-${Date.now().toString().slice(-3)}`,
    customerId: '',
    orderDate: new Date().toISOString().split('T')[0],
    expectedDeliveryDate: '',
    status: 'Planifiée',
    totalAmount: '',
    priority: 'Normale',
    salesManager: '',
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await ordersAPI.create({ ...form, totalAmount: parseFloat(form.totalAmount) });
      onSuccess();
    } catch (e: any) {
      alert(e.response?.data?.message || 'Erreur de création');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">Référence</label>
          <input value={form.id} onChange={e => setForm({...form, id: e.target.value})} className="input" required />
        </div>
        <div>
          <label className="label">Client (ID)</label>
          <input value={form.customerId} onChange={e => setForm({...form, customerId: e.target.value})} placeholder="CLI001" className="input" required />
        </div>
        <div>
          <label className="label">Date commande</label>
          <input type="date" value={form.orderDate} onChange={e => setForm({...form, orderDate: e.target.value})} className="input" required />
        </div>
        <div>
          <label className="label">Livraison prévue</label>
          <input type="date" value={form.expectedDeliveryDate} onChange={e => setForm({...form, expectedDeliveryDate: e.target.value})} className="input" required />
        </div>
        <div>
          <label className="label">Montant (€)</label>
          <input type="number" value={form.totalAmount} onChange={e => setForm({...form, totalAmount: e.target.value})} placeholder="50000" className="input" required />
        </div>
        <div>
          <label className="label">Responsable commercial</label>
          <input value={form.salesManager} onChange={e => setForm({...form, salesManager: e.target.value})} className="input" required />
        </div>
        <div>
          <label className="label">Priorité</label>
          <select value={form.priority} onChange={e => setForm({...form, priority: e.target.value})} className="input">
            {['Normale', 'Standard', 'Haute', 'Urgente', 'Basse'].map(p => <option key={p}>{p}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Statut</label>
          <select value={form.status} onChange={e => setForm({...form, status: e.target.value})} className="input">
            {['Planifiée', 'En production'].map(s => <option key={s}>{s}</option>)}
          </select>
        </div>
      </div>
      <button type="submit" disabled={loading} className="btn-primary w-full justify-center mt-2">
        {loading ? 'Création...' : 'Créer la commande'}
      </button>
    </form>
  );
}
