import React, { useEffect, useState } from 'react';
import { Plus, Eye, Pencil, Trash2, BoxSelect } from 'lucide-react';
import { productsAPI } from '../../services/api';
import type { Product } from '../../types';
import { useAuthStore } from '../../store/authStore';
import {
  Badge, StatCard, SearchInput, Table, PageLoader,
  ErrorState, EmptyState, Modal, PermissionGuard
} from '../../components/ui';
import { formatCurrency } from '../../utils';

export function ProductsPage() {
  const { permissions } = useAuthStore();
  const perms = permissions?.products;
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [selected, setSelected] = useState<Product | null>(null);
  const [showDetail, setShowDetail] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [showEdit, setShowEdit] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await productsAPI.getAll();
      setProducts(res.data.data || []);
    } catch (e: any) {
      setError(e.response?.data?.message || 'Erreur');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const categories = [...new Set(products.map(p => p.category))];

  const filtered = products.filter(p => {
    const matchSearch = !search ||
      p.description.toLowerCase().includes(search.toLowerCase()) ||
      p.id.toLowerCase().includes(search.toLowerCase());
    const matchCat = !categoryFilter || p.category === categoryFilter;
    return matchSearch && matchCat;
  });

  const handleDelete = async (id: string) => {
    if (!confirm('Supprimer ce produit ?')) return;
    try {
      await productsAPI.delete(id);
      await load();
    } catch (e: any) {
      alert(e.response?.data?.message || 'Erreur');
    }
  };

  const getCertColor = (cert: string) => {
    const map: Record<string, string> = {
      'EN9100': 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
      'AS9100': 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
      'DO-178C': 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
      'DO-160': 'bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-300',
      'CE': 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300',
      'AMS': 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
      'NAS': 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
    };
    return map[cert] || 'bg-slate-100 text-slate-600';
  };

  if (loading) return <PageLoader />;
  if (error) return <ErrorState message={error} onRetry={load} />;

  return (
    <div className="space-y-6 page-enter">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total produits" value={products.length} icon={<BoxSelect size={18} />} color="blue" />
        <StatCard title="Catégories" value={categories.length} icon={<BoxSelect size={18} />} color="purple" />
        <StatCard title="Prix moyen" value={formatCurrency(products.reduce((s, p) => s + p.unitPrice, 0) / (products.length || 1))} icon={<BoxSelect size={18} />} color="green" />
        <StatCard title="Certifications" value={new Set(products.map(p => p.certification)).size} icon={<BoxSelect size={18} />} color="cyan" />
      </div>

      <div className="card">
        <div className="flex flex-wrap items-center gap-3 p-5 border-b border-slate-200 dark:border-slate-700">
          <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100 flex-1">
            Catalogue produits <span className="text-slate-400 font-normal ml-1">({filtered.length})</span>
          </h2>
          <SearchInput value={search} onChange={setSearch} placeholder="Référence, description..." className="w-52" />
          <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)} className="input h-9 text-xs w-36">
            <option value="">Toutes catégories</option>
            {categories.map(c => <option key={c}>{c}</option>)}
          </select>
          <PermissionGuard allowed={!!perms?.canCreate}>
            <button onClick={() => setShowCreate(true)} className="btn-primary">
              <Plus size={15} /> Nouveau produit
            </button>
          </PermissionGuard>
        </div>

        {filtered.length === 0 ? (
          <EmptyState icon={<BoxSelect size={24} />} title="Aucun produit" />
        ) : (
          <Table headers={['Référence', 'Description', 'Catégorie', 'Prix unitaire', 'Tps fabrication', 'Poids (kg)', 'Certification', 'Actions']}>
            {filtered.map((p) => (
              <tr key={p.id} className="table-row-hover">
                <td className="py-2 px-3 font-mono text-xs text-brand-600 font-semibold">{p.id}</td>
                <td className="py-2 px-3 text-sm text-slate-900 dark:text-slate-100 max-w-[220px] truncate">{p.description}</td>
                <td className="py-2 px-3">
                  <Badge className="bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300">{p.category}</Badge>
                </td>
                <td className="py-2 px-3 text-sm font-semibold text-slate-900 dark:text-slate-100">{formatCurrency(p.unitPrice)}</td>
                <td className="py-2 px-3 text-xs text-slate-500">{p.manufacturingTimeH}h</td>
                <td className="py-2 px-3 text-xs text-slate-500">{p.weightKg} kg</td>
                <td className="py-2 px-3"><Badge className={getCertColor(p.certification)}>{p.certification}</Badge></td>
                <td className="py-2 px-3">
                  <div className="flex items-center gap-1">
                    <button onClick={() => { setSelected(p); setShowDetail(true); }} className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-brand-50 text-slate-400 hover:text-brand-600 transition-colors">
                      <Eye size={14} />
                    </button>
                    <PermissionGuard allowed={!!perms?.canUpdate}>
                      <button onClick={() => { setSelected(p); setShowEdit(true); }} className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-amber-50 text-slate-400 hover:text-amber-600 transition-colors">
                        <Pencil size={14} />
                      </button>
                    </PermissionGuard>
                    <PermissionGuard allowed={!!perms?.canDelete}>
                      <button onClick={() => handleDelete(p.id)} className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-red-50 text-slate-400 hover:text-red-600 transition-colors">
                        <Trash2 size={14} />
                      </button>
                    </PermissionGuard>
                  </div>
                </td>
              </tr>
            ))}
          </Table>
        )}
      </div>

      <Modal isOpen={showDetail} onClose={() => setShowDetail(false)} title={selected?.id || ''} size="sm">
        {selected && (
          <div className="space-y-3">
            <p className="text-base font-semibold text-slate-900 dark:text-slate-100">{selected.description}</p>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Catégorie', value: selected.category },
                { label: 'Certification', value: selected.certification },
                { label: 'Prix unitaire', value: formatCurrency(selected.unitPrice) },
                { label: 'Tps fabrication', value: `${selected.manufacturingTimeH}h` },
                { label: 'Poids', value: `${selected.weightKg} kg` },
              ].map(f => (
                <div key={f.label}>
                  <p className="text-xs text-slate-500">{f.label}</p>
                  <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{f.value}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </Modal>

      <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title="Nouveau produit" size="md">
        <ProductForm onSuccess={() => { setShowCreate(false); load(); }} />
      </Modal>

      <Modal isOpen={showEdit} onClose={() => setShowEdit(false)} title="Modifier le produit" size="md">
        {selected && <ProductForm product={selected} onSuccess={() => { setShowEdit(false); load(); }} />}
      </Modal>
    </div>
  );
}

function ProductForm({ product, onSuccess }: { product?: Product; onSuccess: () => void }) {
  const isEdit = !!product;
  const [form, setForm] = useState({
    id: product?.id || '',
    description: product?.description || '',
    category: product?.category || 'Hydraulique',
    unitPrice: product?.unitPrice?.toString() || '',
    manufacturingTimeH: product?.manufacturingTimeH?.toString() || '',
    weightKg: product?.weightKg?.toString() || '',
    certification: product?.certification || 'EN9100',
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = {
        ...form,
        unitPrice: parseFloat(form.unitPrice),
        manufacturingTimeH: parseFloat(form.manufacturingTimeH),
        weightKg: parseFloat(form.weightKg),
      };
      if (isEdit) {
        await productsAPI.update(product!.id, data);
      } else {
        await productsAPI.create(data);
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
          <div className="col-span-2">
            <label className="label">Référence</label>
            <input value={form.id} onChange={e => setForm({...form, id: e.target.value})} placeholder="PROD-AX-2403" className="input" required />
          </div>
        )}
        <div className="col-span-2">
          <label className="label">Description</label>
          <input value={form.description} onChange={e => setForm({...form, description: e.target.value})} className="input" required />
        </div>
        <div>
          <label className="label">Catégorie</label>
          <select value={form.category} onChange={e => setForm({...form, category: e.target.value})} className="input">
            {['Hydraulique', 'Mécanique', 'Électronique', 'Drone', 'Accessoire'].map(c => <option key={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Certification</label>
          <select value={form.certification} onChange={e => setForm({...form, certification: e.target.value})} className="input">
            {['EN9100', 'AS9100', 'DO-178C', 'DO-160', 'CE', 'AMS', 'NAS'].map(c => <option key={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Prix unitaire (€)</label>
          <input type="number" step="0.01" value={form.unitPrice} onChange={e => setForm({...form, unitPrice: e.target.value})} className="input" required />
        </div>
        <div>
          <label className="label">Tps fabrication (h)</label>
          <input type="number" step="0.5" value={form.manufacturingTimeH} onChange={e => setForm({...form, manufacturingTimeH: e.target.value})} className="input" required />
        </div>
        <div>
          <label className="label">Poids (kg)</label>
          <input type="number" step="0.01" value={form.weightKg} onChange={e => setForm({...form, weightKg: e.target.value})} className="input" required />
        </div>
      </div>
      <button type="submit" disabled={loading} className="btn-primary w-full justify-center mt-2">
        {loading ? 'Enregistrement...' : isEdit ? 'Mettre à jour' : 'Créer le produit'}
      </button>
    </form>
  );
}
