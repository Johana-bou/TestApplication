import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { getEtatNominatif, deleteLigneNominatif } from '../../api/etat-nominatif.api'
import { CardBox } from '../../components/ui/CardBox'
import { Spinner } from '../../components/ui/Spinner'
import { BoutonImprimer } from '../../components/shared/BoutonImprimer'
import { formatMontant } from '../../utils/formatMontant'
import { toDisplay } from '../../utils/formatDate'
import api from '../../api/axios'

interface LigneNominatif {
  id_ligne: number
  id_usager: number
  nom_usager: string           
  libelle: string
  montant_rar_physique: number
  montant_rar_balance: number
}

export default function EtatNominatifDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const qc = useQueryClient()

  // État modal modification ligne
  const [ligneEnCours,   setLigneEnCours]   = useState<LigneNominatif | null>(null)
  const [editLibelle,    setEditLibelle]    = useState('')
  const [editPhysique,   setEditPhysique]   = useState('')
  const [editBalance,    setEditBalance]    = useState('')
  const [modalOuvert,    setModalOuvert]    = useState(false)

  const { data: etat, isLoading } = useQuery({
    queryKey: ['etat-nominatif', id],
    queryFn: () => getEtatNominatif(Number(id)),
  })

  const deleteLigneMutation = useMutation({
    mutationFn: deleteLigneNominatif,
    onSuccess: () => {
      toast.success('Ligne supprimée')
      qc.invalidateQueries({ queryKey: ['etat-nominatif', id] })
    },
    onError: () => toast.error('Erreur lors de la suppression'),
  })

  const updateLigneMutation = useMutation({
    mutationFn: ({ ligneId, data }: { ligneId: number; data: object }) =>
      api.put(`/api/etats-nominatifs/lignes/${ligneId}`, data),
    onSuccess: () => {
      toast.success('Ligne modifiée')
      qc.invalidateQueries({ queryKey: ['etat-nominatif', id] })
      fermerModal()
    },
    onError: () => toast.error('Erreur lors de la modification'),
  })

  const ouvrirModal = (l: LigneNominatif) => {
    setLigneEnCours(l)
    setEditLibelle(l.libelle)
    setEditPhysique(String(l.montant_rar_physique))
    setEditBalance(String(l.montant_rar_balance))
    setModalOuvert(true)
  }

  const fermerModal = () => {
    setModalOuvert(false)
    setLigneEnCours(null)
  }

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault()
    if (!ligneEnCours) return
    updateLigneMutation.mutate({
      ligneId: ligneEnCours.id_ligne,
      data: {
        libelle:             editLibelle,
        montant_rar_physique: Number(editPhysique),
        montant_rar_balance:  Number(editBalance),
      },
    })
  }

  if (isLoading) return <Spinner fullPage />
  if (!etat) return <div className="alert alert-danger m-20">État introuvable</div>

  const lignes: LigneNominatif[] = etat.lignes || []

  return (
    <div className="min-height-200px">
      <div className="page-header">
        <div className="row align-items-center">
          <div className="col">
            <div className="title">
              <h4>
                État Nominatif —{' '}
                <span className={`badge badge-${etat.type === 'RAR' ? 'primary' : 'warning'}`}
                  style={{ fontSize: 16, verticalAlign: 'middle' }}>
                  {etat.type}
                </span>
              </h4>
            </div>
            <nav aria-label="breadcrumb">
              <ol className="breadcrumb">
                <li className="breadcrumb-item"><a href="/dashboard">Accueil</a></li>
                <li className="breadcrumb-item">
                  <a href="#" onClick={e => { e.preventDefault(); navigate('/etats-nominatifs') }}>
                    États Nominatifs
                  </a>
                </li>
                <li className="breadcrumb-item active">Détail</li>
              </ol>
            </nav>
          </div>
          <div className="col-auto d-flex" style={{ gap: 8 }}>
            <BoutonImprimer
              url={`/api/etats-nominatifs/${id}/pdf`}
              label="Imprimer"
              size="md"
              avecOrientation
            />
            <button className="btn btn-light"
              onClick={() => navigate(-1)}>
              <i className="dw dw-left-arrow mr-1" /> Retour
            </button>
          </div>
        </div>
      </div>

      {/* Informations générales */}
      <CardBox className="mb-20">
        <div className="row">
          <div className="col-md-5">
            <table className="table table-sm table-borderless mb-0">
              <tbody>
                <tr>
                  <th style={{ width: '40%', color: '#888', fontSize: 12 }}>Type</th>
                  <td>
                    <span className={`badge badge-${etat.type === 'RAR' ? 'primary' : 'warning'}`}>
                      {etat.type}
                    </span>
                  </td>
                </tr>
                <tr>
                  <th style={{ color: '#888', fontSize: 12 }}>Date</th>
                  <td>{etat.date_etat ? toDisplay(etat.date_etat) : '-'}</td>
                </tr>
                <tr>
                  <th style={{ color: '#888', fontSize: 12 }}>Observation</th>
                  <td>{etat.observation || <span className="text-muted">—</span>}</td>
                </tr>
                <tr>
                  <th style={{ color: '#888', fontSize: 12 }}>Lignes</th>
                  <td><strong>{lignes.length}</strong> ligne(s)</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Totaux */}
          <div className="col-md-7">
            <div className="row text-center">
              {[
                { label: 'Total physique', value: etat.totaux?.montant_rar_physique, color: '#7934f3' },
                { label: 'Total balance',  value: etat.totaux?.montant_rar_balance,  color: '#04a9f5' },
                {
                  label: 'Écart',
                  value: etat.totaux?.ecart,
                  color: etat.totaux?.ecart === 0 ? '#1ec01e' : '#e55353',
                  extra: etat.totaux?.ecart === 0 ? ' Équilibré' : null,
                },
              ].map(item => (
                <div key={item.label} className="col-4">
                  <div style={{ padding: '16px 8px', background: '#f8f9fa', borderRadius: 10 }}>
                    <div style={{ fontSize: 11, color: '#888', marginBottom: 6 }}>{item.label}</div>
                    <div style={{ fontWeight: 700, color: item.color, fontSize: 15 }}>
                      {item.extra ?? formatMontant(Math.abs(item.value || 0))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </CardBox>

      {/* Lignes nominatives */}
      <CardBox>
        <h5 className="mb-20 h6" style={{ borderBottom: '2px solid #7934f3', paddingBottom: 8 }}>
          <i className="dw dw-edit2 mr-2" style={{ color: '#7934f3' }} />
          Lignes nominatives ({lignes.length})
        </h5>

        {lignes.length === 0 ? (
          <div className="text-center py-4 text-muted">
            <i className="dw dw-edit2 font-48" style={{ opacity: 0.2 }} />
            <p className="mt-2">Aucune ligne pour cet état</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table table-hover table-sm">
              <thead style={{ background: '#f8f9fa' }}>
                <tr>
                  <th>Usager</th>               {/* ← nom_usager maintenant */}
                  <th>Libellé</th>
                  <th className="text-right">Montant physique</th>
                  <th className="text-right">Montant balance</th>
                  <th className="text-right">Écart</th>
                  <th className="text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {lignes.map(l => {
                  const ecart = (l.montant_rar_physique || 0) - (l.montant_rar_balance || 0)
                  return (
                    <tr key={l.id_ligne}>
                      {/* ← Nom de l'usager au lieu de "Usager #id" */}
                      <td style={{ fontSize: 13 }}>
                        <strong>{l.nom_usager}</strong>
                      </td>
                      <td style={{ fontSize: 13, color: '#555' }}>{l.libelle}</td>
                      <td className="text-right" style={{ fontSize: 13 }}>
                        {formatMontant(l.montant_rar_physique || 0)}
                      </td>
                      <td className="text-right" style={{ fontSize: 13 }}>
                        {formatMontant(l.montant_rar_balance || 0)}
                      </td>
                      <td className="text-right">
                        <span style={{
                          color: ecart === 0 ? '#1ec01e' : '#e55353',
                          fontWeight: 600, fontSize: 13,
                        }}>
                          {ecart === 0 ? '✅' : formatMontant(Math.abs(ecart))}
                        </span>
                      </td>
                      <td className="text-center">
                        <div className="btn-group btn-group-sm">
                          {/* Modifier */}
                          <button className="btn btn-light" title="Modifier"
                            onClick={() => ouvrirModal(l)}>
                            <i className="dw dw-pencil" style={{ color: '#4361ee' }} />
                          </button>
                          {/* Supprimer */}
                          <button className="btn btn-light" title="Supprimer"
                            disabled={deleteLigneMutation.isPending}
                            onClick={() => {
                              if (window.confirm('Supprimer cette ligne ?'))
                                deleteLigneMutation.mutate(l.id_ligne)
                            }}>
                            <i className="dw dw-delete-3" style={{ color: '#e55353' }} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
              <tfoot style={{ background: '#f0e8ff' }}>
                <tr>
                  <td colSpan={2} className="font-weight-700 text-right">TOTAUX</td>
                  <td className="text-right font-weight-700" style={{ color: '#7934f3' }}>
                    {formatMontant(etat.totaux?.montant_rar_physique || 0)}
                  </td>
                  <td className="text-right font-weight-700" style={{ color: '#7934f3' }}>
                    {formatMontant(etat.totaux?.montant_rar_balance || 0)}
                  </td>
                  <td className="text-right font-weight-700"
                    style={{ color: etat.totaux?.ecart === 0 ? '#1ec01e' : '#e55353' }}>
                    {etat.totaux?.ecart === 0 ? '' : formatMontant(Math.abs(etat.totaux?.ecart || 0))}
                  </td>
                  <td />
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </CardBox>

      {/* ── Modal modification ligne ─────────────────────────────────────── */}
      {modalOuvert && ligneEnCours && (
        <>
          <div className="modal fade show d-block" tabIndex={-1} role="dialog">
            <div className="modal-dialog modal-dialog-centered" role="document">
              <div className="modal-content">

                <div className="modal-header" style={{ borderBottom: '2px solid #7934f3' }}>
                  <h5 className="modal-title">
                    <i className="dw dw-pencil mr-2" style={{ color: '#7934f3' }} />
                    Modifier la ligne
                  </h5>
                  <button type="button" className="close" onClick={fermerModal}>
                    <span>&times;</span>
                  </button>
                </div>

                <form onSubmit={handleUpdate}>
                  <div className="modal-body">

                    {/* Usager — non modifiable */}
                    <div className="alert alert-light border mb-20 py-10 px-15">
                      <div className="text-muted" style={{ fontSize: 11, marginBottom: 4 }}>
                        USAGER (non modifiable)
                      </div>
                      <div className="font-weight-700">{ligneEnCours.nom_usager}</div>
                    </div>

                    {/* Libellé */}
                    <div className="form-group">
                      <label className="font-weight-600">Libellé</label>
                      <input type="text" className="form-control"
                        value={editLibelle}
                        onChange={e => setEditLibelle(e.target.value)}
                        required />
                    </div>

                    {/* Montant physique */}
                    <div className="form-group">
                      <label className="font-weight-600">
                        Montant physique (FCFA) <span className="text-danger">*</span>
                      </label>
                      <div className="input-group">
                        <input type="number" className="form-control" min="0" step="1"
                          value={editPhysique}
                          onChange={e => setEditPhysique(e.target.value)}
                          required />
                        <div className="input-group-append">
                          <span className="input-group-text">FCFA</span>
                        </div>
                      </div>
                    </div>

                    {/* Montant balance */}
                    <div className="form-group mb-0">
                      <label className="font-weight-600">
                        Montant balance (FCFA) <span className="text-danger">*</span>
                      </label>
                      <div className="input-group">
                        <input type="number" className="form-control" min="0" step="1"
                          value={editBalance}
                          onChange={e => setEditBalance(e.target.value)}
                          required />
                        <div className="input-group-append">
                          <span className="input-group-text">FCFA</span>
                        </div>
                      </div>
                    </div>

                    {/* Aperçu écart en temps réel */}
                    {editPhysique && editBalance && (
                      <div className="mt-15 p-10 rounded"
                        style={{ background: '#f8f9fa', fontSize: 13 }}>
                        <span className="text-muted">Écart prévu : </span>
                        <strong style={{
                          color: Number(editPhysique) === Number(editBalance) ? '#1ec01e' : '#e55353'
                        }}>
                          {formatMontant(Math.abs(Number(editPhysique) - Number(editBalance)))}
                          {Number(editPhysique) === Number(editBalance) && ' '}
                        </strong>
                      </div>
                    )}
                  </div>

                  <div className="modal-footer">
                    <button type="button" className="btn btn-light" onClick={fermerModal}>
                      Annuler
                    </button>
                    <button type="submit" className="btn btn-primary"
                      disabled={updateLigneMutation.isPending}>
                      {updateLigneMutation.isPending
                        ? <><span className="spinner-border spinner-border-sm mr-2" />Enregistrement…</>
                        : <><i className="dw dw-save mr-2" />Enregistrer</>}
                    </button>
                  </div>
                </form>

              </div>
            </div>
          </div>
          <div className="modal-backdrop fade show" onClick={fermerModal} />
        </>
      )}
    </div>
  )
}