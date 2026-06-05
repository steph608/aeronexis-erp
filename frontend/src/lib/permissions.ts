import type { Role, Permissions } from '../types';

const FULL_ACCESS = { canView: true, canCreate: true, canUpdate: true, canDelete: true };
const READ_ONLY = { canView: true, canCreate: false, canUpdate: false, canDelete: false };
const READ_WRITE = { canView: true, canCreate: true, canUpdate: true, canDelete: false };
const NO_ACCESS = { canView: false, canCreate: false, canUpdate: false, canDelete: false };

export const ROLE_PERMISSIONS: Record<Role, Permissions> = {
  ADMIN: {
    dashboard: FULL_ACCESS, orders: FULL_ACCESS, manufacturing: FULL_ACCESS,
    materials: FULL_ACCESS, incidents: FULL_ACCESS, customers: FULL_ACCESS,
    products: FULL_ACCESS, users: FULL_ACCESS, shipments: FULL_ACCESS, audit: FULL_ACCESS,
    ai: { delays: true, stock: true, quality: true, fullReport: true },
  },
  DIRECTOR: {
    dashboard: READ_ONLY, orders: READ_ONLY, manufacturing: READ_ONLY,
    materials: READ_ONLY, incidents: READ_ONLY, customers: READ_ONLY,
    products: READ_ONLY, users: READ_ONLY, shipments: READ_ONLY, audit: READ_ONLY,
    ai: { delays: true, stock: true, quality: true, fullReport: true },
  },
  PRODUCTION_MANAGER: {
    dashboard: READ_ONLY, orders: READ_ONLY,
    manufacturing: { canView: true, canCreate: true, canUpdate: true, canDelete: false },
    materials: READ_ONLY,
    incidents: { canView: true, canCreate: true, canUpdate: true, canDelete: false },
    customers: READ_ONLY,
    products: { canView: true, canCreate: true, canUpdate: true, canDelete: false },
    users: READ_ONLY, shipments: READ_ONLY, audit: READ_ONLY,
    ai: { delays: false, stock: false, quality: true, fullReport: false },
  },
  LOGISTICS_MANAGER: {
    dashboard: READ_ONLY, orders: READ_ONLY, manufacturing: READ_ONLY,
    materials: { canView: true, canCreate: false, canUpdate: true, canDelete: false },
    incidents: READ_ONLY, customers: READ_ONLY, products: READ_ONLY, users: READ_ONLY,
    shipments: { canView: true, canCreate: true, canUpdate: true, canDelete: false },
    audit: READ_ONLY,
    ai: { delays: false, stock: true, quality: false, fullReport: false },
  },
  SALES_MANAGER: {
    dashboard: READ_ONLY, orders: READ_WRITE, manufacturing: READ_ONLY,
    materials: READ_ONLY, incidents: READ_ONLY,
    customers: { canView: true, canCreate: true, canUpdate: true, canDelete: false },
    products: READ_ONLY, users: READ_ONLY, shipments: READ_ONLY, audit: NO_ACCESS,
    ai: { delays: true, stock: false, quality: false, fullReport: false },
  },
  OPERATOR: {
    dashboard: NO_ACCESS, orders: READ_ONLY, manufacturing: READ_ONLY,
    materials: READ_ONLY,
    incidents: { canView: true, canCreate: true, canUpdate: false, canDelete: false },
    customers: READ_ONLY, products: READ_ONLY, users: READ_ONLY,
    shipments: NO_ACCESS, audit: READ_ONLY,
    ai: { delays: false, stock: false, quality: false, fullReport: false },
  },
};

export function getPermissions(role: Role): Permissions {
  return ROLE_PERMISSIONS[role] ?? ROLE_PERMISSIONS.OPERATOR;
}

export function hasPermission(
  role: Role,
  module: keyof Omit<Permissions, 'ai'>,
  action: 'canView' | 'canCreate' | 'canUpdate' | 'canDelete'
): boolean {
  const perms = getPermissions(role);
  return (perms[module] as any)[action] ?? false;
}

export function hasAIAccess(role: Role, feature: keyof Permissions['ai']): boolean {
  return getPermissions(role).ai[feature] ?? false;
}

export function getAccessibleModules(role: Role): string[] {
  const perms = getPermissions(role);
  const modules: string[] = [];

  if (perms.dashboard.canView) modules.push('dashboard');
  if (perms.orders.canView) modules.push('orders');
  if (perms.manufacturing.canView) modules.push('manufacturing');
  if (perms.materials.canView) modules.push('materials');
  if (perms.incidents.canView) modules.push('incidents');
  if (perms.customers.canView) modules.push('customers');
  if (perms.products.canView) modules.push('products');
  if (perms.users.canView) modules.push('users');
  if (perms.shipments?.canView) modules.push('shipments');
  if (perms.audit?.canView) modules.push('audit');

  const ai = perms.ai;
  if (ai.delays || ai.stock || ai.quality || ai.fullReport) modules.push('ai');

  return modules;
}

export const ROLE_LABELS: Record<Role, string> = {
  ADMIN: 'Administrateur',
  DIRECTOR: 'Directeur',
  PRODUCTION_MANAGER: 'Resp. Production',
  LOGISTICS_MANAGER: 'Resp. Logistique',
  SALES_MANAGER: 'Resp. Commercial',
  OPERATOR: 'Opérateur',
};

export const ROLE_COLORS: Record<Role, string> = {
  ADMIN: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
  DIRECTOR: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  PRODUCTION_MANAGER: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
  LOGISTICS_MANAGER: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  SALES_MANAGER: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-300',
  OPERATOR: 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300',
};