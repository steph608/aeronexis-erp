import React, { useEffect, useState } from 'react';
import { Plus, Eye, Pencil, Factory, CheckCircle2, Clock, Search } from 'lucide-react';
import { manufacturingAPI, usersAPI } from '../../services/api';
import type { ManufacturingOrder, User } from '../../types';
import { useAuthStore } from '../../store/authStore';
import {
  Badge, StatCard, SearchInput, Table, PageLoader,
  ErrorState, EmptyState, Modal, PermissionGuard
} from '../../components/ui';
import { formatDate, getOFStatusColor, daysUntil } from '../../utils';

export function ManufacturingPage() {
  const { permissions } = useAuthStore();
  const perms = permissions?.manufacturing;
  const [orders, setOrders] = useState<ManufacturingOrder[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [siteFilter, setSiteFilter] = useState('');
  const [selected, setSelected] = useState<ManufacturingOrder | null>(null);
  const [showDetail, setShowDetail] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [showTraceability, setShowTraceability] = useState(false);
  const [traceData, setTraceData] = useState<any>(null);

  const load = async () => {
    setLoading(true);
    try {
      const [ofRes, statsRes, usersRes] = await Promise.all([
        manufacturingAPI.getAll(),
        manufacturingAPI.getStats(),
        usersAPI.getAll(),
      ]);
      setOrders(ofRes.data.data || []);
      setStats(statsRes.data.data);
      setUsers(usersRes.data.data || []);
    } catch (e: any) {
      setError(e.response?.data?.message || 'Erreur de chargement');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const loadTraceability = async (batchNumber: string) => {
    try {
      const res = await manufacturingAPI.getTraceability(batchNumber);
      setTraceData(res.data.data);
      setShowTraceability(true);
    } catch (e: any) {
      alert('Traçabilité indisponible');
    }
  };

  const filtered = orders.filter(o => {
    const matchSearch = !search ||
      o.id.toLowerCase().includes(search.toLowerCase()) ||
      o.batchNumber.toLowerCase().includes(search.toLowerCase()) ||
      o.product?.description?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = !statusFilter || o.status === statusFilter;
    const matchSite = !siteFilter || o.site === siteFilter;
    return matchSearch && matchStatus && matchSite;
  });

  const sites = [...new Set(orders.map(o => o.site))];

  if (loading) return <PageLoader />;
  if (error) return <ErrorState message={error} onRetry={load} />;

  return (
    <div className="space-y-6 page-enter">
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard title="Total OFs" value={stats.total || orders.length} icon={<Factory size={18} />} color="purple" />
          <StatCard title="En cours" value={orders.filter(o => o.status === 'En cours').length} icon={<Clock size={18} />} color="blue" />
          <StatCard title="Planifiés" value={orders.filter(o => o.status === 'Planifié').length} icon={<Clock size={18} />} color="orange" />
          <StatCard title="Terminés" value={orders.filter(o => o.status === 'Terminé').length} icon={<CheckCircle2 size={18} />} color="green" />
        </div>
      )}

      <div className="card">
        <div className="flex flex-wrap items-center gap-3 p-5 border-b border-slate-200 dark:border-slate-700">
          <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100 flex-1">
            Ordres de fabrication <span className="text-slate-400 font-normal ml-1">({filtered.length})</span>
          </h2>
          <SearchInput value={search} onChange={setSearch} placeholder="OF, lot, produit..." className="w-52" />
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="input h-9 text-xs w-36">
            <option value="">Tous statuts</option>
            {['En cours', 'Planifié', 'Terminé', 'Suspendu'].map(s => <option key={s}>{s}</option>)}
          </select>
          <select value={siteFilter} onChange={(e) => setSiteFilter(e.target.value)} className="input h-9 text-xs w-36">
            <option value="">Tous sites</option>
            {sites.map(s => <option key={s}>{s}</option>)}
          </select>
          <PermissionGuard allowed={!!perms?.canCreate}>
            <button onClick={() => setShowCreate(true)} className="btn-primary">
              <Plus size={15} /> Créer OF
            </button>
          </PermissionGuard>
        </div>

        {filtered.length === 0 ? (
          <EmptyState icon={<Factory size={24} />} title="Aucun ordre de fabrication" />
        ) : (
          <Table headers={['OF', 'Produit', 'Lot', 'Quantité', 'Lancement', 'Fin prévue', 'Site', 'Opérateur', 'Statut', 'Actions']}>
            {filtered.map((of) => {
              const days = daysUntil(of.expectedEndDate);
              return (
                <tr key={of.id} className="table-row-hover">
                  <td className="py-3 px-4 font-mono text-xs text-brand-600 font-semibold">{of.id}</td>
                  <td className="py-3 px-4 text-xs text-slate-700 dark:text-slate-300 max-w-[160px] truncate">
                    {of.product?.description || of.productId}
                  </td>
                  <td className="py-3 px-4 font-mono text-xs text-slate-500">{of.batchNumber}</td>
                  <td className="py-3 px-4 text-sm font-semibold text-slate-900 dark:text-slate-100">{of.quantity}</td>
                  <td className="py-3 px-4 text-xs text-slate-500">{formatDate(of.launchDate)}</td>
                  <td className="py-3 px-4">
                    <p className="text-xs text-slate-700 dark:text-slate-300">{formatDate(of.expectedEndDate)}</p>
                    {of.status !== 'Terminé' && (
                      <p className={`text-xs font-medium ${days < 0 ? 'text-red-500' : days <= 3 ? 'text-orange-500' : 'text-slate-400'}`}>
                        {days < 0 ? `⚠ J+${Math.abs(days)}` : `J-${days}`}
                      </p>
                    )}
                  </td>
                  <td className="py-3 px-4 text-xs text-slate-500">{of.site}</td>
                  <td className="py-3 px-4 text-xs text-slate-500">
                    {of.operator ? `${of.operator.firstName} ${of.operator.lastName}` : '—'}
                  </td>
                  <td className="py-3 px-4"><Badge className={getOFStatusColor(of.status)}>{of.status}</Badge></td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => { setSelected(of); setShowDetail(true); }}
                        className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-brand-50 dark:hover:bg-brand-900/20 text-slate-400 hover:text-brand-600 transition-colors"
                        title="Détail"
                      ><Eye size={14} /></button>
                      <button
                        onClick={() => loadTraceability(of.batchNumber)}
                        className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-purple-50 dark:hover:bg-purple-900/20 text-slate-400 hover:text-purple-600 transition-colors"
                        title="Traçabilité"
                      ><Search size={14} /></button>
                      <PermissionGuard allowed={!!perms?.canUpdate}>
                        <button
                          onClick={() => { setSelected(of); setShowEdit(true); }}
                          className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-amber-50 text-slate-400 hover:text-amber-600 transition-colors"
                        ><Pencil size={14} /></button>
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
      <Modal isOpen={showDetail} onClose={() => setShowDetail(false)} title={`OF ${selected?.id}`} size="md">
        {selected && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Produit', value: selected.product?.description || selected.productId },
                { label: 'Numéro de lot', value: selected.batchNumber },
                { label: 'Quantité', value: selected.quantity },
                { label: 'Site', value: selected.site },
                { label: 'Lancement', value: formatDate(selected.launchDate) },
                { label: 'Fin prévue', value: formatDate(selected.expectedEndDate) },
                { label: 'Certification', value: selected.product?.certification || '—' },
                { label: 'Catégorie', value: selected.product?.category || '—' },
              ].map(f => (
                <div key={f.label}>
                  <p className="text-xs text-slate-500">{f.label}</p>
                  <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{f.value}</p>
                </div>
              ))}
            </div>
            <Badge className={getOFStatusColor(selected.status)}>{selected.status}</Badge>
          </div>
        )}
      </Modal>

      {/* Traceability modal */}
      <Modal isOpen={showTraceability} onClose={() => setShowTraceability(false)} title="Traçabilité du lot" size="lg">
        {traceData && (
          <div className="space-y-4 text-sm">
            <div className="p-4 bg-slate-50 dark:bg-slate-700 rounded-xl">
              <p className="font-semibold text-slate-900 dark:text-slate-100 mb-1">Lot: {traceData.batchNumber}</p>
              <p className="text-slate-500 text-xs">OF: {traceData.id} · {traceData.site}</p>
            </div>
            {traceData.qualityIncidents?.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wide mb-2">
                  Incidents qualité ({traceData.qualityIncidents.length})
                </p>
                <div className="space-y-2">
                  {traceData.qualityIncidents.map((inc: any) => (
                    <div key={inc.id} className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-100 dark:border-red-800">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-medium text-red-800 dark:text-red-300">{inc.anomalyType}</span>
                        <Badge className="bg-red-100 text-red-700 text-[10px]">{inc.severity}</Badge>
                      </div>
                      <p className="text-xs text-red-600 dark:text-red-400">{inc.correctiveAction}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {(!traceData.qualityIncidents || traceData.qualityIncidents.length === 0) && (
              <div className="flex items-center gap-2 text-green-600 p-3 bg-green-50 dark:bg-green-900/20 rounded-xl">
                <CheckCircle2 size={16} />
                <span className="text-sm font-medium">Aucun incident qualité sur ce lot</span>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Edit modal */}
      <Modal isOpen={showEdit} onClose={() => setShowEdit(false)} title="Modifier l'OF" size="sm">
        {selected && (
          <EditOFForm of={selected} users={users} onSuccess={() => { setShowEdit(false); load(); }} />
        )}
      </Modal>

      {/* Create modal */}
      <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title="Créer un OF" size="md">
        <CreateOFForm users={users} onSuccess={() => { setShowCreate(false); load(); }} />
      </Modal>
    </div>
  );
}

function EditOFForm({ of, users, onSuccess }: { of: ManufacturingOrder; users: User[]; onSuccess: () => void }) {
  const [status, setStatus] = useState(of.status);
  const [operatorId, setOperatorId] = useState(of.operatorId?.toString() || '');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await manufacturingAPI.update(of.id, {
        status,
        operatorId: operatorId ? parseInt(operatorId) : null,
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
      <div>
        <label className="label">Statut</label>
        <select value={status} onChange={e => setStatus(e.target.value)} className="input">
          {['En cours', 'Planifié', 'Terminé', 'Suspendu'].map(s => <option key={s}>{s}</option>)}
        </select>
      </div>
      <div>
        <label className="label">Opérateur</label>
        <select value={operatorId} onChange={e => setOperatorId(e.target.value)} className="input">
          <option value="">Non assigné</option>
          {users.filter(u => u.role === 'OPERATOR').map(u => (
            <option key={u.id} value={u.id}>{u.firstName} {u.lastName}</option>
          ))}
        </select>
      </div>
      <button type="submit" disabled={loading} className="btn-primary w-full justify-center">
        {loading ? 'Enregistrement...' : 'Enregistrer'}
      </button>
    </form>
  );
}

function CreateOFForm({ users, onSuccess }: { users: User[]; onSuccess: () => void }) {
  const [form, setForm] = useState({
    id: `OF-2026-${Date.now().toString().slice(-4)}`,
    productId: '',
    batchNumber: `LOT-${Date.now().toString().slice(-6)}`,
    quantity: '',
    launchDate: new Date().toISOString().split('T')[0],
    expectedEndDate: '',
    status: 'Planifié',
    site: 'Site Lyon',
    operatorId: '',
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await manufacturingAPI.create({
        ...form,
        quantity: parseInt(form.quantity),
        operatorId: form.operatorId ? parseInt(form.operatorId) : null,
      });
      onSuccess();
    } catch (e: any) {
      alert(e.response?.data?.message || 'Erreur');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">Référence OF</label>
          <input value={form.id} onChange={e => setForm({...form, id: e.target.value})} className="input" required />
        </div>
        <div>
          <label className="label">Produit (ID)</label>
          <input value={form.productId} onChange={e => setForm({...form, productId: e.target.value})} placeholder="PROD-AX-2401" className="input" required />
        </div>
        <div>
          <label className="label">N° de lot</label>
          <input value={form.batchNumber} onChange={e => setForm({...form, batchNumber: e.target.value})} className="input" required />
        </div>
        <div>
          <label className="label">Quantité</label>
          <input type="number" value={form.quantity} onChange={e => setForm({...form, quantity: e.target.value})} className="input" required />
        </div>
        <div>
          <label className="label">Lancement</label>
          <input type="date" value={form.launchDate} onChange={e => setForm({...form, launchDate: e.target.value})} className="input" required />
        </div>
        <div>
          <label className="label">Fin prévue</label>
          <input type="date" value={form.expectedEndDate} onChange={e => setForm({...form, expectedEndDate: e.target.value})} className="input" required />
        </div>
        <div>
          <label className="label">Site</label>
          <select value={form.site} onChange={e => setForm({...form, site: e.target.value})} className="input">
            {['Site Lyon', 'Site Toulouse'].map(s => <option key={s}>{s}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Opérateur</label>
          <select value={form.operatorId} onChange={e => setForm({...form, operatorId: e.target.value})} className="input">
            <option value="">Non assigné</option>
            {users.filter(u => u.role === 'OPERATOR').map(u => (
              <option key={u.id} value={u.id}>{u.firstName} {u.lastName}</option>
            ))}
          </select>
        </div>
      </div>
      <button type="submit" disabled={loading} className="btn-primary w-full justify-center mt-2">
        {loading ? 'Création...' : 'Créer l\'OF'}
      </button>
    </form>
  );
}
