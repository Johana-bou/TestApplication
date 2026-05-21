import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { getRapprochements, deleteRapprochement } from '../../api/rapprochement.api'
import { getComptes } from '../../api/admin.api'
import { CardBox } from '../../components/ui/CardBox'
import { Spinner } from '../../components/ui/Spinner'
import { EmptyState } from '../../components/ui/EmptyState'
import { BoutonImprimer } from '../../components/shared/BoutonImprimer'
import { formatMontant } from '../../utils/formatMontant'
import { toDisplay } from '../../utils/formatDate'

export default function RapprochementList() {
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [deleteId, setDeleteId] = useState<number | null>(null)

  const { data: rapprochements, isLoading } = useQuery({
    queryKey: ['rapprochements'],
    queryFn: () => getRapprochements({ skip: 0, limit: 100 }),
  })

  const { data: comptes } = useQuery({ queryKey: ['comptes'], queryFn: getComptes })

  const deleteMutation = useMutation({
    mutationFn: deleteRapprochement,
    onSuccess: () => { toast.success('Supprimé'); qc.invalidateQueries({ queryKey: ['rapprochements'] }); setDeleteId(null) },
    onError: () => toast.error('Erreur'),
  })

  // Récupérer les infos du compte
  const getCompteInfo = (id: number) => {
    const c = (comptes || []).find((c: any) => c.id_compte === id)
    return c ? { num: c.num_compte, nom: c.nom_compte } : { num: `#${id}`, nom: 'Compte inconnu' }
  }

  return (
    <div className="min-height-200px">
      <div className="page-header">
        <div className="row align-items-center">
          <div className="col">
            <div className="title"><h4>Rapprochement SYSTAC/SYGMA</h4></div>
            <nav aria-label="breadcrumb">
              <ol className="breadcrumb">
                <li className="breadcrumb-item"><a href="/dashboard">Accueil</a></li>
                <li className="breadcrumb-item active">Rapprochement</li>
              </ol>
            </nav>
          </div>
          <div className="col-auto">
            <button className="btn btn-primary" onClick={() => navigate('/rapprochement/nouveau')}>
              <i className="dw dw-add mr-1" /> Nouveau rapprochement
            </button>
          </div>
        </div>
      </div>

      <CardBox>
        {isLoading ? <Spinner fullPage /> : (rapprochements || []).length === 0 ? (
          <EmptyState message="Aucun rapprochement trouvé" icon="dw-synchronize" />
        ) : (
          <div className="table-responsive">
            <table className="table table-hover">
              <thead style={{ background: '#f8f9fa' }}>
                <tr>
                  <th>N° Compte</th>
                  <th>Nom du compte</th>
                  <th>Intitulé du rapprochement</th>
                  <th>Date</th>
                  <th>Solde théorique</th>
                  <th>Écart</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {(rapprochements || []).map((r: any) => {
                  const compte = getCompteInfo(r.id_compte)
                  return (
                    <tr key={r.id_rapprochement}>
                      <td><strong>{compte.num}</strong></td>
                      <td>{compte.nom}</td>
                      <td>{r.intitule}</td>
                      <td>{toDisplay(r.date_rapprochement)}</td>
                      <td className="fw-bold text-primary">{formatMontant(r.solde_theorique || 0)}</td>
                      <td className={r.ecart === 0 ? 'text-success' : 'text-danger'}>
                        {formatMontant(Math.abs(r.ecart || 0))}
                      </td>
                      <td>
                        <div className="d-flex gap-2">
                          <button
                            className="btn btn-sm btn-outline-info"
                            onClick={() => navigate(`/rapprochement/${r.id_rapprochement}`)}
                            title="Voir détail"
                          >
                            <i className="dw dw-eye" />
                          </button>
                          <BoutonImprimer
                            url={`/api/etats-rapprochement/${r.id_rapprochement}/pdf`}
                            avecOrientation
                          />
                          <button
                            className="btn btn-sm btn-outline-danger"
                            onClick={() => setDeleteId(r.id_rapprochement)}
                            title="Supprimer"
                          >
                            <i className="dw dw-delete-3" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </CardBox>

      {/* Modal de confirmation */}
      {deleteId && (
        <div className="modal fade show" style={{ display: 'block', background: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-sm">
            <div className="modal-content">
              <div className="modal-header"><h5 className="modal-title">Confirmation</h5></div>
              <div className="modal-body"><p>Supprimer ce rapprochement définitivement ?</p></div>
              <div className="modal-footer">
                <button className="btn btn-secondary btn-sm" onClick={() => setDeleteId(null)}>Annuler</button>
                <button className="btn btn-danger btn-sm" onClick={() => deleteMutation.mutate(deleteId!)} disabled={deleteMutation.isPending}>
                  Supprimer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}