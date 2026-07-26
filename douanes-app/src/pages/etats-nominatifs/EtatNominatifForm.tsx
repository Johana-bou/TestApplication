import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import {
  getTypesDisponibles,
  getCompteAmende,
  createEtatNominatif,
  getUsagersDisponibles,
} from '../../api/etat-nominatif.api'
import { CardBox } from '../../components/ui/CardBox'
import { Spinner } from '../../components/ui/Spinner'
import { useAuth } from '../../hooks/useAuth'
import { useDebounce } from '../../hooks/useDebounce'
import { todayAPI } from '../../utils/formatDate'
import { formatMontant } from '../../utils/formatMontant'
import { useEnterNavigation } from '../../hooks/useEnterNavigation'

interface Ligne {
  id_usager: number
  nom_usager: string
  libelle: string
  montant_rar_physique: number
  montant_rar_balance: number
}

export default function EtatNominatifForm() {
  const navigate = useNavigate()
  const { poste } = useAuth()
  const formRef = useRef<HTMLFormElement>(null)
  useEnterNavigation(formRef)

  const [typeEtat, setTypeEtat] = useState<'RAR' | 'AMENDE'>('RAR')
  const [compteAmende, setCompteAmende] = useState<Record<string, unknown> | null>(null)
  const [lignes, setLignes] = useState<Ligne[]>([])
  const [searchUsager, setSearchUsager] = useState('')
  const [showUsagerSearch, setShowUsagerSearch] = useState(false)
  const debouncedSearch = useDebounce(searchUsager, 300)

  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: { date_etat: todayAPI(), observation: '' }
  })

  // Récupération des types disponibles (select)
  const { data: types } = useQuery({
    queryKey: ['types-nominatifs'],
    queryFn: getTypesDisponibles,
  })

  const { data: usagers } = useQuery({
    queryKey: ['usagers-disponibles', debouncedSearch],
    queryFn: () => getUsagersDisponibles({ search: debouncedSearch || undefined }),
    enabled: showUsagerSearch,
  })

  // Charger compte AMENDE automatiquement
  useEffect(() => {
    if (typeEtat === 'AMENDE' && poste?.id_poste) {
      getCompteAmende(poste.id_poste)
        .then(data => setCompteAmende(data))
        .catch(() => toast.error('Aucun compte AMENDE configuré pour ce poste'))
    } else {
      setCompteAmende(null)
    }
  }, [typeEtat, poste?.id_poste])

  const addLigne = (usager: Record<string, unknown>) => {
    if (lignes.some(l => l.id_usager === usager.id_usager)) {
      toast.error('Cet usager est déjà dans la liste')
      return
    }
    setLignes(prev => [...prev, {
      id_usager: usager.id_usager as number,
      nom_usager: usager.nom_usager as string,
      libelle: '',
      montant_rar_physique: 0,
      montant_rar_balance: 0,
    }])
    setShowUsagerSearch(false)
    setSearchUsager('')
  }

  const updateLigne = (idx: number, field: keyof Ligne, value: string | number) => {
    setLignes(prev => prev.map((l, i) => i === idx ? { ...l, [field]: value } : l))
  }

  const removeLigne = (idx: number) => {
    setLignes(prev => prev.filter((_, i) => i !== idx))
  }

  const totalPhysique = lignes.reduce((acc, l) => acc + (Number(l.montant_rar_physique) || 0), 0)
  const totalBalance = lignes.reduce((acc, l) => acc + (Number(l.montant_rar_balance) || 0), 0)
  const totalEcart = totalPhysique - totalBalance

  const mutation = useMutation({
    mutationFn: (formData: Record<string, unknown>) => {
      const payload = {
        type: typeEtat,
        date_etat: formData.date_etat,
        observation: formData.observation,
        ...(compteAmende ? { id_compte: compteAmende.id_compte } : {}),
        lignes: lignes.map(l => ({
          id_usager: l.id_usager,
          libelle: l.libelle,
          montant_rar_physique: Number(l.montant_rar_physique),
          montant_rar_balance: Number(l.montant_rar_balance),
        })),
      }
      return createEtatNominatif(payload as any)
    },
    onSuccess: (data) => {
      toast.success(`État ${typeEtat} créé avec succès`)
      navigate(`/etats-nominatifs/${data.id_etat}`)
    },
    onError: () => toast.error('Erreur lors de la création'),
  })

  return (
    <div className="min-height-200px">
      <div className="page-header">
        <div className="row align-items-center">
          <div className="col">
            <div className="title"><h4>Nouvel État Nominatif</h4></div>
            <nav aria-label="breadcrumb">
              <ol className="breadcrumb">
                <li className="breadcrumb-item"><a href="/dashboard">Accueil</a></li>
                <li className="breadcrumb-item"><a href="/etats-nominatifs">États</a></li>
                <li className="breadcrumb-item active">Nouveau</li>
              </ol>
            </nav>
          </div>
        </div>
      </div>

      <form ref={formRef} onSubmit={handleSubmit(d => mutation.mutate(d as Record<string, unknown>))}>
        {/* Infos générales */}
        <CardBox className="mb-20">
          <h5 className="mb-4 h6" style={{ borderBottom: '2px solid #7934f3', paddingBottom: 8 }}>
            Informations générales
          </h5>
          <div className="row">
            <div className="col-md-4">
              <div className="form-group">
                <label className="font-weight-600">Type d'état</label>
                <select
                  className="form-control"
                  value={typeEtat}
                  onChange={(e) => setTypeEtat(e.target.value as 'RAR' | 'AMENDE')}
                >
                  {(types || [{ valeur: 'RAR', libelle: 'RAR' }, { valeur: 'AMENDE', libelle: 'AMENDE' }]).map((t: Record<string, unknown>) => (
                    <option key={t.valeur as string} value={t.valeur as string}>
                      {t.libelle as string}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="col-md-3">
              <div className="form-group">
                <label className="font-weight-600">Date</label>
                <input type="date" {...register('date_etat')} className="form-control" />
              </div>
            </div>
            {typeEtat === 'AMENDE' && (
              <div className="col-md-5">
                <div className="form-group">
                  <label className="font-weight-600">Compte AMENDE</label>
                  {compteAmende ? (
                    <div className="form-control" style={{ background: '#f0e8ff', color: '#7934f3', fontWeight: 600 }}>
                      {compteAmende.num_compte as string} — {compteAmende.nom_compte as string}
                    </div>
                  ) : (
                    <div className="form-control text-muted" style={{ background: '#f8f9fa' }}>
                      Chargement...
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </CardBox>

        {/* Lignes */}
        <CardBox className="mb-20">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h5 className="mb-0 h6" style={{ borderBottom: '2px solid #04a9f5', paddingBottom: 8 }}>
              Lignes nominatives
            </h5>
            <button type="button" className="btn btn-sm btn-outline-primary" onClick={() => setShowUsagerSearch(!showUsagerSearch)}>
              <i className="dw dw-add mr-1" /> Ajouter un usager
            </button>
          </div>

          {/* Recherche usager - affichage simplifié (seulement le nom) */}
          {showUsagerSearch && (
            <div className="mb-3 p-3 rounded" style={{ background: '#f8f9fa', border: '1px solid #dee2e6' }}>
              <input
                type="text"
                className="form-control mb-2"
                placeholder="Rechercher un usager par nom..."
                value={searchUsager}
                onChange={e => setSearchUsager(e.target.value)}
                autoFocus
              />
              {(usagers || []).length > 0 && (
                <div style={{ maxHeight: 200, overflowY: 'auto', border: '1px solid #eee', borderRadius: 6, background: '#fff' }}>
                  {(usagers || []).map((u: Record<string, unknown>) => (
                    <div
                      key={u.id_usager as number}
                      onClick={() => addLigne(u)}
                      style={{
                        padding: '8px 14px',
                        cursor: 'pointer',
                        borderBottom: '1px solid #f5f5f5',
                        fontSize: 13,
                      }}
                      onMouseOver={e => (e.currentTarget.style.background = '#f0e8ff')}
                      onMouseOut={e => (e.currentTarget.style.background = '#fff')}
                    >
                      <strong>{u.nom_usager as string}</strong>
                      {/* Plus d'affichage de raison sociale ni de numéro de compte */}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {lignes.length === 0 ? (
            <div className="text-center py-4 text-muted">
              <i className="dw dw-add font-36" />
              <p className="mt-2">Ajoutez des usagers pour constituer l'état nominatif</p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-sm">
                <thead style={{ background: '#f8f9fa' }}>
                  <tr>
                    <th>Usager</th>
                    <th>Libellé</th>
                    <th style={{ width: 160 }}>Montant physique</th>
                    <th style={{ width: 160 }}>Montant balance</th>
                    <th style={{ width: 140 }}>Écart</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {lignes.map((l, i) => {
                    const ecart = (Number(l.montant_rar_physique) || 0) - (Number(l.montant_rar_balance) || 0)
                    return (
                      <tr key={i}>
                        <td style={{ fontSize: 13 }}><strong>{l.nom_usager}</strong></td>
                        <td>
                          <input
                            type="text"
                            className="form-control form-control-sm"
                            value={l.libelle}
                            onChange={e => updateLigne(i, 'libelle', e.target.value)}
                            placeholder="Libellé..."
                          />
                        </td>
                        <td>
                          <input
                            type="number"
                            className="form-control form-control-sm"
                            value={l.montant_rar_physique}
                            onChange={e => updateLigne(i, 'montant_rar_physique', Number(e.target.value))}
                          />
                        </td>
                        <td>
                          <input
                            type="number"
                            className="form-control form-control-sm"
                            value={l.montant_rar_balance}
                            onChange={e => updateLigne(i, 'montant_rar_balance', Number(e.target.value))}
                          />
                        </td>
                        <td style={{ color: ecart === 0 ? '#1ec01e' : '#e55353', fontSize: 12, fontWeight: 600 }}>
                          {new Intl.NumberFormat('fr-FR').format(ecart)}
                        </td>
                        <td>
                          <button type="button" className="btn btn-sm btn-outline-danger" onClick={() => removeLigne(i)}>
                            <i className="dw dw-delete-3" />
                          </button>
                        </td>
                      </tr>
                    )
                  })}

                </tbody>
                <tfoot style={{ background: '#f0e8ff' }}>
                  <tr>
                    <td colSpan={2} className="font-weight-700 text-right" style={{ fontSize: 13 }}>TOTAUX :</td>
                    <td style={{ fontWeight: 700, color: '#7934f3' }}>{formatMontant(totalPhysique)}</td>
                    <td style={{ fontWeight: 700, color: '#7934f3' }}>{formatMontant(totalBalance)}</td>
                    <td style={{ fontWeight: 700, color: totalEcart === 0 ? '#1ec01e' : '#e55353' }}>
                      {formatMontant(Math.abs(totalEcart))}
                    </td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </CardBox>

          <div className="form-group">
            <label className="font-weight-600">Observation</label>
            <textarea {...register('observation')} className="form-control" rows={2} />
          </div>

        <div className="d-flex" style={{ gap: 10 }}>
          <button type="button" className="btn btn-secondary" onClick={() => navigate('/etats-nominatifs')}>Annuler</button>
          <button type="submit" className="btn btn-primary" disabled={mutation.isPending || lignes.length === 0}>
            {mutation.isPending ? <><span className="spinner-border spinner-border-sm mr-2" />Enregistrement...</> : 'Enregistrer'}
          </button>
        </div>
      </form>
    </div>
  )
}