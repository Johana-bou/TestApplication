// src/pages/RapprochementNouveau.tsx
import { useState, useEffect, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useQuery, useMutation } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { useAuth } from '../../hooks/useAuth'
import { CardBox } from '../../components/ui/CardBox'
import { Spinner } from '../../components/ui/Spinner'
import api from '../../api/axios'
import { useEnterNavigation } from '../../hooks/useEnterNavigation'

const MOIS_LABELS = [
  'Janvier','Février','Mars','Avril','Mai','Juin',
  'Juillet','Août','Septembre','Octobre','Novembre','Décembre'
]

interface Compte { id_compte: number; nom_compte: string; num_compte: string }
interface ExistantInfo {
  existe              : boolean
  id_rapprochement   ?: number
  intitule           ?: string
  solde_balance      ?: number
  operation_acct_non_constate ?: number
  operation_poste_non_constate?: number
  solde_theorique    ?: number  
  ecart              ?: number
  observation        ?: string
}

export default function RapprochementNouveau() {
  const navigate = useNavigate()
  const { poste } = useAuth()
  const formRef = useRef<HTMLFormElement>(null)
  useEnterNavigation(formRef)

  const [searchParams] = useSearchParams()
  const today = new Date()
  const anneeCourante = today.getFullYear()
  const annees = Array.from({ length: 5 }, (_, i) => anneeCourante - i)

  // Champs du formulaire
  const [idCompte,     setIdCompte]     = useState<number | ''>(
    searchParams.get('compte') ? Number(searchParams.get('compte')) : ''
  )
  const [mois,         setMois]         = useState(
    searchParams.get('mois') ? Number(searchParams.get('mois')) : today.getMonth() + 1
  )
  const [annee,        setAnnee]        = useState(
    searchParams.get('annee') ? Number(searchParams.get('annee')) : anneeCourante
  )
  const [intitule,     setIntitule]     = useState('')
  const [soldeBalance, setSoldeBalance] = useState<number>(0)
  const [opAcct,       setOpAcct]       = useState<number>(0)
  const [opPoste,      setOpPoste]      = useState<number>(0)
  const [soldeTheorique, setSoldeTheorique] = useState<number>(0)  
  const [observation,  setObservation]  = useState('')

 
  const ecart = soldeTheorique - soldeBalance

  // ── Charger les comptes du poste ────────────────────────────────────────
  const { data: comptes = [], isLoading: loadingComptes } = useQuery<Compte[]>({
    queryKey: ['comptes', poste?.id_poste],
    queryFn: () => api.get(`/api/comptes/poste/${poste!.id_poste}`).then(r => r.data),
    enabled: !!poste,
  })

  // ── Vérifier si un rapprochement existe déjà pour ce compte/mois/année ─
  const {
    data     : existantInfo,
    isFetching: verifEnCours,
    refetch  : verifier,
  } = useQuery<ExistantInfo>({
    queryKey : ['rapprochement-verif', idCompte, mois, annee],
    queryFn  : () => api.get('/api/etats-rapprochement/verifier/mois', {
      params: { id_compte: idCompte, mois, annee }
    }).then(r => r.data),
    enabled  : false,
  })

  // Quand compte/mois/année changent → pré-remplir si existant
  useEffect(() => {
    if (!idCompte) return
    verifier().then(({ data }) => {
      if (data?.existe) {
        // Pré-remplir avec les valeurs existantes
        setSoldeBalance(data.solde_balance ?? 0)
        setOpAcct(data.operation_acct_non_constate ?? 0)
        setOpPoste(data.operation_poste_non_constate ?? 0)
        setSoldeTheorique(data.solde_theorique ?? 0)  // 
        setObservation(data.observation ?? '')
        setIntitule(data.intitule ?? '')
      } else {
        // Réinitialiser
        setSoldeBalance(0)
        setOpAcct(0)
        setOpPoste(0)
        setSoldeTheorique(0)  // 
        setObservation('')
      }
    })
  }, [idCompte, mois, annee])

  // ── Soumission ──────────────────────────────────────────────────────────
  const mutation = useMutation({
    mutationFn: () => api.post('/api/etats-rapprochement/', {
      id_compte                   : Number(idCompte),
      date_rapprochement          : `${annee}-${String(mois).padStart(2, '0')}-01`,
      intitule,
      solde_balance               : soldeBalance,
      operation_acct_non_constate : opAcct,
      operation_poste_non_constate: opPoste,
      solde_theorique             : soldeTheorique,  // ✅ Envoyer le solde théorique saisi
      observation,
    }),
    onSuccess: (res) => {
      const { action, message, id_rapprochement } = res.data
      toast.success(` ${message}`)
      navigate(`/rapprochement/${id_rapprochement}`)
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.detail || 'Erreur lors de l\'enregistrement')
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!idCompte) { toast.error('Sélectionnez un compte'); return }
    mutation.mutate()
  }

  const existeDeja = existantInfo?.existe === true

  return (
    <div className="min-height-200px">
      <div className="page-header">
        <div className="row align-items-center">
          <div className="col">
            <div className="title"><h4>Rapprochement Mensuel</h4></div>
            <nav aria-label="breadcrumb">
              <ol className="breadcrumb">
                <li className="breadcrumb-item"><a href="/dashboard">Accueil</a></li>
                <li className="breadcrumb-item">
                  <a href="#" onClick={e => { e.preventDefault(); navigate('/rapprochement') }}>
                    Rapprochements
                  </a>
                </li>
                <li className="breadcrumb-item active">
                  {existeDeja ? 'Modifier' : 'Nouveau'}
                </li>
              </ol>
            </nav>
          </div>
          <div className="col-auto">
            <button className="btn btn-light" onClick={() => navigate('/rapprochement')}>
              <i className="dw dw-left-arrow mr-1" /> Retour
            </button>
          </div>
        </div>
      </div>

      <form ref={formRef} onSubmit={handleSubmit}>
  <div className="row">

    {/* ── Bloc 1 : Sélection compte + période ── */}
    <div className="col-md-5 mb-20">
      <CardBox>
        <h5 className="h6 mb-20" style={{ borderBottom: '2px solid #7934f3', paddingBottom: 8 }}>
          <i className="dw dw-bank mr-2" style={{ color: '#7934f3' }} />
          Compte et Période
        </h5>

        {/* Compte */}
        <div className="form-group">
          <label className="font-weight-600">
            Compte <span className="text-danger">*</span>
          </label>
          {loadingComptes ? <Spinner /> : (
            <select className="form-control" value={idCompte}
              onChange={e => setIdCompte(e.target.value ? Number(e.target.value) : '')}>
              <option value="">— Sélectionnez un compte —</option>
              {comptes.map(c => (
                <option key={c.id_compte} value={c.id_compte}>
                  {c.nom_compte} ({c.num_compte})
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Mois */}
        <div className="form-group">
          <label className="font-weight-600">Mois</label>
          <select className="form-control" value={mois}
            onChange={e => setMois(Number(e.target.value))}>
            {MOIS_LABELS.map((m, i) => (
              <option key={i + 1} value={i + 1}>{m}</option>
            ))}
          </select>
        </div>

        {/* Année */}
        <div className="form-group mb-0">
          <label className="font-weight-600">Année</label>
          <select className="form-control" value={annee}
            onChange={e => setAnnee(Number(e.target.value))}>
            {annees.map(a => <option key={a} value={a}>{a}</option>)}
          </select>
        </div>
      </CardBox>
    </div>

    {/* ── Bloc 2 : Montants ── */}
    <div className="col-md-7 mb-20">
      <CardBox>

        {/* ← Bandeau si rapprochement existant */}
        {verifEnCours && (
          <div className="alert alert-light d-flex align-items-center mb-20">
            <span className="spinner-border spinner-border-sm mr-2 text-primary" />
            Vérification en cours…
          </div>
        )}

        {!verifEnCours && existeDeja && (
          <div className="alert alert-warning mb-20" style={{ borderLeft: '4px solid #ff9f1c' }}>
            <div className="d-flex align-items-start">
              <i className="dw dw-warning font-20 mr-10 mt-1" style={{ color: '#ff9f1c' }} />
              <div>
                <div className="font-weight-700 mb-5">
                  Rapprochement existant pour {MOIS_LABELS[mois - 1]} {annee}
                </div>
                <div className="font-12 text-muted">
                  Un rapprochement a déjà été saisi pour ce compte ce mois-ci.
                  <br />
                  Vous pouvez modifier tous les champs.
                </div>
              </div>
            </div>
          </div>
        )}

        {!verifEnCours && !existeDeja && idCompte && (
          <div className="alert alert-success mb-20" style={{ borderLeft: '4px solid #1ec01e' }}>
            <i className="dw dw-check mr-2" />
            Nouveau rapprochement pour <strong>{MOIS_LABELS[mois - 1]} {annee}</strong>
          </div>
        )}

        <h5 className="h6 mb-20" style={{ borderBottom: '2px solid #7934f3', paddingBottom: 8 }}>
          <i className="dw dw-money-2 mr-2" style={{ color: '#7934f3' }} />
          {existeDeja ? 'Modifier les montants' : 'Saisie des montants'}
        </h5>

        {/* Intitulé */}
        <div className="form-group">
          <label className="font-weight-600">Intitulé</label>
          <input type="text" className="form-control"
            placeholder="Ex: Rapprochement compte PROTOCOLE"
            value={intitule}
            onChange={e => setIntitule(e.target.value)} />
        </div>

        {/* Solde balance */}
        <div className="form-group">
          <label className="font-weight-600">
            Solde en balance (FCFA) <span className="text-danger">*</span>
          </label>
          <div className="input-group">
            <input type="number" className="form-control" min="0" step="1"
              value={soldeBalance}
              onChange={e => setSoldeBalance(Number(e.target.value))} />
            <div className="input-group-append">
              <span className="input-group-text">FCFA</span>
            </div>
          </div>
        </div>

        {/* Opération comptable non constatée */}
        <div className="form-group">
          <label className="font-weight-600">
            Opérations comptabilité non constatées (FCFA)
          </label>
          <div className="input-group">
            <input type="number" className="form-control" min="0" step="1"
              value={opAcct}
              onChange={e => setOpAcct(Number(e.target.value))} />
            <div className="input-group-append">
              <span className="input-group-text">FCFA</span>
            </div>
          </div>
        </div>

        {/* Opération poste non constatée */}
        <div className="form-group">
          <label className="font-weight-600">
            Opérations poste non constatées (FCFA)
          </label>
          <div className="input-group">
            <input type="number" className="form-control" min="0" step="1"
              value={opPoste}
              onChange={e => setOpPoste(Number(e.target.value))} />
            <div className="input-group-append">
              <span className="input-group-text">FCFA</span>
            </div>
          </div>
        </div>

        {/* Solde théorique - SAISI PAR L'UTILISATEUR (non obligatoire) */}
        <div className="form-group">
          <label className="font-weight-600" style={{ color: '#7934f3' }}>
            Solde théorique (FCFA)
            <span className="ml-2 font-12" style={{ color: '#888', fontWeight: 'normal' }}>
            </span>
          </label>
          <div className="input-group">
            <input type="number" className="form-control" min="0" step="1"
              value={soldeTheorique}
              onChange={e => setSoldeTheorique(Number(e.target.value))} />
            <div className="input-group-append">
              <span className="input-group-text">FCFA</span>
            </div>
          </div>
        </div>

        {/* Observation */}
        <div className="form-group">
          <label className="font-weight-600">Observation</label>
          <textarea className="form-control" rows={2}
            value={observation}
            onChange={e => setObservation(e.target.value)}
            placeholder="Observations éventuelles…" />
        </div>

        {/* Résumé calcul */}
        <div className="row text-center mt-20">
          <div className="col-6">
            <div style={{ padding: '12px 8px', background: '#f8f9fa', borderRadius: 8 }}>
              <div style={{ fontSize: 11, color: '#888', marginBottom: 4 }}>Solde en balance</div>
              <div style={{ fontWeight: 600, fontSize: 14 }}>
                {soldeBalance.toLocaleString('fr-FR')} FCFA
              </div>
            </div>
          </div>
          <div className="col-6">
            <div style={{
              padding: '12px 8px', borderRadius: 8,
              background: ecart === 0 ? '#e8f8e8' : '#fff3e0',
              border: `1px solid ${ecart === 0 ? '#2e7d32' : '#e65100'}`,
            }}>
              <div style={{ fontSize: 11, color: '#888', marginBottom: 4 }}>Écart</div>
              <div style={{
                fontWeight: 700, fontSize: 16,
                color: ecart === 0 ? '#2e7d32' : '#e65100',
              }}>
                {ecart === 0
                  ? 'ÉQUILIBRÉ'
                  : `${ecart > 0 ? '+' : ''}${Math.abs(ecart).toLocaleString('fr-FR')} FCFA`}
              </div>
            </div>
          </div>
        </div>
      </CardBox>
    </div>
  </div>

  {/* Bouton */}
  <div className="row">
    <div className="col-12">
      <button type="submit" className="btn btn-primary btn-block py-3"
        disabled={mutation.isPending || !idCompte}>
        {mutation.isPending ? (
          <><span className="spinner-border spinner-border-sm mr-2" />Enregistrement…</>
        ) : existeDeja ? (
          <><i className="dw dw-save mr-2" />Mettre à jour le rapprochement de {MOIS_LABELS[mois - 1]} {annee}</>
        ) : (
          <><i className="dw dw-save mr-2" />Créer le rapprochement de {MOIS_LABELS[mois - 1]} {annee}</>
        )}
      </button>
    </div>
  </div>
</form>
    </div>
  )
}
