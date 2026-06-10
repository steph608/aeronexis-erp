import React, { useEffect, useState } from 'react';
import { Plus, AlertTriangle, CheckCircle2, Clock, Pencil, Eye, MessageSquare, Send } from 'lucide-react';
import { incidentsAPI, ordersAPI, manufacturingAPI } from '../../services/api';
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
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState('');
  const [search, setSearch]       = useState('');
  const [severityFilter, setSeverityFilter] = useState('');
  const [statusFilter, setStatusFilter]     = useState('');
  const [selected, setSelected]   = useState<QualityIncident | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [showEdit, setShowEdit]     = useState(false);
  const [showDetail, setShowDetail] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await incidentsAPI.getAll();
      setIncidents(res.data.data || []);
    } catch (e: any) {
      setError(e.response?.data?.message || 'Erreur');
    } finally {
      setLoading(false);
    }
  };

  // Rechargement silencieux — ne déclenche pas le spinner, met à jour la liste en arrière-plan
  const silentReload = async () => {
    try {
      const res = await incidentsAPI.getAll();
      setIncidents(res.data.data || []);
    } catch {}
  };

  useEffect(() => { load(); }, []);

  const filtered = incidents.filter(i => {
    const matchSearch = !search ||
      i.id.toLowerCase().includes(search.toLowerCase()) ||
      i.batchNumber.toLowerCase().includes(search.toLowerCase()) ||
      i.anomalyType.toLowerCase().includes(search.toLowerCase());
    const matchSeverity = !severityFilter || i.severity === severityFilter;
    const matchStatus   = !statusFilter   || i.status   === statusFilter;
    return matchSearch && matchSeverity && matchStatus;
  });

  if (loading) return <PageLoader />;
  if (error)   return <ErrorState message={error} onRetry={load} />;

  // La bannière se base toujours sur TOUS les incidents (pas affectée par les filtres)
  const critiques = incidents.filter(i => i.severity === 'Critique' && i.status === 'En cours');

  // Les stat cards reflètent la liste filtrée pour rester cohérentes avec le tableau
  const filteredEnCours   = filtered.filter(i => i.status === 'En cours').length;
  const filteredCritiques = filtered.filter(i => i.severity === 'Critique').length; // tous statuts confondus
  const filteredResolus   = filtered.filter(i => i.status === 'Résolu').length;

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
        <StatCard title="Total incidents" value={filtered.length} icon={<AlertTriangle size={18} />} color="orange" />
        <StatCard title="En cours" value={filteredEnCours} icon={<Clock size={18} />} color={filteredCritiques > 0 ? 'red' : 'orange'} />
        <StatCard title="Critiques" value={filteredCritiques} icon={<AlertTriangle size={18} />} color={filteredCritiques > 0 ? 'red' : 'green'} />
        <StatCard title="Résolus" value={filteredResolus} icon={<CheckCircle2 size={18} />} color="green" />
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
          <EmptyState icon={<CheckCircle2 size={24} />} title="Aucun incident" description="Aucun incident qualité enregistré" />
        ) : (
          <Table headers={['ID', 'Commande', 'Lot', 'Anomalie', 'Sévérité', 'Statut', 'Action corrective', 'Responsable', 'Actions']}>
            {filtered.map((inc) => {
              const linkedOrder = (inc as any).orderId || (inc as any).manufacturingOrder?.orderId;
              return (
                <tr key={inc.id} className="table-row-hover">
                  <td className="py-2 px-3 font-mono text-xs text-brand-600 font-semibold">{inc.id}</td>
                  <td className="py-2 px-3">
                    {linkedOrder
                      ? <span className="font-mono text-xs text-slate-600 dark:text-slate-400">{linkedOrder}</span>
                      : <span className="text-xs text-slate-400">—</span>
                    }
                  </td>
                  <td className="py-2 px-3 font-mono text-xs text-slate-600 dark:text-slate-400">{inc.batchNumber}</td>
                  <td className="py-2 px-3 text-xs text-slate-900 dark:text-slate-100 max-w-[140px] truncate">{inc.anomalyType}</td>
                  <td className="py-2 px-3"><Badge className={getIncidentSeverityColor(inc.severity)} dot>{inc.severity}</Badge></td>
                  <td className="py-2 px-3"><Badge className={getIncidentStatusColor(inc.status)}>{inc.status}</Badge></td>
                  <td className="py-2 px-3 text-xs text-slate-500 max-w-[160px] truncate">{inc.correctiveAction}</td>
                  <td className="py-2 px-3 text-xs text-slate-500">
                    {inc.responsible ? `${inc.responsible.firstName} ${inc.responsible.lastName}` : '—'}
                  </td>
                  <td className="py-2 px-3 flex items-center gap-1">
                    <button
                      onClick={() => { setSelected(inc); setShowDetail(true); }}
                      className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-blue-50 text-slate-400 hover:text-blue-600 transition-colors"
                      title="Voir détails & commentaires"
                    ><Eye size={14} /></button>
                    <PermissionGuard allowed={!!perms?.canUpdate}>
                      <button
                        onClick={() => { setSelected(inc); setShowEdit(true); }}
                        className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-amber-50 text-slate-400 hover:text-amber-600 transition-colors"
                        title="Modifier"
                      ><Pencil size={14} /></button>
                    </PermissionGuard>
                  </td>
                </tr>
              );
            })}
          </Table>
        )}
      </div>

      <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title="Signaler un incident" size="lg">
        <CreateIncidentForm onSuccess={() => { setShowCreate(false); silentReload(); }} />
      </Modal>

      <Modal isOpen={showEdit} onClose={() => setShowEdit(false)} title="Modifier l'incident" size="md">
        {selected && <EditIncidentForm incident={selected} onSuccess={() => { setShowEdit(false); silentReload(); }} />}
      </Modal>

      <Modal isOpen={showDetail} onClose={() => setShowDetail(false)} title="Détail de l'incident" size="xl">
        {selected && <IncidentDetailModal incident={selected} />}
      </Modal>
    </div>
  );
}

// ─── Modal détail + commentaires ──────────────────────────────────────────────
function IncidentDetailModal({ incident }: { incident: QualityIncident }) {
  const { user } = useAuthStore();
  const [comments, setComments]   = useState<any[]>([]);
  const [newComment, setNewComment] = useState('');
  const [sending, setSending]     = useState(false);
  const [loadingComments, setLoadingComments] = useState(true);

  useEffect(() => {
    incidentsAPI.getComments(incident.id)
      .then(r => setComments(r.data.data || []))
      .catch(() => {})
      .finally(() => setLoadingComments(false));
  }, [incident.id]);

  const handleSend = async () => {
    if (!newComment.trim()) return;
    setSending(true);
    try {
      const res = await incidentsAPI.addComment(incident.id, newComment.trim());
      setComments(prev => [...prev, res.data.data]);
      setNewComment('');
    } catch (e: any) {
      alert(e.response?.data?.message || 'Erreur');
    } finally {
      setSending(false);
    }
  };

  const linkedOrder = (incident as any).orderId || (incident as any).manufacturingOrder?.orderId;

  return (
    <div className="space-y-5 max-h-[80vh] overflow-y-auto">
      {/* Infos incident */}
      <div className="grid grid-cols-2 gap-3 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl text-xs">
        <div><span className="text-slate-400">Référence</span><p className="font-mono font-semibold text-brand-600 mt-0.5">{incident.id}</p></div>
        <div><span className="text-slate-400">Date détection</span><p className="font-medium mt-0.5">{formatDate(incident.detectionDate)}</p></div>
        <div><span className="text-slate-400">Commande liée</span><p className="font-mono font-medium mt-0.5">{linkedOrder || '—'}</p></div>
        <div><span className="text-slate-400">N° de lot</span><p className="font-mono font-medium mt-0.5">{incident.batchNumber}</p></div>
        <div className="col-span-2"><span className="text-slate-400">Anomalie</span><p className="font-medium mt-0.5">{incident.anomalyType}</p></div>
        <div>
          <span className="text-slate-400">Sévérité</span>
          <div className="mt-0.5"><Badge className={getIncidentSeverityColor(incident.severity)} dot>{incident.severity}</Badge></div>
        </div>
        <div>
          <span className="text-slate-400">Statut</span>
          <div className="mt-0.5"><Badge className={getIncidentStatusColor(incident.status)}>{incident.status}</Badge></div>
        </div>
        <div className="col-span-2"><span className="text-slate-400">Action corrective</span><p className="mt-0.5 text-slate-700 dark:text-slate-300">{incident.correctiveAction}</p></div>
        {incident.responsible && (
          <div><span className="text-slate-400">Responsable</span><p className="font-medium mt-0.5">{incident.responsible.firstName} {incident.responsible.lastName}</p></div>
        )}
      </div>

      {/* Thread commentaires */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <MessageSquare size={15} className="text-slate-400" />
          <h3 className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wide">
            Commentaires & suivi ({comments.length})
          </h3>
        </div>

        {loadingComments ? (
          <p className="text-xs text-slate-400 text-center py-4">Chargement...</p>
        ) : comments.length === 0 ? (
          <div className="text-center py-6 text-slate-400">
            <MessageSquare size={28} className="mx-auto mb-2 opacity-40" />
            <p className="text-xs">Aucun commentaire pour le moment. Soyez le premier à commenter.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {comments.map((c: any) => (
              <div key={c.id} className="flex gap-3">
                <div className="w-7 h-7 rounded-full bg-brand-100 dark:bg-brand-900/40 flex items-center justify-center flex-shrink-0 text-[10px] font-bold text-brand-700 dark:text-brand-300">
                  {(c.userName || c.userEmail || '?')[0].toUpperCase()}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">{c.userName || c.userEmail}</span>
                    <span className="text-[10px] text-slate-400">{new Date(c.createdAt).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800 rounded-lg px-3 py-2">{c.content}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Ajouter un commentaire */}
        <div className="mt-4 flex gap-2">
          <div className="w-7 h-7 rounded-full bg-brand-100 dark:bg-brand-900/40 flex items-center justify-center flex-shrink-0 text-[10px] font-bold text-brand-700 dark:text-brand-300">
            {user?.firstName?.[0]?.toUpperCase() || '?'}
          </div>
          <div className="flex-1 flex gap-2">
            <textarea
              value={newComment}
              onChange={e => setNewComment(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
              placeholder="Ajouter un commentaire... (Entrée pour envoyer)"
              rows={2}
              className="input resize-none text-xs flex-1"
            />
            <button
              onClick={handleSend}
              disabled={sending || !newComment.trim()}
              className="btn-primary px-3 self-end disabled:opacity-40"
            >
              <Send size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Formulaire création ───────────────────────────────────────────────────────
function CreateIncidentForm({ onSuccess }: { onSuccess: () => void }) {
  const { user } = useAuthStore();
  const [allOrders, setAllOrders] = useState<any[]>([]);
  const [allOFs, setAllOFs]       = useState<any[]>([]);
  const [orderId, setOrderId]     = useState('');
  const [form, setForm] = useState({
    id:              `INC-${Date.now().toString().slice(-6)}`,
    detectionDate:   new Date().toISOString().split('T')[0],
    batchNumber:     '',
    anomalyType:     '',
    severity:        'Mineur',
    status:          'En cours',
    correctiveAction: '',
    responsibleId:   user?.id?.toString() || '',
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    ordersAPI.getAll().then(r => setAllOrders(r.data.data || [])).catch(() => {});
    manufacturingAPI.getAll().then(r => setAllOFs(r.data.data || [])).catch(() => {});
  }, []);

  // Lots disponibles selon la commande sélectionnée
  const lotsForOrder = orderId
    ? allOFs.filter((of: any) => of.orderId === orderId)
    : allOFs;

  const handleOrderChange = (val: string) => {
    setOrderId(val);
    setForm(f => ({ ...f, batchNumber: '' }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await incidentsAPI.create({
        ...form,
        responsibleId: form.responsibleId ? parseInt(form.responsibleId) : null,
        orderId: orderId || null,
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
      {/* Sélection commande */}
      <div>
        <label className="label">Commande liée (optionnel)</label>
        <select
          value={orderId}
          onChange={e => handleOrderChange(e.target.value)}
          className="input"
        >
          <option value="">— Sélectionner une commande —</option>
          {allOrders.map((o: any) => (
            <option key={o.id} value={o.id}>{o.id} · {o.customer?.name || o.customerId}</option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">Référence</label>
          <input value={form.id} onChange={e => setForm({...form, id: e.target.value})} className="input" required />
        </div>
        <div>
          <label className="label">Date de détection</label>
          <input type="date" value={form.detectionDate} onChange={e => setForm({...form, detectionDate: e.target.value})} className="input" required />
        </div>

        {/* N° de lot — dropdown si commande sélectionnée */}
        <div className="col-span-2">
          <label className="label">N° de lot</label>
          {orderId && lotsForOrder.length > 0 ? (
            <select
              value={form.batchNumber}
              onChange={e => setForm({...form, batchNumber: e.target.value})}
              className="input"
              required
            >
              <option value="">— Sélectionner un lot —</option>
              {lotsForOrder.map((of: any) => (
                <option key={of.batchNumber} value={of.batchNumber}>
                  {of.batchNumber} · {of.product?.description || of.productId}
                </option>
              ))}
            </select>
          ) : (
            <input
              value={form.batchNumber}
              onChange={e => setForm({...form, batchNumber: e.target.value})}
              placeholder="LOT-AX-2401-001"
              className="input"
              required
            />
          )}
          {orderId && lotsForOrder.length === 0 && (
            <p className="text-xs text-amber-500 mt-1">Aucun OF trouvé pour cette commande — saisie manuelle</p>
          )}
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
        {loading ? 'Enregistrement...' : "Signaler l'incident"}
      </button>
    </form>
  );
}

// ─── Formulaire modification ───────────────────────────────────────────────────
function EditIncidentForm({ incident, onSuccess }: { incident: QualityIncident; onSuccess: () => void }) {
  const [status, setStatus]                 = useState(incident.status);
  const [severity, setSeverity]             = useState(incident.severity);
  const [correctiveAction, setCorrectiveAction] = useState(incident.correctiveAction);
  const [loading, setLoading]               = useState(false);

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
        <textarea value={correctiveAction} onChange={e => setCorrectiveAction(e.target.value)} rows={3} className="input resize-none" required />
      </div>
      <button type="submit" disabled={loading} className="btn-primary w-full justify-center">
        {loading ? 'Mise à jour...' : 'Mettre à jour'}
      </button>
    </form>
  );
}
