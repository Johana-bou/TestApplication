import { useState, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { getUsagers, createUsager, updateUsager, deleteUsager, getComptes } from '../../api/admin.api'
import { CardBox } from '../../components/ui/CardBox'
import { Spinner } from '../../components/ui/Spinner'
import { EmptyState } from '../../components/ui/EmptyState'
import { useEnterNavigation } from '../../hooks/useEnterNavigation'

export default function Usagers() {
  const qc = useQueryClient()
  const [editItem, setEditItem] = useState<Record<string, unknown> | null>(null)
  const formRef = useRef<HTMLFormElement>(null)
  useEnterNavigation(formRef)

  const [showForm, setShowForm] = useState(false)
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [search, setSearch] = useState('')

  const { data: usagers, isLoading } = useQuery({ queryKey: ['usagers'], queryFn: getUsagers })
  const { data: comptes } = useQuery({ queryKey: ['comptes'], queryFn: getComptes })
  const { register, handleSubmit, reset, setValue } = useForm()

  const saveMutation = useMutation({
    mutationFn: (data: any) => editItem
      ? updateUsager(editItem.id_usager as number, data)
      : createUsager(data),
    onSuccess: () => {
      toast.success(editItem ? 'Usager modifié' : 'Usager créé')
      qc.invalidateQueries({ queryKey: ['usagers'] })
      setShowForm(false); setEditItem(null); reset()
    },
    onError: () => toast.error('Erreur'),
  })

  const deleteMutation = useMutation({
    mutationFn: deleteUsager,
    onSuccess: () => { toast.success('Supprimé'); qc.invalidateQueries({ queryKey: ['usagers'] }); setDeleteId(null) },
    onError: () => toast.error('Erreur'),
  })

  const handleEdit = (u: Record<string, unknown>) => {
    setEditItem(u)
    setValue('nom_usager', u.nom_usager); setValue('raison_sociale', u.raison_sociale)
    setValue('telephone', u.telephone); setValue('id_compte', u.id_compte)
    setShowForm(true)
  }

  // Fonction pour récupérer le numéro de compte à partir de l'id
  const getNumCompte = (idCompte: number | null | undefined) => {
    if (!idCompte) return <span className="text-muted">—</span>
    const compte = (comptes || []).find((c: any) => c.id_compte === idCompte)
    return compte ? compte.num_compte : <span className="text-muted">Compte #{idCompte}</span>
  }

  const filtered = (usagers || []).filter((u: Record<string, unknown>) =>
    !search || (u.nom_usager as string || '').toLowerCase().includes(search.toLowerCase()) ||
    (u.raison_sociale as string || '').toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="min-height-200px">
      <div className="page-header">
        <div className="row align-items-center">
          <div className="col"><div className="title"><h4>Usagers douaniers</h4></div></div>
          <div className="col-auto">
            <button className="btn btn-primary" onClick={() => { setEditItem(null); reset(); setShowForm(true) }}>
              <i className="dw dw-add mr-1" /> Nouvel usager
            </button>
          </div>
        </div>
      </div>

      {showForm && (
        <CardBox className="mb-20">
          <h5 className="mb-3 h6">{editItem ? 'Modifier' : 'Nouvel'} usager</h5>
          <form ref={formRef} onSubmit={handleSubmit(d => saveMutation.mutate(d as Record<string, unknown>))}>
            <div className="row">
              <div className="col-md-3"><div className="form-group"><label className="font-weight-600">Nom usager</label><input {...register('nom_usager')} className="form-control" required /></div></div>
              <div className="col-md-3"><div className="form-group"><label className="font-weight-600">Raison sociale</label><input {...register('raison_sociale')} className="form-control" /></div></div>
              <div className="col-md-2"><div className="form-group"><label className="font-weight-600">Téléphone</label><input {...register('telephone')} className="form-control" /></div></div>
              <div className="col-md-4">
                <div className="form-group">
                  <label className="font-weight-600">Compte</label>
                  <select {...register('id_compte', { valueAsNumber: true })} className="form-control" required>
                    <option value="">— Sélectionnez un compte —</option>
                    {(comptes || []).map((c: Record<string, unknown>) => (
                      <option key={c.id_compte as number} value={c.id_compte as number}>
                        {c.num_compte as string} — {c.nom_compte as string}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
            <div className="d-flex" style={{ gap: 8 }}>
              <button type="button" className="btn btn-secondary" onClick={() => { setShowForm(false); reset() }}>Annuler</button>
              <button type="submit" className="btn btn-primary" disabled={saveMutation.isPending}>{saveMutation.isPending ? 'Enregistrement...' : 'Enregistrer'}</button>
            </div>
          </form>
        </CardBox>
      )}

      <CardBox>
        <div className="mb-3">
          <input className="form-control" placeholder="Rechercher un usager..." value={search} onChange={e => setSearch(e.target.value)} style={{ maxWidth: 350 }} />
        </div>
        {isLoading ? <Spinner fullPage /> : filtered.length === 0 ? <EmptyState message="Aucun usager" /> : (
          <div className="table-responsive">
            <table className="table table-hover">
              <thead style={{ background: '#f8f9fa' }}>
                <tr><th>Nom</th><th>Raison sociale</th><th>Téléphone</th><th>N° Compte</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {filtered.map((u: Record<string, unknown>) => {
                  const isEditing = editItem?.id_usager === u.id_usager
                  return (
                    <tr key={u.id_usager as number}>
                      <td><strong>{u.nom_usager as string}</strong></td>
                      <td style={{ fontSize: 13 }}>{u.raison_sociale as string || <span className="text-muted">—</span>}</td>
                      <td style={{ fontSize: 13 }}>{u.telephone as string || <span className="text-muted">—</span>}</td>
                      <td style={{ fontSize: 12 }}><code>{getNumCompte(u.id_compte as number)}</code></td>
                      <td>
                        {!isEditing && (
                          <div className="d-flex" style={{ gap: 4 }}>
                            <button className="btn btn-sm btn-outline-warning" onClick={() => handleEdit(u)}><i className="dw dw-edit2" /></button>
                            <button className="btn btn-sm btn-outline-danger" onClick={() => setDeleteId(u.id_usager as number)}><i className="dw dw-delete-3" /></button>
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
          <div className="modal-dialog modal-sm"><div className="modal-content">
            <div className="modal-header"><h5 className="modal-title">Confirmation</h5></div>
            <div className="modal-body"><p>Supprimer cet usager ?</p></div>
            <div className="modal-footer">
              <button className="btn btn-secondary btn-sm" onClick={() => setDeleteId(null)}>Annuler</button>
              <button className="btn btn-danger btn-sm" onClick={() => deleteMutation.mutate(deleteId!)} disabled={deleteMutation.isPending}>Supprimer</button>
            </div>
          </div></div>
        </div>
      )}
    </div>
  )
}