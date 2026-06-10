import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Truck, Package2, CheckCircle2, XCircle, Clock, Search, ChevronDown } from 'lucide-react';
import { shipmentsAPI, ordersAPI } from '../../services/api';
import { Modal, Badge, PageLoader, ErrorState, EmptyState, StatCard, PermissionGuard } from '../../components/ui';
import { useAuthStore } from '../../store/authStore';
import { formatDate } from '../../utils';

const STATUTS = ['À envoyer', 'Planifiée', 'En transit', 'En cours', 'Envoyé', 'Reçu', 'Livrée', 'Annulée'] as const;
type Statut = typeof STATUTS[number];

const STATUS_STYLE: Record<Statut, string> = {
  'À envoyer': 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300',
  'Planifiée':  'bg-blue-50  text-blue-700  dark:bg-blue-900/30 dark:text-blue-300',
  'En transit': 'bg-blue-100 text-blue-800  dark:bg-blue-900/40 dark:text-blue-200',
  'En cours':   'bg-blue-200 text-blue-900  dark:bg-blue-800/50 dark:text-blue-100',
  'Envoyé':     'bg-blue-300 text-blue-900  dark:bg-blue-700/50 dark:text-blue-100',
  'Reçu':       'bg-blue-400 text-white      dark:bg-blue-600/60',
  'Livrée':     'bg-blue-600 text-white      dark:bg-blue-600',
  'Annulée':    'bg-red-50   text-red-600    dark:bg-red-900/30  dark:text-red-400',
};

function statusIcon(s: string) {
  if (s === 'Livrée' || s === 'Reçu') return <CheckCircle2 size={11} />;
  if (s === 'Annulée') return <XCircle size={11} />;
  return <Clock size={11} />;
}

export default function ShipmentsPage() {
  const { permissions } = useAuthStore();
  const canWrite = permissions?.shipments?.canCreate;
  const queryClient = useQueryClient();

  const [search, setSearch]           = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showCreate, setShowCreate]   = useState(false);
  const [form, setForm] = useState({
    id: `EXP-${new Date().getFullYear()}-${String(Date.now()).slice(-3)}`,
    orderId: '',
    status: 'À envoyer' as Statut,
    destination: '',
    carrier: '',
    trackingNumber: '',
    scheduledDate: new Date().toISOString().slice(0, 16),
    notes: '',
  });

  const { data: shipData, isLoading, error } = useQuery({
    queryKey: ['shipments'],
    queryFn: () => shipmentsAPI.getAll(),
  });

  const { data: ordersData } = useQuery({
    queryKey: ['orders'],
    queryFn: () => ordersAPI.getAll(),
  });

  const createMutation = useMutation({
    mutationFn: (d: any) => shipmentsAPI.create(d),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shipments'] });
      setShowCreate(false);
      resetForm();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => shipmentsAPI.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['shipments'] }),
  });

  const resetForm = () => setForm({
    id: `EXP-${new Date().getFullYear()}-${String(Date.now()).slice(-3)}`,
    orderId: '', status: 'À envoyer', destination: '',
    carrier: '', trackingNumber: '',
    scheduledDate: new Date().toISOString().slice(0, 16),
    notes: '',
  });

  const shipments: any[] = shipData?.data?.data || [];
  const orders: any[]    = ordersData?.data?.data || [];

  const filtered = shipments.filter(s => {
    const q = search.toLowerCase();
    const matchSearch = !q || s.id.toLowerCase().includes(q) || s.orderId?.toLowerCase().includes(q) || s.destination?.toLowerCase().includes(q);
    const matchStatus = !statusFilter || s.status === statusFilter;
    return matchSearch && matchStatus;
  });

  // Stats
  const stats = {
    total:     shipments.length,
    aEnvoyer:  shipments.filter(s => s.status === 'À envoyer' || s.status === 'Planifiée').length,
    enCours:   shipments.filter(s => ['En cours', 'En transit', 'Envoyé'].includes(s.status)).length,
    livrees:   shipments.filter(s => s.status === 'Livrée' || s.status === 'Reçu').length,
  };

  if (isLoading) return <PageLoader />;
  if (error)     return <ErrorState message="Impossible de charger les expéditions" onRetry={() => queryClient.invalidateQueries({ queryKey: ['shipments'] })} />;

  return (
    <div className="space-y-4 page-enter">

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total expéditions" value={stats.total}    icon={<Truck size={15} />}        color="blue" />
        <StatCard title="À envoyer"         value={stats.aEnvoyer} icon={<Clock size={15} />}        color="orange" />
        <StatCard title="En transit"        value={stats.enCours}  icon={<Package2 size={15} />}     color="cyan" />
        <StatCard title="Livrées / Reçues"  value={stats.livrees}  icon={<CheckCircle2 size={15} />} color="green" />
      </div>

      {/* Table */}
      <div className="card">
        {/* Barre filtres */}
        <div className="flex flex-wrap items-center gap-3 px-4 py-3 border-b border-slate-200 dark:border-slate-700">
          <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-100 flex-1">
            Expéditions <span className="text-slate-400 font-normal ml-1 font-mono">({filtered.length})</span>
          </h2>

          {/* Recherche */}
          <div className="relative">
            <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Rechercher..."
              className="h-8 pl-8 pr-3 text-xs border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-brand-500 w-44"
            />
          </div>

          {/* Filtre statut */}
          <div className="relative">
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="appearance-none h-8 pl-2.5 pr-7 text-xs border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-brand-500 cursor-pointer"
            >
              <option value="">Tous statuts</option>
              {STATUTS.map(s => <option key={s}>{s}</option>)}
            </select>
            <ChevronDown size={10} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          </div>

          <PermissionGuard allowed={!!canWrite}>
            <button onClick={() => setShowCreate(true)} className="btn-primary h-8 text-xs px-3">
              <Plus size={13} /> Nouvelle expédition
            </button>
          </PermissionGuard>
        </div>

        {/* Table */}
        {filtered.length === 0 ? (
          <EmptyState icon={<Truck size={22} />} title="Aucune expédition" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/50">
                  {['Référence', 'Commande', 'Client', 'Destination', 'Transporteur', 'Date prévue', 'Statut', 'Action'].map(h => (
                    <th key={h} className="text-left py-2 px-3 text-[11px] font-semibold text-slate-400 uppercase tracking-[0.07em] whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((s, idx) => (
                  <tr
                    key={s.id}
                    className={`border-b border-slate-100 dark:border-slate-700/50 hover:bg-blue-50/40 dark:hover:bg-slate-700/40 transition-colors ${idx % 2 === 1 ? 'bg-slate-50/40 dark:bg-slate-800/20' : ''}`}
                  >
                    <td className="py-2 px-3 font-mono text-[12px] text-brand-600 font-semibold whitespace-nowrap">{s.id}</td>
                    <td className="py-2 px-3 font-mono text-[12px] text-slate-600 dark:text-slate-300">{s.orderId}</td>
                    <td className="py-2 px-3 text-[12px] text-slate-500 max-w-[140px] truncate">{s.order?.customer?.name || '—'}</td>
                    <td className="py-2 px-3 text-[12px] text-slate-700 dark:text-slate-300 max-w-[160px] truncate">{s.destination}</td>
                    <td className="py-2 px-3 text-[12px] text-slate-500">{s.carrier || '—'}</td>
                    <td className="py-2 px-3 text-[12px] text-slate-500 whitespace-nowrap">{formatDate(s.scheduledDate)}</td>
                    <td className="py-2 px-3">
                      <Badge className={`${STATUS_STYLE[s.status as Statut] || STATUS_STYLE['Planifiée']} flex items-center gap-1 w-fit`}>
                        {statusIcon(s.status)}
                        {s.status}
                      </Badge>
                    </td>
                    {/* Changement statut inline */}
                    <td className="py-2 px-3">
                      <div className="relative">
                        <select
                          value={s.status}
                          onChange={e => updateMutation.mutate({ id: s.id, data: { status: e.target.value } })}
                          className="appearance-none h-7 pl-2 pr-6 text-[11px] border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-brand-500 cursor-pointer"
                        >
                          {STATUTS.map(st => <option key={st}>{st}</option>)}
                        </select>
                        <ChevronDown size={9} className="absolute right-1.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal création */}
      <Modal isOpen={showCreate} onClose={() => { setShowCreate(false); resetForm(); }} title="Nouvelle expédition" size="md">
        <form
          onSubmit={e => { e.preventDefault(); createMutation.mutate(form); }}
          className="space-y-3"
        >
          <div className="grid grid-cols-2 gap-3">

            {/* ID */}
            <div>
              <label className="label">Référence expédition</label>
              <input value={form.id} onChange={e => setForm({ ...form, id: e.target.value })} className="input" required placeholder="EXP-2026-001" />
            </div>

            {/* Commande — dropdown des commandes existantes */}
            <div>
              <label className="label">Commande associée</label>
              <div className="relative">
                <select
                  value={form.orderId}
                  onChange={e => {
                    const order = orders.find((o: any) => o.id === e.target.value);
                    setForm({
                      ...form,
                      orderId: e.target.value,
                      destination: order?.customer?.country ? `${order.customer.name}, ${order.customer.country}` : form.destination,
                    });
                  }}
                  className="input appearance-none pr-7 cursor-pointer"
                  required
                >
                  <option value="">— Choisir une commande —</option>
                  {orders.map((o: any) => (
                    <option key={o.id} value={o.id}>
                      {o.id} · {o.customer?.name || ''}
                    </option>
                  ))}
                </select>
                <ChevronDown size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              </div>
            </div>

            {/* Statut initial */}
            <div>
              <label className="label">Statut initial</label>
              <div className="relative">
                <select
                  value={form.status}
                  onChange={e => setForm({ ...form, status: e.target.value as Statut })}
                  className="input appearance-none pr-7 cursor-pointer"
                >
                  {STATUTS.map(s => <option key={s}>{s}</option>)}
                </select>
                <ChevronDown size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              </div>
            </div>

            {/* Date prévue */}
            <div>
              <label className="label">Date d'envoi prévue</label>
              <input
                type="datetime-local"
                value={form.scheduledDate}
                onChange={e => setForm({ ...form, scheduledDate: e.target.value })}
                className="input"
                required
              />
            </div>

            {/* Destination */}
            <div>
              <label className="label">Destination</label>
              <input value={form.destination} onChange={e => setForm({ ...form, destination: e.target.value })} className="input" required placeholder="Frankfurt, Allemagne" />
            </div>

            {/* Transporteur */}
            <div>
              <label className="label">Transporteur</label>
              <input value={form.carrier} onChange={e => setForm({ ...form, carrier: e.target.value })} className="input" placeholder="DHL, FedEx, Geodis…" />
            </div>

            {/* Tracking */}
            <div className="col-span-2">
              <label className="label">Numéro de suivi</label>
              <input value={form.trackingNumber} onChange={e => setForm({ ...form, trackingNumber: e.target.value })} className="input" placeholder="1Z999AA10123456784" />
            </div>

            {/* Notes */}
            <div className="col-span-2">
              <label className="label">Notes</label>
              <textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} className="input" rows={2} placeholder="Fragile, température contrôlée…" />
            </div>
          </div>

          {createMutation.isError && (
            <p className="text-xs text-red-500">{(createMutation.error as any)?.response?.data?.message || 'Erreur lors de la création'}</p>
          )}

          <div className="flex justify-end gap-2 pt-1">
            <button type="button" onClick={() => { setShowCreate(false); resetForm(); }} className="btn-secondary text-xs h-8 px-3">
              Annuler
            </button>
            <button type="submit" disabled={createMutation.isPending} className="btn-primary text-xs h-8 px-4">
              {createMutation.isPending ? 'Création…' : 'Créer l\'expédition'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
