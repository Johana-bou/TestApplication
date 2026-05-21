import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { getEtatsNominatifs, deleteEtatNominatif } from '../../api/etat-nominatif.api'
import { CardBox } from '../../components/ui/CardBox'
import { Spinner } from '../../components/ui/Spinner'
import { EmptyState } from '../../components/ui/EmptyState'
import { BoutonImprimer } from '../../components/shared/BoutonImprimer'
import { formatMontant } from '../../utils/formatMontant'
import { toDisplay } from '../../utils/formatDate'

const MOIS_LABELS = [
  'Janvier','Février','Mars','Avril','Mai','Juin',
  'Juillet','Août','Septembre','Octobre','Novembre','Décembre'
]

export default function EtatNominatifList() {
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [searchParams] = useSearchParams()

  // ← Lire le type depuis l'URL (?type=RAR ou ?type=AMENDE)
  const typeDepuisUrl = searchParams.get('type') as 'RAR' | 'AMENDE' | null
  const venantDuSidebar = typeDepuisUrl !== null

  const [deleteId, setDeleteId] = useState<number | null>(null)

  // Filtre mois / année uniquement
  const today = new Date()
  const [moisFiltre,  setMoisFiltre]  = useState(today.getMonth() + 1)
  const [anneeFiltre, setAnneeFiltre] = useState(today.getFullYear())

  const annees = Array.from({ length: 5 }, (_, i) => today.getFullYear() - i)

  // Calcul date_debut / date_fin depuis mois + année
  const date_debut = `${anneeFiltre}-${String(moisFiltre).padStart(2, '0')}-01`
  const date_fin   = (() => {
    const d = new Date(anneeFiltre, moisFiltre, 0)
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  })()

  const { data: etats, isLoading } = useQuery({
    queryKey: ['etats-nominatifs', date_debut, date_fin, typeDepuisUrl],
    queryFn: () => getEtatsNominatifs({ date_debut, date_fin }),
  })

  // Filtrer par type si venant du sidebar
  const filtered = (etats || []).filter((e: Record<string, unknown>) =>
    !typeDepuisUrl || e.type === typeDepuisUrl
  )

  const deleteMutation = useMutation({
    mutationFn: deleteEtatNominatif,
    onSuccess: () => {
      toast.success('État supprimé')
      qc.invalidateQueries({ queryKey: ['etats-nominatifs'] })
      setDeleteId(null)
    },
    onError: () => toast.error('Erreur lors de la suppression'),
  })

  return (
    <div className="min-height-200px">
      <div className="page-header">
        <div className="row align-items-center">
          <div className="col">
            <div className="title">
              <h4>
                États Nominatifs
                {/* Badge type si venant du sidebar */}
                {venantDuSidebar && (
                  <span
                    className={`badge badge-${typeDepuisUrl === 'RAR' ? 'primary' : 'warning'} ml-10`}
                    style={{ fontSize: 14, verticalAlign: 'middle' }}>
                    {typeDepuisUrl}
                  </span>
                )}
              </h4>
            </div>
            <nav aria-label="breadcrumb">
              <ol className="breadcrumb">
                <li className="breadcrumb-item"><a href="/dashboard">Accueil</a></li>
                <li className="breadcrumb-item">
                  <a href="#" onClick={e => { e.preventDefault(); navigate('/etats-nominatifs') }}>
                    États Nominatifs
                  </a>
                </li>
                {venantDuSidebar && (
                  <li className="breadcrumb-item active">{typeDepuisUrl}</li>
                )}
              </ol>
            </nav>
          </div>
          <div className="col-auto d-flex" style={{ gap: 8 }}>
            {/* Bouton changer de type si venant du sidebar */}
            {venantDuSidebar && (
              <button className="btn btn-light btn-sm"
                onClick={() => navigate('/etats-nominatifs')}>
                <i className="dw dw-left-arrow mr-1" /> Tous les types
              </button>
            )}
            <button className="btn btn-primary"
              onClick={() => navigate('/etats-nominatifs/nouveau')}>
              <i className="dw dw-add mr-1" /> Nouvel état
            </button>
          </div>
        </div>
      </div>

      <CardBox>
        <div className="row mb-20 align-items-end">

          {/* Filtre Mois */}
          <div className="col-md-4">
            <label className="font-weight-600 mb-2" style={{ fontSize: 13 }}>Mois</label>
            <select className="form-control" value={moisFiltre}
              onChange={e => setMoisFiltre(Number(e.target.value))}>
              {MOIS_LABELS.map((m, i) => (
                <option key={i + 1} value={i + 1}>{m}</option>
              ))}
            </select>
          </div>

          {/* Filtre Année */}
          <div className="col-md-3">
            <label className="font-weight-600 mb-2" style={{ fontSize: 13 }}>Année</label>
            <select className="form-control" value={anneeFiltre}
              onChange={e => setAnneeFiltre(Number(e.target.value))}>
              {annees.map(a => <option key={a} value={a}>{a}</option>)}
            </select>
          </div>

          {/* Filtre type — UNIQUEMENT si on ne vient pas du sidebar */}
          {!venantDuSidebar && (
            <div className="col-md-3">
              <label className="font-weight-600 mb-2" style={{ fontSize: 13 }}>Type</label>
              <div className="btn-group w-100">
                {(['ALL', 'RAR', 'AMENDE'] as const).map(t => (
                  <button key={t} type="button"
                    className={`btn btn-sm ${
                      (t === 'ALL' && !typeDepuisUrl) ? 'btn-primary' : 'btn-outline-primary'
                    }`}
                    onClick={() => navigate(t === 'ALL' ? '/etats-nominatifs' : `/etats-nominatifs?type=${t}`)}>
                    {t === 'ALL' ? 'Tous' : t}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="col-md-2 text-muted" style={{ fontSize: 12 }}>
            <i className="dw dw-calendar mr-1" />
            {date_debut} → {date_fin}
          </div>
        </div>

        {isLoading ? (
          <Spinner fullPage />
        ) : filtered.length === 0 ? (
          <EmptyState
            message={`Aucun état ${typeDepuisUrl ?? ''} trouvé pour ${MOIS_LABELS[moisFiltre - 1]} ${anneeFiltre}`}
            icon="dw-edit2"
          />
        ) : (
          <div className="table-responsive">
            <table className="table table-hover">
              <thead style={{ background: '#f8f9fa' }}>
                <tr>
                  {/* ← N° supprimé */}
                  {!venantDuSidebar && <th>Type</th>}
                  <th>Date</th>
                  <th className="text-right">Total physique</th>
                  <th className="text-right">Total balance</th>
                  <th className="text-right">Écart</th>
                  <th className="text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((e: Record<string, unknown>) => {
                  const ecart = (e.total_ecart as number) || 0
                  const nbLignes = (e.nombre_lignes as number) ?? (e.lignes as unknown[])?.length ?? 0

                  return (
                    <tr key={e.id_etat as number}>
                      {/* Type — masqué si venant du sidebar */}
                      {!venantDuSidebar && (
                        <td>
                          <span className={`badge badge-${e.type === 'RAR' ? 'primary' : 'warning'}`}>
                            {e.type as string}
                          </span>
                        </td>
                      )}

                      <td style={{ fontSize: 13 }}>
                        {e.date_etat ? toDisplay(e.date_etat as string) : '-'}
                      </td>

                      {/* ← Nombre de lignes avec fallback */}

                      <td className="text-right" style={{ fontSize: 13 }}>
                        {formatMontant((e.total_physique as number) || 0)}
                      </td>
                      <td className="text-right" style={{ fontSize: 13 }}>
                        {formatMontant((e.total_balance as number) || 0)}
                      </td>
                      <td className="text-right">
                        <span style={{
                          color: ecart === 0 ? '#1ec01e' : '#e55353',
                          fontWeight: 600, fontSize: 13,
                        }}>
                          {ecart === 0
                            ? <><i className="dw dw-check mr-1" />Équilibré</>
                            : formatMontant(Math.abs(ecart))}
                        </span>
                      </td>

                      <td className="text-center">
                        <div className="btn-group btn-group-sm">
                          <button className="btn btn-light" title="Voir le détail"
                            onClick={() => navigate(`/etats-nominatifs/${e.id_etat}`)}>
                            <i className="dw dw-eye text-info" />
                          </button>
                          <BoutonImprimer
                            url={`/api/etats-nominatifs/${e.id_etat}/pdf`}
                            avecOrientation
                          />
                          <button className="btn btn-light" title="Supprimer"
                            onClick={() => setDeleteId(e.id_etat as number)}>
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

      {/* Modal confirmation suppression */}
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
                <p>Supprimer cet état nominatif et toutes ses lignes ?</p>
                <p className="text-muted font-12">Cette action est irréversible.</p>
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary btn-sm"
                  onClick={() => setDeleteId(null)}>
                  Annuler
                </button>
                <button className="btn btn-danger btn-sm"
                  disabled={deleteMutation.isPending}
                  onClick={() => deleteMutation.mutate(deleteId!)}>
                  {deleteMutation.isPending
                    ? <><span className="spinner-border spinner-border-sm mr-1" />Suppression…</>
                    : <><i className="dw dw-delete-3 mr-1" />Supprimer</>}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}