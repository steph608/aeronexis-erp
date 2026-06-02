import React, { useEffect, useState } from 'react';
import { Plus, AlertTriangle, CheckCircle2, Clock, Pencil } from 'lucide-react';
import { incidentsAPI } from '../../services/api';
import type { QualityIncident } from '../../types';
import { useAuthStore } from '../../store/authStore';
import {
  Badge, StatCard, SearchInput, Table, PageLoader,
  ErrorState, EmptyState, Modal, PermissionGuard
} from '../../components/ui';
import { formatDate, getIncidentSeverityColor, getIncidentStatusColor } from '../../utils';

export function IncidentsPage() {
  const { permissions } = useAuthStore();
  const perms = permissions?.incidents;
  const [incidents, setIncidents] = useState<QualityIncident[]>([]);
  const [_stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [severityFilter, setSeverityFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selected, setSelected] = useState<QualityIncident | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [showEdit, setShowEdit] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const [incRes, statsRes] = await Promise.all([
        incidentsAPI.getAll(),
        incidentsAPI.getStats(),
      ]);
      setIncidents(incRes.data.data || []);
      setStats(statsRes.data.data);
    } catch (e: any) {
      setError(e.response?.data?.message || 'Erreur');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const filtered = incidents.filter(i => {
    const matchSearch = !search ||
      i.id.toLowerCase().includes(search.toLowerCase()) ||
      i.batchNumber.toLowerCase().includes(search.toLowerCase()) ||
      i.anomalyType.toLowerCase().includes(search.toLowerCase());
    const matchSeverity = !severityFilter || i.severity === severityFilter;
    const matchStatus = !statusFilter || i.status === statusFilter;
    return matchSearch && matchSeverity && matchStatus;
  });

  if (loading) return <PageLoader />;
  if (error) return <ErrorState message={error} onRetry={load} />;

  const critiques = incidents.filter(i => i.severity === 'Critique' && i.status === 'En cours');

  return (
    <div className="space-y-6 page-enter">
      {critiques.length > 0 && (
        <div className="p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 flex items-center gap-3">
          <AlertTriangle size={18} className="text-red-500 flex-shrink-0" />
          <p className="text-sm font-semibold text-red-700 dark:text-red-300">
            {critiques.length} incident(s) CRITIQUE(S) en cours — Action immédiate requise
          </p>
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total incidents" value={incidents.length} icon={<AlertTriangle size={18} />} color="orange" />
        <StatCard title="En cours" value={incidents.filter(i => i.status === 'En cours').length} icon={<Clock size={18} />} color={critiques.length > 0 ? 'red' : 'orange'} />
        <StatCard title="Critiques" value={critiques.length} icon={<AlertTriangle size={18} />} color={critiques.length > 0 ? 'red' : 'green'} />
        <StatCard title="Résolus" value={incidents.filter(i => i.status === 'Résolu').length} icon={<CheckCircle2 size={18} />} color="green" />
      </div>

      <div className="card">
        <div className="flex flex-wrap items-center gap-3 p-5 border-b border-slate-200 dark:border-slate-700">
          <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100 flex-1">
            Incidents qualité <span className="text-slate-400 font-normal ml-1">({filtered.length})</span>
          </h2>
          <SearchInput value={search} onChange={setSearch} placeholder="ID, lot, anomalie..." className="w-52" />
          <select value={severityFilter} onChange={e => setSeverityFilter(e.target.value)} className="input h-9 text-xs w-32">
            <option value="">Sévérité</option>
            {['Critique', 'Majeur', 'Mineur', 'Observation'].map(s => <option key={s}>{s}</option>)}
          </select>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="input h-9 text-xs w-28">
            <option value="">Statut</option>
            {['En cours', 'Résolu', 'Clos'].map(s => <option key={s}>{s}</option>)}
          </select>
          <PermissionGuard allowed={!!perms?.canCreate}>
            <button onClick={() => setShowCreate(true)} className="btn-primary">
              <Plus size={15} /> Signaler
            </button>
          </PermissionGuard>
        </div>

        {filtered.length === 0 ? (
          <EmptyState
            icon={<CheckCircle2 size={24} />}
            title="Aucun incident"
            description="Aucun incident qualité enregistré"
          />
        ) : (
          <Table headers={['ID', 'Date détection', 'Lot', 'Anomalie', 'Sévérité', 'Statut', 'Action corrective', 'Responsable', 'Actions']}>
            {filtered.map((inc) => (
              <tr key={inc.id} className="table-row-hover">
                <td className="py-3 px-4 font-mono text-xs text-brand-600 font-semibold">{inc.id}</td>
                <td className="py-3 px-4 text-xs text-slate-500">{formatDate(inc.detectionDate)}</td>
                <td className="py-3 px-4 font-mono text-xs text-slate-600 dark:text-slate-400">{inc.batchNumber}</td>
                <td className="py-3 px-4 text-xs text-slate-900 dark:text-slate-100 max-w-[160px] truncate">{inc.anomalyType}</td>
                <td className="py-3 px-4"><Badge className={getIncidentSeverityColor(inc.severity)} dot>{inc.severity}</Badge></td>
                <td className="py-3 px-4"><Badge className={getIncidentStatusColor(inc.status)}>{inc.status}</Badge></td>
                <td className="py-3 px-4 text-xs text-slate-500 max-w-[180px] truncate">{inc.correctiveAction}</td>
                <td className="py-3 px-4 text-xs text-slate-500">
                  {inc.responsible ? `${inc.responsible.firstName} ${inc.responsible.lastName}` : '—'}
                </td>
                <td className="py-3 px-4">
                  <PermissionGuard allowed={!!perms?.canUpdate}>
                    <button
                      onClick={() => { setSelected(inc); setShowEdit(true); }}
                      className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-amber-50 text-slate-400 hover:text-amber-600 transition-colors"
                    ><Pencil size={14} /></button>
                  </PermissionGuard>
                </td>
              </tr>
            ))}
          </Table>
        )}
      </div>

      <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title="Signaler un incident" size="md">
        <CreateIncidentForm onSuccess={() => { setShowCreate(false); load(); }} />
      </Modal>

      <Modal isOpen={showEdit} onClose={() => setShowEdit(false)} title="Modifier l'incident" size="md">
        {selected && (
          <EditIncidentForm incident={selected} onSuccess={() => { setShowEdit(false); load(); }} />
        )}
      </Modal>
    </div>
  );
}

function CreateIncidentForm({ onSuccess }: { onSuccess: () => void }) {
  const { user } = useAuthStore();
  const [form, setForm] = useState({
    id: `INC-${Date.now().toString().slice(-6)}`,
    detectionDate: new Date().toISOString().split('T')[0],
    batchNumber: '',
    anomalyType: '',
    severity: 'Mineur',
    status: 'En cours',
    correctiveAction: '',
    responsibleId: user?.id?.toString() || '',
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await incidentsAPI.create({
        ...form,
        responsibleId: form.responsibleId ? parseInt(form.responsibleId) : null,
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
          <label className="label">Référence</label>
          <input value={form.id} onChange={e => setForm({...form, id: e.target.value})} className="input" required />
        </div>
        <div>
          <label className="label">Date de détection</label>
          <input type="date" value={form.detectionDate} onChange={e => setForm({...form, detectionDate: e.target.value})} className="input" required />
        </div>
        <div>
          <label className="label">N° de lot</label>
          <input value={form.batchNumber} onChange={e => setForm({...form, batchNumber: e.target.value})} placeholder="LOT-AX-2401-001" className="input" required />
        </div>
        <div>
          <label className="label">Type d'anomalie</label>
          <input value={form.anomalyType} onChange={e => setForm({...form, anomalyType: e.target.value})} placeholder="Défaut dimensionnel" className="input" required />
        </div>
        <div>
          <label className="label">Sévérité</label>
          <select value={form.severity} onChange={e => setForm({...form, severity: e.target.value})} className="input">
            {['Observation', 'Mineur', 'Majeur', 'Critique'].map(s => <option key={s}>{s}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Statut</label>
          <select value={form.status} onChange={e => setForm({...form, status: e.target.value})} className="input">
            {['En cours', 'Résolu', 'Clos'].map(s => <option key={s}>{s}</option>)}
          </select>
        </div>
      </div>
      <div>
        <label className="label">Action corrective</label>
        <textarea
          value={form.correctiveAction}
          onChange={e => setForm({...form, correctiveAction: e.target.value})}
          rows={3}
          className="input resize-none"
          placeholder="Décrire l'action corrective mise en place..."
          required
        />
      </div>
      <button type="submit" disabled={loading} className="btn-primary w-full justify-center">
        {loading ? 'Enregistrement...' : 'Signaler l\'incident'}
      </button>
    </form>
  );
}

function EditIncidentForm({ incident, onSuccess }: { incident: QualityIncident; onSuccess: () => void }) {
  const [status, setStatus] = useState(incident.status);
  const [severity, setSeverity] = useState(incident.severity);
  const [correctiveAction, setCorrectiveAction] = useState(incident.correctiveAction);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await incidentsAPI.update(incident.id, { status, severity, correctiveAction });
      onSuccess();
    } catch (e: any) {
      alert(e.response?.data?.message || 'Erreur');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">Sévérité</label>
          <select value={severity} onChange={e => setSeverity(e.target.value)} className="input">
            {['Observation', 'Mineur', 'Majeur', 'Critique'].map(s => <option key={s}>{s}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Statut</label>
          <select value={status} onChange={e => setStatus(e.target.value)} className="input">
            {['En cours', 'Résolu', 'Clos'].map(s => <option key={s}>{s}</option>)}
          </select>
        </div>
      </div>
      <div>
        <label className="label">Action corrective</label>
        <textarea
          value={correctiveAction}
          onChange={e => setCorrectiveAction(e.target.value)}
          rows={3}
          className="input resize-none"
          required
        />
      </div>
      <button type="submit" disabled={loading} className="btn-primary w-full justify-center">
        {loading ? 'Mise à jour...' : 'Mettre à jour'}
      </button>
    </form>
  );
}
