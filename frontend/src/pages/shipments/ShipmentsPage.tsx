import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { shipmentsAPI } from '../../services/api';

export default function ShipmentsPage() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    id: '',
    orderId: '',
    destination: '',
    carrier: '',
    trackingNumber: '',
    scheduledDate: '',
    notes: '',
  });

  const { data, isLoading } = useQuery({
    queryKey: ['shipments'],
    queryFn: () => shipmentsAPI.getAll(),
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => shipmentsAPI.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shipments'] });
      setShowForm(false);
      setForm({ id: '', orderId: '', destination: '', carrier: '', trackingNumber: '', scheduledDate: '', notes: '' });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      shipmentsAPI.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['shipments'] }),
  });

  const shipments = data?.data?.data || [];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Livrée': return 'bg-green-100 text-green-800';
      case 'En cours': return 'bg-blue-100 text-blue-800';
      case 'Planifiée': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Expéditions</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          + Nouvelle expédition
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-xl shadow p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Créer une expédition</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">ID Expédition</label>
              <input
                className="w-full border rounded-lg px-3 py-2"
                placeholder="EXP-2026-001"
                value={form.id}
                onChange={e => setForm({ ...form, id: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">ID Commande</label>
              <input
                className="w-full border rounded-lg px-3 py-2"
                placeholder="CMD-2026-001"
                value={form.orderId}
                onChange={e => setForm({ ...form, orderId: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Destination</label>
              <input
                className="w-full border rounded-lg px-3 py-2"
                placeholder="Frankfurt, Allemagne"
                value={form.destination}
                onChange={e => setForm({ ...form, destination: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Transporteur</label>
              <input
                className="w-full border rounded-lg px-3 py-2"
                placeholder="DHL, FedEx..."
                value={form.carrier}
                onChange={e => setForm({ ...form, carrier: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Numéro de suivi</label>
              <input
                className="w-full border rounded-lg px-3 py-2"
                value={form.trackingNumber}
                onChange={e => setForm({ ...form, trackingNumber: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date prévue</label>
              <input
                type="datetime-local"
                className="w-full border rounded-lg px-3 py-2"
                value={form.scheduledDate}
                onChange={e => setForm({ ...form, scheduledDate: e.target.value })}
              />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
              <textarea
                className="w-full border rounded-lg px-3 py-2"
                rows={2}
                value={form.notes}
                onChange={e => setForm({ ...form, notes: e.target.value })}
              />
            </div>
          </div>
          <div className="flex gap-3 mt-4">
            <button
              onClick={() => createMutation.mutate(form)}
              disabled={createMutation.isPending}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {createMutation.isPending ? 'Création...' : 'Créer'}
            </button>
            <button
              onClick={() => setShowForm(false)}
              className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300"
            >
              Annuler
            </button>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="text-center py-12 text-gray-500">Chargement...</div>
      ) : (
        <div className="bg-white rounded-xl shadow overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600">ID</th>
                <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600">Commande</th>
                <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600">Destination</th>
                <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600">Transporteur</th>
                <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600">Date prévue</th>
                <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600">Statut</th>
                <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {shipments.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-gray-500">
                    Aucune expédition pour l'instant
                  </td>
                </tr>
              ) : shipments.map((s: any) => (
                <tr key={s.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono text-sm text-blue-600">{s.id}</td>
                  <td className="px-4 py-3 text-sm">{s.orderId}</td>
                  <td className="px-4 py-3 text-sm">{s.destination}</td>
                  <td className="px-4 py-3 text-sm">{s.carrier || '—'}</td>
                  <td className="px-4 py-3 text-sm">
                    {new Date(s.scheduledDate).toLocaleDateString('fr-FR')}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(s.status)}`}>
                      {s.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <select
                      className="text-sm border rounded px-2 py-1"
                      value={s.status}
                      onChange={e => updateMutation.mutate({ id: s.id, data: { status: e.target.value } })}
                    >
                      <option>Planifiée</option>
                      <option>En cours</option>
                      <option>Livrée</option>
                      <option>Annulée</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}