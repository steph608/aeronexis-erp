import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Lock, Mail, AlertCircle, MapPin, ArrowRight, ShieldCheck } from 'lucide-react';

import { authAPI } from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import { Spinner } from '../../components/ui';

// ─── Sites disponibles ────────────────────────────────────────────────────────
const SITES = [
  { value: 'toulouse',  label: 'Toulouse — Siège Principal' },
  { value: 'bordeaux',  label: 'Bordeaux — Usine Nord'      },
  { value: 'paris',     label: 'Paris — Centre R&D'         },
];

// ─── Machine à écrire ─────────────────────────────────────────────────────────
const SEGMENTS = [
  { text: 'Piloter la production\n', blue: false },
  { text: 'aéronautique',            blue: true  },
  { text: '\nen temps réel.',         blue: false },
];
const FULL_TEXT  = SEGMENTS.map(s => s.text).join('');
const BLUE_START = SEGMENTS[0].text.length;
const BLUE_END   = BLUE_START + SEGMENTS[1].text.length;

function Typewriter() {
  const [count, setCount] = useState(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const total = FULL_TEXT.length;
    const tick = (current: number) => {
      if (current > total) {
        timerRef.current = setTimeout(() => tick(0), 1800);
      } else {
        setCount(current);
        timerRef.current = setTimeout(() => tick(current + 1), 65);
      }
    };
    timerRef.current = setTimeout(() => tick(0), 400);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, []);

  const chars = FULL_TEXT.slice(0, count).split('').map((char, idx) => {
    if (char === '\n') return <br key={idx} />;
    return (
      <span key={idx} className={idx >= BLUE_START && idx < BLUE_END ? 'text-blue-300' : ''}>
        {char}
      </span>
    );
  });

  return (
    <h2 className="text-4xl font-bold text-white font-display leading-tight mb-4 drop-shadow-lg min-h-[7rem]">
      {chars}
      <span className="inline-block w-[3px] h-9 bg-blue-300 ml-1 align-middle" style={{ animation: 'blink 1s step-end infinite' }} />
    </h2>
  );
}

// ─── Champ glassmorphism ──────────────────────────────────────────────────────
// Champ sombre (sélecteur de site)
const glassInput = [
  'w-full h-11 rounded-xl text-sm text-white placeholder-white/35',
  'bg-white/10 border border-white/20',
  'focus:outline-none focus:border-brand-400/70 focus:bg-white/15',
  'transition-all duration-200 px-4',
].join(' ');

// Champ clair (email / mot de passe)
const lightInput = [
  'w-full h-11 rounded-xl text-sm text-slate-900 placeholder-slate-400',
  'bg-white border border-slate-200',
  'focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20',
  'transition-all duration-200 px-4',
].join(' ');

// ─── Page de connexion ────────────────────────────────────────────────────────
export function LoginPage() {
  const navigate = useNavigate();
  const login    = useAuthStore((s) => s.login);

  const [form, setForm]         = useState({ email: '', password: '', site: 'toulouse' });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');


  const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
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
    <div className="relative min-h-screen overflow-hidden bg-black">
      <style>{`
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }
        input:-webkit-autofill,
        input:-webkit-autofill:hover,
        input:-webkit-autofill:focus {
          -webkit-box-shadow: 0 0 0 1000px rgba(255,255,255,0.08) inset !important;
          -webkit-text-fill-color: white !important;
          caret-color: white;
          transition: background-color 9999s ease-in-out 0s;
        }
      `}</style>

      {/* ── Vidéo YouTube plein écran ─────────────────────────────────── */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
          style={{ width: 'max(100vw, calc(100vh * 16 / 9))', height: 'max(100vh, calc(100vw * 9 / 16))' }}
        >
          <iframe
            src="https://www.youtube.com/embed/1Nq80xnzQog?autoplay=1&mute=1&loop=1&playlist=1Nq80xnzQog&controls=0&showinfo=0&rel=0&modestbranding=1&iv_load_policy=3&disablekb=1&fs=0"
            className="w-full h-full"
            allow="autoplay; encrypted-media"
            style={{ border: 'none' }}
            title="background"
          />
        </div>
      </div>

      {/* ── Overlay gradient ──────────────────────────────────────────── */}
      <div className="absolute inset-0 z-10 bg-gradient-to-r from-black/40 via-black/45 to-black/75" />

      {/* ── Logo haut gauche ──────────────────────────────────────────── */}
      <div className="absolute top-8 left-10 z-20 flex items-center gap-3">
        <div className="w-11 h-11 rounded-2xl bg-brand-600 flex items-center justify-center shadow-lg shadow-brand-600/40 border border-brand-400/30">
          <span className="text-white font-bold text-base font-display tracking-tight">AX</span>
        </div>
        <div>
          <p className="text-white font-bold text-lg font-display tracking-tight leading-none">AERONEXIS</p>
          <p className="text-white/50 text-[9px] tracking-widest uppercase">Plateforme de Gestion Aéronautique</p>
        </div>
      </div>

      {/* ── Texte centré gauche ───────────────────────────────────────── */}
      <div className="absolute inset-y-0 left-10 lg:left-16 z-20 hidden lg:flex flex-col justify-center max-w-lg">
        <Typewriter />
        <p className="text-white/65 text-sm leading-relaxed drop-shadow">
          Plateforme ERP d'entreprise pour la gestion des ordres de fabrication,
          de la supply chain et de la qualité aéronautique.
        </p>
      </div>

      {/* ── Stats bas gauche ──────────────────────────────────────────── */}
      <div className="absolute bottom-10 left-10 lg:left-16 z-20 hidden lg:flex gap-10">
        {[
          { label: 'Clients',        value: '10+' },
          { label: 'Produits',       value: '10+' },
          { label: 'Certifications', value: '7'   },
          { label: 'Sites',          value: '3'   },
        ].map((stat) => (
          <div key={stat.label}>
            <p className="text-3xl font-bold text-white font-display drop-shadow">{stat.value}</p>
            <p className="text-blue-300 text-xs mt-0.5">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* ── Panneau de connexion droite ───────────────────────────────── */}
      <div className="relative z-20 min-h-screen flex items-center justify-end px-8 lg:px-14">
        <div className="w-full max-w-sm">

          {/* Carte verre */}
          <div className="bg-white/10 backdrop-blur-2xl backdrop-saturate-150 rounded-2xl border border-white/20 shadow-2xl shadow-black/50 p-8">

            {/* Logo + salutation */}
            <div className="flex items-center gap-3 mb-7">
              <div className="w-10 h-10 rounded-xl bg-brand-600 flex items-center justify-center shadow-lg shadow-brand-600/40 flex-shrink-0">
                <span className="text-white font-bold text-sm font-display">AX</span>
              </div>
              <div>
                <p className="text-white font-bold text-base font-display leading-none">AERONEXIS</p>
                <p className="text-white/50 text-[9px] uppercase tracking-widest mt-0.5">Connectez-vous à votre espace</p>
              </div>
            </div>

            {/* Erreur */}
            {error && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/20 border border-red-400/30 mb-5">
                <AlertCircle size={15} className="text-red-300 flex-shrink-0" />
                <p className="text-sm text-red-200">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">

              {/* Sélecteur de site */}
              <div>
                <label className="block text-white/70 text-xs font-medium mb-1.5">Site de connexion</label>
                <div className="relative">
                  <MapPin size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/75 pointer-events-none" />
                  <select
                    value={form.site}
                    onChange={(e) => setForm({ ...form, site: e.target.value })}
                    className={`${glassInput} pl-9 appearance-none cursor-pointer`}
                    style={{ colorScheme: 'dark' }}
                  >
                    {SITES.map(s => (
                      <option key={s.value} value={s.value} className="bg-slate-800 text-white">
                        {s.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="block text-white text-xs font-medium mb-1.5">Email</label>
                <div className="relative">
                  <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="vous@aeronexis.com"
                    required
                    className={`${lightInput} pl-9`}
                  />
                </div>
              </div>

              {/* Mot de passe */}
              <div>
                <label className="block text-white text-xs font-medium mb-1.5">Mot de passe</label>
                <div className="relative">
                  <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                  <input
                    type={showPass ? 'text' : 'password'}
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    placeholder="••••••••"
                    required
                    className={`${lightInput} pl-9 pr-10`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(!showPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-800 transition-colors"
                  >
                    {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              {/* Bouton */}
              <button
                type="submit"
                disabled={loading}
                className={[
                  'w-full h-11 rounded-xl mt-2 font-semibold text-sm text-white',
                  'flex items-center justify-center gap-2',
                  'bg-gradient-to-r from-brand-500 to-brand-700',
                  'hover:from-brand-400 hover:to-brand-600',
                  'shadow-lg shadow-brand-600/40',
                  'transition-all duration-200 active:scale-[0.98]',
                  'disabled:opacity-60 disabled:cursor-not-allowed',
                ].join(' ')}
              >
                {loading
                  ? <><Spinner size={15} /> Connexion en cours...</>
                  : <><span>Accéder à la plateforme</span><ArrowRight size={15} /></>
                }
              </button>
            </form>

            {/* Footer sécurisé */}
            <div className="flex items-center justify-center gap-1.5 mt-6">
              <ShieldCheck size={12} className="text-white/30" />
              <p className="text-[11px] text-white/30">Connexion sécurisée SSL · AERONEXIS</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
