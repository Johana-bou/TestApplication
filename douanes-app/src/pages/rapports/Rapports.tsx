import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { CardBox } from '../../components/ui/CardBox'
import { BoutonImprimer } from '../../components/shared/BoutonImprimer'
import { Spinner } from '../../components/ui/Spinner'
import { getRapportTableau, getRapportPdfUrl, type RapportLigne } from '../../api/rapport.api'
import { getPeriode, dernierJourDuMois, type PeriodeType } from '../../utils/periodes'
import { formatMontantCourt } from '../../utils/formatMontant'

type TypeRapport = 'PROTOCOLE' | 'CAC'

const MOIS_LABELS = ['Janvier','Février','Mars','Avril','Mai','Juin',
                     'Juillet','Août','Septembre','Octobre','Novembre','Décembre']
const MOIS_COURTS = ['Jan','Fév','Mar','Avr','Mai','Jun',
                     'Jul','Aoû','Sep','Oct','Nov','Déc']

interface ParamsConfirmes {
  type_rapport: TypeRapport
  date_debut: string
  date_fin: string
}

export default function Rapports() {
  const [searchParams] = useSearchParams()
  // ✅ Type lu depuis l'URL, réactif à chaque changement de lien sidebar
  const typeRapport: TypeRapport = searchParams.get('type') === 'CAC' ? 'CAC' : 'PROTOCOLE'

  const [periodeType,    setPeriodeType]    = useState<PeriodeType | 'personnalise'>('mois')
  const [customDebMois,  setCustomDebMois]  = useState(1)
  const [customDebAnnee, setCustomDebAnnee] = useState(new Date().getFullYear())
  const [customFinMois,  setCustomFinMois]  = useState(new Date().getMonth() + 1)
  const [customFinAnnee, setCustomFinAnnee] = useState(new Date().getFullYear())
  const [paramsConfirmes, setParamsConfirmes] = useState<ParamsConfirmes | null>(null)

  const anneeCourante = new Date().getFullYear()
  const annees = Array.from({ length: 5 }, (_, i) => anneeCourante - i)

  const getPeriodeParams = () => {
    if (periodeType === 'personnalise') {
      return {
        date_debut: `${customDebAnnee}-${String(customDebMois).padStart(2, '0')}-01`,
        date_fin:   dernierJourDuMois(customFinAnnee, customFinMois),
      }
    }
    return getPeriode(periodeType as PeriodeType)
  }

  const handleApercu = () => {
    const { date_debut, date_fin } = getPeriodeParams()
    setParamsConfirmes({ type_rapport: typeRapport, date_debut, date_fin })
  }

  const { data: lignes, isLoading } = useQuery<RapportLigne[]>({
    queryKey: [
      'rapport',
      paramsConfirmes?.type_rapport,
      paramsConfirmes?.date_debut,
      paramsConfirmes?.date_fin,
    ],
    queryFn: () => getRapportTableau({
      type_rapport: paramsConfirmes!.type_rapport,
      date_debut:   paramsConfirmes!.date_debut,
      date_fin:     paramsConfirmes!.date_fin,
    }),
    enabled: paramsConfirmes !== null,
  })

  const moisPresents: number[] = lignes && lignes.length > 0
    ? [...new Set(lignes.flatMap(l => Object.keys(l.montants_par_mois).map(Number)))].sort((a, b) => a - b)
    : []

  const totauxMois: Record<number, number> = {}
  moisPresents.forEach(m => {
    totauxMois[m] = (lignes || []).reduce((acc, l) => acc + (l.montants_par_mois[m] || 0), 0)
  })
  const grandTotal = (lignes || []).reduce((acc, l) => acc + l.total, 0)

  const { date_debut: ddAff, date_fin: dfAff } = getPeriodeParams()
  const pdfUrl = getRapportPdfUrl({
    type_rapport: paramsConfirmes?.type_rapport ?? typeRapport,
    date_debut:   paramsConfirmes?.date_debut   ?? ddAff,
    date_fin:     paramsConfirmes?.date_fin     ?? dfAff,
  })

  const { date_debut: ddCourant, date_fin: dfCourant } = getPeriodeParams()

  return (
    <div className="min-height-200px">
      <div className="page-header">
        <div className="row">
          <div className="col">
            {/* ✅ Titre dynamique selon le type */}
            <div className="title">
              <h4>Rapport <strong style={{ color: '#7934f3' }}>{typeRapport}</strong></h4>
            </div>
            <nav aria-label="breadcrumb">
              <ol className="breadcrumb">
                <li className="breadcrumb-item"><a href="/dashboard">Accueil</a></li>
                <li className="breadcrumb-item active">Rapport {typeRapport}</li>
              </ol>
            </nav>
          </div>
        </div>
      </div>

      <CardBox className="mb-20">
        {/* ✅ Titre du CardBox avec le type actif, sans boutons radio */}
        <h5 className="mb-4 h6" style={{ borderBottom: '2px solid #7934f3', paddingBottom: 8 }}>
          <i className="dw dw-analytics-21 mr-2" style={{ color: '#7934f3' }} />
          Rapport <strong style={{ color: '#7934f3' }}>{typeRapport}</strong> — Paramètres
        </h5>

        {/* Période */}
        <div className="form-group">
          <label className="font-weight-600">Période</label>
          <div className="btn-group flex-wrap">
            {([
              ['mois',         'Mois courant'],
              ['trimestre',    'Trimestre'],
              ['semestre',     'Semestre'],
              ['annee',        'Année'],
              ['personnalise', 'Personnalisé'],
            ] as [PeriodeType | 'personnalise', string][]).map(([p, label]) => (
              <button key={p} type="button"
                className={`btn btn-sm ${periodeType === p ? 'btn-primary' : 'btn-outline-primary'}`}
                onClick={() => setPeriodeType(p)}>
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Sélecteurs personnalisés */}
        {periodeType === 'personnalise' && (
          <div className="row mt-2">
            <div className="col-md-3">
              <label className="font-weight-600" style={{ fontSize: 13 }}>Mois début</label>
              <select className="form-control" value={customDebMois}
                onChange={e => setCustomDebMois(Number(e.target.value))}>
                {MOIS_LABELS.map((m, i) => <option key={i+1} value={i+1}>{m}</option>)}
              </select>
            </div>
            <div className="col-md-3">
              <label className="font-weight-600" style={{ fontSize: 13 }}>Année début</label>
              <select className="form-control" value={customDebAnnee}
                onChange={e => setCustomDebAnnee(Number(e.target.value))}>
                {annees.map(a => <option key={a} value={a}>{a}</option>)}
              </select>
            </div>
            <div className="col-md-3">
              <label className="font-weight-600" style={{ fontSize: 13 }}>Mois fin</label>
              <select className="form-control" value={customFinMois}
                onChange={e => setCustomFinMois(Number(e.target.value))}>
                {MOIS_LABELS.map((m, i) => <option key={i+1} value={i+1}>{m}</option>)}
              </select>
            </div>
            <div className="col-md-3">
              <label className="font-weight-600" style={{ fontSize: 13 }}>Année fin</label>
              <select className="form-control" value={customFinAnnee}
                onChange={e => setCustomFinAnnee(Number(e.target.value))}>
                {annees.map(a => <option key={a} value={a}>{a}</option>)}
              </select>
            </div>
            <div className="col-12 mt-2">
              <small className="text-muted">
                Période : <strong>{ddCourant}</strong> → <strong>{dfCourant}</strong>
              </small>
            </div>
          </div>
        )}

        {periodeType !== 'personnalise' && (
          <div className="mt-2">
            <small className="text-muted">
              Période : <strong>{ddCourant}</strong> → <strong>{dfCourant}</strong>
            </small>
          </div>
        )}

        <div className="d-flex mt-4" style={{ gap: 10 }}>
          <button className="btn btn-primary" onClick={handleApercu}>
            <i className="dw dw-eye mr-1" /> Aperçu tableau
          </button>
          {paramsConfirmes && (
            <BoutonImprimer url={pdfUrl} label="Imprimer PDF" size="md" avecOrientation />
          )}
        </div>
      </CardBox>

      {/* Tableau */}
      {paramsConfirmes && (
        <CardBox>
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h5 className="mb-0 h6">
              Rapport{' '}
              <strong style={{ color: '#7934f3' }}>{paramsConfirmes.type_rapport}</strong>
              {' — '}{paramsConfirmes.date_debut} au {paramsConfirmes.date_fin}
            </h5>
            <BoutonImprimer url={pdfUrl} label="Imprimer" size="sm" avecOrientation />
          </div>

          {isLoading ? (
            <Spinner fullPage />
          ) : !lignes || lignes.length === 0 ? (
            <div className="text-center py-5 text-muted">
              <i className="dw dw-analytics-21 font-48" style={{ opacity: 0.2 }} />
              <p className="mt-2">Aucune donnée pour cette période</p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-bordered table-hover table-sm">
                <thead style={{ background: '#7934f3', color: '#fff' }}>
                  <tr>
                    <th style={{ minWidth: 160 }}>Unité</th>
                    {moisPresents.map(m => (
                      <th key={m} style={{ fontSize: 11, textAlign: 'right', minWidth: 80 }}>
                        {MOIS_COURTS[m - 1]}
                      </th>
                    ))}
                    <th style={{ textAlign: 'right', minWidth: 120 }}>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {lignes.map(ligne => (
                    <tr key={ligne.id_unite}>
                      <td style={{ fontSize: 12, fontWeight: 500 }}>{ligne.nom_unite}</td>
                      {moisPresents.map(m => (
                        <td key={m} style={{
                          fontSize: 11, textAlign: 'right',
                          color: ligne.montants_par_mois[m] > 0 ? '#353535' : '#ccc',
                        }}>
                          {ligne.montants_par_mois[m] > 0
                            ? formatMontantCourt(ligne.montants_par_mois[m])
                            : '—'}
                        </td>
                      ))}
                      <td style={{ fontSize: 12, fontWeight: 700, textAlign: 'right', color: '#7934f3' }}>
                        {formatMontantCourt(ligne.total)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot style={{ background: '#f0e8ff' }}>
                  <tr>
                    <td className="font-weight-700" style={{ fontSize: 13 }}>TOTAL GÉNÉRAL</td>
                    {moisPresents.map(m => (
                      <td key={m} style={{ fontSize: 11, fontWeight: 700, textAlign: 'right' }}>
                        {totauxMois[m] > 0 ? formatMontantCourt(totauxMois[m]) : '—'}
                      </td>
                    ))}
                    <td style={{ fontWeight: 700, textAlign: 'right', color: '#7934f3', fontSize: 13 }}>
                      {formatMontantCourt(grandTotal)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </CardBox>
      )}
    </div>
  )
}