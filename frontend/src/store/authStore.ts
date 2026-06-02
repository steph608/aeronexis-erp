import { create } from 'zustand';
import type { User, Role } from '../types';
import { getPermissions, getAccessibleModules } from '../lib/permissions';
import type { Permissions } from '../types';

interface AuthStore {
  token: string | null;
  user: User | null;
  isAuthenticated: boolean;
  permissions: Permissions | null;
  accessibleModules: string[];

  login: (token: string, user: User) => void;
  logout: () => void;
  updateUser: (user: User) => void;
}

const loadFromStorage = () => {
  try {
    const token = localStorage.getItem('aeronexis_token');
    const userStr = localStorage.getItem('aeronexis_user');
    if (token && userStr) {
      const user = JSON.parse(userStr) as User;
      return { token, user };
    }
  } catch {}
  return { token: null, user: null };
};

const saved = loadFromStorage();

export const useAuthStore = create<AuthStore>((set) => ({
  token: saved.token,
  user: saved.user,
  isAuthenticated: !!saved.token,
  permissions: saved.user ? getPermissions(saved.user.role as Role) : null,
  accessibleModules: saved.user ? getAccessibleModules(saved.user.role as Role) : [],

  login: (token, user) => {
    localStorage.setItem('aeronexis_token', token);
    localStorage.setItem('aeronexis_user', JSON.stringify(user));
    set({
      token,
      user,
      isAuthenticated: true,
      permissions: getPermissions(user.role as Role),
      accessibleModules: getAccessibleModules(user.role as Role),
    });
  },

  logout: () => {
    localStorage.removeItem('aeronexis_token');
    localStorage.removeItem('aeronexis_user');
    set({
      token: null,
      user: null,
      isAuthenticated: false,
      permissions: null,
      accessibleModules: [],
    });
  },

  updateUser: (user) => {
    localStorage.setItem('aeronexis_user', JSON.stringify(user));
    set({
      user,
      permissions: getPermissions(user.role as Role),
      accessibleModules: getAccessibleModules(user.role as Role),
    });
  },
}));
