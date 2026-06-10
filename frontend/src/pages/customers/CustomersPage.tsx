import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Eye, Pencil, Users2, TrendingUp, Globe, Clock, ToggleLeft, ToggleRight } from 'lucide-react';
import { customersAPI } from '../../services/api';
import type { Customer } from '../../types';
import { useAuthStore } from '../../store/authStore';
import {
  Badge, StatCard, SearchInput, Table, PageLoader,
  ErrorState, EmptyState, Modal, PermissionGuard
} from '../../components/ui';
import { formatCurrency, formatDate } from '../../utils';

// ─── Page principale ─────────────────────────────────────────────────────────

export function CustomersPage() {
  const { permissions } = useAuthStore();
  const perms = permissions?.customers;
  const navigate = useNavigate();

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState('');
  const [search, setSearch]       = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [selected, setSelected]   = useState<Customer | null>(null);
  const [showDetail, setShowDetail] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [showEdit, setShowEdit]   = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await customersAPI.getAll();
      setCustomers(res.data.data || []);
    } catch (e: any) {
      setError(e.response?.data?.message || 'Erreur');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const filtered = customers.filter(c => {
    const matchSearch = !search ||
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.country.toLowerCase().includes(search.toLowerCase()) ||
      c.id.toLowerCase().includes(search.toLowerCase());
    const matchType = !typeFilter || c.type === typeFilter;
    return matchSearch && matchType;
  });

  const totalCA = customers.reduce((s, c) => s + c.annualRevenue, 0);
  const types   = [...new Set(customers.map(c => c.type))];

  const handleToggleStatus = async (c: Customer) => {
    const newStatus = c.status === 'Actif' ? 'Inactif' : 'Actif';
    try {
      await customersAPI.update(c.id, { status: newStatus });
      await load();
    } catch (e: any) {
      alert(e.response?.data?.message || 'Erreur');
    }
  };

  if (loading) return <PageLoader />;
  if (error)   return <ErrorState message={error} onRetry={load} />;

  return (
    <div className="space-y-6 page-enter">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total clients"   value={customers.length}                                         icon={<Users2 size={18} />}     color="blue" />
        <StatCard title="Clients actifs"  value={customers.filter(c => c.status === 'Actif').length}       icon={<Users2 size={18} />}     color="green" />
        <StatCard title="CA annuel total" value={formatCurrency(totalCA)}                                   icon={<TrendingUp size={18} />} color="purple" />
        <StatCard title="Pays"            value={new Set(customers.map(c => c.country)).size}               icon={<Globe size={18} />}      color="cyan" />
      </div>

      <div className="card">
        <div className="flex flex-wrap items-center gap-3 p-5 border-b border-slate-200 dark:border-slate-700">
          <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100 flex-1">
            Clients <span className="text-slate-400 font-normal ml-1">({filtered.length})</span>
          </h2>
          <SearchInput value={search} onChange={setSearch} placeholder="Nom, pays, référence..." className="w-56" />
          <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} className="input h-9 text-xs w-36">
            <option value="">Tous types</option>
            {types.map(t => <option key={t}>{t}</option>)}
          </select>
          <PermissionGuard allowed={!!perms?.canCreate}>
            <button onClick={() => setShowCreate(true)} className="btn-primary">
              <Plus size={15} /> Nouveau client
            </button>
          </PermissionGuard>
        </div>

        {filtered.length === 0 ? (
          <EmptyState icon={<Users2 size={24} />} title="Aucun client" />
        ) : (
          <Table headers={['ID client', 'Nom', 'Pays', 'Type', 'CA annuel', 'Premier contrat', 'Statut', 'Actions']}>
            {filtered.map((c) => (
              <tr key={c.id} className="table-row-hover">
                <td className="py-2 px-3 font-mono text-xs text-brand-600 font-semibold">{c.id}</td>
                <td className="py-2 px-3 text-sm font-medium text-slate-900 dark:text-slate-100">{c.name}</td>
                <td className="py-2 px-3 text-xs text-slate-500">{c.country}</td>
                <td className="py-2 px-3">
                  <Badge className={c.type === 'Grand Compte' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300' : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400'}>
                    {c.type}
                  </Badge>
                </td>
                <td className="py-2 px-3 text-sm font-semibold text-slate-900 dark:text-slate-100">{formatCurrency(c.annualRevenue)}</td>
                <td className="py-2 px-3 text-xs text-slate-500">{formatDate(c.firstContractDate)}</td>
                <td className="py-2 px-3">
                  <Badge className={c.status === 'Actif' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' : 'bg-slate-100 text-slate-600'} dot>
                    {c.status}
                  </Badge>
                </td>
                <td className="py-2 px-3">
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => { setSelected(c); setShowDetail(true); }}
                      className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-brand-50 text-slate-400 hover:text-brand-600 transition-colors"
                      title="Détails"
                    >
                      <Eye size={14} />
                    </button>
                    <button
                      onClick={() => navigate(`/audit?tab=client&id=${c.id}`)}
                      className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-purple-50 text-slate-400 hover:text-purple-600 transition-colors"
                      title="Voir l'historique"
                    >
                      <Clock size={14} />
                    </button>
                    <PermissionGuard allowed={!!perms?.canUpdate}>
                      <button onClick={() => { setSelected(c); setShowEdit(true); }} className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-amber-50 text-slate-400 hover:text-amber-600 transition-colors">
                        <Pencil size={14} />
                      </button>
                    </PermissionGuard>
                    <PermissionGuard allowed={!!perms?.canUpdate}>
                      <button
                        onClick={() => handleToggleStatus(c)}
                        className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${
                          c.status === 'Actif'
                            ? 'hover:bg-red-50 text-green-500 hover:text-red-500'
                            : 'hover:bg-green-50 text-slate-400 hover:text-green-600'
                        }`}
                        title={c.status === 'Actif' ? 'Désactiver le client' : 'Activer le client'}
                      >
                        {c.status === 'Actif' ? <ToggleRight size={16} /> : <ToggleLeft size={16} />}
                      </button>
                    </PermissionGuard>
                  </div>
                </td>
              </tr>
            ))}
          </Table>
        )}
      </div>

      {/* Modal détail */}
      <Modal isOpen={showDetail} onClose={() => setShowDetail(false)} title={selected?.name || ''} size="md">
        {selected && (
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'ID client',       value: selected.id },
              { label: 'Pays',            value: selected.country },
              { label: 'Type',            value: selected.type },
              { label: 'Statut',          value: selected.status },
              { label: 'CA annuel',       value: formatCurrency(selected.annualRevenue) },
              { label: 'Premier contrat', value: formatDate(selected.firstContractDate) },
            ].map(f => (
              <div key={f.label}>
                <p className="text-xs text-slate-500">{f.label}</p>
                <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{f.value}</p>
              </div>
            ))}
          </div>
        )}
      </Modal>

      {/* Modal création */}
      <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title="Nouveau client" size="md">
        <CustomerForm onSuccess={() => { setShowCreate(false); load(); }} />
      </Modal>

      {/* Modal édition */}
      <Modal isOpen={showEdit} onClose={() => setShowEdit(false)} title="Modifier le client" size="md">
        {selected && <CustomerForm customer={selected} onSuccess={() => { setShowEdit(false); load(); }} />}
      </Modal>
    </div>
  );
}

// ─── Formulaire client ───────────────────────────────────────────────────────

function CustomerForm({ customer, onSuccess }: { customer?: Customer; onSuccess: () => void }) {
  const isEdit = !!customer;
  const [form, setForm] = useState({
    id:                customer?.id || `CLI${String(Date.now()).slice(-3)}`,
    name:              customer?.name || '',
    country:           customer?.country || '',
    type:              customer?.type || 'Moyen',
    annualRevenue:     customer?.annualRevenue?.toString() || '',
    firstContractDate: customer?.firstContractDate?.split('T')[0] || new Date().toISOString().split('T')[0],
    status:            customer?.status || 'Actif',
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = { ...form, annualRevenue: parseFloat(form.annualRevenue) };
      if (isEdit) {
        await customersAPI.update(customer!.id, data);
      } else {
        await customersAPI.create(data);
      }
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
        {!isEdit && (
          <div>
            <label className="label">ID client</label>
            <input value={form.id} onChange={e => setForm({...form, id: e.target.value})} className="input" required />
          </div>
        )}
        <div className={!isEdit ? '' : 'col-span-2'}>
          <label className="label">Nom</label>
          <input value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="input" required />
        </div>
        <div>
          <label className="label">Pays</label>
          <input value={form.country} onChange={e => setForm({...form, country: e.target.value})} className="input" required />
        </div>
        <div>
          <label className="label">Type</label>
          <select value={form.type} onChange={e => setForm({...form, type: e.target.value})} className="input">
            {['Grand Compte', 'Moyen', 'PME'].map(t => <option key={t}>{t}</option>)}
          </select>
        </div>
        <div>
          <label className="label">CA annuel (€)</label>
          <input type="number" value={form.annualRevenue} onChange={e => setForm({...form, annualRevenue: e.target.value})} className="input" required />
        </div>
        <div>
          <label className="label">Statut</label>
          <select value={form.status} onChange={e => setForm({...form, status: e.target.value})} className="input">
            {['Actif', 'Inactif', 'Prospect'].map(s => <option key={s}>{s}</option>)}
          </select>
        </div>
      </div>
      <button type="submit" disabled={loading} className="btn-primary w-full justify-center mt-2">
        {loading ? 'Enregistrement...' : isEdit ? 'Mettre à jour' : 'Créer le client'}
      </button>
    </form>
  );
}
