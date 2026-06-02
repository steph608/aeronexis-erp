import React, { useState } from 'react';
import { Brain, TrendingDown, Package2, AlertTriangle, FileText, Loader2, ChevronRight, Sparkles } from 'lucide-react';
import { aiAPI } from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import { Badge } from '../../components/ui';
import { formatCurrency } from '../../utils';

interface AICard {
  id: 'delays' | 'stock' | 'quality' | 'fullReport';
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  action: () => Promise<any>;
}

export function AIPage() {
  const { permissions } = useAuthStore();
  const aiPerms = permissions?.ai;
  const [results, setResults] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState<Record<string, boolean>>({});

  const cards: AICard[] = [
    {
      id: 'delays',
      title: 'Analyse des retards',
      description: 'Détection des commandes en retard et à risque, avec recommandations',
      icon: <TrendingDown size={20} />,
      color: 'orange',
      action: () => aiAPI.delays().then(r => r.data.data),
    },
    {
      id: 'stock',
      title: 'Prédiction stock',
      description: 'Prévision des ruptures et niveaux critiques de matières premières',
      icon: <Package2 size={20} />,
      color: 'blue',
      action: () => aiAPI.stock().then(r => r.data.data),
    },
    {
      id: 'quality',
      title: 'Analyse qualité',
      description: 'Analyse des incidents qualité et tendances de défauts',
      icon: <AlertTriangle size={20} />,
      color: 'red',
      action: () => aiAPI.quality().then(r => r.data.data),
    },
    {
      id: 'fullReport',
      title: 'Rapport complet',
      description: 'Rapport consolidé de toute l\'activité ERP (Admin & Directeur uniquement)',
      icon: <FileText size={20} />,
      color: 'purple',
      action: () => aiAPI.fullReport().then(r => r.data.data),
    },
  ];

  const allowed: AICard['id'][] = cards
    .filter(c => aiPerms?.[c.id])
    .map(c => c.id);

  const run = async (card: AICard) => {
    setLoading(prev => ({ ...prev, [card.id]: true }));
    try {
      const data = await card.action();
      setResults(prev => ({ ...prev, [card.id]: data }));
    } catch (e: any) {
      setResults(prev => ({ ...prev, [card.id]: { error: e.response?.data?.message || 'Erreur' } }));
    } finally {
      setLoading(prev => ({ ...prev, [card.id]: false }));
    }
  };

  const colorMap: Record<string, string> = {
    orange: 'bg-orange-50 text-orange-600 dark:bg-orange-900/20 dark:text-orange-400',
    blue: 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400',
    red: 'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400',
    purple: 'bg-purple-50 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400',
  };

  return (
    <div className="space-y-6 page-enter">
      <div className="flex items-center gap-3 p-5 rounded-2xl bg-gradient-to-r from-brand-600 to-brand-800 text-white">
        <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center">
          <Brain size={24} />
        </div>
        <div>
          <h2 className="text-lg font-bold font-display">Intelligence Artificielle ERP</h2>
          <p className="text-blue-200 text-sm">Analyses prédictives et recommandations automatisées</p>
        </div>
        <Sparkles size={20} className="ml-auto text-blue-200" />
      </div>

      {allowed.length === 0 && (
        <div className="card p-12 text-center">
          <Brain size={32} className="text-slate-400 mx-auto mb-3" />
          <p className="text-slate-700 dark:text-slate-300 font-medium">Aucun module IA accessible</p>
          <p className="text-slate-500 text-sm mt-1">Votre rôle ne permet pas l'accès aux analyses IA.</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {cards.map((card) => {
          const isAllowed = allowed.includes(card.id);
          const result = results[card.id];
          const isLoading = loading[card.id];

          return (
            <div key={card.id} className={`card overflow-hidden ${!isAllowed ? 'opacity-40' : ''}`}>
              <div className="p-5">
                <div className="flex items-start gap-4">
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${colorMap[card.color]}`}>
                    {card.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">{card.title}</h3>
                    <p className="text-xs text-slate-500 mt-0.5">{card.description}</p>
                  </div>
                  {isAllowed && (
                    <button
                      onClick={() => run(card)}
                      disabled={isLoading}
                      className="btn-secondary text-xs py-1.5 flex-shrink-0"
                    >
                      {isLoading ? <Loader2 size={13} className="animate-spin" /> : <ChevronRight size={13} />}
                      {isLoading ? 'Analyse...' : 'Analyser'}
                    </button>
                  )}
                  {!isAllowed && (
                    <Badge className="bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400 flex-shrink-0">
                      Accès restreint
                    </Badge>
                  )}
                </div>
              </div>

              {/* Results */}
              {result && !result.error && (
                <div className="border-t border-slate-100 dark:border-slate-700 p-5 bg-slate-50 dark:bg-slate-700/30">
                  <AIResultDisplay id={card.id} data={result} />
                </div>
              )}
              {result?.error && (
                <div className="border-t border-red-100 dark:border-red-900 p-4 bg-red-50 dark:bg-red-900/20">
                  <p className="text-xs text-red-600 dark:text-red-400">{result.error}</p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function AIResultDisplay({ id, data }: { id: string; data: any }) {
  if (id === 'delays') {
    return (
      <div className="space-y-3">
        <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wide">{data.analyse}</p>
        {data.commandesEnRetard?.length > 0 ? (
          <div className="space-y-2">
            <p className="text-xs text-red-600 font-medium">⚠ {data.commandesEnRetard.length} commande(s) en retard</p>
            {data.commandesEnRetard.slice(0, 3).map((c: any) => (
              <div key={c.id} className="flex items-center justify-between text-xs p-2 bg-red-50 dark:bg-red-900/20 rounded-lg">
                <span className="font-mono text-red-700 dark:text-red-300">{c.id}</span>
                <span className="text-slate-600 dark:text-slate-400">{c.client}</span>
                <span className="font-medium text-red-600">+{c.joursRetard}j</span>
              </div>
            ))}
          </div>
        ) : null}
        <div className="space-y-1">
          {data.recommandations?.map((r: string, i: number) => (
            <p key={i} className="text-xs text-slate-600 dark:text-slate-400">{r}</p>
          ))}
        </div>
      </div>
    );
  }

  if (id === 'stock') {
    const critical = data.alertes?.filter((a: any) => a.risque === 'Élevé' || a.risque === 'Critique') || [];
    return (
      <div className="space-y-2">
        <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wide">Matières à risque</p>
        {critical.length === 0 ? (
          <p className="text-xs text-green-600">✅ Aucune rupture imminente détectée</p>
        ) : critical.slice(0, 4).map((a: any) => (
          <div key={a.id} className="flex items-center justify-between text-xs p-2 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
            <span className="text-slate-700 dark:text-slate-300 truncate max-w-[160px]">{a.description}</span>
            <Badge className="bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300">{a.risque}</Badge>
            <span className="text-slate-500">{a.joursEstimes}j</span>
          </div>
        ))}
        {data.recommandations?.slice(0, 2).map((r: string, i: number) => (
          <p key={i} className="text-xs text-slate-500">{r}</p>
        ))}
      </div>
    );
  }

  if (id === 'quality') {
    return (
      <div className="space-y-2">
        <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wide">Analyse qualité</p>
        {data.tauxResolution !== undefined && (
          <p className="text-xs text-slate-600 dark:text-slate-400">
            Taux de résolution: <strong className="text-green-600">{data.tauxResolution}%</strong>
          </p>
        )}
        {data.recommandations?.slice(0, 3).map((r: string, i: number) => (
          <p key={i} className="text-xs text-slate-500">{r}</p>
        ))}
      </div>
    );
  }

  if (id === 'fullReport') {
    return (
      <div className="space-y-2">
        <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wide">Rapport consolidé</p>
        {data.kpis && (
          <div className="grid grid-cols-2 gap-2">
            {Object.entries(data.kpis).map(([k, v]: [string, any]) => (
              <div key={k} className="p-2 bg-white dark:bg-slate-800 rounded-lg">
                <p className="text-[10px] text-slate-500 capitalize">{k}</p>
                <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  {typeof v === 'number' ? (k.includes('montant') || k.includes('ca') ? formatCurrency(v) : v) : '—'}
                </p>
              </div>
            ))}
          </div>
        )}
        {data.recommandations?.slice(0, 2).map((r: string, i: number) => (
          <p key={i} className="text-xs text-slate-500">{r}</p>
        ))}
      </div>
    );
  }

  return <pre className="text-xs text-slate-500 overflow-auto max-h-40">{JSON.stringify(data, null, 2)}</pre>;
}
