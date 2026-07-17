// src/pages/rapprochement/RapprochementDetail.tsx
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { getRapprochement } from '../../api/rapprochement.api'
import { getComptes } from '../../api/admin.api'
import { CardBox } from '../../components/ui/CardBox'
import { Spinner } from '../../components/ui/Spinner'
import { BoutonImprimer } from '../../components/shared/BoutonImprimer'
import { formatMontant } from '../../utils/formatMontant'

const MOIS_LABELS = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
]

export default function RapprochementDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  // ── Chargement du rapprochement ──────────────────────────────────────────
  const { data: rapprochement, isLoading: loadingRap, error } = useQuery({
    queryKey: ['rapprochement', id],
    queryFn: () => getRapprochement(Number(id)),
    enabled: !!id,
  })

  // ── Chargement des comptes ──────────────────────────────────────────────
  const { data: comptes, isLoading: loadingComptes } = useQuery({
    queryKey: ['comptes'],
    queryFn: getComptes,
  })

  if (loadingRap || loadingComptes) return <Spinner fullPage />

  // ── Gestion d'erreur ─────────────────────────────────────────────────────
  if (error || !rapprochement) {
    return (
      <div className="min-height-200px d-flex align-items-center justify-content-center">
        <div className="text-center">
          <i className="dw dw-file font-48 text-muted" />
          <h5 className="mt-3">Rapprochement non trouvé</h5>
          <p className="text-muted">
            Le rapprochement que vous cherchez n'existe pas ou a été supprimé.
          </p>
          <button className="btn btn-primary mt-3" onClick={() => navigate('/rapprochement')}>
            <i className="dw dw-left-arrow mr-1" /> Retour à la liste
          </button>
        </div>
      </div>
    )
  }

  // ── Récupérer les infos du compte ──────────────────────────────────────
  const compte = comptes?.find((c: any) => c.id_compte === rapprochement.id_compte)
  const d = new Date(rapprochement.date_rapprochement)
  const mois = d.getMonth() + 1
  const annee = d.getFullYear()

  return (
    <div className="min-height-200px">
      <div className="page-header">
        <div className="row align-items-center">
          <div className="col">
            <div className="title"><h4>Détail du Rapprochement</h4></div>
            <nav aria-label="breadcrumb">
              <ol className="breadcrumb">
                <li className="breadcrumb-item"><a href="/dashboard">Accueil</a></li>
                <li className="breadcrumb-item">
                  <a href="#" onClick={e => { e.preventDefault(); navigate('/rapprochement') }}>
                    Rapprochements
                  </a>
                </li>
                <li className="breadcrumb-item active">
                  {MOIS_LABELS[mois - 1]} {annee}
                </li>
              </ol>
            </nav>
          </div>
          <div className="col-auto">
            <button className="btn btn-light mr-2" onClick={() => navigate('/rapprochement')}>
              <i className="dw dw-left-arrow mr-1" /> Retour
            </button>
            <BoutonImprimer
              url={`/api/etats-rapprochement/${rapprochement.id_rapprochement}/pdf`}
              avecOrientation
            />
          </div>
        </div>
      </div>

      <div className="row">
        {/* ── Informations du compte ── */}
        <div className="col-md-6 mb-20">
          <CardBox>
            <h5 className="h6 mb-20" style={{ borderBottom: '2px solid #7934f3', paddingBottom: 8 }}>
              <i className="dw dw-bank mr-2" style={{ color: '#7934f3' }} />
              Informations du compte
            </h5>
            <div className="row">
              <div className="col-6">
                <div style={{ fontSize: 12, color: '#888' }}>Numéro de compte</div>
                <div className="font-weight-bold" style={{ fontSize: 16 }}>
                  {compte?.num_compte || rapprochement.num_compte || '---'}
                </div>
              </div>
              <div className="col-6">
                <div style={{ fontSize: 12, color: '#888' }}>Nom du compte</div>
                <div className="font-weight-bold" style={{ fontSize: 16 }}>
                  {compte?.nom_compte || rapprochement.nom_compte || '---'}
                </div>
              </div>
            </div>
            <div className="row mt-15">
              <div className="col-6">
                <div style={{ fontSize: 12, color: '#888' }}>Période</div>
                <div className="font-weight-bold" style={{ fontSize: 16 }}>
                  {MOIS_LABELS[mois - 1]} {annee}
                </div>
              </div>
              <div className="col-6">
                <div style={{ fontSize: 12, color: '#888' }}>Intitulé</div>
                <div className="font-weight-bold" style={{ fontSize: 16 }}>
                  {rapprochement.intitule}
                </div>
              </div>
            </div>
          </CardBox>
        </div>

        {/* ── Résumé des montants ── */}
        <div className="col-md-6 mb-20">
          <CardBox>
            <h5 className="h6 mb-20" style={{ borderBottom: '2px solid #7934f3', paddingBottom: 8 }}>
              <i className="dw dw-money-2 mr-2" style={{ color: '#7934f3' }} />
              Résumé des montants
            </h5>
            <div className="row">
              <div className="col-6">
                <div style={{ fontSize: 12, color: '#888' }}>Solde en balance</div>
                <div className="font-weight-bold" style={{ fontSize: 16 }}>
                  {formatMontant(rapprochement.solde_balance || 0)}
                </div>
              </div>
              <div className="col-6">
                <div style={{ fontSize: 12, color: '#888' }}>Solde théorique</div>
                <div className="font-weight-bold" style={{ fontSize: 16, color: '#7934f3' }}>
                  {formatMontant(rapprochement.solde_theorique || 0)}
                </div>
              </div>
            </div>
            <div className="row mt-15">
              <div className="col-6">
                <div style={{ fontSize: 12, color: '#888' }}>Opérations ACCT non constatées</div>
                <div className="font-weight-bold" style={{ fontSize: 16 }}>
                  {formatMontant(rapprochement.operation_acct_non_constate || 0)}
                </div>
              </div>
              <div className="col-6">
                <div style={{ fontSize: 12, color: '#888' }}>Opérations poste non constatées</div>
                <div className="font-weight-bold" style={{ fontSize: 16 }}>
                  {formatMontant(rapprochement.operation_poste_non_constate || 0)}
                </div>
              </div>
            </div>
            <div className="row mt-15">
              <div className="col-12">
                <div style={{ fontSize: 12, color: '#888' }}>Écart</div>
                <div className="font-weight-bold" style={{ 
                  fontSize: 18, 
                  color: rapprochement.ecart === 0 ? '#1ec01e' : '#e55353'
                }}>
                  {rapprochement.ecart === 0
                    ? ' Équilibré'
                    : `${formatMontant(Math.abs(rapprochement.ecart || 0))}`}
                </div>
              </div>
            </div>
          </CardBox>
        </div>
      </div>

      {/* ── Observation ── */}
      {rapprochement.observation && (
        <div className="row">
          <div className="col-12 mb-20">
            <CardBox>
              <h5 className="h6 mb-10" style={{ borderBottom: '2px solid #7934f3', paddingBottom: 8 }}>
                <i className="dw dw-edit-2 mr-2" style={{ color: '#7934f3' }} />
                Observation
              </h5>
              <p style={{ fontSize: 14, color: '#555' }}>{rapprochement.observation}</p>
            </CardBox>
          </div>
        </div>
      )}

      {/* ── Actions ── */}
      <div className="row">
        <div className="col-12">
          <div className="d-flex justify-content-between">
            <button className="btn btn-outline-secondary"
              onClick={() => navigate('/rapprochement')}>
              <i className="dw dw-left-arrow mr-1" /> Retour à la liste
            </button>
            <div>
              <button className="btn btn-warning mr-2"
                onClick={() => navigate(`/rapprochement/nouveau?compte=${rapprochement.id_compte}&mois=${mois}&annee=${annee}`)}>
                <i className="dw dw-edit-2 mr-1" /> Modifier
              </button>
              <BoutonImprimer
                url={`/api/etats-rapprochement/${rapprochement.id_rapprochement}/pdf`}
                avecOrientation
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
