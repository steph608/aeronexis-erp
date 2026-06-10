import { useState } from 'react';
import { X, User, Lock, MapPin, Save, Eye, EyeOff, CheckCircle2 } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { authAPI } from '../../services/api';
import { ROLE_LABELS } from '../../lib/permissions';
import type { Role } from '../../types';

interface Props { onClose: () => void; }

type Tab = 'profil' | 'password';

export function SettingsModal({ onClose }: Props) {
  const { user, updateUser } = useAuthStore();
  const [tab, setTab] = useState<Tab>('profil');

  // Profil
  const [firstName, setFirstName] = useState(user?.firstName ?? '');
  const [lastName,  setLastName]  = useState(user?.lastName  ?? '');
  const [saving,    setSaving]    = useState(false);
  const [profileOk, setProfileOk] = useState(false);
  const [profileErr, setProfileErr] = useState('');

  // Password
  const [current,  setCurrent]  = useState('');
  const [next,     setNext]     = useState('');
  const [confirm,  setConfirm]  = useState('');
  const [showCur,  setShowCur]  = useState(false);
  const [showNew,  setShowNew]  = useState(false);
  const [pwSaving, setPwSaving] = useState(false);
  const [pwOk,     setPwOk]     = useState(false);
  const [pwErr,    setPwErr]    = useState('');

  const saveProfile = async () => {
    if (!firstName.trim()) return setProfileErr('Le prénom est requis');
    setSaving(true); setProfileErr(''); setProfileOk(false);
    try {
      const res = await authAPI.updateProfile({ firstName: firstName.trim(), lastName: lastName.trim() });
      updateUser(res.data.data);
      setProfileOk(true);
      setTimeout(() => setProfileOk(false), 3000);
    } catch (e: any) {
      setProfileErr(e?.response?.data?.message || 'Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  const savePassword = async () => {
    setPwErr('');
    if (!current) return setPwErr('Entrez votre mot de passe actuel');
    if (next.length < 6) return setPwErr('Minimum 6 caractères');
    if (next !== confirm) return setPwErr('Les mots de passe ne correspondent pas');
    setPwSaving(true); setPwOk(false);
    try {
      await authAPI.changePassword({ currentPassword: current, newPassword: next });
      setPwOk(true);
      setCurrent(''); setNext(''); setConfirm('');
      setTimeout(() => setPwOk(false), 3000);
    } catch (e: any) {
      setPwErr(e?.response?.data?.message || 'Erreur lors du changement');
    } finally {
      setPwSaving(false);
    }
  };

  const roleLabel = user ? ROLE_LABELS[user.role as Role] : '';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden" onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-700">
          <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">Paramètres</h2>
          <button onClick={onClose} className="w-7 h-7 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors">
            <X size={15} />
          </button>
        </div>

        {/* Avatar + infos */}
        <div className="px-6 py-5 flex items-center gap-4 bg-slate-50 dark:bg-slate-800/50">
          <div className="w-14 h-14 rounded-full bg-brand-600 flex items-center justify-center text-white text-lg font-black flex-shrink-0 shadow">
            {user?.firstName?.[0]}{user?.lastName?.[0] || user?.firstName?.[1] || ''}
          </div>
          <div>
            <p className="font-bold text-slate-900 dark:text-slate-100">{user?.firstName} {user?.lastName}</p>
            <p className="text-xs text-slate-500 mt-0.5">{user?.email}</p>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-[10px] bg-brand-100 dark:bg-brand-900/30 text-brand-700 dark:text-brand-300 px-2 py-0.5 rounded-full font-semibold">{roleLabel}</span>
              <span className="flex items-center gap-1 text-[10px] text-slate-400"><MapPin size={9} />{user?.site ?? 'Site Toulouse'}</span>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-200 dark:border-slate-700 px-6">
          {([['profil', <User size={13} />, 'Profil'], ['password', <Lock size={13} />, 'Mot de passe']] as [Tab, React.ReactNode, string][]).map(([id, icon, label]) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`flex items-center gap-1.5 px-1 py-3 mr-5 text-xs font-semibold border-b-2 transition-colors ${
                tab === id
                  ? 'border-brand-600 text-brand-600 dark:text-brand-400'
                  : 'border-transparent text-slate-400 hover:text-slate-600'
              }`}
            >
              {icon}{label}
            </button>
          ))}
        </div>

        {/* Contenu */}
        <div className="px-6 py-5 space-y-4">

          {tab === 'profil' && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1 block">Prénom</label>
                  <input
                    value={firstName}
                    onChange={e => setFirstName(e.target.value)}
                    className="w-full text-sm px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 outline-none focus:border-brand-400 transition-colors"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1 block">Nom</label>
                  <input
                    value={lastName}
                    onChange={e => setLastName(e.target.value)}
                    className="w-full text-sm px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 outline-none focus:border-brand-400 transition-colors"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1 block">Email</label>
                <input
                  value={user?.email ?? ''}
                  disabled
                  className="w-full text-sm px-3 py-2 rounded-lg border border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-400 cursor-not-allowed"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1 block">Site</label>
                <input
                  value={user?.site ?? 'Site Toulouse'}
                  disabled
                  className="w-full text-sm px-3 py-2 rounded-lg border border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-400 cursor-not-allowed"
                />
              </div>

              {profileErr && <p className="text-xs text-red-500">{profileErr}</p>}
              {profileOk  && <p className="text-xs text-emerald-500 flex items-center gap-1"><CheckCircle2 size={12} /> Profil mis à jour</p>}

              <button
                onClick={saveProfile}
                disabled={saving}
                className="w-full flex items-center justify-center gap-2 py-2.5 bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white text-sm font-semibold rounded-lg transition-colors"
              >
                <Save size={14} />{saving ? 'Sauvegarde...' : 'Sauvegarder'}
              </button>
            </>
          )}

          {tab === 'password' && (
            <>
              {[
                { label: 'Mot de passe actuel', val: current, set: setCurrent, show: showCur, toggle: () => setShowCur(p => !p) },
                { label: 'Nouveau mot de passe', val: next,    set: setNext,    show: showNew, toggle: () => setShowNew(p => !p) },
                { label: 'Confirmer',            val: confirm, set: setConfirm, show: showNew, toggle: () => setShowNew(p => !p) },
              ].map(({ label, val, set, show, toggle }) => (
                <div key={label}>
                  <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1 block">{label}</label>
                  <div className="relative">
                    <input
                      type={show ? 'text' : 'password'}
                      value={val}
                      onChange={e => set(e.target.value)}
                      className="w-full text-sm px-3 py-2 pr-9 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 outline-none focus:border-brand-400 transition-colors"
                    />
                    <button type="button" onClick={toggle} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                      {show ? <EyeOff size={13} /> : <Eye size={13} />}
                    </button>
                  </div>
                </div>
              ))}

              {pwErr && <p className="text-xs text-red-500">{pwErr}</p>}
              {pwOk  && <p className="text-xs text-emerald-500 flex items-center gap-1"><CheckCircle2 size={12} /> Mot de passe modifié</p>}

              <button
                onClick={savePassword}
                disabled={pwSaving}
                className="w-full flex items-center justify-center gap-2 py-2.5 bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white text-sm font-semibold rounded-lg transition-colors"
              >
                <Lock size={14} />{pwSaving ? 'Modification...' : 'Changer le mot de passe'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
