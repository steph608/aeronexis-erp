import { useQuery } from '@tanstack/react-query';
import { auditAPI } from '../../services/api';

export default function AuditPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['audit'],
    queryFn: () => auditAPI.getAll(),
  });

  const logs = data?.data?.data || [];

  const getActionColor = (action: string) => {
    switch (action) {
      case 'CREATE': return 'bg-green-100 text-green-800';
      case 'UPDATE': return 'bg-blue-100 text-blue-800';
      case 'DELETE': return 'bg-red-100 text-red-800';
      case 'LOGIN': return 'bg-purple-100 text-purple-800';
      case 'LOGOUT': return 'bg-gray-100 text-gray-800';
      case 'RESERVE': return 'bg-yellow-100 text-yellow-800';
      case 'VIEW': return 'bg-indigo-100 text-indigo-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Historique des actions</h1>
        <p className="text-gray-500 text-sm mt-1">
          Traçabilité complète de toutes les actions effectuées dans le système
        </p>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-gray-500">Chargement...</div>
      ) : (
        <div className="bg-white rounded-xl shadow overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600">Date</th>
                <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600">Utilisateur</th>
                <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600">Action</th>
                <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600">Module</th>
                <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600">Description</th>
                <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600">IP</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-gray-500">
                    Aucune action enregistrée
                  </td>
                </tr>
              ) : logs.map((log: any) => (
                <tr key={log.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm text-gray-500 whitespace-nowrap">
                    {new Date(log.createdAt).toLocaleString('fr-FR')}
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-sm font-medium text-gray-900">
                      {log.user ? `${log.user.firstName} ${log.user.lastName}` : log.userEmail}
                    </div>
                    <div className="text-xs text-gray-500">{log.userEmail}</div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getActionColor(log.action)}`}>
                      {log.action}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600 capitalize">{log.module}</td>
                  <td className="px-4 py-3 text-sm text-gray-600 max-w-xs truncate">{log.description}</td>
                  <td className="px-4 py-3 text-sm text-gray-400 font-mono">{log.ipAddress}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}