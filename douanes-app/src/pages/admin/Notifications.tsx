import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import {
  getNotifications, createNotification, deleteNotification, marquerTousLus,
} from '../../api/notification.api'
import { getUtilisateurs } from '../../api/admin.api'
import { CardBox } from '../../components/ui/CardBox'
import { Spinner } from '../../components/ui/Spinner'
import { EmptyState } from '../../components/ui/EmptyState'
import { toDisplay } from '../../utils/formatDate'

const TYPE_COLORS: Record<string, string> = {
  INFO: '#04a9f5',
  ALERTE: '#e55353',
  SUCCES: '#1ec01e',
}

export default function Notifications() {
  const qc = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [filterNonLu, setFilterNonLu] = useState(false)

  const { data: notifs, isLoading } = useQuery({
    queryKey: ['notifs-admin', filterNonLu],
    queryFn: () => getNotifications({ only_non_lues: filterNonLu, limit: 100 }),
  })

  const { data: utilisateurs } = useQuery({
    queryKey: ['utilisateurs'],
    queryFn: getUtilisateurs,
  })

  const { register, handleSubmit, reset } = useForm<{
    id_user: number
    type: 'INFO' | 'ALERTE' | 'SUCCES'
    message: string
  }>({ defaultValues: { type: 'INFO' } })

  const createMutation = useMutation({
    mutationFn: (data: { id_user: number; type: 'INFO' | 'ALERTE' | 'SUCCES'; message: string }) =>
      createNotification({ id_user: Number(data.id_user), type: data.type, message: data.message }),
    onSuccess: () => {
      toast.success('Notification envoyée')
      qc.invalidateQueries({ queryKey: ['notifs-admin'] })
      setShowForm(false)
      reset()
    },
    onError: (e: any) => toast.error(e?.response?.data?.detail || 'Erreur'),
  })

  const deleteMutation = useMutation({
    mutationFn: deleteNotification,
    onSuccess: () => {
      toast.success('Supprimée')
      qc.invalidateQueries({ queryKey: ['notifs-admin'] })
      setDeleteId(null)
    },
    onError: () => toast.error('Erreur'),
  })

  const marquerTousMutation = useMutation({
    mutationFn: marquerTousLus,
    onSuccess: () => {
      toast.success('Toutes marquées comme lues')
      qc.invalidateQueries({ queryKey: ['notifs-admin'] })
    },
    onError: () => toast.error('Erreur'),
  })

  const nonLuCount = (notifs as any[] || []).filter((n: any) => !n.lu).length

  return (
    <div className="min-height-200px">
      <div className="page-header">
        <div className="row align-items-center">
          <div className="col">
            <div className="title"><h4>Gestion des Notifications</h4></div>
            <nav aria-label="breadcrumb">
              <ol className="breadcrumb">
                <li className="breadcrumb-item"><a href="/dashboard">Accueil</a></li>
                <li className="breadcrumb-item active">Notifications</li>
              </ol>
            </nav>
          </div>
          <div className="col-auto d-flex" style={{ gap: 8 }}>
            {nonLuCount > 0 && (
              <button className="btn btn-outline-secondary" onClick={() => marquerTousMutation.mutate()}>
                <i className="dw dw-check-circle mr-1" />
                Tout marquer lu ({nonLuCount})
              </button>
            )}
            <button className="btn btn-primary" onClick={() => setShowForm(true)}>
              <i className="dw dw-add mr-1" /> Envoyer notification
            </button>
          </div>
        </div>
      </div>

      {showForm && (
        <CardBox className="mb-20">
          <h5 className="mb-3 h6">Envoyer une notification</h5>
          <form onSubmit={handleSubmit(d => createMutation.mutate({ ...d, id_user: Number(d.id_user) }))}>
            <div className="row">
              <div className="col-md-4">
                <div className="form-group">
                  <label className="font-weight-600">Destinataire <span className="text-danger">*</span></label>
                  <select {...register('id_user', { required: true, valueAsNumber: true })} className="form-control">
                    <option value="">— Sélectionnez —</option>
                    {(utilisateurs || []).map((u: Record<string, unknown>) => (
                      <option key={u.id_user as number} value={u.id_user as number}>
                        {u.prenom as string} {u.nom as string} ({u.pseudo as string})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="col-md-2">
                <div className="form-group">
                  <label className="font-weight-600">Type</label>
                  <select {...register('type')} className="form-control">
                    <option value="INFO">ℹ️ INFO</option>
                    <option value="ALERTE">⚠️ ALERTE</option>
                    <option value="SUCCES">✅ SUCCÈS</option>
                  </select>
                </div>
              </div>
              <div className="col-md-6">
                <div className="form-group">
                  <label className="font-weight-600">Message <span className="text-danger">*</span></label>
                  <input {...register('message', { required: true })} className="form-control"
                    placeholder="Entrez le message de la notification..." />
                </div>
              </div>
            </div>
            <div className="d-flex" style={{ gap: 8 }}>
              <button type="button" className="btn btn-secondary"
                onClick={() => { setShowForm(false); reset() }}>Annuler</button>
              <button type="submit" className="btn btn-primary" disabled={createMutation.isPending}>
                {createMutation.isPending ? 'Envoi...' : <><i className="dw dw-sent mr-1" />Envoyer</>}
              </button>
            </div>
          </form>
        </CardBox>
      )}

      <CardBox>
        {/* Filtres */}
        <div className="d-flex justify-content-between align-items-center mb-3">
          <div className="btn-group">
            <button className={`btn btn-sm ${!filterNonLu ? 'btn-primary' : 'btn-outline-primary'}`}
              onClick={() => setFilterNonLu(false)}>Toutes</button>
            <button className={`btn btn-sm ${filterNonLu ? 'btn-primary' : 'btn-outline-primary'}`}
              onClick={() => setFilterNonLu(true)}>Non lues</button>
          </div>
          <small className="text-muted">{(notifs || []).length} notification(s)</small>
        </div>

        {isLoading ? <Spinner fullPage /> : (notifs || []).length === 0
          ? <EmptyState message="Aucune notification" icon="dw-notification" />
          : (
            <div className="table-responsive">
              <table className="table table-hover">
                <thead style={{ background: '#f8f9fa' }}>
                  <tr>
                    <th>Type</th>
                    <th>Message</th>
                    <th>Date</th>
                    <th>Statut</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {(notifs as any[] || []).map((n: any) => (
                    <tr key={n.id_notif as number}
                      style={{ background: n.lu ? '#fff' : '#f9f5ff' }}>
                      <td>
                        <span className="badge" style={{
                          background: TYPE_COLORS[n.type as string] || '#888',
                          color: '#fff', fontSize: 11,
                        }}>
                          {n.type as string}
                        </span>
                      </td>
                      <td style={{ fontSize: 13, maxWidth: 400 }}>{n.message as string}</td>
                      <td style={{ fontSize: 12, color: '#888' }}>
                        {n.date_notif
                          ? toDisplay(String(n.date_notif).split('T')[0])
                          : '—'}
                      </td>
                      <td>
                        <span className={`badge badge-${n.lu ? 'success' : 'warning'}`}>
                          {n.lu ? 'Lu' : 'Non lu'}
                        </span>
                      </td>
                      <td>
                        <button className="btn btn-sm btn-outline-danger"
                          onClick={() => setDeleteId(n.id_notif as number)}
                          title="Supprimer">
                          <i className="dw dw-delete-3" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
      </CardBox>

      {deleteId && (
        <div className="modal fade show" style={{ display: 'block', background: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-sm">
            <div className="modal-content">
              <div className="modal-header"><h5 className="modal-title">Confirmation</h5></div>
              <div className="modal-body"><p>Supprimer cette notification ?</p></div>
              <div className="modal-footer">
                <button className="btn btn-secondary btn-sm" onClick={() => setDeleteId(null)}>Annuler</button>
                <button className="btn btn-danger btn-sm"
                  onClick={() => deleteMutation.mutate(deleteId!)}
                  disabled={deleteMutation.isPending}>
                  {deleteMutation.isPending ? 'Suppression...' : 'Supprimer'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
