import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { getPVList, getPVByPoste, deletePV } from '../../api/pv.api'
import { CardBox } from '../../components/ui/CardBox'
import { Spinner } from '../../components/ui/Spinner'
import { EmptyState } from '../../components/ui/EmptyState'
import { BoutonImprimer } from '../../components/shared/BoutonImprimer'
import { useAuth } from '../../hooks/useAuth'
import { formatMontant } from '../../utils/formatMontant'
import { toDisplay } from '../../utils/formatDate'

const MOIS_LABELS = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
]

export default function PVList() {
  const navigate = useNavigate()
  const { isAdmin, poste } = useAuth()
  const qc = useQueryClient()

  // États des filtres
  const [search, setSearch] = useState('')
  const [moisFiltre, setMoisFiltre] = useState<number | 'tous'>('tous')
  const [anneeFiltre, setAnneeFiltre] = useState<number>(new Date().getFullYear())
  const [deleteId, setDeleteId] = useState<number | null>(null)

  // Génération des années (10 ans en arrière, 1 en avant)
  const currentYear = new Date().getFullYear()
  const annees = Array.from({ length: 12 }, (_, i) => currentYear - 5 + i)

  // Chargement des données
  const { data: pvData, isLoading } = useQuery({
    queryKey: ['pv', isAdmin, poste?.id_poste],
    queryFn: () => isAdmin
      ? getPVList({ skip: 0, limit: 100 })
      : getPVByPoste(poste!.id_poste),
    enabled: !!poste,
  })

  const deleteMutation = useMutation({
    mutationFn: deletePV,
    onSuccess: () => {
      toast.success('PV supprimé')
      qc.invalidateQueries({ queryKey: ['pv'] })
      setDeleteId(null)
    },
    onError: (e: any) => toast.error(e?.response?.data?.detail || 'Erreur lors de la suppression'),
  })

  // Filtrage des PV
  const pvList = (pvData || []) as any[]
  const filtered = useMemo(() => {
    return pvList.filter(pv => {
      // Filtre par recherche
      if (search && !String(pv.num_pv || '').toLowerCase().includes(search.toLowerCase())) {
        return false
      }
      // Filtre par date
      if (pv.date_pv) {
        const d = new Date(pv.date_pv)
        const mois = d.getMonth() + 1
        const annee = d.getFullYear()
        if (moisFiltre !== 'tous' && mois !== moisFiltre) return false
        if (annee !== anneeFiltre) return false
      } else {
       
        if (moisFiltre !== 'tous' || anneeFiltre !== currentYear) return false
      }
      return true
    })
  }, [pvList, search, moisFiltre, anneeFiltre])

  // Statistiques
  const stats = useMemo(() => {
    const total = pvList.length
    const filteredCount = filtered.length
    const totalSolde = pvList.reduce((sum, pv) => sum + (pv.solde_theorique || 0), 0)
    return { total, filteredCount, totalSolde }
  }, [pvList, filtered])

  // Réinitialiser les filtres
  const resetFilters = () => {
    setSearch('')
    setMoisFiltre('tous')
    setAnneeFiltre(currentYear)
  }

  return (
    <div className="min-height-200px">
      <div className="page-header">
        <div className="row align-items-center">
          <div className="col">
            <div className="title"><h4>Procès-Verbaux</h4></div>
            <nav aria-label="breadcrumb">
              <ol className="breadcrumb">
                <li className="breadcrumb-item"><a href="/dashboard">Accueil</a></li>
                <li className="breadcrumb-item active">Procès-Verbaux</li>
              </ol>
            </nav>
          </div>
          <div className="col-auto">
            <button className="btn btn-primary" onClick={() => navigate('/pv/nouveau')}>
              <i className="dw dw-add mr-1" /> Nouveau PV
            </button>
          </div>
        </div>
      </div>

      <CardBox>

        <div className="row mb-20 align-items-end">
          <div className="col-md-3">
            <label className="font-weight-600 mb-2" style={{ fontSize: 13 }}>Recherche</label>
            <input
              className="form-control"
              placeholder="N° PV..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <div className="col-md-2">
            <label className="font-weight-600 mb-2" style={{ fontSize: 13 }}>Mois</label>
            <select className="form-control" value={moisFiltre}
              onChange={e => setMoisFiltre(e.target.value === 'tous' ? 'tous' : Number(e.target.value))}>
              <option value="tous">— Tous —</option>
              {MOIS_LABELS.map((m, i) => (
                <option key={i + 1} value={i + 1}>{m}</option>
              ))}
            </select>
          </div>
          <div className="col-md-2">
            <label className="font-weight-600 mb-2" style={{ fontSize: 13 }}>Année</label>
            <select className="form-control" value={anneeFiltre}
              onChange={e => setAnneeFiltre(Number(e.target.value))}>
              {annees.map(a => <option key={a} value={a}>{a}</option>)}
            </select>
          </div>
          <div className="col-md-3 text-right text-muted" style={{ fontSize: 12 }}>
            <i className="dw dw-calendar mr-1" />
            {moisFiltre === 'tous' ? `Toute l'année ${anneeFiltre}` : `${MOIS_LABELS[moisFiltre - 1]} ${anneeFiltre}`}
            <br />
            <span className="font-weight-600">{filtered.length} PV</span> sur {stats.total}
          </div>
        </div>

    
        {isLoading ? (
          <Spinner fullPage />
        ) : filtered.length === 0 ? (
          <EmptyState message="Aucun PV trouvé" icon="dw-clipboard" />
        ) : (
          <div className="table-responsive">
            <table className="table table-hover">
              <thead style={{ background: '#f8f9fa' }}>
                <tr>
                  <th>N° PV</th>
                  <th>Date</th>
                  <th>Période</th>
                  <th>Solde théorique</th>
                  <th className="text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((pv: any) => (
                  <tr key={pv.id_pv}>
                    <td><strong>{pv.num_pv}</strong></td>
                    <td style={{ fontSize: 13 }}>{pv.date_pv ? toDisplay(pv.date_pv) : '—'}</td>
                    <td style={{ fontSize: 12, color: '#888' }}>
                      {pv.periode_debut && pv.periode_fin
                        ? `${toDisplay(pv.periode_debut)} → ${toDisplay(pv.periode_fin)}`
                        : '—'}
                    </td>
                    <td>
                      <strong style={{ color: '#7934f3' }}>
                        {formatMontant(pv.solde_theorique || 0)}
                      </strong>
                    </td>
                    <td className="text-center">
                      <div className="d-flex justify-content-center" style={{ gap: 4 }}>
                        <button
                          className="btn btn-sm btn-outline-info"
                          onClick={() => navigate(`/pv/${pv.id_pv}`)}
                          title="Voir"
                        >
                          <i className="dw dw-eye" />
                        </button>
                        <button
                          className="btn btn-sm btn-outline-warning"
                          onClick={() => navigate(`/pv/${pv.id_pv}/modifier`)}
                          title="Modifier"
                        >
                          <i className="dw dw-edit2" />
                        </button>
                        <BoutonImprimer url={`/api/pv/${pv.id_pv}/pdf`} avecOrientation />
                        <button
                          className="btn btn-sm btn-outline-danger"
                          onClick={() => setDeleteId(pv.id_pv)}
                          title="Supprimer"
                        >
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

      {/* Modal de confirmation de suppression */}
      {deleteId && (
        <div className="modal fade show" style={{ display: 'block', background: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-sm">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Confirmation</h5>
              </div>
              <div className="modal-body">
                <p>Supprimer ce PV définitivement ?</p>
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
