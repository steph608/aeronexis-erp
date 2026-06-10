import { useEffect, useState } from 'react';
import {
  Brain, TrendingDown, Package2, AlertTriangle, FileText,
  Loader2, Sparkles, TrendingUp, RefreshCw, CheckCircle2,
  Clock, ShoppingCart, Factory, ChevronRight, Zap,
  BarChart3, ArrowUp, Minus,
} from 'lucide-react';
import { aiAPI } from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import { Badge } from '../../components/ui';
import { formatCurrency } from '../../utils';

// ─── Barre de progression ─────────────────────────────────────────────────────
function ProgressBar({ value, max = 100, color = 'brand' }: { value: number; max?: number; color?: string }) {
  const pct = Math.min(100, Math.round((value / max) * 100));
  const colors: Record<string, string> = {
    brand:  'bg-brand-500',
    green:  'bg-emerald-500',
    orange: 'bg-orange-500',
    red:    'bg-red-500',
    blue:   'bg-blue-500',
    purple: 'bg-purple-500',
  };
  return (
    <div className="h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
      <div className={`h-full rounded-full transition-all duration-700 ${colors[color] || colors.brand}`} style={{ width: `${pct}%` }} />
    </div>
  );
}

// ─── Jauge circulaire SVG ────────────────────────────────────────────────────
function ScoreGauge({ score, level }: { score: number; level: string }) {
  const r = 40;
  const circ = 2 * Math.PI * r;
  const dash = (score / 100) * circ;
  const color = score >= 80 ? '#10b981' : score >= 60 ? '#f59e0b' : score >= 40 ? '#f97316' : '#ef4444';
  const levelColor = score >= 80 ? 'text-emerald-600' : score >= 60 ? 'text-amber-600' : score >= 40 ? 'text-orange-600' : 'text-red-600';

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-28 h-28">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r={r} fill="none" stroke="#e2e8f0" strokeWidth="8" />
          <circle
            cx="50" cy="50" r={r} fill="none"
            stroke={color} strokeWidth="8"
            strokeDasharray={`${dash} ${circ}`}
            strokeLinecap="round"
            className="transition-all duration-1000"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-black text-slate-900 dark:text-slate-100">{score}</span>
          <span className="text-[9px] text-slate-400 uppercase tracking-wider">/100</span>
        </div>
      </div>
      <span className={`text-sm font-bold mt-1 ${levelColor}`}>{level}</span>
    </div>
  );
}

// ─── Mini KPI card ────────────────────────────────────────────────────────────
function KpiCard({ icon, label, value, sub, color = 'slate' }: { icon: React.ReactNode; label: string; value: string | number; sub?: string; color?: string }) {
  const bg: Record<string, string> = {
    slate:  'bg-slate-50 dark:bg-slate-800',
    red:    'bg-red-50 dark:bg-red-900/20',
    orange: 'bg-orange-50 dark:bg-orange-900/20',
    green:  'bg-emerald-50 dark:bg-emerald-900/20',
    blue:   'bg-blue-50 dark:bg-blue-900/20',
    purple: 'bg-purple-50 dark:bg-purple-900/20',
  };
  const iconColor: Record<string, string> = {
    slate: 'text-slate-500', red: 'text-red-500', orange: 'text-orange-500',
    green: 'text-emerald-500', blue: 'text-blue-500', purple: 'text-purple-500',
  };
  return (
    <div className={`rounded-xl p-3 ${bg[color] || bg.slate}`}>
      <div className="flex items-center gap-2 mb-1">
        <span className={iconColor[color] || iconColor.slate}>{icon}</span>
        <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">{label}</span>
      </div>
      <p className="text-xl font-black text-slate-900 dark:text-slate-100">{value}</p>
      {sub && <p className="text-[10px] text-slate-400 mt-0.5">{sub}</p>}
    </div>
  );
}

// ─── Section résultat générique ───────────────────────────────────────────────
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{title}</p>
      {children}
    </div>
  );
}

// ─── Recommandation row ───────────────────────────────────────────────────────
function Reco({ text }: { text: string }) {
  const isOk    = text.startsWith('✅');
  const isWarn  = text.startsWith('⚠️');
  const isAlert = text.startsWith('🚨');
  const bg = isOk ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800' :
             isAlert ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800' :
             isWarn  ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800' :
             'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700';
  return (
    <div className={`text-xs px-3 py-2 rounded-lg border ${bg} text-slate-700 dark:text-slate-300`}>{text}</div>
  );
}

// ─── Résultats Retards ────────────────────────────────────────────────────────
function ResultDelays({ data }: { data: any }) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <KpiCard icon={<AlertTriangle size={14} />} label="En retard" value={data.commandesEnRetard?.length ?? 0} color={data.commandesEnRetard?.length ? 'red' : 'green'} />
        <KpiCard icon={<Clock size={14} />} label="À risque (7j)" value={data.commandesArisque?.length ?? 0} color={data.commandesArisque?.length ? 'orange' : 'green'} />
      </div>

      {data.commandesEnRetard?.length > 0 && (
        <Section title={`${data.commandesEnRetard.length} commande(s) en retard`}>
          <div className="space-y-1.5">
            {data.commandesEnRetard.map((c: any) => (
              <div key={c.id} className="flex items-center justify-between text-xs p-2.5 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-100 dark:border-red-800">
                <span className="font-mono font-semibold text-red-700 dark:text-red-300">{c.id}</span>
                <span className="text-slate-500 truncate max-w-[120px]">{c.client}</span>
                <span className="font-bold text-red-600 flex items-center gap-0.5"><ArrowUp size={10} />+{c.joursRetard}j</span>
              </div>
            ))}
          </div>
        </Section>
      )}

      {data.commandesArisque?.length > 0 && (
        <Section title="Commandes à risque">
          <div className="space-y-1.5">
            {data.commandesArisque.map((c: any) => (
              <div key={c.id} className="flex items-center justify-between text-xs p-2.5 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-100 dark:border-amber-800">
                <span className="font-mono font-semibold text-amber-700 dark:text-amber-300">{c.id}</span>
                <span className="text-slate-500">{c.client}</span>
                <span className="font-medium text-amber-600">{c.joursRestants}j restants</span>
              </div>
            ))}
          </div>
        </Section>
      )}

      <Section title="Recommandations">
        <div className="space-y-1.5">
          {data.recommandations?.map((r: string, i: number) => <Reco key={i} text={r} />)}
        </div>
      </Section>
    </div>
  );
}

// ─── Résultats Stock ──────────────────────────────────────────────────────────
function ResultStock({ data }: { data: any }) {
  const all = data.alertes || [];
  const critique = all.filter((a: any) => a.risqueRupture === 'Critique');
  const eleve    = all.filter((a: any) => a.risqueRupture === 'Élevé');
  const moyen    = all.filter((a: any) => a.risqueRupture === 'Moyen');

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-2">
        <KpiCard icon={<Zap size={13} />} label="Critique" value={critique.length} color={critique.length ? 'red' : 'green'} />
        <KpiCard icon={<AlertTriangle size={13} />} label="Élevé" value={eleve.length} color={eleve.length ? 'orange' : 'green'} />
        <KpiCard icon={<Minus size={13} />} label="Moyen" value={moyen.length} color={moyen.length ? 'blue' : 'green'} />
      </div>

      {[...critique, ...eleve].slice(0, 5).map((a: any) => {
        const barColor = a.risqueRupture === 'Critique' ? 'red' : 'orange';
        return (
          <div key={a.id} className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium text-slate-700 dark:text-slate-300 truncate max-w-[180px]">{a.materiau}</span>
              <Badge className={a.risqueRupture === 'Critique' ? 'bg-red-100 text-red-700 text-[10px]' : 'bg-orange-100 text-orange-700 text-[10px]'}>
                {a.joursAvantRupture}j
              </Badge>
            </div>
            <ProgressBar value={a.stockDisponible} max={a.stockMinimum * 2} color={barColor} />
            <p className="text-[10px] text-slate-400">{a.stockDisponible} / min. {a.stockMinimum} {a.unite}</p>
          </div>
        );
      })}

      <Section title="Recommandations">
        <div className="space-y-1.5">
          {data.recommandations?.map((r: string, i: number) => <Reco key={i} text={r} />)}
        </div>
      </Section>
    </div>
  );
}

// ─── Résultats Qualité ────────────────────────────────────────────────────────
function ResultQuality({ data }: { data: any }) {
  const stats = data.statistiques || {};
  const parSev = stats.parSeverite || {};

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <KpiCard icon={<BarChart3 size={13} />} label="Total incidents" value={stats.total ?? 0} />
        <KpiCard icon={<CheckCircle2 size={13} />} label="Taux résolution" value={`${stats.tauxResolution ?? 0}%`} color={stats.tauxResolution >= 70 ? 'green' : stats.tauxResolution >= 40 ? 'orange' : 'red'} />
      </div>

      {/* Taux résolution barre */}
      <div className="space-y-1">
        <div className="flex justify-between text-xs text-slate-500">
          <span>Taux de résolution</span>
          <span className="font-semibold">{stats.tauxResolution ?? 0}%</span>
        </div>
        <ProgressBar value={stats.tauxResolution ?? 0} color={stats.tauxResolution >= 70 ? 'green' : stats.tauxResolution >= 40 ? 'orange' : 'red'} />
      </div>

      {/* Répartition par sévérité */}
      {Object.keys(parSev).length > 0 && (
        <Section title="Répartition par sévérité">
          <div className="space-y-1.5">
            {Object.entries(parSev).map(([sev, count]: [string, any]) => {
              const c = sev === 'Critique' ? 'red' : sev === 'Majeur' ? 'orange' : sev === 'Mineur' ? 'blue' : 'slate';
              return (
                <div key={sev} className="flex items-center gap-2">
                  <span className="text-xs text-slate-600 dark:text-slate-400 w-24">{sev}</span>
                  <div className="flex-1"><ProgressBar value={count} max={stats.total || 1} color={c} /></div>
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 w-6 text-right">{count}</span>
                </div>
              );
            })}
          </div>
        </Section>
      )}

      {/* Incidents critiques non résolus */}
      {data.critiqueNonResolus?.length > 0 && (
        <Section title={`${data.critiqueNonResolus.length} critique(s) non résolu(s)`}>
          <div className="space-y-1.5">
            {data.critiqueNonResolus.map((i: any) => (
              <div key={i.id} className="p-2.5 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-100 dark:border-red-800">
                <div className="flex items-center justify-between mb-0.5">
                  <span className="text-xs font-semibold text-red-700 dark:text-red-300">{i.anomalie}</span>
                  <span className="text-[10px] font-mono text-red-500">{i.lot}</span>
                </div>
                <p className="text-[11px] text-slate-500">{i.produit}</p>
              </div>
            ))}
          </div>
        </Section>
      )}

      <Section title="Recommandations">
        <div className="space-y-1.5">
          {data.recommandations?.map((r: string, i: number) => <Reco key={i} text={r} />)}
        </div>
      </Section>
    </div>
  );
}

// ─── Résultats Marges ────────────────────────────────────────────────────────
function ResultMargins({ data }: { data: any }) {
  const produits = data.produits || [];
  const total = data.totalRevenu || 0;

  return (
    <div className="space-y-4">
      <KpiCard icon={<TrendingUp size={14} />} label="Chiffre d'affaires total" value={formatCurrency(total)} color="green" />

      {produits.slice(0, 6).map((p: any) => {
        const pct = total > 0 ? Math.round((p.totalRevenue / total) * 100) : 0;
        return (
          <div key={p.id} className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium text-slate-700 dark:text-slate-300 truncate max-w-[160px]">{p.description}</span>
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className="text-slate-400">{pct}%</span>
                <span className="font-semibold text-slate-900 dark:text-slate-100">{formatCurrency(p.totalRevenue)}</span>
              </div>
            </div>
            <ProgressBar value={p.totalRevenue} max={total} color="brand" />
            <p className="text-[10px] text-slate-400">Qté : {p.totalQty} · {p.nbCommandes} commande(s) · PU : {formatCurrency(p.unitPrice)}</p>
          </div>
        );
      })}

      <Section title="Recommandations">
        <div className="space-y-1.5">
          {data.recommandations?.map((r: string, i: number) => <Reco key={i} text={r} />)}
        </div>
      </Section>
    </div>
  );
}

// ─── Résultats Rapport complet ────────────────────────────────────────────────
function ResultFullReport({ data }: { data: any }) {
  return (
    <div className="space-y-4">
      {data.scoreGlobal && (
        <div className="flex items-center gap-4 p-4 bg-slate-50 dark:bg-slate-700/30 rounded-xl">
          <ScoreGauge score={data.scoreGlobal.score} level={data.scoreGlobal.niveau} />
          <div className="flex-1">
            <p className="text-xs font-semibold text-slate-700 dark:text-slate-200 mb-2">Score de santé global</p>
            <div className="space-y-1 text-xs text-slate-500">
              <p>Généré le {new Date(data.date).toLocaleString('fr-FR')}</p>
              <p>{data.alertesPrioritaires?.length ?? 0} alerte(s) prioritaire(s) identifiée(s)</p>
            </div>
          </div>
        </div>
      )}

      {data.alertesPrioritaires?.length > 0 && (
        <Section title="Alertes prioritaires">
          <div className="space-y-1.5">
            {data.alertesPrioritaires.map((r: string, i: number) => <Reco key={i} text={r} />)}
          </div>
        </Section>
      )}
    </div>
  );
}

// ─── Page principale ──────────────────────────────────────────────────────────
interface AnalysisCard {
  id: 'delays' | 'stock' | 'quality' | 'margins' | 'fullReport';
  title: string;
  description: string;
  icon: React.ReactNode;
  gradient: string;
  iconBg: string;
  action: () => Promise<any>;
  ResultComponent: React.FC<{ data: any }>;
}

// ─── Rendu texte IA (markdown simplifié) ────────────────────────────────────
function AITextResult({ text }: { text: string }) {
  const lines = text.split('\n').filter(Boolean);
  return (
    <div className="space-y-1.5 text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
      {lines.map((line, i) => {
        if (line.startsWith('## ')) return <p key={i} className="font-bold text-sm text-slate-900 dark:text-slate-100 mt-3 first:mt-0">{line.slice(3)}</p>;
        if (line.startsWith('# '))  return <p key={i} className="font-black text-base text-slate-900 dark:text-slate-100">{line.slice(2)}</p>;
        if (line.startsWith('**') && line.endsWith('**')) return <p key={i} className="font-semibold text-slate-800 dark:text-slate-200">{line.slice(2, -2)}</p>;
        if (line.startsWith('- ') || line.startsWith('• ')) return (
          <div key={i} className="flex gap-2">
            <span className="text-brand-500 mt-0.5">•</span>
            <span>{line.slice(2)}</span>
          </div>
        );
        if (/^\d+\./.test(line)) return (
          <div key={i} className="flex gap-2">
            <span className="text-brand-500 font-semibold flex-shrink-0">{line.match(/^\d+/)?.[0]}.</span>
            <span>{line.replace(/^\d+\.\s*/, '')}</span>
          </div>
        );
        return <p key={i}>{line}</p>;
      })}
    </div>
  );
}

// ─── Suggestions proactives ───────────────────────────────────────────────────
const PRIORITY_STYLE: Record<string, string> = {
  haute:   'bg-white dark:bg-slate-800 border-red-200 dark:border-red-800 text-red-700 dark:text-red-300',
  moyenne: 'bg-white dark:bg-slate-800 border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300',
  info:    'bg-white dark:bg-slate-800 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300',
};
const PRIORITY_DOT: Record<string, string> = { haute: 'bg-red-500', moyenne: 'bg-amber-500', info: 'bg-blue-500' };

function SuggestionsSection() {
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [loading, setLoading]         = useState(true);

  const load = () => {
    setLoading(true);
    aiAPI.suggestions()
      .then(r => setSuggestions(r.data.data || []))
      .catch(() => setSuggestions([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  if (loading) return (
    <div className="card p-4 flex items-center gap-3 text-sm text-slate-400">
      <Loader2 size={16} className="animate-spin text-brand-500" />
      Analyse des données en cours — suggestions IA...
    </div>
  );

  if (!suggestions.length) return null;

  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Sparkles size={15} className="text-brand-500" />
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Suggestions proactives</h3>
          <span className="text-[10px] bg-brand-100 dark:bg-brand-900/30 text-brand-700 dark:text-brand-300 px-2 py-0.5 rounded-full font-semibold">Llama 3.1</span>
        </div>
        <button onClick={load} className="w-7 h-7 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center justify-center transition-colors">
          <RefreshCw size={13} className="text-slate-400" />
        </button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {suggestions.map((s, i) => (
          <div key={i} className={`flex gap-3 p-3 rounded-xl border ${PRIORITY_STYLE[s.priority] || PRIORITY_STYLE.info}`}>
            <div className={`w-2 h-2 rounded-full mt-1 flex-shrink-0 ${PRIORITY_DOT[s.priority] || PRIORITY_DOT.info}`} />
            <div>
              <p className="text-xs font-semibold leading-tight">{s.title}</p>
              <p className="text-[11px] opacity-80 mt-0.5 leading-relaxed">{s.detail}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function AIPage() {
  const { permissions } = useAuthStore();
  const aiPerms = permissions?.ai;
  const [summary, setSummary]           = useState<any>(null);
  const [results, setResults]           = useState<Record<string, any>>({});
  const [loading, setLoading]           = useState<Record<string, boolean>>({});
  const [showResults, setShowResults]   = useState<Record<string, boolean>>({});
  const [aiTexts, setAiTexts]           = useState<Record<string, string>>({});
  const [aiLoading, setAiLoading]       = useState<Record<string, boolean>>({});
  const [showAiTexts, setShowAiTexts]   = useState<Record<string, boolean>>({});
  const [loadingSum, setLoadingSum]     = useState(true);

  useEffect(() => {
    aiAPI.summary()
      .then(r => setSummary(r.data.data))
      .catch(() => {})
      .finally(() => setLoadingSum(false));
  }, []);

  const cards: AnalysisCard[] = [
    {
      id: 'delays', title: 'Retards & Livraisons',
      description: 'Commandes en retard, à risque, et recommandations de rattrapage',
      icon: <TrendingDown size={18} />,
      gradient: 'from-orange-500 to-red-500',
      iconBg: 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400',
      action: () => aiAPI.delays().then(r => r.data.data),
      ResultComponent: ResultDelays,
    },
    {
      id: 'stock', title: 'Prédiction Stock',
      description: 'Ruptures imminentes, niveaux critiques et commandes fournisseurs à planifier',
      icon: <Package2 size={18} />,
      gradient: 'from-blue-500 to-cyan-500',
      iconBg: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
      action: () => aiAPI.stock().then(r => r.data.data),
      ResultComponent: ResultStock,
    },
    {
      id: 'quality', title: 'Qualité & Incidents',
      description: 'Taux de résolution, tendances de défauts, incidents critiques en cours',
      icon: <AlertTriangle size={18} />,
      gradient: 'from-red-500 to-pink-500',
      iconBg: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400',
      action: () => aiAPI.quality().then(r => r.data.data),
      ResultComponent: ResultQuality,
    },
    {
      id: 'margins', title: 'Répartition CA Produits',
      description: 'Chiffre d\'affaires par produit, top vendeurs et part de marché interne',
      icon: <TrendingUp size={18} />,
      gradient: 'from-emerald-500 to-teal-500',
      iconBg: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400',
      action: () => aiAPI.margins().then(r => r.data.data),
      ResultComponent: ResultMargins,
    },
    {
      id: 'fullReport', title: 'Rapport Global',
      description: 'Synthèse complète avec score de santé, alertes prioritaires et plan d\'action',
      icon: <FileText size={18} />,
      gradient: 'from-purple-500 to-indigo-500',
      iconBg: 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400',
      action: () => aiAPI.fullReport().then(r => r.data.data),
      ResultComponent: ResultFullReport,
    },
  ];

  const run = async (card: AnalysisCard) => {
    // Si déjà affiché → toggle fermeture
    if (results[card.id] && showResults[card.id]) {
      setShowResults(p => ({ ...p, [card.id]: false }));
      return;
    }
    // Si données déjà chargées → juste réafficher
    if (results[card.id]) {
      setShowResults(p => ({ ...p, [card.id]: true }));
      return;
    }
    setLoading(p => ({ ...p, [card.id]: true }));
    try {
      const data = await card.action();
      setResults(p => ({ ...p, [card.id]: data }));
      setShowResults(p => ({ ...p, [card.id]: true }));
    } catch (e: any) {
      setResults(p => ({ ...p, [card.id]: { error: e.response?.data?.message || 'Erreur lors de l\'analyse' } }));
      setShowResults(p => ({ ...p, [card.id]: true }));
    } finally {
      setLoading(p => ({ ...p, [card.id]: false }));
    }
  };

  const runAI = async (id: string) => {
    // Si déjà affiché → toggle fermeture
    if (aiTexts[id] && showAiTexts[id]) {
      setShowAiTexts(p => ({ ...p, [id]: false }));
      return;
    }
    // Si texte déjà chargé → juste réafficher
    if (aiTexts[id]) {
      setShowAiTexts(p => ({ ...p, [id]: true }));
      return;
    }
    setAiLoading(p => ({ ...p, [id]: true }));
    try {
      const type = id === 'fullReport' ? 'report' : id === 'delays' ? 'delays' : id === 'stock' ? 'stock' : id === 'quality' ? 'quality' : 'margins';
      const res = await aiAPI.analyze(type);
      setAiTexts(p => ({ ...p, [id]: res.data.data.analysis }));
      setShowAiTexts(p => ({ ...p, [id]: true }));
    } catch {
      setAiTexts(p => ({ ...p, [id]: 'Impossible de contacter le service IA. Vérifiez votre connexion.' }));
      setShowAiTexts(p => ({ ...p, [id]: true }));
    } finally {
      setAiLoading(p => ({ ...p, [id]: false }));
    }
  };


  return (
    <div className="space-y-6 page-enter">

      {/* ── Hero banner ── */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-brand-900 to-slate-900 p-6 text-white">
        {/* Décoration */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-brand-500/10 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-24 w-32 h-32 bg-purple-500/10 rounded-full translate-y-1/2" />

        <div className="relative flex flex-wrap items-center gap-6">
          {/* Titre */}
          <div className="flex items-center gap-3 flex-1 min-w-[200px]">
            <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur flex items-center justify-center flex-shrink-0">
              <Brain size={24} className="text-brand-300" />
            </div>
            <div>
              <h2 className="text-lg font-black font-display tracking-tight">Intelligence Artificielle</h2>
              <p className="text-slate-400 text-xs mt-0.5">Analyses prédictives · Recommandations · Alertes</p>
            </div>
          </div>

          {/* Score de santé */}
          <div className="flex items-center gap-6 flex-wrap">
            {loadingSum ? (
              <div className="flex items-center gap-2 text-slate-400">
                <Loader2 size={14} className="animate-spin" />
                <span className="text-xs">Calcul du score...</span>
              </div>
            ) : summary ? (
              <>
                {/* Jauge circulaire */}
                <div className="flex flex-col items-center gap-1">
                  <ScoreGauge score={summary.healthScore} level={summary.healthLevel} />
                  <p className="text-[10px] text-slate-400 uppercase tracking-wider">Score Santé</p>
                </div>

                {/* KPIs */}
                <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 text-xs">
                  {[
                    { icon: <ShoppingCart size={11} />, label: 'Commandes',   value: summary.totalOrders,   warn: false },
                    { icon: <AlertTriangle size={11} />, label: 'En retard',   value: summary.lateOrders,    warn: summary.lateOrders > 0 },
                    { icon: <Factory size={11} />,       label: 'OFs actifs',  value: summary.ofEnCours,     warn: false },
                    { icon: <Zap size={11} />,           label: 'Critiques',   value: summary.critiques,     warn: summary.critiques > 0 },
                    { icon: <Package2 size={11} />,      label: 'Alertes stock', value: summary.stockAlertes ?? 0, warn: (summary.stockAlertes ?? 0) > 0 },
                  ].map(k => (
                    <div key={k.label} className="flex items-center gap-1.5">
                      <span className={k.warn ? 'text-red-400' : 'text-slate-400'}>{k.icon}</span>
                      <span className="text-slate-400">{k.label} :</span>
                      <span className={`font-bold ${k.warn ? 'text-red-300' : 'text-white'}`}>{k.value}</span>
                    </div>
                  ))}
                </div>

                {/* CA */}
                <div className="text-right">
                  <p className="text-[10px] text-slate-400">Chiffre d'affaires</p>
                  <p className="text-lg font-black text-emerald-400">{formatCurrency(summary.totalRevenu)}</p>
                </div>
              </>
            ) : null}
            <button
              onClick={() => { setLoadingSum(true); aiAPI.summary().then(r => setSummary(r.data.data)).finally(() => setLoadingSum(false)); }}
              className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
              title="Actualiser"
            >
              <RefreshCw size={14} className={loadingSum ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>
      </div>

      {/* ── Suggestions proactives IA ── */}
      <SuggestionsSection />

      {/* ── Grille d'analyses ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {cards.map((card) => {
          const isAllowed   = aiPerms?.[card.id] !== false;
          const result      = results[card.id];
          const isLoading   = loading[card.id];
          const hasResult   = result && !result.error && showResults[card.id];
          const hasError    = result?.error && showResults[card.id];
          const aiText      = aiTexts[card.id];
          const isAiLoading = aiLoading[card.id];
          const showAiText  = showAiTexts[card.id];

          return (
            <div key={card.id} className={`card overflow-hidden flex flex-col ${!isAllowed ? 'opacity-40 pointer-events-none' : ''}`}>
              {/* Header carte */}
              <div className="p-5 flex-1">
                <div className="flex items-start gap-3 mb-4">
                  <div className="w-9 h-9 rounded-lg bg-slate-100 dark:bg-slate-700 flex items-center justify-center flex-shrink-0 text-slate-500 dark:text-slate-400">
                    {card.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">{card.title}</h3>
                    <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">{card.description}</p>
                  </div>
                </div>

                {/* Boutons côte à côte */}
                <div className="flex gap-2">
                  <button
                    onClick={() => run(card)}
                    disabled={isLoading}
                    className="flex-1 flex items-center justify-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all disabled:opacity-50"
                  >
                    {isLoading
                      ? <><Loader2 size={12} className="animate-spin" /> Calcul...</>
                      : results[card.id] && showResults[card.id]
                      ? <><ChevronRight size={12} className="rotate-90" /> Masquer</>
                      : results[card.id]
                      ? <><BarChart3 size={12} /> Afficher</>
                      : <><BarChart3 size={12} /> Chiffres</>}
                  </button>
                  <button
                    onClick={() => runAI(card.id)}
                    disabled={isAiLoading}
                    className="flex-1 flex items-center justify-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg bg-brand-600 hover:bg-brand-700 text-white transition-all disabled:opacity-50"
                  >
                    {isAiLoading
                      ? <><Loader2 size={12} className="animate-spin" /> IA...</>
                      : aiTexts[card.id] && showAiTexts[card.id]
                      ? <><ChevronRight size={12} className="rotate-90" /> Masquer IA</>
                      : aiTexts[card.id]
                      ? <><Sparkles size={12} /> Afficher IA</>
                      : <><Sparkles size={12} /> Analyse IA</>}
                  </button>
                </div>
              </div>

              {/* Résultats chiffrés */}
              {hasResult && (
                <div className="border-t border-slate-100 dark:border-slate-700 p-5 bg-slate-50/50 dark:bg-slate-700/20">
                  <card.ResultComponent data={result} />
                </div>
              )}

              {/* Analyse IA */}
              {(isAiLoading || (aiText && showAiText)) && (
                <div className="border-t border-brand-100 dark:border-brand-900/30 p-5 bg-brand-50/30 dark:bg-brand-900/10">
                  <div className="flex items-center gap-2 mb-3">
                    <Sparkles size={12} className="text-brand-500" />
                    <span className="text-[10px] font-bold text-brand-600 dark:text-brand-400 uppercase tracking-wider">Analyse Llama 3.1</span>
                  </div>
                  {isAiLoading
                    ? <div className="flex items-center gap-2 text-xs text-slate-400"><Loader2 size={12} className="animate-spin" /> Analyse en cours...</div>
                    : <AITextResult text={aiText!} />
                  }
                </div>
              )}

              {/* Erreur */}
              {hasError && (
                <div className="border-t border-red-100 dark:border-red-900 p-4 bg-red-50 dark:bg-red-900/20">
                  <p className="text-xs text-red-600 dark:text-red-400 flex items-center gap-2">
                    <AlertTriangle size={12} /> {result.error}
                  </p>
                </div>
              )}

              {/* État vide */}
              {!results[card.id] && !isLoading && !aiTexts[card.id] && !isAiLoading && (
                <div className="border-t border-slate-100 dark:border-slate-700 p-6 text-center">
                  <div className={`w-10 h-10 rounded-xl mx-auto mb-2 flex items-center justify-center ${card.iconBg} opacity-40`}>{card.icon}</div>
                  <p className="text-xs text-slate-400">
                    <strong>Chiffres</strong> pour les données · <strong>Analyse IA</strong> pour le commentaire GPT
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
