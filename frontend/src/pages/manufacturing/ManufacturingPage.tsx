import React, { useEffect, useState } from 'react';
import {
  Plus, Eye, Pencil, Factory, CheckCircle2, Clock, Search, Trash2,
  AlertTriangle, MessageSquare, ShieldCheck, Package, ArrowRight,
  GitBranch, User as UserIcon, MapPin, Calendar, Hash,
} from 'lucide-react';
import { manufacturingAPI, usersAPI, ordersAPI, productsAPI } from '../../services/api';
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
          <StatCard title="Total des OFs" value={stats.total || orders.length} icon={<Factory size={18} />} color="purple" />
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
                  <td className="py-2 px-3 font-mono text-xs text-brand-600 font-semibold">{of.id}</td>
                  <td className="py-2 px-3 text-xs text-slate-700 dark:text-slate-300 max-w-[160px] truncate">
                    {of.product?.description || of.productId}
                  </td>
                  <td className="py-2 px-3 font-mono text-xs text-slate-500">{of.batchNumber}</td>
                  <td className="py-2 px-3 text-sm font-semibold text-slate-900 dark:text-slate-100">{of.quantity}</td>
                  <td className="py-2 px-3 text-xs text-slate-500">{formatDate(of.launchDate)}</td>
                  <td className="py-2 px-3">
                    <p className="text-xs text-slate-700 dark:text-slate-300">{formatDate(of.expectedEndDate)}</p>
                    {of.status !== 'Terminé' && (
                      <p className={`text-xs font-medium ${days < 0 ? 'text-red-500' : days <= 3 ? 'text-orange-500' : 'text-slate-400'}`}>
                        {days < 0 ? `⚠ J+${Math.abs(days)}` : `J-${days}`}
                      </p>
                    )}
                  </td>
                  <td className="py-2 px-3 text-xs text-slate-500">{of.site}</td>
                  <td className="py-2 px-3 text-xs text-slate-500">
                    {of.operator ? `${of.operator.firstName} ${of.operator.lastName}` : '—'}
                  </td>
                  <td className="py-2 px-3"><Badge className={getOFStatusColor(of.status)}>{of.status}</Badge></td>
                  <td className="py-2 px-3">
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
      <Modal
        isOpen={showTraceability}
        onClose={() => { setShowTraceability(false); setTraceData(null); }}
        title={traceData ? `Traçabilité — Lot ${traceData.of?.batchNumber}` : 'Traçabilité du lot'}
        size="xl"
      >
        {traceData && <LotTraceabilityView data={traceData} />}
      </Modal>

      {/* Edit modal */}
      <Modal isOpen={showEdit} onClose={() => setShowEdit(false)} title="Modifier l'OF" size="sm">
        {selected && (
          <EditOFForm of={selected} users={users} onSuccess={() => { setShowEdit(false); load(); }} />
        )}
      </Modal>

      {/* Create modal */}
      <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title="Créer un OF" size="lg">
        <CreateOFForm users={users} onSuccess={() => { setShowCreate(false); load(); }} />
      </Modal>
    </div>
  );
}

function EditOFForm({ of, users, onSuccess }: { of: ManufacturingOrder; users: User[]; onSuccess: () => void }) {
  const [status, setStatus]               = useState(of.status);
  const [operators, setOperators]         = useState<User[]>(users.filter(u => u.role === 'OPERATOR'));
  const [operatorMode, setOperatorMode]   = useState<'list' | 'autre'>('list');
  const [operatorId, setOperatorId]       = useState(of.operatorId?.toString() || '');
  const [newOpFirstName, setNewOpFirstName] = useState('');
  const [newOpLastName, setNewOpLastName]   = useState('');
  const [loading, setLoading]             = useState(false);

  useEffect(() => {
    usersAPI.getAll()
      .then(r => setOperators((r.data.data || []).filter((u: User) => u.role === 'OPERATOR')))
      .catch(() => {});
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (operatorMode === 'autre' && (!newOpFirstName.trim() || !newOpLastName.trim())) {
      alert("Saisissez le prénom et le nom du nouvel opérateur");
      return;
    }
    setLoading(true);
    try {
      let resolvedOperatorId: number | null = operatorMode === 'list' && operatorId ? parseInt(operatorId) : null;
      if (operatorMode === 'autre') {
        const slug = `${newOpFirstName.toLowerCase()}.${newOpLastName.toLowerCase()}.${Date.now()}`;
        const newUser = await usersAPI.create({
          firstName: newOpFirstName.trim(),
          lastName:  newOpLastName.trim(),
          email:     `${slug}@aeronexis.local`,
          password:  'Aeronexis2024!',
          role:      'OPERATOR',
        });
        resolvedOperatorId = newUser.data.data.id;
        setOperators(prev => [...prev, newUser.data.data]);
      }
      await manufacturingAPI.update(of.id, {
        status,
        operatorId: resolvedOperatorId,
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
        <select
          value={operatorMode === 'autre' ? '__autre__' : operatorId}
          onChange={e => {
            if (e.target.value === '__autre__') {
              setOperatorMode('autre');
              setOperatorId('');
            } else {
              setOperatorMode('list');
              setOperatorId(e.target.value);
              setNewOpFirstName('');
              setNewOpLastName('');
            }
          }}
          className="input"
        >
          <option value="">Non assigné</option>
          {operators.map(u => (
            <option key={u.id} value={u.id}>{u.firstName} {u.lastName}</option>
          ))}
          <option value="__autre__">— Autre (nouvel opérateur) —</option>
        </select>
        {operatorMode === 'autre' && (
          <div className="grid grid-cols-2 gap-2 mt-2">
            <input
              type="text"
              placeholder="Prénom"
              value={newOpFirstName}
              onChange={e => setNewOpFirstName(e.target.value)}
              className="input text-sm"
              autoFocus
            />
            <input
              type="text"
              placeholder="Nom"
              value={newOpLastName}
              onChange={e => setNewOpLastName(e.target.value)}
              className="input text-sm"
            />
            <p className="col-span-2 text-xs text-slate-400">Cet opérateur sera ajouté à la liste du système.</p>
          </div>
        )}
      </div>
      <button type="submit" disabled={loading} className="btn-primary w-full justify-center">
        {loading ? 'Enregistrement...' : 'Enregistrer'}
      </button>
    </form>
  );
}

function CreateOFForm({ users: initialUsers, onSuccess }: { users: User[]; onSuccess: () => void }) {
  const [allOrders, setAllOrders]         = useState<any[]>([]);
  const [allProducts, setAllProducts]     = useState<any[]>([]);
  const [operators, setOperators]         = useState<User[]>(initialUsers.filter(u => u.role === 'OPERATOR'));
  const [orderId, setOrderId]             = useState('');
  const [orderError, setOrderError]       = useState('');
  const [lines, setLines]                 = useState([{ productId: '', unitPrice: 0, quantity: '', amount: 0 }]);
  const [launchDate, setLaunchDate]       = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate]             = useState('');
  const [site, setSite]                   = useState('Site Toulouse');
  const [operatorMode, setOperatorMode]   = useState<'list' | 'autre'>('list');
  const [operatorId, setOperatorId]       = useState('');
  const [newOpFirstName, setNewOpFirstName] = useState('');
  const [newOpLastName, setNewOpLastName]   = useState('');
  const [loading, setLoading]             = useState(false);

  useEffect(() => {
    ordersAPI.getAll().then(r => setAllOrders(r.data.data || [])).catch(() => {});
    productsAPI.getAll().then(r => setAllProducts(r.data.data || [])).catch(() => {});
    usersAPI.getAll().then(r => setOperators((r.data.data || []).filter((u: User) => u.role === 'OPERATOR'))).catch(() => {});
  }, []);

  // Génère la référence OF : OF-YYYYMMDD-XXXX (4 derniers chiffres du n° commande)
  const dateStr    = launchDate.replace(/-/g, '');
  const suffix     = orderId ? orderId.slice(-4) : '0000';
  const ofBaseRef  = `OF-${dateStr}-${suffix}`;
  const batchBase  = `LOT-${dateStr}-${suffix}`;

  const handleOrderChange = (val: string) => {
    setOrderId(val);
    const exists = allOrders.some(o => o.id === val);
    setOrderError(val && !exists ? 'Numéro de commande invalide' : '');
  };

  const handleProductChange = (idx: number, productId: string) => {
    const prod = allProducts.find((p: any) => p.id === productId);
    setLines(prev => prev.map((l, i) => i !== idx ? l : {
      ...l, productId,
      unitPrice: prod?.unitPrice ?? 0,
      amount: (parseInt(l.quantity) || 0) * (prod?.unitPrice ?? 0),
    }));
  };

  const handleQtyChange = (idx: number, qty: string) => {
    setLines(prev => prev.map((l, i) => i !== idx ? l : {
      ...l, quantity: qty,
      amount: (parseInt(qty) || 0) * l.unitPrice,
    }));
  };

  const addLine    = () => setLines(p => [...p, { productId: '', unitPrice: 0, quantity: '', amount: 0 }]);
  const removeLine = (idx: number) => setLines(p => p.filter((_, i) => i !== idx));

  const totalAmount = lines.reduce((s, l) => s + l.amount, 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!allOrders.some(o => o.id === orderId)) { setOrderError('Numéro de commande invalide'); return; }
    if (lines.some(l => !l.productId || !l.quantity)) { alert('Remplissez tous les produits et quantités'); return; }
    if (operatorMode === 'autre' && (!newOpFirstName.trim() || !newOpLastName.trim())) {
      alert("Saisissez le prénom et le nom du nouvel opérateur");
      return;
    }
    setLoading(true);
    try {
      // Si "Autre" : créer d'abord le compte opérateur
      let resolvedOperatorId: number | null = operatorMode === 'list' && operatorId ? parseInt(operatorId) : null;
      if (operatorMode === 'autre') {
        const slug = `${newOpFirstName.toLowerCase()}.${newOpLastName.toLowerCase()}.${Date.now()}`;
        const newUser = await usersAPI.create({
          firstName: newOpFirstName.trim(),
          lastName:  newOpLastName.trim(),
          email:     `${slug}@aeronexis.local`,
          password:  'Aeronexis2024!',
          role:      'OPERATOR',
        });
        resolvedOperatorId = newUser.data.data.id;
        setOperators(prev => [...prev, newUser.data.data]);
      }

      await Promise.all(lines.map((line, idx) =>
        manufacturingAPI.create({
          id:              lines.length > 1 ? `${ofBaseRef}-${idx + 1}` : ofBaseRef,
          productId:       line.productId,
          batchNumber:     lines.length > 1 ? `${batchBase}-${idx + 1}` : batchBase,
          quantity:        parseInt(line.quantity),
          launchDate,
          expectedEndDate: endDate,
          status:          'Planifié',
          site,
          operatorId:      resolvedOperatorId,
          orderId:         orderId || null,
        })
      ));
      onSuccess();
    } catch (e: any) {
      alert(e.response?.data?.message || 'Erreur de création');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">

      {/* Numéro de commande */}
      <div>
        <label className="label">Numéro de commande</label>
        <select
          value={orderId}
          onChange={e => handleOrderChange(e.target.value)}
          className={`input ${orderError ? 'border-red-400' : ''}`}
          required
        >
          <option value="">— Sélectionner une commande —</option>
          {allOrders.map((o: any) => (
            <option key={o.id} value={o.id}>
              {o.id} · {o.customer?.name || o.customerId}
            </option>
          ))}
        </select>
        {orderError && <p className="text-xs text-red-500 mt-1">{orderError}</p>}
      </div>

      {/* Référence OF (auto) */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">Référence OF (auto)</label>
          <input value={ofBaseRef} readOnly className="input bg-slate-50 dark:bg-slate-800 text-slate-500 cursor-not-allowed font-mono text-xs" />
        </div>
        <div>
          <label className="label">N° de lot (auto)</label>
          <input value={batchBase} readOnly className="input bg-slate-50 dark:bg-slate-800 text-slate-500 cursor-not-allowed font-mono text-xs" />
        </div>
        <div>
          <label className="label">Date de lancement</label>
          <input type="date" value={launchDate} onChange={e => setLaunchDate(e.target.value)} className="input" required />
        </div>
        <div>
          <label className="label">Fin prévue</label>
          <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="input" required />
        </div>
        <div>
          <label className="label">Site</label>
          <select value={site} onChange={e => setSite(e.target.value)} className="input">
            {['Site Toulouse', 'Site Bordeaux', 'Site Paris'].map(s => <option key={s}>{s}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Opérateur</label>
          <select
            value={operatorMode === 'autre' ? '__autre__' : operatorId}
            onChange={e => {
              if (e.target.value === '__autre__') {
                setOperatorMode('autre');
                setOperatorId('');
              } else {
                setOperatorMode('list');
                setOperatorId(e.target.value);
                setNewOpFirstName('');
                setNewOpLastName('');
              }
            }}
            className="input"
          >
            <option value="">Non assigné</option>
            {operators.map(u => (
              <option key={u.id} value={u.id}>{u.firstName} {u.lastName}</option>
            ))}
            <option value="__autre__">— Autre (nouvel opérateur) —</option>
          </select>
          {operatorMode === 'autre' && (
            <div className="grid grid-cols-2 gap-2 mt-2">
              <input
                type="text"
                placeholder="Prénom"
                value={newOpFirstName}
                onChange={e => setNewOpFirstName(e.target.value)}
                className="input text-sm"
                autoFocus
              />
              <input
                type="text"
                placeholder="Nom"
                value={newOpLastName}
                onChange={e => setNewOpLastName(e.target.value)}
                className="input text-sm"
              />
              <p className="col-span-2 text-xs text-slate-400">Cet opérateur sera ajouté à la liste du système.</p>
            </div>
          )}
        </div>
      </div>

      {/* Lignes produits */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="label mb-0">Produits</label>
          <button type="button" onClick={addLine} className="text-xs text-brand-600 hover:text-brand-700 font-medium flex items-center gap-1">
            <Plus size={12} /> Ajouter une ligne
          </button>
        </div>
        <div className="space-y-2">
          {lines.map((line, idx) => {
            return (
              <div key={idx} className="grid grid-cols-12 gap-2 items-center p-2 bg-slate-50 dark:bg-slate-800 rounded-lg">
                <div className="col-span-5">
                  <select
                    value={line.productId}
                    onChange={e => handleProductChange(idx, e.target.value)}
                    className="input text-xs h-8"
                    required
                  >
                    <option value="">— Produit —</option>
                    {allProducts.map((p: any) => (
                      <option key={p.id} value={p.id}>{p.id} · {p.description}</option>
                    ))}
                  </select>
                </div>
                <div className="col-span-2">
                  <input
                    type="number"
                    min="1"
                    placeholder="Qté"
                    value={line.quantity}
                    onChange={e => handleQtyChange(idx, e.target.value)}
                    className="input text-xs h-8"
                    required
                  />
                </div>
                <div className="col-span-2">
                  <input
                    readOnly
                    value={line.unitPrice ? `${line.unitPrice} €` : '—'}
                    className="input text-xs h-8 bg-white dark:bg-slate-700 text-slate-500 cursor-not-allowed"
                    title="Prix unitaire"
                  />
                </div>
                <div className="col-span-2">
                  <input
                    readOnly
                    value={line.amount ? `${line.amount.toLocaleString('fr-FR')} €` : '—'}
                    className="input text-xs h-8 bg-white dark:bg-slate-700 font-semibold text-brand-600 cursor-not-allowed"
                    title="Montant"
                  />
                </div>
                <div className="col-span-1 flex justify-center">
                  {lines.length > 1 && (
                    <button type="button" onClick={() => removeLine(idx)} className="text-slate-400 hover:text-red-500 transition-colors">
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
        {totalAmount > 0 && (
          <div className="flex justify-end mt-2">
            <p className="text-xs text-slate-500">Total : <span className="font-semibold text-slate-900 dark:text-slate-100">{totalAmount.toLocaleString('fr-FR')} €</span></p>
          </div>
        )}
      </div>

      <button type="submit" disabled={loading || !!orderError} className="btn-primary w-full justify-center">
        {loading ? 'Création...' : `Créer ${lines.length > 1 ? `${lines.length} OFs` : "l'OF"}`}
      </button>
    </form>
  );
}

// ─── Composant traçabilité complète d'un lot ──────────────────────────────────
function getAuditEventStyle(log: any): { icon: React.ReactNode; color: string; label: string } {
  const { action, module, description } = log;
  if (module === 'manufacturing' && action === 'CREATE')
    return { icon: <Factory size={12} />, color: 'bg-indigo-100 text-indigo-700 border-indigo-200', label: 'Création OF' };
  if (module === 'manufacturing' && action === 'UPDATE' && description.includes('Statut'))
    return { icon: <ArrowRight size={12} />, color: 'bg-blue-100 text-blue-700 border-blue-200', label: 'Changement statut OF' };
  if (module === 'manufacturing' && action === 'UPDATE' && description.includes('Opérateur'))
    return { icon: <UserIcon size={12} />, color: 'bg-cyan-100 text-cyan-700 border-cyan-200', label: 'Changement opérateur' };
  if (module === 'manufacturing' && action === 'UPDATE')
    return { icon: <Pencil size={12} />, color: 'bg-blue-100 text-blue-700 border-blue-200', label: 'Modification OF' };
  if (module === 'incidents' && action === 'CREATE')
    return { icon: <AlertTriangle size={12} />, color: 'bg-red-100 text-red-700 border-red-200', label: 'Incident détecté' };
  if (module === 'incidents' && action === 'UPDATE')
    return { icon: <AlertTriangle size={12} />, color: 'bg-orange-100 text-orange-700 border-orange-200', label: 'Incident mis à jour' };
  if (module === 'manufacturing' && action === 'VIEW')
    return { icon: <ShieldCheck size={12} />, color: 'bg-slate-100 text-slate-600 border-slate-200', label: 'Consultation traçabilité' };
  return { icon: <Package size={12} />, color: 'bg-slate-100 text-slate-600 border-slate-200', label: action };
}

function LotTraceabilityView({ data }: { data: any }) {
  const { of: ofData, auditLogs = [], incidents = [] } = data;
  const fmt = (d: string) => new Date(d).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  const fmtDate = (d: string) => new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });

  // Construire la timeline : audit logs + commentaires d'incidents triés par date
  const timelineItems: any[] = [
    ...auditLogs.map((l: any) => ({ ...l, _type: 'audit' })),
  ];


  // Ajouter les commentaires des incidents dans la timeline
  incidents.forEach((inc: any) => {
    (inc.comments || []).forEach((c: any) => {
      timelineItems.push({ ...c, _type: 'comment', _incident: inc });
    });
  });

  timelineItems.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

  const severityColor: Record<string, string> = {
    Critique: 'bg-red-100 text-red-700',
    Majeur: 'bg-orange-100 text-orange-700',
    Mineur: 'bg-amber-100 text-amber-700',
    Observation: 'bg-slate-100 text-slate-600',
  };

  return (
    <div className="space-y-5 max-h-[72vh] overflow-y-auto pr-1">
      {/* Carte récapitulative OF */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
        <div className="flex items-start gap-2">
          <Hash size={13} className="text-slate-400 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-[10px] text-slate-400 uppercase tracking-wide">Lot</p>
            <p className="text-xs font-mono font-semibold text-slate-900 dark:text-slate-100">{ofData.batchNumber}</p>
          </div>
        </div>
        <div className="flex items-start gap-2">
          <Package size={13} className="text-slate-400 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-[10px] text-slate-400 uppercase tracking-wide">Produit</p>
            <p className="text-xs font-medium text-slate-900 dark:text-slate-100 truncate max-w-[120px]" title={ofData.product?.description}>{ofData.product?.description}</p>
          </div>
        </div>
        <div className="flex items-start gap-2">
          <MapPin size={13} className="text-slate-400 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-[10px] text-slate-400 uppercase tracking-wide">Site</p>
            <p className="text-xs font-medium text-slate-900 dark:text-slate-100">{ofData.site}</p>
          </div>
        </div>
        <div className="flex items-start gap-2">
          <UserIcon size={13} className="text-slate-400 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-[10px] text-slate-400 uppercase tracking-wide">Opérateur</p>
            <p className="text-xs font-medium text-slate-900 dark:text-slate-100">
              {ofData.operator ? `${ofData.operator.firstName} ${ofData.operator.lastName}` : '—'}
            </p>
          </div>
        </div>
        <div className="flex items-start gap-2">
          <Calendar size={13} className="text-slate-400 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-[10px] text-slate-400 uppercase tracking-wide">Lancement</p>
            <p className="text-xs font-medium text-slate-900 dark:text-slate-100">{fmtDate(ofData.launchDate)}</p>
          </div>
        </div>
        <div className="flex items-start gap-2">
          <Calendar size={13} className="text-slate-400 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-[10px] text-slate-400 uppercase tracking-wide">Fin prévue</p>
            <p className="text-xs font-medium text-slate-900 dark:text-slate-100">{fmtDate(ofData.expectedEndDate)}</p>
          </div>
        </div>
        <div className="flex items-start gap-2">
          <Factory size={13} className="text-slate-400 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-[10px] text-slate-400 uppercase tracking-wide">Statut actuel</p>
            <Badge className={getOFStatusColor(ofData.status)}>{ofData.status}</Badge>
          </div>
        </div>
        {ofData.order && (
          <div className="flex items-start gap-2">
            <GitBranch size={13} className="text-slate-400 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-[10px] text-slate-400 uppercase tracking-wide">Commande liée</p>
              <p className="text-xs font-mono font-semibold text-brand-600">{ofData.order.id}</p>
            </div>
          </div>
        )}
      </div>

      {/* Résumé incidents */}
      {incidents.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {incidents.map((inc: any) => (
            <div key={inc.id} className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium border ${severityColor[inc.severity] || 'bg-slate-100 text-slate-600'}`}>
              <AlertTriangle size={11} />
              {inc.anomalyType} — {inc.severity}
              {inc.comments?.length > 0 && (
                <span className="ml-1 flex items-center gap-0.5 opacity-70"><MessageSquare size={10} />{inc.comments.length}</span>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Timeline */}
      <div>
        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
          <ShieldCheck size={13} /> Historique complet ({timelineItems.length} événement{timelineItems.length > 1 ? 's' : ''})
        </p>

        {timelineItems.length === 0 ? (
          <div className="text-center py-8 text-slate-400 text-xs">Aucun événement enregistré pour ce lot</div>
        ) : (
          <div className="relative pl-5">
            {/* Ligne verticale */}
            <div className="absolute left-2 top-0 bottom-0 w-px bg-slate-200 dark:bg-slate-700" />

            <div className="space-y-3">
              {timelineItems.map((item: any, _idx: number) => {
                if (item._type === 'comment') {
                  return (
                    <div key={`comment-${item.id}`} className="relative">
                      <div className="absolute -left-3 top-2 w-4 h-4 rounded-full bg-purple-100 border-2 border-purple-300 flex items-center justify-center">
                        <MessageSquare size={8} className="text-purple-600" />
                      </div>
                      <div className="ml-3 p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-100 dark:border-purple-800">
                        <div className="flex items-start justify-between gap-2 flex-wrap mb-1">
                          <p className="text-[11px] font-semibold text-purple-700 dark:text-purple-300">
                            Commentaire incident — {item._incident?.anomalyType}
                          </p>
                          <span className="text-[10px] text-slate-400 flex-shrink-0">{fmt(item.createdAt)}</span>
                        </div>
                        <p className="text-xs text-slate-600 dark:text-slate-400 italic">"{item.content}"</p>
                        <p className="text-[10px] text-slate-400 mt-1">
                          {item.firstName ? `${item.firstName} ${item.lastName}` : item.userEmail}
                        </p>
                      </div>
                    </div>
                  );
                }

                // Audit log
                const style = getAuditEventStyle(item);
                const userName = item.user
                  ? `${item.user.firstName} ${item.user.lastName}`
                  : item.userEmail?.split('@')[0] || 'Système';

                return (
                  <div key={`audit-${item.id}`} className="relative">
                    <div className={`absolute -left-3 top-2 w-4 h-4 rounded-full border-2 flex items-center justify-center ${style.color}`}>
                      {style.icon}
                    </div>
                    <div className="ml-3 p-3 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                      <div className="flex items-start justify-between gap-2 flex-wrap">
                        <p className="text-xs font-semibold text-slate-800 dark:text-slate-100">{style.label}</p>
                        <span className="text-[10px] text-slate-400 flex-shrink-0">{fmt(item.createdAt)}</span>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">{item.description}</p>
                      <p className="text-[10px] text-slate-400 mt-1">{userName}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
