// ============================================
// AERONEXIS ERP — TYPE DEFINITIONS
// ============================================

export type Role =
  | 'ADMIN'
  | 'DIRECTOR'
  | 'PRODUCTION_MANAGER'
  | 'LOGISTICS_MANAGER'
  | 'SALES_MANAGER'
  | 'OPERATOR';

export interface User {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  role: Role;
  isActive: boolean;
  createdAt?: string;
}

export interface AuthState {
  token: string | null;
  user: User | null;
  isAuthenticated: boolean;
}

// ── Orders ──────────────────────────────────
export interface Customer {
  id: string;
  name: string;
  country: string;
  type: string;
  annualRevenue: number;
  firstContractDate: string;
  status: string;
  createdAt?: string;
}

export interface Product {
  id: string;
  description: string;
  category: string;
  unitPrice: number;
  manufacturingTimeH: number;
  weightKg: number;
  certification: string;
}

export interface OrderLine {
  id: string;
  orderId: string;
  productId: string;
  quantity: number;
  unitPrice: number;
  lineAmount: number;
  lineStatus: string;
  product?: Product;
}

export interface Order {
  id: string;
  customerId: string;
  orderDate: string;
  expectedDeliveryDate: string;
  status: string;
  totalAmount: number;
  priority: string;
  salesManager: string;
  createdAt?: string;
  updatedAt?: string;
  customer?: Customer;
  orderLines?: OrderLine[];
}

// ── Manufacturing ─────────────────────────
export interface ManufacturingOrder {
  id: string;
  productId: string;
  batchNumber: string;
  quantity: number;
  launchDate: string;
  expectedEndDate: string;
  status: string;
  operatorId?: number;
  site: string;
  createdAt?: string;
  updatedAt?: string;
  product?: Product;
  operator?: User;
  qualityIncidents?: QualityIncident[];
}

// ── Materials ─────────────────────────────
export interface RawMaterial {
  id: string;
  description: string;
  unit: string;
  currentStock: number;
  minimumStock: number;
  reservedStock: number;
  supplier: string;
  lastReplenishment: string;
  updatedAt?: string;
}

// ── Incidents ─────────────────────────────
export interface QualityIncident {
  id: string;
  detectionDate: string;
  batchNumber: string;
  anomalyType: string;
  severity: string;
  status: string;
  responsibleId?: number;
  correctiveAction: string;
  createdAt?: string;
  updatedAt?: string;
  responsible?: User;
  manufacturingOrder?: {
    batchNumber: string;
    product: { description: string };
  };
}

// ── Dashboard KPIs ────────────────────────
export interface DashboardData {
  kpis: {
    commandes: {
      total: number;
      enProduction: number;
      planifiees: number;
      terminees: number;
      chiffreAffaires: number;
    };
    production: {
      total: number;
      enCours: number;
      termines: number;
      tauxRendement: number;
    };
    incidents: {
      total: number;
      critiques: number;
      enCours: number;
      resolus: number;
      tauxResolution: number;
    };
    stock: {
      totalMatieres: number;
      alertesRupture: number;
    };
    clients: {
      total: number;
      actifs: number;
    };
  };
  dernieresCommandes: Order[];
  derniersIncidents: QualityIncident[];
  derniersOFs: ManufacturingOrder[];
}

// ── API Responses ─────────────────────────
export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
  errors?: any[];
}

export interface PaginatedData<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
}

// ── RBAC permissions map ───────────────────
export type ModulePermission = {
  canView: boolean;
  canCreate: boolean;
  canUpdate: boolean;
  canDelete: boolean;
};

export type Permissions = {
  dashboard: ModulePermission;
  orders: ModulePermission;
  manufacturing: ModulePermission;
  materials: ModulePermission;
  incidents: ModulePermission;
  customers: ModulePermission;
  products: ModulePermission;
  users: ModulePermission;
  ai: {
    delays: boolean;
    stock: boolean;
    quality: boolean;
    fullReport: boolean;
  };
};
