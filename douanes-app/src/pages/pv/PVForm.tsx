import { useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQuery } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { createPV, updatePV, getPV } from '../../api/pv.api'
import { CardBox } from '../../components/ui/CardBox'
import { Spinner } from '../../components/ui/Spinner'
import { useAuth } from '../../hooks/useAuth'
import { todayAPI } from '../../utils/formatDate'
import { formatMontant } from '../../utils/formatMontant'

// Schéma avec coerce
const schema = z.object({
  date_pv: z.string().min(1, 'Date requise'),
  solde_dernier_controle: z.coerce.number().min(0).default(0),
  mouvements_debiteurs: z.coerce.number().min(0).default(0),
  mouvements_crediteurs: z.coerce.number().min(0).default(0),
  observation: z.string().optional(),
  virements: z.array(z.object({
    date_virement: z.string().min(1, 'Date requise'),
    num_virement: z.string().min(1, 'Numéro requis'),
    montant: z.coerce.number().min(0),
    observation: z.string().optional(),
  })).default([]),
  cheques: z.array(z.object({
    date_cheque: z.string().min(1, 'Date requise'),
    num_cheque: z.string().min(1, 'Numéro requis'),
    montant: z.coerce.number().min(0),
    num_dr: z.string().optional(),
    observation: z.string().optional(),
  })).default([]),
})

type FormData = z.infer<typeof schema>

export default function PVForm() {
  const navigate = useNavigate()
  const { id } = useParams()
  const { poste } = useAuth()
  const isEdit = Boolean(id)

  const { data: existing, isLoading: loadingExisting } = useQuery({
    queryKey: ['pv', id],
    queryFn: () => getPV(Number(id)),
    enabled: isEdit,
  })

  const form = useForm<FormData>({
    resolver: zodResolver(schema) as any, // ← contournement TypeScript
    defaultValues: {
      date_pv: todayAPI(),
      solde_dernier_controle: 0,
      mouvements_debiteurs: 0,
      mouvements_crediteurs: 0,
      virements: [],
      cheques: [],
    },
  })

  const { register, handleSubmit, watch, setValue, control, formState: { errors } } = form
  const { fields: vFields, append: addV, remove: removeV } = useFieldArray({ control, name: 'virements' })
  const { fields: cFields, append: addC, remove: removeC } = useFieldArray({ control, name: 'cheques' })

  useEffect(() => {
    if (existing) {
      setValue('date_pv', existing.date_pv || todayAPI())
      setValue('solde_dernier_controle', existing.solde_dernier_controle || 0)
      setValue('mouvements_debiteurs', existing.mouvements_debiteurs || 0)
      setValue('mouvements_crediteurs', existing.mouvements_crediteurs || 0)
      setValue('observation', existing.observation || '')
      setValue('virements', (existing.virements || []).map((v: any) => ({
        date_virement: v.date_virement || '',
        num_virement: v.num_virement || '',
        montant: v.montant || 0,
        observation: v.observation || '',
      })))
      setValue('cheques', (existing.cheques || []).map((c: any) => ({
        date_cheque: c.date_cheque || '',
        num_cheque: c.num_cheque || '',
        montant: c.montant || 0,
        num_dr: c.num_dr || '',
        observation: c.observation || '',
      })))
    }
  }, [existing, setValue])

  const sdc = watch('solde_dernier_controle') || 0
  const md = watch('mouvements_debiteurs') || 0
  const mc = watch('mouvements_crediteurs') || 0
  const soldeTheorique = Number(sdc) + Number(md) - Number(mc)

  const mutation = useMutation({
    mutationFn: async (data: FormData) => {
      if (isEdit) {
        return updatePV(Number(id), { observation: data.observation })
      }
      return createPV({
        ...data,
        poste_id: poste!.id_poste,
      })
    },
    onSuccess: () => {
      toast.success(isEdit ? 'PV modifié' : 'PV créé')
      navigate('/pv')
    },
    onError: (error: any) => {
      const msg = error?.response?.data?.detail || 'Erreur lors de la sauvegarde'
      toast.error(msg)
    },
  })

  if (isEdit && loadingExisting) return <Spinner fullPage />

  // Typage explicite de onSubmit pour éviter l'erreur
  const onSubmit = (data: FormData) => {
    mutation.mutate(data)
  }

  return (
    <div className="min-height-200px">
      <div className="page-header">
        <div className="row">
          <div className="col">
            <div className="title"><h4>{isEdit ? 'Modifier le PV' : 'Nouveau Procès-Verbal'}</h4></div>
            <nav aria-label="breadcrumb">
              <ol className="breadcrumb">
                <li className="breadcrumb-item"><a href="/dashboard">Accueil</a></li>
                <li className="breadcrumb-item"><a href="/pv">PV</a></li>
                <li className="breadcrumb-item active">{isEdit ? 'Modifier' : 'Nouveau'}</li>
              </ol>
            </nav>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        <CardBox className="mb-20">
          <h5 className="mb-3 h6" style={{ borderBottom: '2px solid #7934f3', paddingBottom: 8 }}>
            Informations générales
          </h5>
          <div className="row">
            <div className="col-md-3">
              <div className="form-group">
                <label className="font-weight-600">Date du PV <span className="text-danger">*</span></label>
                <input type="date" {...register('date_pv')} className={`form-control ${errors.date_pv ? 'is-invalid' : ''}`}
                  disabled={isEdit} />
                {errors.date_pv && <div className="invalid-feedback">{errors.date_pv.message}</div>}
                {!isEdit && <small className="text-muted">La période se calcule automatiquement</small>}
              </div>
            </div>
            <div className="col-md-3">
              <div className="form-group">
                <label className="font-weight-600">Poste</label>
                <input type="text" className="form-control" value={poste?.nom_poste || ''} readOnly
                  style={{ background: '#f8f9fa' }} />
              </div>
            </div>
            <div className="col-md-3">
              <div className="form-group">
                <label className="font-weight-600">Solde théorique (auto)</label>
                <input type="text" className="form-control font-weight-700" readOnly
                  value={formatMontant(soldeTheorique)}
                  style={{ background: '#f0e8ff', color: '#7934f3' }} />
              </div>
            </div>
          </div>

          {!isEdit && (
            <div className="row">
              <div className="col-md-4">
                <div className="form-group">
                  <label className="font-weight-600">Solde dernier contrôle</label>
                  <input type="number" {...register('solde_dernier_controle', { valueAsNumber: true })} 
                    className={`form-control ${errors.solde_dernier_controle ? 'is-invalid' : ''}`} />
                  {errors.solde_dernier_controle && <div className="invalid-feedback">{errors.solde_dernier_controle.message}</div>}
                </div>
              </div>
              <div className="col-md-4">
                <div className="form-group">
                  <label className="font-weight-600">Mouvements débiteurs</label>
                  <input type="number" {...register('mouvements_debiteurs', { valueAsNumber: true })} 
                    className={`form-control ${errors.mouvements_debiteurs ? 'is-invalid' : ''}`} />
                  {errors.mouvements_debiteurs && <div className="invalid-feedback">{errors.mouvements_debiteurs.message}</div>}
                </div>
              </div>
              <div className="col-md-4">
                <div className="form-group">
                  <label className="font-weight-600">Mouvements créditeurs</label>
                  <input type="number" {...register('mouvements_crediteurs', { valueAsNumber: true })} 
                    className={`form-control ${errors.mouvements_crediteurs ? 'is-invalid' : ''}`} />
                  {errors.mouvements_crediteurs && <div className="invalid-feedback">{errors.mouvements_crediteurs.message}</div>}
                </div>
              </div>
            </div>
          )}

          <div className="form-group">
            <label className="font-weight-600">Observation</label>
            <textarea {...register('observation')} className="form-control" rows={3} />
          </div>
        </CardBox>

        {!isEdit && (
          <>
            <CardBox className="mb-20">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h5 className="mb-0 h6" style={{ borderBottom: '2px solid #04a9f5', paddingBottom: 8 }}>Virements</h5>
                <button type="button" className="btn btn-sm btn-outline-primary"
                  onClick={() => addV({ date_virement: todayAPI(), num_virement: '', montant: 0, observation: '' })}>
                  <i className="dw dw-add mr-1" /> Ajouter
                </button>
              </div>
              {vFields.length === 0 ? (
                <p className="text-muted text-center py-3">Aucun virement — cliquez sur Ajouter</p>
              ) : (
                <div className="table-responsive">
                  <table className="table table-sm">
                    <thead style={{ background: '#f8f9fa' }}>
                      <tr><th>Date</th><th>N° Virement</th><th>Montant</th><th>Observation</th><th></th></tr>
                    </thead>
                    <tbody>
                      {vFields.map((f, i) => (
                        <tr key={f.id}>
                          <td><input type="date" {...register(`virements.${i}.date_virement`)} className="form-control form-control-sm" /></td>
                          <td><input {...register(`virements.${i}.num_virement`)} className="form-control form-control-sm" placeholder="ex: VIR-001" /></td>
                          <td><input type="number" {...register(`virements.${i}.montant`, { valueAsNumber: true })} 
                            className="form-control form-control-sm" /></td>
                          <td><input {...register(`virements.${i}.observation`)} className="form-control form-control-sm" /></td>
                          <td>
                            <button type="button" className="btn btn-sm btn-outline-danger" onClick={() => removeV(i)}>
                              <i className="dw dw-delete-3" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardBox>

            <CardBox className="mb-20">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h5 className="mb-0 h6" style={{ borderBottom: '2px solid #1ec01e', paddingBottom: 8 }}>Chèques</h5>
                <button type="button" className="btn btn-sm btn-outline-success"
                  onClick={() => addC({ date_cheque: todayAPI(), num_cheque: '', montant: 0, num_dr: '', observation: '' })}>
                  <i className="dw dw-add mr-1" /> Ajouter
                </button>
              </div>
              {cFields.length === 0 ? (
                <p className="text-muted text-center py-3">Aucun chèque — cliquez sur Ajouter</p>
              ) : (
                <div className="table-responsive">
                  <table className="table table-sm">
                    <thead style={{ background: '#f8f9fa' }}>
                      <tr><th>Date</th><th>N° Chèque</th><th>Montant</th><th>N° DR</th><th>Observation</th><th></th></tr>
                    </thead>
                    <tbody>
                      {cFields.map((f, i) => (
                        <tr key={f.id}>
                          <td><input type="date" {...register(`cheques.${i}.date_cheque`)} className="form-control form-control-sm" /></td>
                          <td><input {...register(`cheques.${i}.num_cheque`)} className="form-control form-control-sm" placeholder="ex: CHQ-001" /></td>
                          <td><input type="number" {...register(`cheques.${i}.montant`, { valueAsNumber: true })} 
                            className="form-control form-control-sm" /></td>
                          <td><input {...register(`cheques.${i}.num_dr`)} className="form-control form-control-sm" /></td>
                          <td><input {...register(`cheques.${i}.observation`)} className="form-control form-control-sm" /></td>
                          <td>
                            <button type="button" className="btn btn-sm btn-outline-danger" onClick={() => removeC(i)}>
                              <i className="dw dw-delete-3" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardBox>
          </>
        )}

        <div className="d-flex" style={{ gap: 10 }}>
          <button type="button" className="btn btn-secondary" onClick={() => navigate('/pv')}>Annuler</button>
          <button type="submit" className="btn btn-primary" disabled={mutation.isPending}>
            {mutation.isPending ? (
              <><span className="spinner-border spinner-border-sm mr-2" />Enregistrement...</>
            ) : (
              'Enregistrer'
            )}
          </button>
        </div>
      </form>
    </div>
  )
}