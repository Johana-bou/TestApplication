import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { getUtilisateurs, createUtilisateur, updateUtilisateur, deleteUtilisateur } from '../../api/admin.api'
import { CardBox } from '../../components/ui/CardBox'
import { Spinner } from '../../components/ui/Spinner'
import { EmptyState } from '../../components/ui/EmptyState'
import { getPostes } from '../../api/admin.api'
import { useQuery as useQ } from '@tanstack/react-query'

export default function Utilisateurs() {
  const qc = useQueryClient()
  const [editItem, setEditItem] = useState<Record<string, unknown> | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [deleteId, setDeleteId] = useState<number | null>(null)

  const { data: utilisateurs, isLoading } = useQuery({ queryKey: ['utilisateurs'], queryFn: getUtilisateurs })
  const { data: postes } = useQuery({ queryKey: ['postes-admin'], queryFn: getPostes })
  const { register, handleSubmit, reset, setValue } = useForm<{
    nom: string; prenom: string; pseudo: string; role: string
    poste_id: number; mot_de_passe?: string; actif?: boolean
  }>()

  const saveMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) => editItem
      ? updateUtilisateur(editItem.id_user as number, {
          nom: data.nom as string,
          prenom: data.prenom as string,
          role: data.role as string,
          actif: data.actif as boolean,
        })
      : createUtilisateur({
          nom: data.nom as string,
          prenom: data.prenom as string,
          pseudo: data.pseudo as string,
          mot_de_passe: data.mot_de_passe as string,
          role: data.role as 'ADMIN' | 'RECEVEUR',
          poste_id: Number(data.poste_id),
        }),
    onSuccess: () => {
      toast.success(editItem ? 'Modifié' : 'Créé — affectation créée automatiquement')
      qc.invalidateQueries({ queryKey: ['utilisateurs'] })
      setShowForm(false); setEditItem(null); reset()
    },
    onError: (e: any) => toast.error(e?.response?.data?.detail || 'Erreur'),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteUtilisateur(id),
    onSuccess: () => { toast.success('Supprimé'); qc.invalidateQueries({ queryKey: ['utilisateurs'] }); setDeleteId(null) },
    onError: (e: any) => toast.error(e?.response?.data?.detail || 'Erreur'),
  })

  const handleEdit = (u: Record<string, unknown>) => {
    setEditItem(u)
    setValue('nom', u.nom as string)
    setValue('prenom', u.prenom as string)
    setValue('pseudo', u.pseudo as string)
    setValue('role', u.role as string)
    setShowForm(true)
  }

  return (
    <div className="min-height-200px">
      <div className="page-header">
        <div className="row align-items-center">
          <div className="col"><div className="title"><h4>Utilisateurs</h4></div></div>
          <div className="col-auto">
            <button className="btn btn-primary" onClick={() => { setEditItem(null); reset(); setShowForm(true) }}>
              <i className="dw dw-add mr-1" /> Nouvel utilisateur
            </button>
          </div>
        </div>
      </div>

      {showForm && (
        <CardBox className="mb-20">
          <h5 className="mb-3 h6">{editItem ? 'Modifier' : 'Nouvel'} utilisateur</h5>
          <div className="alert alert-info" style={{ fontSize: 12 }}>
            <i className="dw dw-information mr-1" />
            {editItem
              ? 'Modifiez nom, prénom, rôle ou statut. L\'identifiant ne peut pas être modifié.'
              : 'L\'affectation au poste sera créée automatiquement lors de la création.'}
          </div>
          <form onSubmit={handleSubmit(d => saveMutation.mutate(d as unknown as Record<string, unknown>))}>
            <div className="row">
              <div className="col-md-3">
                <div className="form-group">
                  <label className="font-weight-600">Prénom</label>
                  <input {...register('prenom', { required: true })} className="form-control" />
                </div>
              </div>
              <div className="col-md-3">
                <div className="form-group">
                  <label className="font-weight-600">Nom</label>
                  <input {...register('nom', { required: true })} className="form-control" />
                </div>
              </div>
              {!editItem && (
                <>
                  <div className="col-md-3">
                    <div className="form-group">
                      <label className="font-weight-600">Pseudo <span className="text-danger">*</span></label>
                      <input {...register('pseudo', { required: !editItem })} className="form-control" />
                    </div>
                  </div>
                  <div className="col-md-3">
                    <div className="form-group">
                      <label className="font-weight-600">Mot de passe <span className="text-danger">*</span></label>
                      <input type="password" {...register('mot_de_passe', { required: !editItem })} className="form-control" />
                    </div>
                  </div>
                </>
              )}
              <div className="col-md-3">
                <div className="form-group">
                  <label className="font-weight-600">Rôle</label>
                  <select {...register('role', { required: true })} className="form-control">
                    <option value="RECEVEUR">RECEVEUR</option>
                    <option value="ADMIN">ADMIN</option>
                  </select>
                </div>
              </div>
              {!editItem && (
                <div className="col-md-3">
                  <div className="form-group">
                    <label className="font-weight-600">Poste <span className="text-danger">*</span></label>
                    <select {...register('poste_id', { required: !editItem, valueAsNumber: true })} className="form-control">
                      <option value="">— Choisir —</option>
                      {(postes || []).map((p: Record<string, unknown>) => (
                        <option key={p.id_poste as number} value={p.id_poste as number}>
                          {p.nom_poste as string} ({p.code_poste as string})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}
            </div>
            <div className="d-flex" style={{ gap: 8 }}>
              <button type="button" className="btn btn-secondary" onClick={() => { setShowForm(false); reset() }}>Annuler</button>
              <button type="submit" className="btn btn-primary" disabled={saveMutation.isPending}>
                {saveMutation.isPending ? 'Enregistrement...' : 'Enregistrer'}
              </button>
            </div>
          </form>
        </CardBox>
      )}

      <CardBox>
        {isLoading ? <Spinner fullPage /> : (utilisateurs || []).length === 0
          ? <EmptyState message="Aucun utilisateur" />
          : (
            <div className="table-responsive">
              <table className="table table-hover">
                <thead style={{ background: '#f8f9fa' }}>
                  <tr><th>Nom complet</th><th>Pseudo</th><th>Rôle</th><th>Statut</th><th>Actions</th></tr>
                </thead>
                <tbody>
                  {(utilisateurs || []).map((u: Record<string, unknown>) => (
                    <tr key={u.id_user as number}>
                      <td><strong>{u.prenom as string} {u.nom as string}</strong></td>
                      <td><code>{u.pseudo as string}</code></td>
                      <td>
                        <span className={`badge badge-${u.role === 'ADMIN' ? 'primary' : 'secondary'}`}>
                          {u.role as string}
                        </span>
                      </td>
                      <td>
                        <span className={`badge badge-${u.actif ? 'success' : 'danger'}`}>
                          {u.actif ? 'Actif' : 'Inactif'}
                        </span>
                      </td>
                      <td>
                        <div className="d-flex" style={{ gap: 4 }}>
                          <button className="btn btn-sm btn-outline-warning" onClick={() => handleEdit(u)}>
                            <i className="dw dw-edit2" />
                          </button>
                          <button className="btn btn-sm btn-outline-danger" onClick={() => setDeleteId(u.id_user as number)}>
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

      {deleteId && (
        <div className="modal fade show" style={{ display: 'block', background: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-sm">
            <div className="modal-content">
              <div className="modal-header"><h5 className="modal-title">Confirmation</h5></div>
              <div className="modal-body"><p>Supprimer cet utilisateur ?</p></div>
              <div className="modal-footer">
                <button className="btn btn-secondary btn-sm" onClick={() => setDeleteId(null)}>Annuler</button>
                <button className="btn btn-danger btn-sm" onClick={() => deleteMutation.mutate(deleteId!)}
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
