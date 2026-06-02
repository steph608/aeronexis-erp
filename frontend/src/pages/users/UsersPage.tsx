import React, { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, Users, Shield } from 'lucide-react';
import { usersAPI } from '../../services/api';
import type { User, Role } from '../../types';
import { useAuthStore } from '../../store/authStore';
import {
  Badge, StatCard, SearchInput, Table, PageLoader,
  ErrorState, EmptyState, Modal, PermissionGuard
} from '../../components/ui';
import { formatDate } from '../../utils';
import { ROLE_LABELS, ROLE_COLORS } from '../../lib/permissions';

export function UsersPage() {
  const { permissions, user: currentUser } = useAuthStore();
  const perms = permissions?.users;
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [selected, setSelected] = useState<User | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [showEdit, setShowEdit] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await usersAPI.getAll();
      setUsers(res.data.data || []);
    } catch (e: any) {
      setError(e.response?.data?.message || 'Erreur');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const filtered = users.filter(u => {
    const matchSearch = !search ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      u.firstName.toLowerCase().includes(search.toLowerCase()) ||
      u.lastName.toLowerCase().includes(search.toLowerCase());
    const matchRole = !roleFilter || u.role === roleFilter;
    return matchSearch && matchRole;
  });

  const handleDelete = async (id: number) => {
    if (id === currentUser?.id) { alert('Impossible de supprimer votre propre compte'); return; }
    if (!confirm('Supprimer cet utilisateur ?')) return;
    try {
      await usersAPI.delete(id);
      await load();
    } catch (e: any) {
      alert(e.response?.data?.message || 'Erreur');
    }
  };

  if (loading) return <PageLoader />;
  if (error) return <ErrorState message={error} onRetry={load} />;

  const roles: Role[] = ['ADMIN', 'DIRECTOR', 'PRODUCTION_MANAGER', 'LOGISTICS_MANAGER', 'SALES_MANAGER', 'OPERATOR'];

  return (
    <div className="space-y-6 page-enter">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total utilisateurs" value={users.length} icon={<Users size={18} />} color="blue" />
        <StatCard title="Actifs" value={users.filter(u => u.isActive).length} icon={<Users size={18} />} color="green" />
        <StatCard title="Admins" value={users.filter(u => u.role === 'ADMIN').length} icon={<Shield size={18} />} color="purple" />
        <StatCard title="Opérateurs" value={users.filter(u => u.role === 'OPERATOR').length} icon={<Users size={18} />} color="cyan" />
      </div>

      <div className="card">
        <div className="flex flex-wrap items-center gap-3 p-5 border-b border-slate-200 dark:border-slate-700">
          <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100 flex-1">
            Utilisateurs <span className="text-slate-400 font-normal ml-1">({filtered.length})</span>
          </h2>
          <SearchInput value={search} onChange={setSearch} placeholder="Nom, email..." className="w-52" />
          <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)} className="input h-9 text-xs w-44">
            <option value="">Tous les rôles</option>
            {roles.map(r => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
          </select>
          <PermissionGuard allowed={!!perms?.canCreate}>
            <button onClick={() => setShowCreate(true)} className="btn-primary">
              <Plus size={15} /> Nouvel utilisateur
            </button>
          </PermissionGuard>
        </div>

        {filtered.length === 0 ? (
          <EmptyState icon={<Users size={24} />} title="Aucun utilisateur" />
        ) : (
          <Table headers={['', 'Nom complet', 'Email', 'Rôle', 'Statut', 'Créé le', 'Actions']}>
            {filtered.map((u) => (
              <tr key={u.id} className="table-row-hover">
                <td className="py-3 px-4">
                  <div className="w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center text-white text-xs font-bold">
                    {u.firstName[0]}{u.lastName[0]}
                  </div>
                </td>
                <td className="py-3 px-4">
                  <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{u.firstName} {u.lastName}</p>
                  {u.id === currentUser?.id && <span className="text-[10px] text-brand-500 font-medium">Vous</span>}
                </td>
                <td className="py-3 px-4 text-xs text-slate-500 font-mono">{u.email}</td>
                <td className="py-3 px-4">
                  <Badge className={ROLE_COLORS[u.role as Role]}>{ROLE_LABELS[u.role as Role]}</Badge>
                </td>
                <td className="py-3 px-4">
                  <Badge className={u.isActive ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'} dot>
                    {u.isActive ? 'Actif' : 'Inactif'}
                  </Badge>
                </td>
                <td className="py-3 px-4 text-xs text-slate-500">{u.createdAt ? formatDate(u.createdAt) : '—'}</td>
                <td className="py-3 px-4">
                  <div className="flex items-center gap-1">
                    <PermissionGuard allowed={!!perms?.canUpdate}>
                      <button onClick={() => { setSelected(u); setShowEdit(true); }} className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-amber-50 text-slate-400 hover:text-amber-600 transition-colors">
                        <Pencil size={14} />
                      </button>
                    </PermissionGuard>
                    <PermissionGuard allowed={!!perms?.canDelete && u.id !== currentUser?.id}>
                      <button onClick={() => handleDelete(u.id)} className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-red-50 text-slate-400 hover:text-red-600 transition-colors">
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

      <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title="Nouvel utilisateur" size="md">
        <UserForm onSuccess={() => { setShowCreate(false); load(); }} />
      </Modal>

      <Modal isOpen={showEdit} onClose={() => setShowEdit(false)} title="Modifier l'utilisateur" size="sm">
        {selected && <UserForm user={selected} onSuccess={() => { setShowEdit(false); load(); }} />}
      </Modal>
    </div>
  );
}

function UserForm({ user, onSuccess }: { user?: User; onSuccess: () => void }) {
  const isEdit = !!user;
  const [form, setForm] = useState({
    email: user?.email || '',
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    role: user?.role || 'OPERATOR',
    isActive: user?.isActive ?? true,
    password: '',
  });
  const [loading, setLoading] = useState(false);

  const roles: Role[] = ['ADMIN', 'DIRECTOR', 'PRODUCTION_MANAGER', 'LOGISTICS_MANAGER', 'SALES_MANAGER', 'OPERATOR'];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isEdit) {
        const { password, ...data } = form;
        await usersAPI.update(user!.id, data);
      } else {
        await usersAPI.create(form);
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
        <div>
          <label className="label">Prénom</label>
          <input value={form.firstName} onChange={e => setForm({...form, firstName: e.target.value})} className="input" required />
        </div>
        <div>
          <label className="label">Nom</label>
          <input value={form.lastName} onChange={e => setForm({...form, lastName: e.target.value})} className="input" required />
        </div>
        <div className="col-span-2">
          <label className="label">Email</label>
          <input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} className="input" required />
        </div>
        {!isEdit && (
          <div className="col-span-2">
            <label className="label">Mot de passe</label>
            <input type="password" value={form.password} onChange={e => setForm({...form, password: e.target.value})} className="input" required minLength={6} />
          </div>
        )}
        <div>
          <label className="label">Rôle</label>
          <select value={form.role} onChange={e => setForm({...form, role: e.target.value as Role})} className="input">
            {roles.map(r => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Statut</label>
          <select value={form.isActive ? 'true' : 'false'} onChange={e => setForm({...form, isActive: e.target.value === 'true'})} className="input">
            <option value="true">Actif</option>
            <option value="false">Inactif</option>
          </select>
        </div>
      </div>
      <button type="submit" disabled={loading} className="btn-primary w-full justify-center mt-2">
        {loading ? 'Enregistrement...' : isEdit ? 'Mettre à jour' : 'Créer l\'utilisateur'}
      </button>
    </form>
  );
}
