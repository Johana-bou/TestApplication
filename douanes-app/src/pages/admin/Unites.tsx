import { useState, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { getUnites, createUnite, updateUnite, deleteUnite } from '../../api/unites.api'
import { getPostes, type Poste } from '../../api/auth.api'   // ← import correct depuis auth.api
import { CardBox } from '../../components/ui/CardBox'
import { Spinner } from '../../components/ui/Spinner'
import { EmptyState } from '../../components/ui/EmptyState'
import type { Unite } from '../../types/admin.types'
import { useEnterNavigation } from '../../hooks/useEnterNavigation'

export default function Unites() {
  const qc = useQueryClient()
  const [editItem, setEditItem] = useState<Unite | null>(null)
  const formRef = useRef<HTMLFormElement>(null)
  useEnterNavigation(formRef)

  const [showModal, setShowModal] = useState(false)
  const [deleteId, setDeleteId] = useState<number | null>(null)

  // Récupération des unités
  const { data: unites, isLoading } = useQuery({
    queryKey: ['unites'],
    queryFn: getUnites,
  })

  // Récupération des postes (existe déjà dans auth.api)
  const { data: postes, isLoading: loadingPostes } = useQuery({
    queryKey: ['postes'],
    queryFn: getPostes,
  })

  const { register, handleSubmit, reset, setValue } = useForm<Partial<Unite>>()

  const saveMutation = useMutation({
    mutationFn: (data: Partial<Unite>) =>
      editItem
        ? updateUnite(editItem.id_unite, data as { nom_unite: string; id_poste: number })
        : createUnite(data as { nom_unite: string; id_poste: number }),
    onSuccess: () => {
      toast.success(editItem ? 'Unité modifiée' : 'Unité créée')
      qc.invalidateQueries({ queryKey: ['unites'] })
      setShowModal(false)
      setEditItem(null)
      reset()
    },
    onError: () => toast.error('Erreur lors de l’enregistrement'),
  })

  const deleteMutation = useMutation({
    mutationFn: deleteUnite,
    onSuccess: () => {
      toast.success('Unité supprimée')
      qc.invalidateQueries({ queryKey: ['unites'] })
      setDeleteId(null)
    },
    onError: () => toast.error('Erreur lors de la suppression'),
  })

  const openModal = (unite?: Unite) => {
    if (unite) {
      setEditItem(unite)
      setValue('nom_unite', unite.nom_unite)
      setValue('id_poste', unite.id_poste)
    } else {
      setEditItem(null)
      reset({ nom_unite: '', id_poste: undefined })
    }
    setShowModal(true)
  }

  const closeModal = () => {
    setShowModal(false)
    setEditItem(null)
    reset()
  }

  // Trouver le nom du poste à partir de son id
  const getNomPoste = (id_poste: number) => {
    if (!postes) return id_poste
    const poste = postes.find((p: Poste) => p.id_poste === id_poste)
    return poste ? poste.nom_poste : id_poste
  }

  return (
    <div className="min-height-200px">
      <div className="page-header">
        <div className="row align-items-center">
          <div className="col">
            <div className="title"><h4>Unités</h4></div>
          </div>
          <div className="col-auto">
            <button className="btn btn-primary" onClick={() => openModal()}>
              <i className="dw dw-add mr-1" /> Nouvelle unité
            </button>
          </div>
        </div>
      </div>

      <CardBox>
        {isLoading ? (
          <Spinner fullPage />
        ) : (unites || []).length === 0 ? (
          <EmptyState message="Aucune unité" icon="dw-bank" />
        ) : (
          <div className="table-responsive">
            <table className="table table-hover">
              <thead style={{ background: '#f8f9fa' }}>
                <tr>
                  <th>Nom de l'unité</th>
                  <th>Poste</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {(unites || []).map((u: Unite) => (
                  <tr key={u.id_unite}>
                    <td><strong>{u.nom_unite}</strong></td>
                    <td>{getNomPoste(u.id_poste)}</td>
                    <td>
                      <div className="d-flex" style={{ gap: 4 }}>
                        <button className="btn btn-sm btn-outline-warning" onClick={() => openModal(u)}>
                          <i className="dw dw-edit2" />
                        </button>
                        <button className="btn btn-sm btn-outline-danger" onClick={() => setDeleteId(u.id_unite)}>
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

      {/* Modale de création/modification */}
      {showModal && (
        <div className="modal fade show" style={{ display: 'block', background: 'rgba(0,0,0,0.5)', zIndex: 1050 }}>
          <div className="modal-dialog modal-md">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">{editItem ? 'Modifier l’unité' : 'Nouvelle unité'}</h5>
                <button type="button" className="close" onClick={closeModal}>&times;</button>
              </div>
              <form ref={formRef} onSubmit={handleSubmit((d) => saveMutation.mutate(d))}>
                <div className="modal-body">
                  <div className="form-group">
                    <label className="font-weight-600">Nom de l'unité</label>
                    <input
                      {...register('nom_unite', { required: true })}
                      className="form-control"
                      placeholder="ex: Service des Opérations"
                      autoFocus
                    />
                  </div>
                  <div className="form-group">
                    <label className="font-weight-600">Poste</label>
                    <select
                      {...register('id_poste', { required: true, valueAsNumber: true })}
                      className="form-control"
                      disabled={loadingPostes}
                    >
                      <option value="">-- Sélectionner un poste --</option>
                      {(postes || []).map((p: Poste) => (
                        <option key={p.id_poste} value={p.id_poste}>{p.nom_poste}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={closeModal}>Annuler</button>
                  <button type="submit" className="btn btn-primary" disabled={saveMutation.isPending}>
                    {saveMutation.isPending ? 'Enregistrement...' : 'Enregistrer'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Modale de confirmation suppression */}
      {deleteId && (
        <div className="modal fade show" style={{ display: 'block', background: 'rgba(0,0,0,0.5)', zIndex: 1060 }}>
          <div className="modal-dialog modal-sm">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Confirmation</h5>
              </div>
              <div className="modal-body">
                <p>Supprimer cette unité ?</p>
              </div>
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