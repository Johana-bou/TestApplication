// src/pages/RapprochementList.tsx
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { getRapprochements, deleteRapprochement } from '../../api/rapprochement.api'
import { getComptes } from '../../api/admin.api'
import { CardBox } from '../../components/ui/CardBox'
import { Spinner } from '../../components/ui/Spinner'
import { BoutonImprimer } from '../../components/shared/BoutonImprimer'
import { formatMontant } from '../../utils/formatMontant'
import { toDisplay } from '../../utils/formatDate'
import { useAuth } from '../../hooks/useAuth'

const MOIS_LABELS = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
]

export default function RapprochementList() {
  const navigate = useNavigate()
  const qc = useQueryClient()
  const { poste } = useAuth()
  const [deleteId, setDeleteId] = useState<number | null>(null)

  // ── Filtres ──────────────────────────────────────────────────────────────
  const today = new Date()
  const [compteFiltre, setCompteFiltre] = useState<number | 'tous'>('tous')
  const [moisFiltre, setMoisFiltre] = useState<number | 'tous'>('tous')
  const [anneeFiltre, setAnneeFiltre] = useState(today.getFullYear())
  const annees = Array.from({ length: 10 }, (_, i) => today.getFullYear() - i)

  // ── Chargement des données ──────────────────────────────────────────────
  const { data: rapprochements, isLoading: loadingRap } = useQuery({
    queryKey: ['rapprochements'],
    queryFn: () => getRapprochements({ skip: 0, limit: 100 }),
  })

  const { data: comptes, isLoading: loadingComptes } = useQuery({
    queryKey: ['comptes'],
    queryFn: getComptes,
  })

  const deleteMutation = useMutation({
    mutationFn: deleteRapprochement,
    onSuccess: () => {
      toast.success('Supprimé')
      qc.invalidateQueries({ queryKey: ['rapprochements'] })
      setDeleteId(null)
    },
    onError: () => toast.error('Erreur suppression'),
  })

  // ── Filtrer les comptes du poste actuel ──────────────────────────────────
  const comptesPoste = (comptes || []).filter(
    (c: any) => c.id_poste === poste?.id_poste
  )

  // ── Filtrer les rapprochements ──────────────────────────────────────────
  const rapFiltres = (rapprochements || []).filter((r: any) => {
    const d = new Date(r.date_rapprochement)
    const matchAnnee = d.getFullYear() === anneeFiltre
    const matchMois = moisFiltre === 'tous' || d.getMonth() + 1 === moisFiltre
    const matchCompte = compteFiltre === 'tous' || r.id_compte === compteFiltre
    return matchAnnee && matchMois && matchCompte
  })

  // ── Trier par date (du plus récent au plus ancien) ──────────────────────
  const rapportsTries = [...rapFiltres].sort((a, b) => {
    return new Date(b.date_rapprochement).getTime() - new Date(a.date_rapprochement).getTime()
  })

  // ── Récupérer le nom du compte pour chaque rapprochement ─────────────────
  const getNomCompte = (id_compte: number) => {
    const compte = comptesPoste.find((c: any) => c.id_compte === id_compte)
    return compte ? compte.nom_compte : 'Compte inconnu'
  }

  const getNumCompte = (id_compte: number) => {
    const compte = comptesPoste.find((c: any) => c.id_compte === id_compte)
    return compte ? compte.num_compte : '---'
  }

  // ── Calcul des statistiques ──────────────────────────────────────────────
  const calculerStatistiques = () => {
    // Nombre total de comptes concernés
    const comptesConcernes = compteFiltre === 'tous' 
      ? comptesPoste 
      : comptesPoste.filter((c: any) => c.id_compte === compteFiltre)
    
    const totalComptes = comptesConcernes.length
    
    // Nombre total de mois à prendre en compte
    const totalMois = moisFiltre === 'tous' ? 12 : 1
    
    // Nombre total de rapprochements possibles
    const totalPossibles = totalComptes * totalMois
    
    // Nombre de rapprochements saisis
    const totalSaisis = rapFiltres.length
    
    // Nombre de non saisis
    const totalNonSaisis = totalPossibles - totalSaisis
    
    // Taux de saisie
    const tauxSaisie = totalPossibles > 0 
      ? Math.round((totalSaisis / totalPossibles) * 100) 
      : 0
    
    return {
      totalComptes,
      totalMois,
      totalPossibles,
      totalSaisis,
      totalNonSaisis,
      tauxSaisie
    }
  }

  const stats = calculerStatistiques()

  // ── Vérifier si un compte a des rapprochements pour l'année ─────────────
  const compteARapprochements = (id_compte: number) => {
    return rapprochements?.some((r: any) => {
      const d = new Date(r.date_rapprochement)
      return r.id_compte === id_compte && d.getFullYear() === anneeFiltre
    }) || false
  }

  if (loadingRap || loadingComptes) return <Spinner fullPage />

  // Période affichée
  const periodeAffichee = moisFiltre === 'tous' 
    ? `Année ${anneeFiltre}`
    : `${MOIS_LABELS[moisFiltre - 1]} ${anneeFiltre}`

  // Nom du compte sélectionné
  const nomCompteSelectionne = compteFiltre !== 'tous'
    ? comptesPoste.find((c: any) => c.id_compte === compteFiltre)?.nom_compte
    : null

  return (
    <div className="min-height-200px">
      <div className="page-header">
        <div className="row align-items-center">
          <div className="col">
            <div className="title"><h4>Rapprochement SYSTAC/SYGMA</h4></div>
            <nav aria-label="breadcrumb">
              <ol className="breadcrumb">
                <li className="breadcrumb-item"><a href="/dashboard">Accueil</a></li>
                <li className="breadcrumb-item active">Rapprochement</li>
              </ol>
            </nav>
          </div>
          <div className="col-auto">
            <button className="btn btn-primary"
              onClick={() => navigate('/rapprochement/nouveau')}>
              <i className="dw dw-add mr-1" /> Nouveau rapprochement
            </button>
          </div>
        </div>
      </div>

      <CardBox>
        {/* ── FILTRES ────────────────────────────────────────────────────── */}
        <div className="row mb-20 align-items-end">
          {/* Compte */}
          <div className="col-md-4">
            <label className="font-weight-600 mb-2" style={{ fontSize: 13 }}>
              Compte
            </label>
            <select className="form-control" value={compteFiltre}
              onChange={e => setCompteFiltre(
                e.target.value === 'tous' ? 'tous' : Number(e.target.value)
              )}>
              <option value="tous">— Tous les comptes —</option>
              {comptesPoste.map((c: any) => (
                <option key={c.id_compte} value={c.id_compte}>
                  {c.num_compte} - {c.nom_compte}
                </option>
              ))}
            </select>
          </div>

          {/* Mois - avec option "Tous" */}
          <div className="col-md-3">
            <label className="font-weight-600 mb-2" style={{ fontSize: 13 }}>
              Mois
            </label>
            <select className="form-control" value={moisFiltre}
              onChange={e => setMoisFiltre(
                e.target.value === 'tous' ? 'tous' : Number(e.target.value)
              )}>
              <option value="tous">— Tous les mois —</option>
              {MOIS_LABELS.map((m, i) => (
                <option key={i + 1} value={i + 1}>{m}</option>
              ))}
            </select>
          </div>

          {/* Année */}
          <div className="col-md-3">
            <label className="font-weight-600 mb-2" style={{ fontSize: 13 }}>
              Année
            </label>
            <select className="form-control" value={anneeFiltre}
              onChange={e => setAnneeFiltre(Number(e.target.value))}>
              {annees.map(a => <option key={a} value={a}>{a}</option>)}
            </select>
          </div>

          {/* Info période */}
          <div className="col-md-2 text-muted text-right" style={{ fontSize: 12 }}>
            <i className="dw dw-calendar mr-1" />
            <span className="font-weight-600">
              {periodeAffichee}
            </span>
            <br />
            <span style={{ fontSize: 11 }}>
              {poste?.nom_poste || ''}
            </span>
          </div>
        </div>

        {/* ── STATISTIQUES DYNAMIQUES ───────────────────────────────────── */}
        <div className="row mb-20">
          {/* Si un compte est sélectionné, afficher les stats sur les 12 mois */}
          {compteFiltre !== 'tous' && (
            <div className="col-12 mb-15">
              <div className="alert alert-info" style={{ borderLeft: '4px solid #7934f3' }}>
                <i className="dw dw-bank mr-2" />
                <strong>{nomCompteSelectionne}</strong> — Suivi des 12 mois de l'année {anneeFiltre}
              </div>
            </div>
          )}

          <div className="col-md-3">
            <div className="bg-light p-3 rounded text-center">
              <div style={{ fontSize: 12, color: '#888' }}>
                {compteFiltre !== 'tous' ? 'Mois à saisir' : 'Comptes'}
              </div>
              <div className="font-weight-bold" style={{ fontSize: 18 }}>
                {compteFiltre !== 'tous' ? stats.totalMois : stats.totalComptes}
              </div>
            </div>
          </div>

          <div className="col-md-3">
            <div className="bg-light p-3 rounded text-center">
              <div style={{ fontSize: 12, color: '#888' }}>
                {compteFiltre !== 'tous' ? 'Mois saisis' : 'Rapprochements saisis'}
              </div>
              <div className="font-weight-bold" style={{ fontSize: 18, color: '#1ec01e' }}>
                {stats.totalSaisis}
              </div>
            </div>
          </div>

          <div className="col-md-3">
            <div className="bg-light p-3 rounded text-center">
              <div style={{ fontSize: 12, color: '#888' }}>
                {compteFiltre !== 'tous' ? 'Mois non saisis' : 'Non saisis'}
              </div>
              <div className="font-weight-bold" style={{ fontSize: 18, color: '#e55353' }}>
                {stats.totalNonSaisis}
              </div>
            </div>
          </div>

          <div className="col-md-3">
            <div className="bg-light p-3 rounded text-center">
              <div style={{ fontSize: 12, color: '#888' }}>Taux de saisie</div>
              <div className="font-weight-bold" style={{ fontSize: 18, color: '#7934f3' }}>
                {stats.tauxSaisie}%
              </div>
            </div>
          </div>
        </div>

        {/* ── TABLEAU LISTE ────────────────────────────────────────────── */}
        {rapportsTries.length === 0 ? (
          <div className="text-center py-4 text-muted">
            <i className="dw dw-file font-36" />
            <p className="mt-2">
              {compteFiltre !== 'tous'
                ? `Aucun rapprochement trouvé pour ce compte en ${periodeAffichee}`
                : `Aucun rapprochement trouvé pour ${periodeAffichee}`}
            </p>
            <button className="btn btn-sm btn-outline-primary"
              onClick={() => navigate('/rapprochement/nouveau')}>
              <i className="dw dw-add mr-1" /> Créer un rapprochement
            </button>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table table-hover">
              <thead style={{ background: '#f8f9fa' }}>
                <tr>
                  <th>N° Compte</th>
                  <th>Nom du compte</th>
                  <th>Mois</th>
                  <th>Intitulé</th>
                  <th>Date</th>
                  <th className="text-right">Solde théorique</th>
                  <th className="text-right">Écart</th>
                  <th className="text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rapportsTries.map((rap: any) => {
                  const d = new Date(rap.date_rapprochement)
                  const mois = d.getMonth() + 1
                  const nomCompte = getNomCompte(rap.id_compte)
                  const numCompte = getNumCompte(rap.id_compte)
                  
                  return (
                    <tr key={rap.id_rapprochement}>
                      <td><strong>{numCompte}</strong></td>
                      <td>{nomCompte}</td>
                      <td>{MOIS_LABELS[mois - 1]}</td>
                      <td style={{ fontSize: 13, color: '#666' }}>{rap.intitule}</td>
                      <td style={{ fontSize: 13 }}>{toDisplay(rap.date_rapprochement)}</td>
                      <td className="text-right font-weight-700 text-primary">
                        {formatMontant(rap.solde_theorique || 0)}
                      </td>
                      <td className="text-right">
                        <span style={{
                          color: rap.ecart === 0 ? '#1ec01e' : '#e55353',
                          fontWeight: 600
                        }}>
                          {rap.ecart === 0
                            ? <><i className="dw dw-check mr-1" />Équilibré</>
                            : formatMontant(Math.abs(rap.ecart || 0))}
                        </span>
                      </td>
                      <td className="text-center">
                        <div className="btn-group btn-group-sm">
                          <button className="btn btn-light" title="Voir détail"
                            onClick={() => navigate(`/rapprochement/${rap.id_rapprochement}`)}>
                            <i className="dw dw-eye text-info" />
                          </button>
                          <BoutonImprimer
                            url={`/api/etats-rapprochement/${rap.id_rapprochement}/pdf`}
                            avecOrientation
                          />
                          <button className="btn btn-light" title="Modifier"
                            onClick={() => navigate(`/rapprochement/nouveau?compte=${rap.id_compte}&mois=${mois}&annee=${anneeFiltre}`)}>
                            <i className="dw dw-edit-2 text-warning" />
                          </button>
                          <button className="btn btn-light" title="Supprimer"
                            onClick={() => setDeleteId(rap.id_rapprochement)}>
                            <i className="dw dw-delete-3 text-danger" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </CardBox>

      {/* ── MODAL CONFIRMATION SUPPRESSION ─────────────────────────────── */}
      {deleteId && (
        <div className="modal fade show d-block"
          style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-sm modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title text-danger">
                  <i className="dw dw-warning mr-2" />Confirmation
                </h5>
              </div>
              <div className="modal-body">
                <p>Supprimer ce rapprochement définitivement ?</p>
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary btn-sm"
                  onClick={() => setDeleteId(null)}>Annuler</button>
                <button className="btn btn-danger btn-sm"
                  disabled={deleteMutation.isPending}
                  onClick={() => deleteMutation.mutate(deleteId!)}>
                  {deleteMutation.isPending
                    ? <span className="spinner-border spinner-border-sm" />
                    : 'Supprimer'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
