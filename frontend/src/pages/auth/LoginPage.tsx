import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plane, Eye, EyeOff, Lock, Mail, AlertCircle } from 'lucide-react';
import { authAPI } from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import { Spinner } from '../../components/ui';

export function LoginPage() {
  const navigate = useNavigate();
  const login = useAuthStore((s) => s.login);
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await authAPI.login(form.email, form.password);
      const { token, user } = res.data.data;
      login(token, user);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Email ou mot de passe incorrect');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-slate-50 dark:bg-slate-950">
      {/* Left panel */}
      <div className="hidden lg:flex flex-col flex-1 bg-brand-950 relative overflow-hidden p-12">
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-96 h-96 rounded-full bg-brand-400 blur-3xl -translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 right-0 w-96 h-96 rounded-full bg-brand-600 blur-3xl translate-x-1/2 translate-y-1/2" />
        </div>
        <div className="grid grid-cols-8 grid-rows-8 gap-4 absolute inset-12 opacity-5">
          {Array.from({ length: 64 }).map((_, i) => (
            <div key={i} className="border border-white/30 rounded" />
          ))}
        </div>

        {/* Logo */}
        <div className="relative flex items-center gap-3 mb-auto">
          <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center">
            <Plane size={20} className="text-white rotate-45" />
          </div>
          <div>
            <p className="text-white font-bold text-lg font-display tracking-tight">AERONEXIS</p>
            <p className="text-blue-300 text-xs tracking-widest uppercase">Enterprise ERP</p>
          </div>
        </div>

        {/* Content */}
        <div className="relative mt-auto">
          <h2 className="text-4xl font-bold text-white font-display leading-tight mb-4">
            Piloter la production<br />
            <span className="text-blue-300">aéronautique</span><br />
            en temps réel.
          </h2>
          <p className="text-blue-200/70 text-sm leading-relaxed mb-8">
            Plateforme ERP enterprise pour la gestion des ordres de fabrication,
            de la supply chain et de la qualité aéronautique.
          </p>
          <div className="flex gap-6">
            {[
              { label: 'Clients', value: '10+' },
              { label: 'Produits', value: '10+' },
              { label: 'Certifications', value: '4' },
            ].map((stat) => (
              <div key={stat.label}>
                <p className="text-2xl font-bold text-white font-display">{stat.value}</p>
                <p className="text-blue-300 text-xs">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel */}
      <div className="flex flex-1 items-center justify-center p-8">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div className="w-9 h-9 rounded-xl bg-brand-600 flex items-center justify-center">
              <Plane size={18} className="text-white rotate-45" />
            </div>
            <p className="text-lg font-bold font-display text-slate-900 dark:text-white">AERONEXIS</p>
          </div>

          <h1 className="text-2xl font-bold text-slate-900 dark:text-white font-display mb-1">
            Connexion
          </h1>
          <p className="text-slate-500 text-sm mb-8">
            Accédez à votre espace de travail ERP
          </p>

          {error && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 mb-5">
              <AlertCircle size={16} className="text-red-500 flex-shrink-0" />
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Email</label>
              <div className="relative">
                <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="vous@aeronexis.com"
                  required
                  className="input pl-9"
                />
              </div>
            </div>

            <div>
              <label className="label">Mot de passe</label>
              <div className="relative">
                <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type={showPass ? 'text' : 'password'}
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder="••••••••"
                  required
                  className="input pl-9 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full justify-center py-2.5 mt-2"
            >
              {loading ? <><Spinner size={15} /> Connexion...</> : 'Se connecter'}
            </button>
          </form>

          <p className="text-xs text-slate-400 text-center mt-6">
            AERONEXIS ERP v1.0 — Plateforme sécurisée
          </p>
        </div>
      </div>
    </div>
  );
}
