import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AlertTriangle, Package2, X, Save, CheckCircle2 } from 'lucide-react';
import { notificationsAPI, materialsAPI } from '../../services/api';

interface StockAlertsModalProps {
  onClose: () => void;
}

export function StockAlertsModal({ onClose }: StockAlertsModalProps) {
  const queryClient = useQueryClient();
  const [notes, setNotes] = useState<Record<number, string>>({});

  const { data: alertsData, isLoading } = useQuery({
    queryKey: ['notifications', 'stock'],
    queryFn:  () => notificationsAPI.getStockAlerts(),
  });

  const { data: materialsData } = useQuery({
    queryKey: ['materials', 'alerts'],
    queryFn:  () => materialsAPI.getAlerts(),
  });

  const notifAlerts: any[] = alertsData?.data?.data  ?? [];
  const matAlerts:   any[] = materialsData?.data?.data ?? [];

  const merged = notifAlerts.map(n => ({
    notif: n,
    mat:   matAlerts.find((m: any) => m.id === n.materialId),
  }));

  const saveNote = useMutation({
    mutationFn: ({ id, note }: { id: number; note: string }) =>
      notificationsAPI.updateNote(id, note),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const resolve = useMutation({
    mutationFn: (id: number) => notificationsAPI.markRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications', 'stock'] });
    },
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      <div className="relative bg-white dark:bg-slate-900 rounded-lg shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-200 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-800/60 flex-shrink-0">
          <div className="flex items-center gap-2">
            <AlertTriangle size={15} className="text-amber-500" />
            <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-100 uppercase tracking-[0.06em]">
              Alertes de rupture de stock
            </h2>
            {notifAlerts.length > 0 && (
              <span className="ml-1 bg-red-500 text-white text-[10px] font-bold rounded-full px-1.5 py-0.5 leading-none">
                {notifAlerts.length}
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded flex items-center justify-center hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400 transition-colors"
          >
            <X size={14} />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 p-4 space-y-4">

          {isLoading && (
            <div className="py-10 text-center text-sm text-slate-400">Chargement…</div>
          )}

          {!isLoading && merged.length === 0 && (
            <div className="flex flex-col items-center justify-center py-14 text-center">
              <CheckCircle2 size={36} className="text-blue-400 mb-3" />
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">Aucune rupture de stock active</p>
              <p className="text-xs text-slate-400 mt-1">Tous les stocks sont au-dessus du seuil minimum.</p>
            </div>
          )}

          {merged.map(({ notif, mat }) => {
            const dispo  = mat?.stockDisponible ?? null;
            const manque = mat?.manque          ?? null;
            const note   = notes[notif.id] ?? notif.note ?? '';

            const pct = mat
              ? Math.min(100, Math.round(((mat.currentStock - mat.reservedStock) / (mat.minimumStock || 1)) * 100))
              : 0;

            return (
              <div
                key={notif.id}
                className="border border-amber-200 dark:border-amber-800/40 rounded-lg bg-amber-50/30 dark:bg-amber-900/10 overflow-hidden"
              >
                {/* En-tête carte */}
                <div className="flex items-center gap-3 px-4 py-3 bg-amber-50 dark:bg-amber-900/20 border-b border-amber-100 dark:border-amber-800/30">
                  <Package2 size={14} className="text-amber-500 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-semibold text-slate-800 dark:text-slate-100">{notif.title}</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">{new Date(notif.createdAt).toLocaleString('fr-FR')}</p>
                  </div>
                  {/* Jauge */}
                  {mat && (
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <div className="w-20 h-1.5 rounded-full bg-slate-200 dark:bg-slate-700">
                        <div className="h-1.5 rounded-full bg-red-400" style={{ width: `${pct}%` }} />
                      </div>
                      <span className="text-[10px] font-mono text-red-500 font-bold">{pct}%</span>
                    </div>
                  )}
                </div>

                <div className="px-4 py-3 space-y-3">
                  {/* Grille de stats */}
                  {mat && (
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { label: 'Stock actuel',  val: `${mat.currentStock} ${mat.unit}`,                      danger: false },
                        { label: 'Réservé',        val: `${mat.reservedStock} ${mat.unit}`,                     danger: false },
                        { label: 'Disponible',     val: `${dispo} ${mat.unit}`,                                 danger: true  },
                        { label: 'Seuil minimum',  val: `${mat.minimumStock} ${mat.unit}`,                      danger: false },
                        { label: 'Manquant',       val: `${(manque ?? 0).toFixed(1)} ${mat.unit}`,              danger: true  },
                        { label: 'Fournisseur',    val: mat.supplier,                                           danger: false },
                      ].map(({ label, val, danger }) => (
                        <div key={label} className="bg-white dark:bg-slate-800 rounded p-2 border border-slate-100 dark:border-slate-700">
                          <p className="text-[10px] text-slate-400 uppercase tracking-[0.06em] mb-0.5">{label}</p>
                          <p className={`text-[12px] font-semibold font-mono truncate ${danger ? 'text-red-500' : 'text-slate-800 dark:text-slate-100'}`}>
                            {val}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Champ note — toujours visible */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-[0.07em] mb-1">
                      Note / Action prévue
                    </label>
                    <textarea
                      value={note}
                      onChange={e => setNotes(prev => ({ ...prev, [notif.id]: e.target.value }))}
                      rows={2}
                      placeholder="Ex : Commande fournisseur envoyée le 10/06, livraison prévue sous 7 jours…"
                      className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-slate-800 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
                    />
                    {/* Affiche la note sauvegardée si présente */}
                    {notif.note && !notes[notif.id] && (
                      <p className="text-[11px] text-slate-400 mt-1 italic">Note enregistrée : {notif.note}</p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 justify-end">
                    <button
                      onClick={() => resolve.mutate(notif.id)}
                      disabled={resolve.isPending}
                      className="flex items-center gap-1.5 text-xs h-7 px-3 border border-slate-200 dark:border-slate-600 rounded text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors disabled:opacity-50"
                    >
                      <CheckCircle2 size={12} />
                      Marquer résolu
                    </button>
                    <button
                      onClick={() => saveNote.mutate({ id: notif.id, note })}
                      disabled={saveNote.isPending || !note.trim()}
                      className="flex items-center gap-1.5 text-xs h-7 px-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white rounded transition-colors"
                    >
                      <Save size={12} />
                      {saveNote.isPending ? 'Enregistrement…' : 'Sauvegarder'}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-2.5 border-t border-slate-200 dark:border-slate-700 bg-slate-50/40 dark:bg-slate-800/30 flex-shrink-0">
          <p className="text-xs text-slate-400">
            {merged.length} rupture{merged.length !== 1 ? 's' : ''} active{merged.length !== 1 ? 's' : ''}
          </p>
          <button
            onClick={onClose}
            className="text-xs h-7 px-4 border border-slate-200 dark:border-slate-600 rounded text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
}
