import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { getComptes, createCompte, updateCompte, deleteCompte, getComptesByPoste } from '../../api/admin.api'
import { getPostes } from '../../api/auth.api'
import { CardBox } from '../../components/ui/CardBox'
import { Spinner } from '../../components/ui/Spinner'
import { EmptyState } from '../../components/ui/EmptyState'
import { useAuth } from '../../hooks/useAuth'

export default function Comptes() {
  const qc = useQueryClient()
  const { isAdmin, poste } = useAuth()
  const [editItem, setEditItem] = useState<Record<string, unknown> | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [search, setSearch] = useState('')

  const { data: comptes, isLoading } = useQuery({
    queryKey: ['comptes'],
    queryFn: () => (isAdmin ? getComptes() : getComptesByPoste(poste!.id_poste)),
  })
  const { data: postes } = useQuery({ queryKey: ['postes'], queryFn: getPostes })

  const { register, handleSubmit, reset, setValue } = useForm()

  const saveMutation = useMutation({
    mutationFn: (data: any) =>
      editItem
        ? updateCompte(editItem.id_compte as number, data)
        : createCompte(data),
    onSuccess: () => {
      toast.success(editItem ? 'Compte modifié' : 'Compte créé')
      qc.invalidateQueries({ queryKey: ['comptes'] })
      setShowForm(false)
      setEditItem(null)
      reset()
    },
    onError: () => toast.error('Erreur'),
  })

  const deleteMutation = useMutation({
    mutationFn: deleteCompte,
    onSuccess: () => {
      toast.success('Supprimé')
      qc.invalidateQueries({ queryKey: ['comptes'] })
      setDeleteId(null)
    },
    onError: () => toast.error('Erreur'),
  })

  const handleEdit = (c: Record<string, unknown>) => {
    setEditItem(c)
    setValue('num_compte', c.num_compte)
    setValue('nom_compte', c.nom_compte)
    setValue('id_poste', c.id_poste)
    setShowForm(true)
  }

  const getPosteName = (posteId: number | null) => {
    if (!posteId) return <span className="badge bg-secondary text-white">Général</span>
    const found = (postes || []).find((p: any) => p.id_poste === posteId)
    return found ? found.nom_poste : <span className="text-muted">Poste #{posteId}</span>
  }

  const filtered = (comptes || []).filter((c: Record<string, unknown>) =>
    !search ||
    (c.nom_compte as string).toLowerCase().includes(search.toLowerCase()) ||
    (c.num_compte as string).includes(search)
  )

  return (
    <div className="min-height-200px">
      <div className="page-header">
        <div className="row align-items-center">
          <div className="col">
            <div className="title">
              <h4>Comptes</h4>
            </div>
          </div>
          <div className="col-auto">
            <button
              className="btn btn-primary"
              onClick={() => {
                setEditItem(null)
                reset()
                setShowForm(true)
              }}
            >
              <i className="dw dw-add mr-1" /> Nouveau compte
            </button>
          </div>
        </div>
      </div>

      {showForm && (
        <CardBox className="mb-20">
          <h5 className="mb-3 h6">{editItem ? 'Modifier' : 'Nouveau'} compte</h5>
          <form onSubmit={handleSubmit((d) => saveMutation.mutate(d as Record<string, unknown>))}>
            <div className="row">
              <div className="col-md-3">
                <div className="form-group">
                  <label className="font-weight-600">N° Compte</label>
                  <input {...register('num_compte')} className="form-control" placeholder="ex: 471100" required />
                </div>
              </div>
              <div className="col-md-5">
                <div className="form-group">
                  <label className="font-weight-600">Nom du compte</label>
                  <input {...register('nom_compte')} className="form-control" required />
                </div>
              </div>
              <div className="col-md-4">
                <div className="form-group">
                  <label className="font-weight-600">Poste (optionnel)</label>
                  <select {...register('id_poste', { valueAsNumber: true })} className="form-control">
                    <option value="">— Général (tous postes) —</option>
                    {(postes || []).map((p: any) => (
                      <option key={p.id_poste} value={p.id_poste}>
                        {p.nom_poste}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
            <div className="d-flex" style={{ gap: 8 }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => {
                  setShowForm(false)
                  reset()
                  setEditItem(null)
                }}
              >
                Annuler
              </button>
              <button type="submit" className="btn btn-primary" disabled={saveMutation.isPending}>
                {saveMutation.isPending ? 'Enregistrement...' : 'Enregistrer'}
              </button>
            </div>
          </form>
        </CardBox>
      )}

      <CardBox>
        <div className="mb-3">
          <input
            className="form-control"
            placeholder="Rechercher un compte..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ maxWidth: 350 }}
          />
        </div>
        {isLoading ? (
          <Spinner fullPage />
        ) : filtered.length === 0 ? (
          <EmptyState message="Aucun compte" />
        ) : (
          <div className="table-responsive">
            <table className="table table-hover">
              <thead style={{ background: '#f8f9fa' }}>
                <tr>
                  <th>N° Compte</th>
                  <th>Nom</th>
                  <th>Poste</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((c: Record<string, unknown>) => {
                  const isEditing = editItem?.id_compte === c.id_compte
                  return (
                    <tr key={c.id_compte as number}>
                      <td>
                        <code style={{ fontSize: 13 }}>{c.num_compte as string}</code>
                      </td>
                      <td>
                        <strong>{c.nom_compte as string}</strong>
                      </td>
                      <td>{getPosteName(c.id_poste as number | null)}</td>
                      <td>
                        {!isEditing && (
                          <div className="d-flex" style={{ gap: 4 }}>
                            <button
                              className="btn btn-sm btn-outline-warning"
                              onClick={() => handleEdit(c)}
                              title="Modifier"
                            >
                              <i className="dw dw-edit2" />
                            </button>
                            <button
                              className="btn btn-sm btn-outline-danger"
                              onClick={() => setDeleteId(c.id_compte as number)}
                              title="Supprimer"
                            >
                              <i className="dw dw-delete-3" />
                            </button>
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
              <div className="modal-header">
                <h5 className="modal-title">Confirmation</h5>
              </div>
              <div className="modal-body">
                <p>Supprimer ce compte définitivement ?</p>
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