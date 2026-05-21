import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { getPVList, getPVByPoste, deletePV } from '../../api/pv.api'
import { CardBox } from '../../components/ui/CardBox'
import { Spinner } from '../../components/ui/Spinner'
import { EmptyState } from '../../components/ui/EmptyState'
import { BoutonImprimer } from '../../components/shared/BoutonImprimer'
import { useAuth } from '../../hooks/useAuth'
import { formatMontant } from '../../utils/formatMontant'
import { toDisplay } from '../../utils/formatDate'

export default function PVList() {
  const navigate = useNavigate()
  const { isAdmin, poste } = useAuth()
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const [deleteId, setDeleteId] = useState<number | null>(null)

  const { data: pvData, isLoading } = useQuery({
    queryKey: ['pv', isAdmin, poste?.id_poste],
    queryFn: () => isAdmin
      ? getPVList({ skip: 0, limit: 100 })
      : getPVByPoste(poste!.id_poste),
    enabled: !!poste,
  })

  const deleteMutation = useMutation({
    mutationFn: deletePV,
    onSuccess: () => {
      toast.success('PV supprimé')
      qc.invalidateQueries({ queryKey: ['pv'] })
      setDeleteId(null)
    },
    onError: (e: any) => toast.error(e?.response?.data?.detail || 'Erreur lors de la suppression'),
  })

  const pvList = (pvData || []) as any[]
  const filtered = pvList.filter(pv =>
    !search || String(pv.num_pv || '').toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="min-height-200px">
      <div className="page-header">
        <div className="row align-items-center">
          <div className="col">
            <div className="title"><h4>Procès-Verbaux</h4></div>
            <nav aria-label="breadcrumb">
              <ol className="breadcrumb">
                <li className="breadcrumb-item"><a href="/dashboard">Accueil</a></li>
                <li className="breadcrumb-item active">Procès-Verbaux</li>
              </ol>
            </nav>
          </div>
          <div className="col-auto">
            <button className="btn btn-primary" onClick={() => navigate('/pv/nouveau')}>
              <i className="dw dw-add mr-1" /> Nouveau PV
            </button>
          </div>
        </div>
      </div>

      <CardBox>
        <div className="mb-3">
          <input
            className="form-control"
            placeholder="Rechercher par numéro de PV..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ maxWidth: 320 }}
          />
        </div>

        {isLoading ? (
          <Spinner fullPage />
        ) : filtered.length === 0 ? (
          <EmptyState message="Aucun PV trouvé" icon="dw-clipboard" />
        ) : (
          <div className="table-responsive">
            <table className="table table-hover">
              <thead style={{ background: '#f8f9fa' }}>
                <tr>
                  <th>N° PV</th>
                  <th>Date</th>
                  <th>Période</th>
                  <th>Solde théorique</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((pv: any) => (
                  <tr key={pv.id_pv}>
                    <td><strong>{pv.num_pv}</strong></td>
                    <td style={{ fontSize: 13 }}>{pv.date_pv ? toDisplay(pv.date_pv) : '—'}</td>
                    <td style={{ fontSize: 12, color: '#888' }}>
                      {pv.periode_debut && pv.periode_fin
                        ? `${toDisplay(pv.periode_debut)} → ${toDisplay(pv.periode_fin)}`
                        : '—'}
                    </td>
                    <td>
                      <strong style={{ color: '#7934f3' }}>
                        {formatMontant(pv.solde_theorique || 0)}
                      </strong>
                    </td>
                    <td>
                      <div className="d-flex" style={{ gap: 4 }}>
                        <button
                          className="btn btn-sm btn-outline-info"
                          onClick={() => navigate(`/pv/${pv.id_pv}`)}
                          title="Voir"
                        >
                          <i className="dw dw-eye" />
                        </button>
                        <button
                          className="btn btn-sm btn-outline-warning"
                          onClick={() => navigate(`/pv/${pv.id_pv}/modifier`)}
                          title="Modifier"
                        >
                          <i className="dw dw-edit2" />
                        </button>
                        <BoutonImprimer url={`/api/pv/${pv.id_pv}/pdf`} avecOrientation />
                        {/* Bouton Supprimer visible pour tous les utilisateurs connectés */}
                        <button
                          className="btn btn-sm btn-outline-danger"
                          onClick={() => setDeleteId(pv.id_pv)}
                          title="Supprimer"
                        >
                          <i className="dw dw-delete-3" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardBox>

      {/* Modal de confirmation de suppression */}
      {deleteId && (
        <div className="modal fade show" style={{ display: 'block', background: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-sm">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Confirmation</h5>
              </div>
              <div className="modal-body">
                <p>Supprimer ce PV définitivement ?</p>
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary btn-sm" onClick={() => setDeleteId(null)}>
                  Annuler
                </button>
                <button
                  className="btn btn-danger btn-sm"
                  onClick={() => deleteMutation.mutate(deleteId!)}
                  disabled={deleteMutation.isPending}
                >
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