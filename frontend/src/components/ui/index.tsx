import React from 'react';
import { cn } from '../../utils';
import { Loader2, AlertCircle, Search, X } from 'lucide-react';

// ── Badge ────────────────────────────────
interface BadgeProps {
  children: React.ReactNode;
  className?: string;
  dot?: boolean;
}
export function Badge({ children, className, dot }: BadgeProps) {
  return (
    <span className={cn('badge', className)}>
      {dot && <span className="w-1.5 h-1.5 rounded-full bg-current" />}
      {children}
    </span>
  );
}

// ── Spinner ──────────────────────────────
export function Spinner({ size = 16, className }: { size?: number; className?: string }) {
  return <Loader2 size={size} className={cn('animate-spin', className)} />;
}

// ── Page loader ──────────────────────────
export function PageLoader() {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="flex flex-col items-center gap-3">
        <Spinner size={32} className="text-brand-600" />
        <p className="text-sm text-slate-500">Chargement...</p>
      </div>
    </div>
  );
}

// ── Skeleton ─────────────────────────────
export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('shimmer rounded-lg', className)} />;
}

export function CardSkeleton() {
  return (
    <div className="card p-6 space-y-3">
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-8 w-32" />
      <Skeleton className="h-3 w-48" />
    </div>
  );
}

// ── Empty state ──────────────────────────
interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}
export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      {icon && (
        <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4 text-slate-400">
          {icon}
        </div>
      )}
      <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100 mb-1">{title}</h3>
      {description && <p className="text-sm text-slate-500 mb-4 max-w-sm">{description}</p>}
      {action}
    </div>
  );
}

// ── Error state ──────────────────────────
export function ErrorState({ message, onRetry }: { message?: string; onRetry?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="w-14 h-14 rounded-2xl bg-red-50 dark:bg-red-900/20 flex items-center justify-center mb-3">
        <AlertCircle size={24} className="text-red-500" />
      </div>
      <p className="text-sm font-medium text-slate-800 dark:text-slate-200 mb-1">Erreur de chargement</p>
      <p className="text-xs text-slate-500 mb-4">{message || 'Impossible de charger les données'}</p>
      {onRetry && (
        <button onClick={onRetry} className="btn-secondary text-xs py-1.5">
          Réessayer
        </button>
      )}
    </div>
  );
}

// ── Modal ────────────────────────────────
interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}
export function Modal({ isOpen, onClose, title, children, size = 'md' }: ModalProps) {
  if (!isOpen) return null;
  const sizes = { sm: 'max-w-md', md: 'max-w-xl', lg: 'max-w-2xl', xl: 'max-w-4xl' };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className={cn('relative bg-white dark:bg-slate-800 rounded-lg shadow-2xl w-full animate-slide-up', sizes[size])}>
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-200 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-800/60">
          <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-100 uppercase tracking-[0.06em]">{title}</h2>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded flex items-center justify-center hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400 transition-colors"
          >
            <X size={14} />
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

// ── Search input ──────────────────────────
interface SearchInputProps {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  className?: string;
}
export function SearchInput({ value, onChange, placeholder = 'Rechercher...', className }: SearchInputProps) {
  return (
    <div className={cn('relative', className)}>
      <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="input pl-9 pr-4 h-9"
      />
    </div>
  );
}

// ── Stats card ────────────────────────────
interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  color?: string;
  trend?: { value: number; label: string };
}
export function StatCard({ title, value, subtitle, icon, color = 'blue', trend }: StatCardProps) {
  const colorMap: Record<string, string> = {
    blue:   'bg-blue-50   text-blue-600   dark:bg-blue-900/20   dark:text-blue-400',
    green:  'bg-blue-50   text-blue-700   dark:bg-blue-900/20   dark:text-blue-400',
    orange: 'bg-blue-100  text-blue-800   dark:bg-blue-900/30   dark:text-blue-300',
    red:    'bg-blue-900  text-white       dark:bg-blue-950      dark:text-blue-100',
    purple: 'bg-blue-50   text-blue-600   dark:bg-blue-900/20   dark:text-blue-400',
    cyan:   'bg-blue-100  text-blue-700   dark:bg-blue-900/20   dark:text-blue-300',
  };

  return (
    <div className="card p-4 hover:shadow-card-hover transition-all duration-200">
      <div className="flex items-center gap-2 mb-2">
        <div className={cn('w-7 h-7 rounded flex items-center justify-center flex-shrink-0', colorMap[color] || colorMap.blue)}>
          {icon}
        </div>
        <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-[0.07em]">{title}</p>
      </div>
      <p className="text-[22px] font-bold text-slate-900 dark:text-slate-100 font-mono leading-none">{value}</p>
      {subtitle && <p className="text-[11px] text-slate-400 mt-1">{subtitle}</p>}
      {trend && (
        <div className={cn('inline-flex items-center gap-1 mt-2 text-[11px] font-semibold px-1.5 py-0.5 rounded', trend.value >= 0 ? 'bg-blue-50 text-blue-700' : 'bg-slate-100 text-slate-600')}>
          <span>{trend.value >= 0 ? '↑' : '↓'} {Math.abs(trend.value)}%</span>
          <span className="text-slate-400 font-normal">{trend.label}</span>
        </div>
      )}
    </div>
  );
}

// ── Permission guard ──────────────────────
interface PermissionGuardProps {
  allowed: boolean;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}
export function PermissionGuard({ allowed, children, fallback = null }: PermissionGuardProps) {
  return allowed ? <>{children}</> : <>{fallback}</>;
}

// ── Table ─────────────────────────────────
interface TableProps {
  headers: string[];
  children: React.ReactNode;
  isLoading?: boolean;
}
export function Table({ headers, children, isLoading }: TableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/50">
            {headers.map((h) => (
              <th key={h} className="text-left py-2 px-3 text-[11px] font-semibold text-slate-400 uppercase tracking-[0.07em] whitespace-nowrap">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {isLoading
            ? Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="border-b border-slate-100 dark:border-slate-700/50">
                  {headers.map((h) => (
                    <td key={h} className="py-2 px-3">
                      <Skeleton className="h-3.5 w-full" />
                    </td>
                  ))}
                </tr>
              ))
            : children}
        </tbody>
      </table>
    </div>
  );
}
