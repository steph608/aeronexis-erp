import { useEffect, useState } from 'react';
import {
  ShoppingCart, Factory, AlertTriangle, Package2,
  TrendingUp, CheckCircle2,
  ArrowRight, BarChart3
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';
import { dashboardAPI } from '../../services/api';
import type { DashboardData } from '../../types';
import { StatCard, PageLoader, ErrorState, Badge } from '../../components/ui';
import { useAuthStore } from '../../store/authStore';
import {
  formatCurrency, formatDate, getOrderStatusColor,
  getOFStatusColor, getIncidentSeverityColor, getPriorityColor, daysUntil
} from '../../utils';
import { NavLink } from 'react-router-dom';

// Simulated chart data (in production would come from API)
const monthlyData = [
  { name: 'Oct', commandes: 8, ca: 420000 },
  { name: 'Nov', commandes: 11, ca: 560000 },
  { name: 'Déc', commandes: 7, ca: 380000 },
  { name: 'Jan', commandes: 14, ca: 780000 },
  { name: 'Fév', commandes: 12, ca: 920000 },
  { name: 'Mar', commandes: 9, ca: 650000 },
];

export function DashboardPage() {
  const { user } = useAuthStore();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await dashboardAPI.get();
      setData(res.data.data);
    } catch (e: any) {
      setError(e.response?.data?.message || 'Erreur de chargement du dashboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  if (loading) return <PageLoader />;
  if (error) return <ErrorState message={error} onRetry={load} />;
  if (!data) return null;

  const { kpis } = data;

  // Pie chart data for order status
  const orderStatusData = [
    { name: 'En production', value: kpis.commandes.enProduction, color: '#2563eb' },
    { name: 'Planifiées', value: kpis.commandes.planifiees, color: '#f59e0b' },
    { name: 'Terminées', value: kpis.commandes.terminees, color: '#10b981' },
  ].filter(d => d.value > 0);

  return (
    <div className="space-y-6 page-enter">
      {/* Welcome header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white font-display">
            Bonjour, {user?.firstName} 👋
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Vue d'ensemble de la plateforme AERONEXIS · {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
        </div>
        <button onClick={load} className="btn-secondary text-xs">
          Actualiser
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard
          title="Chiffre d'affaires"
          value={formatCurrency(kpis.commandes.chiffreAffaires)}
          subtitle={`${kpis.commandes.total} commandes`}
          icon={<TrendingUp size={18} />}
          color="blue"
        />
        <StatCard
          title="En production"
          value={kpis.commandes.enProduction}
          subtitle={`${kpis.commandes.planifiees} planifiées`}
          icon={<ShoppingCart size={18} />}
          color="cyan"
        />
        <StatCard
          title="OFs actifs"
          value={kpis.production.enCours}
          subtitle={`Rendement ${kpis.production.tauxRendement}%`}
          icon={<Factory size={18} />}
          color="purple"
        />
        <StatCard
          title="Incidents critiques"
          value={kpis.incidents.critiques}
          subtitle={`Taux résolution ${kpis.incidents.tauxResolution}%`}
          icon={<AlertTriangle size={18} />}
          color={kpis.incidents.critiques > 0 ? 'red' : 'green'}
        />
        <StatCard
          title="Alertes stock"
          value={kpis.stock.alertesRupture}
          subtitle={`${kpis.stock.totalMatieres} matières`}
          icon={<Package2 size={18} />}
          color={kpis.stock.alertesRupture > 0 ? 'orange' : 'green'}
        />
      </div>

      {/* Charts + Lists row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Trend chart */}
        <div className="card p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Évolution des commandes</h3>
              <p className="text-xs text-slate-500 mt-0.5">6 derniers mois</p>
            </div>
            <BarChart3 size={18} className="text-slate-400" />
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={monthlyData} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
              <defs>
                <linearGradient id="caGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2563eb" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ background: '#1e293b', border: 'none', borderRadius: 8, fontSize: 12 }}
                labelStyle={{ color: '#94a3b8' }}
                formatter={(v: any, n: any) => [n === 'ca' ? formatCurrency(v) : v, n === 'ca' ? "CA" : "Commandes"]}
              />
              <Area type="monotone" dataKey="ca" stroke="#2563eb" strokeWidth={2} fill="url(#caGradient)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Order status donut */}
        <div className="card p-5">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-1">Statut commandes</h3>
          <p className="text-xs text-slate-500 mb-4">Répartition actuelle</p>
          {orderStatusData.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={130}>
                <PieChart>
                  <Pie
                    data={orderStatusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={60}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {orderStatusData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ background: '#1e293b', border: 'none', borderRadius: 8, fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2 mt-2">
                {orderStatusData.map((d) => (
                  <div key={d.name} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.color }} />
                      <span className="text-slate-600 dark:text-slate-400">{d.name}</span>
                    </div>
                    <span className="font-semibold text-slate-900 dark:text-slate-100">{d.value}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <p className="text-xs text-slate-400 text-center py-8">Aucune commande</p>
          )}
        </div>
      </div>

      {/* Recent data tables */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent orders */}
        <div className="card lg:col-span-2">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-700">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Dernières commandes</h3>
            <NavLink to="/orders" className="text-xs text-brand-600 hover:text-brand-700 flex items-center gap-1 font-medium">
              Voir tout <ArrowRight size={12} />
            </NavLink>
          </div>
          <div className="divide-y divide-slate-100 dark:divide-slate-700/50">
            {data.dernieresCommandes.slice(0, 5).map((order) => {
              const days = daysUntil(order.expectedDeliveryDate);
              return (
                <div key={order.id} className="flex items-center gap-4 px-5 py-3 table-row-hover">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">{order.id}</p>
                    <p className="text-xs text-slate-500 truncate">{order.customer?.name}</p>
                  </div>
                  <div className="text-right hidden sm:block">
                    <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{formatCurrency(order.totalAmount)}</p>
                    <p className={`text-xs ${days < 0 ? 'text-red-500' : days <= 7 ? 'text-orange-500' : 'text-slate-400'}`}>
                      {days < 0 ? `Retard ${Math.abs(days)}j` : `J-${days}`}
                    </p>
                  </div>
                  <div className="flex flex-col gap-1 items-end">
                    <Badge className={getOrderStatusColor(order.status)}>{order.status}</Badge>
                    <Badge className={getPriorityColor(order.priority)}>{order.priority}</Badge>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Recent incidents */}
        <div className="card">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-700">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Incidents qualité</h3>
            <NavLink to="/incidents" className="text-xs text-brand-600 hover:text-brand-700 flex items-center gap-1 font-medium">
              Voir <ArrowRight size={12} />
            </NavLink>
          </div>
          <div className="divide-y divide-slate-100 dark:divide-slate-700/50">
            {data.derniersIncidents.length === 0 ? (
              <div className="flex items-center gap-2 px-5 py-6 text-green-600">
                <CheckCircle2 size={16} />
                <p className="text-sm font-medium">Aucun incident actif</p>
              </div>
            ) : data.derniersIncidents.slice(0, 5).map((incident) => (
              <div key={incident.id} className="px-5 py-3 table-row-hover">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-xs font-medium text-slate-900 dark:text-slate-100 truncate">{incident.anomalyType}</p>
                  <Badge className={getIncidentSeverityColor(incident.severity)}>{incident.severity}</Badge>
                </div>
                <p className="text-xs text-slate-500 truncate">Lot {incident.batchNumber}</p>
                <p className="text-xs text-slate-400 mt-0.5">{formatDate(incident.detectionDate)}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent OFs */}
      <div className="card">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-700">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Ordres de fabrication récents</h3>
          <NavLink to="/manufacturing" className="text-xs text-brand-600 hover:text-brand-700 flex items-center gap-1 font-medium">
            Voir tout <ArrowRight size={12} />
          </NavLink>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-700">
                {['OF', 'Produit', 'Lot', 'Qté', 'Fin prévue', 'Site', 'Statut'].map(h => (
                  <th key={h} className="text-left py-2.5 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
              {data.derniersOFs.slice(0, 5).map((of) => (
                <tr key={of.id} className="table-row-hover">
                  <td className="py-3 px-4 font-mono text-xs text-brand-600 font-medium">{of.id}</td>
                  <td className="py-3 px-4 text-xs text-slate-700 dark:text-slate-300 max-w-[200px] truncate">{of.product?.description}</td>
                  <td className="py-3 px-4 font-mono text-xs text-slate-500">{of.batchNumber}</td>
                  <td className="py-3 px-4 text-xs font-semibold text-slate-900 dark:text-slate-100">{of.quantity}</td>
                  <td className="py-3 px-4 text-xs text-slate-500">{formatDate(of.expectedEndDate)}</td>
                  <td className="py-3 px-4 text-xs text-slate-500">{of.site}</td>
                  <td className="py-3 px-4"><Badge className={getOFStatusColor(of.status)}>{of.status}</Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
