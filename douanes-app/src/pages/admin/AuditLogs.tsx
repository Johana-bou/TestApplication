import { useQuery } from '@tanstack/react-query'
import { getAuditLogs } from '../../api/admin.api'
import { CardBox } from '../../components/ui/CardBox'
import { Spinner } from '../../components/ui/Spinner'
import { EmptyState } from '../../components/ui/EmptyState'
import { toDisplay } from '../../utils/formatDate'

export default function AuditLogs() {
  const { data: logs, isLoading } = useQuery({ queryKey: ['audit'], queryFn: () => getAuditLogs({ skip: 0, limit: 100 }) })

  return (
    <div className="min-height-200px">
      <div className="page-header">
        <div className="row"><div className="col"><div className="title"><h4>Logs d'audit</h4></div></div></div>
      </div>
      <CardBox>
        {isLoading ? <Spinner fullPage /> : (logs || []).length === 0 ? <EmptyState message="Aucun log d'audit" /> : (
          <div className="table-responsive">
            <table className="table table-hover table-sm">
              <thead style={{ background: '#f8f9fa' }}><tr><th>Date</th><th>Utilisateur</th><th>Action</th><th>Ressource</th><th>Détail</th></tr></thead>
              <tbody>
                {(logs || []).map((l: Record<string, unknown>, i: number) => (
                  <tr key={i}>
                    <td style={{ fontSize: 12 }}>{l.created_at ? toDisplay(String(l.created_at).split('T')[0]) : '-'}</td>
                    <td style={{ fontSize: 12 }}>{String(l.utilisateur || l.pseudo || '-')}</td>
                    <td><span className="badge badge-info" style={{ fontSize: 10 }}>{String(l.action || '-')}</span></td>
                    <td style={{ fontSize: 12 }}>{String(l.ressource || '-')}</td>
                    <td style={{ fontSize: 11, color: '#888' }}>{String(l.detail || '-')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardBox>
    </div>
  )
}
