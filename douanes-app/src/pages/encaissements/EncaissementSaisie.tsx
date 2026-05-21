import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQuery } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { createEncaissement } from '../../api/encaissements.api'
import { rechercherLigne } from '../../api/lignes.api'
import { getUnites, getUnitesByPoste } from '../../api/unites.api'
import { CardBox } from '../../components/ui/CardBox'
import { useAuth } from '../../hooks/useAuth'
import { useDebounce } from '../../hooks/useDebounce'
import { todayAPI } from '../../utils/formatDate'
import { formatMontant } from '../../utils/formatMontant'

interface LigneResolue { num_ligne: string; intitule: string; code_taxe: string }

const schema = z.object({
  id_unite: z.coerce.number().min(1, 'Unité requise'),
  num_ligne: z.string().min(1, 'Numéro de ligne requis'),
  date_encaissement: z.string().min(1, 'Date requise'),
  montant: z.coerce.number().positive('Montant requis'),
})
type FormData = z.infer<typeof schema>

export default function EncaissementSaisie() {
  const { isAdmin, poste } = useAuth()
  const [numLigneInput, setNumLigneInput] = useState('')
  const [ligneResolue, setLigneResolue] = useState<LigneResolue | null>(null)
  const [ligneErreur, setLigneErreur] = useState('')
  const [montantDisplay, setMontantDisplay] = useState('')
  const debouncedLigne = useDebounce(numLigneInput, 400)

  // === GESTION DE LA DATE PERSISTANTE ===
  // La date par défaut est celle d'aujourd'hui, mais ensuite elle ne change que si l'utilisateur la modifie manuellement
  const [persistedDate, setPersistedDate] = useState(todayAPI)

  const { data: unites } = useQuery({
    queryKey: ['unites', isAdmin ? 'all' : poste?.id_poste],
    queryFn: () => isAdmin ? getUnites() : getUnitesByPoste(poste!.id_poste),
    enabled: !!poste,
  })

  const { register, handleSubmit, setValue, reset, watch, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema) as any,
    defaultValues: { date_encaissement: persistedDate, montant: 0 },
  })

  // Synchronisation du champ date avec l'état persistedDate
  useEffect(() => {
    setValue('date_encaissement', persistedDate)
  }, [persistedDate, setValue])

  // Mise à jour de persistedDate quand l'utilisateur change manuellement la date
  const watchedDate = watch('date_encaissement')
  useEffect(() => {
    if (watchedDate && watchedDate !== persistedDate) {
      setPersistedDate(watchedDate)
    }
  }, [watchedDate, persistedDate])

  /* Résolution automatique de la ligne */
  useEffect(() => {
    if (!debouncedLigne) { setLigneResolue(null); setLigneErreur(''); return }
    rechercherLigne(debouncedLigne)
      .then(data => {
        setLigneResolue(data)
        setLigneErreur('')
        setValue('num_ligne', debouncedLigne)
      })
      .catch(() => {
        setLigneResolue(null)
        setLigneErreur(`Ligne "${debouncedLigne}" introuvable`)
        setValue('num_ligne', '')
      })
  }, [debouncedLigne, setValue])

  const [savedUniteId, setSavedUniteId] = useState<number | ''>('')

  const mutation = useMutation({
    mutationFn: createEncaissement,
    onSuccess: (_, variables) => {
      toast.success('Encaissement enregistré avec succès')
      // Après succès : on garde la même unité (déjà dans savedUniteId), la même date (persistedDate),
      // on réinitialise seulement les champs de ligne et montant
      setNumLigneInput('')
      setLigneResolue(null)
      setLigneErreur('')
      setMontantDisplay('')
      setValue('num_ligne', '')
      setValue('montant', 0)
      // On conserve l'unité sélectionnée (savedUniteId) et la date (persistedDate) intactes
    },
    onError: (e: any) => {
      const msg = e?.response?.data?.detail || 'Erreur lors de l\'enregistrement'
      toast.error(msg)
    },
  })

  const handleReset = () => {
    // Réinitialise tout SAUF la date (on garde persistedDate)
    setNumLigneInput('')
    setLigneResolue(null)
    setLigneErreur('')
    setMontantDisplay('')
    setValue('id_unite', '' as unknown as number)
    setValue('num_ligne', '')
    setValue('montant', 0)
    setSavedUniteId('')
    // La date reste la même (persistedDate) – pas de changement
    toast('Formulaire réinitialisé, la date a été conservée', { icon: '📅' })
  }

  return (
    <div className="min-height-200px">
      <div className="page-header">
        <div className="row">
          <div className="col">
            <div className="title"><h4>Saisie d'encaissement</h4></div>
            <nav aria-label="breadcrumb">
              <ol className="breadcrumb">
                <li className="breadcrumb-item"><a href="/dashboard">Accueil</a></li>
                <li className="breadcrumb-item"><a href="/encaissements">Encaissements</a></li>
                <li className="breadcrumb-item active">Saisie</li>
              </ol>
            </nav>
          </div>
        </div>
      </div>

      <div className="row">
        <div className="col-lg-8">
          <CardBox>
            <h5 className="mb-4 h6" style={{ borderBottom: '2px solid #7934f3', paddingBottom: 8 }}>
              <i className="dw dw-money mr-2" style={{ color: '#7934f3' }} />
              Nouveau encaissement
            </h5>

            <form onSubmit={handleSubmit(data => {
              setSavedUniteId(data.id_unite)
              mutation.mutate({
                id_unite: data.id_unite,
                num_ligne: data.num_ligne,
                date_encaissement: data.date_encaissement,
                montant: data.montant,
              })
            })}>

              {/* Étape 1 — Unité */}
              <div className="form-group">
                <label className="font-weight-600">
                  <span className="badge badge-primary mr-2"
                    style={{ borderRadius: '50%', width: 22, height: 22, lineHeight: '22px' }}>1</span>
                  Unité
                </label>
                <select {...register('id_unite')}
                  className={`form-control ${errors.id_unite ? 'is-invalid' : ''}`}>
                  <option value="">— Sélectionnez une unité —</option>
                  {(unites || []).map((u: any) => (
                    <option key={u.id_unite} value={u.id_unite}>{u.nom_unite}</option>
                  ))}
                </select>
                {errors.id_unite && <div className="invalid-feedback">{errors.id_unite.message}</div>}
              </div>

              {/* Étape 2 — Num ligne avec résolution automatique */}
              <div className="form-group">
                <label className="font-weight-600">
                  <span className="badge badge-primary mr-2"
                    style={{ borderRadius: '50%', width: 22, height: 22, lineHeight: '22px' }}>2</span>
                  Numéro de ligne budgétaire
                </label>
                <input
                  type="text"
                  className={`form-control ${ligneErreur ? 'is-invalid' : ligneResolue ? 'is-valid' : ''}`}
                  placeholder="ex: 71313, 71314, 71315..."
                  value={numLigneInput}
                  onChange={e => setNumLigneInput(e.target.value)}
                />
                {ligneErreur && (
                  <div className="invalid-feedback d-block">
                    <i className="dw dw-warning mr-1" /> {ligneErreur}
                  </div>
                )}
                {ligneResolue && (
                  <div className="mt-2 p-3 rounded" style={{ background: '#e8fce8', border: '1px solid #1ec01e' }}>
                    <div style={{ fontSize: 13 }}>
                      <i className="dw dw-check-circle mr-1" style={{ color: '#1ec01e' }} />
                      <strong>Intitulé :</strong> {ligneResolue.intitule}
                    </div>
                    <div style={{ fontSize: 13, marginTop: 4 }}>
                      <strong>Code taxe :</strong>{' '}
                      <span className="badge badge-success">{ligneResolue.code_taxe}</span>
                    </div>
                  </div>
                )}
                <small className="text-muted">
                  Le code taxe et l'intitulé sont résolus automatiquement.
                  Ne saisissez jamais le code taxe manuellement.
                </small>
              </div>

              {/* Étape 3 — Date (persistante) */}
              <div className="form-group">
                <label className="font-weight-600">
                  <span className="badge badge-primary mr-2"
                    style={{ borderRadius: '50%', width: 22, height: 22, lineHeight: '22px' }}>3</span>
                  Date d'encaissement
                </label>
                <input
                  type="date"
                  {...register('date_encaissement')}
                  className={`form-control ${errors.date_encaissement ? 'is-invalid' : ''}`}
                />
                <small className="text-muted">
                  Cette date sera conservée pour les prochaines saisies. Vous pouvez la modifier à tout moment.
                </small>
                {errors.date_encaissement && (
                  <div className="invalid-feedback">{errors.date_encaissement.message}</div>
                )}
              </div>

              {/* Étape 4 — Montant */}
              <div className="form-group">
                <label className="font-weight-600">
                  <span className="badge badge-primary mr-2"
                    style={{ borderRadius: '50%', width: 22, height: 22, lineHeight: '22px' }}>4</span>
                  Montant (FCFA)
                </label>
                <input
                  type="number"
                  {...register('montant')}
                  className={`form-control ${errors.montant ? 'is-invalid' : ''}`}
                  placeholder="0"
                  onChange={e => {
                    const v = Number(e.target.value)
                    setMontantDisplay(v > 0 ? formatMontant(v) : '')
                    setValue('montant', v)
                  }}
                />
                {montantDisplay && (
                  <small className="text-success font-weight-600">{montantDisplay}</small>
                )}
                {errors.montant && <div className="invalid-feedback">{errors.montant.message}</div>}
              </div>

              <div className="d-flex mt-4" style={{ gap: 10 }}>
                <button type="button" className="btn btn-secondary" onClick={handleReset}>
                  Réinitialiser
                </button>
                <button type="submit" className="btn btn-primary"
                  disabled={mutation.isPending || !ligneResolue}>
                  {mutation.isPending
                    ? <><span className="spinner-border spinner-border-sm mr-2" />Enregistrement...</>
                    : <><i className="dw dw-check-circle mr-1" />Enregistrer</>}
                </button>
              </div>
            </form>
          </CardBox>
        </div>

        {/* Guide */}
        <div className="col-lg-4">
          <CardBox>
            <h6 style={{ color: '#7934f3', marginBottom: 14 }}>
              <i className="dw dw-information mr-1" /> Guide de saisie
            </h6>
            <ol style={{ fontSize: 13, color: '#555', paddingLeft: 18 }}>
              <li className="mb-2">Sélectionnez l'unité concernée</li>
              <li className="mb-2">Entrez le <strong>numéro de ligne</strong> — le code taxe et l'intitulé s'affichent automatiquement</li>
              <li className="mb-2">Vérifiez la date (elle reste la même d'une saisie à l'autre)</li>
              <li className="mb-2">Entrez le montant en FCFA</li>
              <li>Cliquez sur <strong>Enregistrer</strong></li>
            </ol>
            <div style={{ height: 1, background: '#f0f0f0', margin: '14px 0' }} />
            <h6 style={{ color: '#353535', fontSize: 12, marginBottom: 8 }}>
              Exemples de numéros de lignes :
            </h6>
            <table className="table table-sm table-borderless mb-0" style={{ fontSize: 12 }}>
              <tbody>
                {[
                  ['71313', 'TVA'], ['71314', 'DAC'],
                  ['71315', 'RII'], ['71316', 'PCT'],
                  ['71317', 'DDI'], ['71318', 'PRO'],
                ].map(([num, code]) => (
                  <tr key={num}>
                    <td><span className="badge badge-secondary">{num}</span></td>
                    <td><span className="badge badge-info">{code}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardBox>
        </div>
      </div>
    </div>
  )
}