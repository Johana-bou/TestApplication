import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import {
  getAffectations, createAffectation, deleteAffectation, getAffectationsActives,
  getUtilisateurs, getPostes,
} from '../../api/admin.api'
import { CardBox } from '../../components/ui/CardBox'
import { Spinner } from '../../components/ui/Spinner'
import { EmptyState } from '../../components/ui/EmptyState'
import { toDisplay } from '../../utils/formatDate'

export default function Affectations() {
  const qc = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [deleteId, setDeleteId] = useState<number | null>(null)

  const { data: affectations, isLoading } = useQuery({ queryKey: ['affectations'], queryFn: getAffectations })
  const { data: utilisateurs } = useQuery({ queryKey: ['utilisateurs'], queryFn: getUtilisateurs })
  const { data: postes } = useQuery({ queryKey: ['postes-admin'], queryFn: getPostes })

  const { register, handleSubmit, reset } = useForm<{
    id_user: number   // ← id_user (pas id_utilisateur)
    id_poste: number
    date_debut: string
  }>()

  const createMutation = useMutation({
    mutationFn: (data: { id_user: number; id_poste: number; date_debut: string }) =>
      createAffectation(data),
    onSuccess: (data) => {
      const msg = data.ancien_poste_termine?.length > 0
        ? `Affectation créée. Anciens postes terminés : ${data.ancien_poste_termine.join(', ')}`
        : 'Affectation créée avec succès'
      toast.success(msg)
      qc.invalidateQueries({ queryKey: ['affectations'] })
      setShowForm(false)
      reset()
    },
    onError: (e: any) => toast.error(e?.response?.data?.detail || 'Erreur'),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteAffectation(id),
    onSuccess: () => { toast.success('Supprimé'); qc.invalidateQueries({ queryKey: ['affectations'] }); setDeleteId(null) },
    onError: () => toast.error('Erreur'),
  })

  // Enrichir les affectations avec les noms
  const getUtilisateurNom = (idUser: number) => {
    const u = (utilisateurs || []).find((u: Record<string, unknown>) => u.id_user === idUser)
    return u ? `${u.prenom} ${u.nom}` : `Utilisateur #${idUser}`
  }
  const getPosteNom = (idPoste: number) => {
    const p = (postes || []).find((p: Record<string, unknown>) => p.id_poste === idPoste)
    return p ? p.nom_poste : `Poste #${idPoste}`
  }

  const today = new Date().toISOString().split('T')[0]

  return (
    <div className="min-height-200px">
      <div className="page-header">
        <div className="row align-items-center">
          <div className="col"><div className="title"><h4>Affectations</h4></div></div>
          <div className="col-auto">
            <button className="btn btn-primary" onClick={() => setShowForm(true)}>
              <i className="dw dw-add mr-1" /> Nouvelle affectation
            </button>
          </div>
        </div>
      </div>

      {showForm && (
        <CardBox className="mb-20">
          <h5 className="mb-3 h6">Nouvelle affectation</h5>
          <div className="alert alert-warning" style={{ fontSize: 12 }}>
            <i className="dw dw-warning mr-1" />
            <strong>Important :</strong> La création d'une nouvelle affectation terminera automatiquement
            toutes les affectations actives de l'utilisateur sélectionné.
          </div>
          <form onSubmit={handleSubmit(d => createMutation.mutate({
            id_user: Number(d.id_user),
            id_poste: Number(d.id_poste),
            date_debut: d.date_debut,
          }))}>
            <div className="row">
              <div className="col-md-4">
                <div className="form-group">
                  <label className="font-weight-600">Utilisateur <span className="text-danger">*</span></label>
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
              <div className="col-md-4">
                <div className="form-group">
                  <label className="font-weight-600">Poste <span className="text-danger">*</span></label>
                  <select {...register('id_poste', { required: true, valueAsNumber: true })} className="form-control">
                    <option value="">— Sélectionnez —</option>
                    {(postes || []).map((p: Record<string, unknown>) => (
                      <option key={p.id_poste as number} value={p.id_poste as number}>
                        {p.nom_poste as string} ({p.code_poste as string})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="col-md-3">
                <div className="form-group">
                  <label className="font-weight-600">Date début <span className="text-danger">*</span></label>
                  <input type="date" {...register('date_debut', { required: true })}
                    className="form-control" defaultValue={today} />
                </div>
              </div>
            </div>
            <div className="d-flex" style={{ gap: 8 }}>
              <button type="button" className="btn btn-secondary" onClick={() => { setShowForm(false); reset() }}>
                Annuler
              </button>
              <button type="submit" className="btn btn-primary" disabled={createMutation.isPending}>
                {createMutation.isPending ? 'Enregistrement...' : 'Enregistrer'}
              </button>
            </div>
          </form>
        </CardBox>
      )}

      <CardBox>
        {isLoading ? <Spinner fullPage /> : (affectations || []).length === 0
          ? <EmptyState message="Aucune affectation" />
          : (
            <div className="table-responsive">
              <table className="table table-hover">
                <thead style={{ background: '#f8f9fa' }}>
                  <tr><th>Utilisateur</th><th>Poste</th><th>Date début</th><th>Date fin</th><th>Statut</th><th>Actions</th></tr>
                </thead>
                <tbody>
                  {(affectations || []).map((a: Record<string, unknown>) => {
                    const isActive = !a.date_fin
                    return (
                      <tr key={a.id_affectation as number}>
                        <td><strong>{getUtilisateurNom(a.id_user as number)}</strong></td>
                        <td>{getPosteNom(a.id_poste as number)}</td>
                        <td style={{ fontSize: 13 }}>{a.date_debut ? toDisplay(String(a.date_debut)) : '-'}</td>
                        <td style={{ fontSize: 13 }}>
                          {a.date_fin ? toDisplay(String(a.date_fin)) : <span className="text-success">En cours</span>}
                        </td>
                        <td>
                          <span className={`badge badge-${isActive ? 'success' : 'secondary'}`}>
                            {isActive ? 'Active' : 'Terminée'}
                          </span>
                        </td>
                        <td>
                          <button className="btn btn-sm btn-outline-danger"
                            onClick={() => setDeleteId(a.id_affectation as number)}>
                            <i className="dw dw-delete-3" />
                          </button>
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
              <div className="modal-body"><p>Supprimer cette affectation ?</p></div>
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
