import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { getLignes, createLigne, updateLigne, deleteLigne } from '../../api/lignes.api'
import type { LigneBudgetaire } from '../../api/lignes.api'
import { CardBox } from '../../components/ui/CardBox'
import { Spinner } from '../../components/ui/Spinner'
import { EmptyState } from '../../components/ui/EmptyState'

export default function LignesBudgetaires() {
  const qc = useQueryClient()
  const [editItem, setEditItem] = useState<LigneBudgetaire | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [search, setSearch] = useState('')

  const { data: lignes, isLoading } = useQuery({
    queryKey: ['lignes'],
    queryFn: getLignes,
  })

  const { register, handleSubmit, reset, setValue } = useForm<Omit<LigneBudgetaire, 'id'>>()

  const createMutation = useMutation({
    mutationFn: createLigne,
    onSuccess: () => {
      toast.success('Ligne créée')
      qc.invalidateQueries({ queryKey: ['lignes'] })
      setShowForm(false)
      reset()
    },
    onError: (e: any) => toast.error(e?.response?.data?.detail || 'Erreur'),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Omit<LigneBudgetaire, 'id'> }) =>
      updateLigne(id, data),
    onSuccess: () => {
      toast.success('Ligne modifiée')
      qc.invalidateQueries({ queryKey: ['lignes'] })
      setShowForm(false)
      setEditItem(null)
      reset()
    },
    onError: (e: any) => toast.error(e?.response?.data?.detail || 'Erreur'),
  })

  const deleteMutation = useMutation({
    mutationFn: deleteLigne,
    onSuccess: () => {
      toast.success('Supprimé')
      qc.invalidateQueries({ queryKey: ['lignes'] })
      setDeleteId(null)
    },
    onError: () => toast.error('Erreur'),
  })

  const handleEdit = (ligne: LigneBudgetaire) => {
    setEditItem(ligne)
    setValue('num_ligne', ligne.num_ligne)
    setValue('intitule', ligne.intitule)
    setValue('code_taxe', ligne.code_taxe)
    setShowForm(true)
  }

  const filtered = (lignes || []).filter((l: LigneBudgetaire) =>
    !search ||
    String(l.num_ligne).includes(search) ||
    l.intitule.toLowerCase().includes(search.toLowerCase()) ||
    l.code_taxe.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="min-height-200px">
      <div className="page-header">
        <div className="row align-items-center">
          <div className="col"><div className="title"><h4>Lignes budgétaires</h4></div></div>
          <div className="col-auto">
            <button className="btn btn-primary" onClick={() => { setEditItem(null); reset(); setShowForm(true) }}>
              <i className="dw dw-add mr-1" /> Nouvelle ligne
            </button>
          </div>
        </div>
      </div>

      {showForm && (
        <CardBox className="mb-20">
          <h5 className="mb-3 h6">{editItem ? 'Modifier' : 'Nouvelle'} ligne budgétaire</h5>
          <div className="alert alert-info" style={{ fontSize: 12 }}>
            <i className="dw dw-information mr-1" />
            Les lignes budgétaires sont globales — elles s'appliquent à tous les postes.
          </div>
          <form onSubmit={handleSubmit(data => {
            if (editItem) {
              updateMutation.mutate({ id: editItem.id!, data })
            } else {
              createMutation.mutate(data)
            }
          })}>
            <div className="row">
              <div className="col-md-2">
                <div className="form-group">
                  <label className="font-weight-600">N° Ligne <span className="text-danger">*</span></label>
                  <input {...register('num_ligne', { required: true })} className="form-control" placeholder="ex: 71313" />
                </div>
              </div>
              <div className="col-md-6">
                <div className="form-group">
                  <label className="font-weight-600">Intitulé <span className="text-danger">*</span></label>
                  <input {...register('intitule', { required: true })} className="form-control" placeholder="ex: Taxe sur la valeur ajoutée" />
                </div>
              </div>
              <div className="col-md-2">
                <div className="form-group">
                  <label className="font-weight-600">Code taxe <span className="text-danger">*</span></label>
                  <input {...register('code_taxe', { required: true })} className="form-control" placeholder="ex: TVA" />
                </div>
              </div>
            </div>
            <div className="d-flex" style={{ gap: 8 }}>
              <button type="button" className="btn btn-secondary" onClick={() => { setShowForm(false); reset(); setEditItem(null) }}>Annuler</button>
              <button type="submit" className="btn btn-primary" disabled={createMutation.isPending || updateMutation.isPending}>
                {createMutation.isPending || updateMutation.isPending ? 'Enregistrement...' : 'Enregistrer'}
              </button>
            </div>
          </form>
        </CardBox>
      )}

      <CardBox>
        <div className="mb-3">
          <input className="form-control" placeholder="Rechercher (numéro, intitulé, code taxe)..." value={search} onChange={e => setSearch(e.target.value)} style={{ maxWidth: 400 }} />
        </div>
        {isLoading ? <Spinner fullPage /> : filtered.length === 0 ? <EmptyState message="Aucune ligne budgétaire" /> : (
          <div className="table-responsive">
            <table className="table table-hover table-sm">
              <thead style={{ background: '#f8f9fa' }}>
                <tr><th>N° Ligne</th><th>Intitulé</th><th>Code taxe</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {filtered.map((l: LigneBudgetaire) => {
                  const isEditing = editItem?.id === l.id
                  return (
                    <tr key={l.id}>
                      <td><span className="badge bg-secondary text-white">{l.num_ligne}</span></td>
                      <td style={{ fontSize: 13 }}>{l.intitule}</td>
                      <td><span className="badge bg-info text-white">{l.code_taxe}</span></td>
                      <td>
                        {!isEditing && (
                          <div className="d-flex" style={{ gap: 4 }}>
                            <button className="btn btn-sm btn-outline-warning" onClick={() => handleEdit(l)}><i className="dw dw-edit2" /></button>
                            <button className="btn btn-sm btn-outline-danger" onClick={() => setDeleteId(l.id!)}><i className="dw dw-delete-3" /></button>
                          </div>
                        )}
                      </td>
                    </tr>
                  )
                })}
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
              <div className="modal-body"><p>Supprimer cette ligne budgétaire définitivement ?</p></div>
              <div className="modal-footer">
                <button className="btn btn-secondary btn-sm" onClick={() => setDeleteId(null)}>Annuler</button>
                <button className="btn btn-danger btn-sm" onClick={() => deleteMutation.mutate(deleteId!)} disabled={deleteMutation.isPending}>Supprimer</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}