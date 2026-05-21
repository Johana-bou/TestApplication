import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { getEncaissementsByUnite } from '../../api/encaissements.api'
import { getUnites, getUnitesByPoste } from '../../api/unites.api'
import { CardBox } from '../../components/ui/CardBox'
import { Spinner } from '../../components/ui/Spinner'
import { EmptyState } from '../../components/ui/EmptyState'
import { BoutonImprimer } from '../../components/shared/BoutonImprimer'
import { useAuth } from '../../hooks/useAuth'
import { formatMontant } from '../../utils/formatMontant'
import { toDisplay } from '../../utils/formatDate'
import api from '../../api/axios'

interface Encaissement {
  id_encaissement: number
  id_unite: number
  id_ligne: number
  date_encaissement: string
  montant: number
  num_ligne: string
  intitule: string
  code_taxe: string
  mois: number
  annee: number
}

// Date du jour et premier jour du mois courant
const today = new Date()
const defaultDateDebut = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-01`
const defaultDateFin = today.toISOString().split('T')[0]

export default function EncaissementList() {
  const { isAdmin, poste } = useAuth()
  const queryClient = useQueryClient()

  const [selectedUnite, setSelectedUnite] = useState<number | ''>('')
  const [dateDebut, setDateDebut] = useState(defaultDateDebut)
  const [dateFin, setDateFin] = useState(defaultDateFin)
  const [filtreType, setFiltreType] = useState<'TOUS' | 'PROTOCOLE' | 'CAC'>('TOUS')

  // Modal modification
  const [modalOuvert, setModalOuvert] = useState(false)
  const [encEnCours, setEncEnCours] = useState<Encaissement | null>(null)
  const [editMontant, setEditMontant] = useState('')
  const [editDate, setEditDate] = useState('')

  const { data: unites } = useQuery({
    queryKey: ['unites', isAdmin ? 'all' : poste?.id_poste],
    queryFn: () => isAdmin ? getUnites() : getUnitesByPoste(poste!.id_poste),
  })

  const { data: encaissements, isLoading } = useQuery<Encaissement[]>({
    queryKey: ['encaissements', selectedUnite, dateDebut, dateFin],
    queryFn: () => selectedUnite
      ? getEncaissementsByUnite(selectedUnite as number, { skip: 0, limit: 200 })
      : Promise.resolve([]),
    enabled: !!selectedUnite,
  })

  // ✅ Filtrage par type CAC/PROTOCOLE côté client
  const encaissementsFiltres = (encaissements || []).filter(e => {
    const matchType = filtreType === 'TOUS' || e.code_taxe === filtreType
    const matchDate =
      (!dateDebut || e.date_encaissement >= dateDebut) &&
      (!dateFin   || e.date_encaissement <= dateFin)
    return matchType && matchDate
  })

  const total = encaissementsFiltres.reduce((acc, e) => acc + (e.montant || 0), 0)

  // Suppression
  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/api/etats-encaissement/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['encaissements', selectedUnite] })
      toast.success('Encaissement supprimé')
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.detail || 'Erreur lors de la suppression')
    },
  })

  const handleDelete = (enc: Encaissement) => {
    if (!window.confirm(
      `Supprimer l'encaissement de ${formatMontant(enc.montant)} du ${toDisplay(enc.date_encaissement)} ?`
    )) return
    deleteMutation.mutate(enc.id_encaissement)
  }

  // Modification
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: object }) =>
      api.put(`/api/etats-encaissement/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['encaissements', selectedUnite] })
      toast.success('Encaissement modifié avec succès')
      fermerModal()
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.detail || 'Erreur lors de la modification')
    },
  })

  const ouvrirModal = (enc: Encaissement) => {
    setEncEnCours(enc)
    setEditMontant(String(enc.montant))
    setEditDate(enc.date_encaissement)
    setModalOuvert(true)
  }

  const fermerModal = () => {
    setModalOuvert(false)
    setEncEnCours(null)
    setEditMontant('')
    setEditDate('')
  }

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault()
    if (!encEnCours) return
    updateMutation.mutate({
      id: encEnCours.id_encaissement,
      data: {
        id_unite:          encEnCours.id_unite,
        num_ligne:         encEnCours.num_ligne,
        date_encaissement: editDate,
        montant:           Number(editMontant),
      },
    })
  }

  return (
    <div className="min-height-200px">
      <div className="page-header">
        <div className="row align-items-center">
          <div className="col">
            <div className="title"><h4>Liste des encaissements</h4></div>
            <nav aria-label="breadcrumb">
              <ol className="breadcrumb">
                <li className="breadcrumb-item"><a href="/dashboard">Accueil</a></li>
                <li className="breadcrumb-item active">Encaissements</li>
              </ol>
            </nav>
          </div>
          <div className="col-auto">
            <a href="/encaissements/saisie" className="btn btn-primary">
              <i className="dw dw-add mr-1" /> Saisir
            </a>
          </div>
        </div>
      </div>

      <CardBox>
        <div className="row mb-3 align-items-end">

          {/* Date début */}
          <div className="col-md-3 mb-2">
            <label className="font-weight-600 mb-1" style={{ fontSize: 13 }}>
              Date début
            </label>
            <input
              type="date"
              className="form-control"
              value={dateDebut}
              onChange={e => setDateDebut(e.target.value)}
            />
          </div>

          {/* Date fin */}
          <div className="col-md-3 mb-2">
            <label className="font-weight-600 mb-1" style={{ fontSize: 13 }}>
              Date fin
            </label>
            <input
              type="date"
              className="form-control"
              value={dateFin}
              onChange={e => setDateFin(e.target.value)}
            />
          </div>

          {/* Filtre type CAC / PROTOCOLE */}
          <div className="col-md-3 mb-2">
            <label className="font-weight-600 mb-1" style={{ fontSize: 13 }}>
              Type
            </label>
            <div className="btn-group d-flex">
              {(['TOUS', 'PROTOCOLE', 'CAC'] as const).map(t => (
                <button
                  key={t}
                  type="button"
                  className={`btn btn-sm ${filtreType === t ? 'btn-primary' : 'btn-outline-primary'}`}
                  onClick={() => setFiltreType(t)}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Unité */}
          <div className="col-md-3 mb-2">
            <label className="font-weight-600 mb-1" style={{ fontSize: 13 }}>
              Unité <span className="text-danger">*</span>
            </label>
            <select
              className="form-control"
              value={selectedUnite}
              onChange={e => setSelectedUnite(e.target.value ? Number(e.target.value) : '')}
            >
              <option value="">— Toutes les unités —</option>
              {(unites || []).map((u: any) => (
                <option key={u.id_unite} value={u.id_unite}>{u.nom_unite}</option>
              ))}
            </select>
          </div>

          {/* Bouton imprimer */}
          {selectedUnite && (
            <div className="col-12 mt-2 text-right">
              <BoutonImprimer
                url={`/api/etats-encaissement/unite/${selectedUnite}/pdf`}
                label="État d'encaissement"
                size="md"
                avecOrientation
              />
            </div>
          )}
        </div>

        {/* Résumé filtre actif */}
        {(dateDebut || dateFin || filtreType !== 'TOUS') && (
          <div className="mb-3">
            <small className="text-muted">
              Filtre actif :
              {dateDebut && <> Du <strong>{toDisplay(dateDebut)}</strong></>}
              {dateFin   && <> au <strong>{toDisplay(dateFin)}</strong></>}
              {filtreType !== 'TOUS' && (
                <> — Type : <span className={`badge badge-${filtreType === 'CAC' ? 'warning' : 'info'} ml-1`}>{filtreType}</span></>
              )}
              {encaissementsFiltres.length > 0 && (
                <> — <strong>{encaissementsFiltres.length}</strong> résultat(s)</>
              )}
            </small>
          </div>
        )}

        {!selectedUnite ? (
          <div className="text-center py-5 text-muted">
            <i className="dw dw-bank font-48" style={{ display: 'block', marginBottom: 12, opacity: 0.3 }} />
            <p>Sélectionnez une unité pour afficher ses encaissements</p>
          </div>
        ) : isLoading ? (
          <Spinner fullPage />
        ) : encaissementsFiltres.length === 0 ? (
          <EmptyState message="Aucun encaissement pour ces critères" icon="dw-money" />
        ) : (
          <div className="table-responsive">
            <table className="table table-hover">
              <thead style={{ background: '#f8f9fa' }}>
                <tr>
                  <th>Date</th>
                  <th>Num. ligne</th>
                  <th>Intitulé</th>
                  <th>Type</th>
                  <th>Montant</th>
                  <th className="text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {encaissementsFiltres.map(e => (
                  <tr key={e.id_encaissement}>
                    <td style={{ fontSize: 13 }}>
                      {e.date_encaissement ? toDisplay(e.date_encaissement) : '-'}
                    </td>
                    <td><span className="badge badge-secondary">{e.num_ligne}</span></td>
                    <td style={{ fontSize: 13 }}>{e.intitule}</td>
                    <td>
                      <span className={`badge badge-${e.code_taxe === 'CAC' ? 'warning' : 'info'}`}>
                        {e.code_taxe}
                      </span>
                    </td>
                    <td>
                      <strong style={{ color: '#7934f3' }}>{formatMontant(e.montant || 0)}</strong>
                    </td>
                    <td className="text-center">
                      <div className="btn-group btn-group-sm">
                        <button className="btn btn-light" title="Modifier" onClick={() => ouvrirModal(e)}>
                          <i className="dw dw-pencil" style={{ color: '#4361ee' }} />
                        </button>
                        <button
                          className="btn btn-light" title="Supprimer"
                          disabled={deleteMutation.isPending}
                          onClick={() => handleDelete(e)}>
                          {deleteMutation.isPending
                            ? <span className="spinner-border spinner-border-sm" />
                            : <i className="dw dw-delete-3" style={{ color: '#e74c3c' }} />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot style={{ background: '#f0e8ff' }}>
                <tr>
                  <td colSpan={4} className="font-weight-700 text-right">TOTAL :</td>
                  <td className="font-weight-700" style={{ color: '#7934f3', fontSize: 15 }}>
                    {formatMontant(total)}
                  </td>
                  <td />
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </CardBox>

      {/* Modal modification */}
      {modalOuvert && encEnCours && (
        <>
          <div className="modal fade show d-block" tabIndex={-1} role="dialog">
            <div className="modal-dialog modal-dialog-centered" role="document">
              <div className="modal-content">
                <div className="modal-header" style={{ borderBottom: '2px solid #7934f3' }}>
                  <h5 className="modal-title">
                    <i className="dw dw-pencil mr-2" style={{ color: '#7934f3' }} />
                    Modifier l'encaissement
                  </h5>
                  <button type="button" className="close" onClick={fermerModal}>
                    <span>&times;</span>
                  </button>
                </div>
                <form onSubmit={handleUpdate}>
                  <div className="modal-body">
                    <div className="alert alert-light border mb-20 py-10 px-15">
                      <div className="text-muted" style={{ fontSize: 11, marginBottom: 4 }}>
                        LIGNE BUDGÉTAIRE (non modifiable)
                      </div>
                      <div className="font-weight-700" style={{ fontSize: 14 }}>
                        {encEnCours.num_ligne} — {encEnCours.intitule}
                      </div>
                      <span className={`badge badge-${encEnCours.code_taxe === 'CAC' ? 'warning' : 'info'} mt-5`}>
                        {encEnCours.code_taxe}
                      </span>
                    </div>
                    <div className="form-group">
                      <label className="font-weight-600">
                        Montant (FCFA) <span className="text-danger">*</span>
                      </label>
                      <div className="input-group">
                        <input type="number" className="form-control" min="0" step="1"
                          value={editMontant} onChange={e => setEditMontant(e.target.value)}
                          required autoFocus />
                        <div className="input-group-append">
                          <span className="input-group-text">FCFA</span>
                        </div>
                      </div>
                    </div>
                    <div className="form-group mb-0">
                      <label className="font-weight-600">
                        Date d'encaissement <span className="text-danger">*</span>
                      </label>
                      <input type="date" className="form-control"
                        value={editDate} onChange={e => setEditDate(e.target.value)} required />
                    </div>
                  </div>
                  <div className="modal-footer">
                    <button type="button" className="btn btn-light" onClick={fermerModal}>Annuler</button>
                    <button type="submit" className="btn btn-primary" disabled={updateMutation.isPending}>
                      {updateMutation.isPending
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