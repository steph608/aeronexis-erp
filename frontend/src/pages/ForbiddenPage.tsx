import { useNavigate } from 'react-router-dom';
import { ShieldX, ArrowLeft } from 'lucide-react';

export default function ForbiddenPage() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="text-center max-w-md">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-red-100 mb-6">
          <ShieldX className="w-10 h-10 text-red-500" />
        </div>
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Accès refusé</h1>
        <p className="text-slate-500 mb-8">
          Vous n'avez pas les permissions nécessaires pour accéder à cette page.
          Contactez votre administrateur si vous pensez qu'il s'agit d'une erreur.
        </p>
        <button
          onClick={() => navigate(-1)}
          className="btn-primary inline-flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Retour
        </button>
      </div>
    </div>
  );
}
