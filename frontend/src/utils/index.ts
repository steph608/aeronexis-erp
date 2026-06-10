// ── Format currency ─────────────────────
export function formatCurrency(value: number, currency = 'EUR'): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(value);
}

// ── Format date ──────────────────────────
export function formatDate(dateStr: string | Date): string {
  const date = new Date(dateStr);
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date);
}

export function formatDateTime(dateStr: string | Date): string {
  const date = new Date(dateStr);
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

export function timeAgo(dateStr: string | Date): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return 'À l\'instant';
  if (minutes < 60) return `il y a ${minutes} min`;
  if (hours < 24) return `il y a ${hours}h`;
  if (days < 30) return `il y a ${days}j`;
  return formatDate(dateStr);
}

export function daysUntil(dateStr: string): number {
  const date = new Date(dateStr);
  const now = new Date();
  return Math.ceil((date.getTime() - now.getTime()) / 86400000);
}

// ── Status colors ──────────────────────
export function getOrderStatusColor(status: string): string {
  const map: Record<string, string> = {
    'En production': 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
    'Planifiée':     'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
    'Terminée':      'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
    'Annulée':       'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
    'Livrée':        'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300',
  };
  return map[status] || 'bg-slate-100 text-slate-700';
}

export function getOFStatusColor(status: string): string {
  const map: Record<string, string> = {
    'En cours': 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
    'Planifié': 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
    'Terminé': 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
    'Suspendu': 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
  };
  return map[status] || 'bg-slate-100 text-slate-700';
}

export function getIncidentSeverityColor(severity: string): string {
  const map: Record<string, string> = {
    'Critique': 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
    'Majeur': 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
    'Mineur': 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
    'Observation': 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  };
  return map[severity] || 'bg-slate-100 text-slate-700';
}

export function getIncidentStatusColor(status: string): string {
  const map: Record<string, string> = {
    'En cours': 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
    'Résolu': 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
    'Clos': 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300',
  };
  return map[status] || 'bg-slate-100 text-slate-700';
}

export function getPriorityColor(priority: string): string {
  const map: Record<string, string> = {
    'Urgente':  'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
    'Haute':    'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
    'Normale':  'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
    'Standard': 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300',
    'Basse':    'bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400',
  };
  return map[priority] || 'bg-slate-100 text-slate-600';
}

// ── cn utility ──────────────────────────
export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ');
}

// ── Number abbreviation ──────────────────
export function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}k`;
  return n.toString();
}
