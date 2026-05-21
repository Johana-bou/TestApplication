import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { getPV } from '../../api/pv.api'
import { CardBox } from '../../components/ui/CardBox'
import { Spinner } from '../../components/ui/Spinner'
import { BoutonImprimer } from '../../components/shared/BoutonImprimer'
import { formatMontant } from '../../utils/formatMontant'
import { toDisplay } from '../../utils/formatDate'

export default function PVDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { data: pv, isLoading } = useQuery({
    queryKey: ['pv', id],
    queryFn: () => getPV(Number(id)),
  })

  if (isLoading) return <Spinner fullPage />
  if (!pv) return <div className="alert alert-danger m-3">PV introuvable</div>

  return (
    <div className="min-height-200px">
      <div className="page-header">
        <div className="row align-items-center">
          <div className="col">
            <div className="title"><h4>PV — {pv.num_pv}</h4></div>
            <nav aria-label="breadcrumb">
              <ol className="breadcrumb">
                <li className="breadcrumb-item"><a href="/dashboard">Accueil</a></li>
                <li className="breadcrumb-item"><a href="/pv">PV</a></li>
                <li className="breadcrumb-item active">{pv.num_pv}</li>
              </ol>
            </nav>
          </div>
          <div className="col-auto d-flex" style={{ gap: 8 }}>
            <button className="btn btn-outline-warning"
              onClick={() => navigate(`/pv/${id}/modifier`)}>
              <i className="dw dw-edit2 mr-1" /> Modifier
            </button>
            <BoutonImprimer url={`/api/pv/${id}/pdf`} label="Imprimer PDF" size="md" avecOrientation />
            <button className="btn btn-secondary" onClick={() => navigate('/pv')}>Retour</button>
          </div>
        </div>
      </div>

      {/* Infos générales */}
      <CardBox className="mb-20">
        <div className="row">
          <div className="col-md-6">
            <table className="table table-sm table-borderless">
              <tbody>
                <tr><th>N° PV</th><td><strong>{pv.num_pv}</strong></td></tr>
                <tr><th>Date</th><td>{pv.date_pv ? toDisplay(pv.date_pv) : '—'}</td></tr>
                <tr><th>Poste</th><td>{pv.nom_poste || '—'}</td></tr>
                <tr><th>Période</th><td>
                  {pv.periode_debut && pv.periode_fin
                    ? `${toDisplay(pv.periode_debut)} → ${toDisplay(pv.periode_fin)}`
                    : '—'}
                </td></tr>
              </tbody>
            </table>
          </div>
          <div className="col-md-6">
            <table className="table table-sm table-borderless">
              <tbody>
                <tr><th>Solde dernier contrôle</th><td>{formatMontant(pv.solde_dernier_controle || 0)}</td></tr>
                <tr><th>Mouvements débiteurs</th><td>{formatMontant(pv.mouvements_debiteurs || 0)}</td></tr>
                <tr><th>Mouvements créditeurs</th><td>{formatMontant(pv.mouvements_crediteurs || 0)}</td></tr>
                <tr>
                  <th>Solde théorique</th>
                  <td>
                    <strong style={{ color: '#7934f3', fontSize: 16 }}>
                      {formatMontant(pv.solde_theorique || 0)}
                    </strong>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
        {pv.observation && (
          <div className="alert alert-info mt-2" style={{ fontSize: 13 }}>
            <strong>Observation :</strong> {pv.observation}
          </div>
        )}
      </CardBox>

      {/* Virements */}
      {(pv.virements || []).length > 0 && (
        <CardBox className="mb-20">
          <h6 className="mb-3" style={{ color: '#04a9f5', fontWeight: 700 }}>
            <i className="dw dw-money mr-1" /> Virements ({pv.virements.length})
          </h6>
          <div className="table-responsive">
            <table className="table table-sm table-hover">
              <thead style={{ background: '#f8f9fa' }}>
                <tr><th>Date</th><th>N° Virement</th><th>Montant</th><th>Observation</th></tr>
              </thead>
              <tbody>
                {pv.virements.map((v: any, i: number) => (
                  <tr key={i}>
                    <td style={{ fontSize: 13 }}>{toDisplay(v.date_virement)}</td>
                    <td><code>{v.num_virement}</code></td>
                    <td style={{ fontWeight: 600 }}>{formatMontant(v.montant)}</td>
                    <td style={{ fontSize: 13, color: '#888' }}>{v.observation || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardBox>
      )}

      {/* Chèques */}
      {(pv.cheques || []).length > 0 && (
        <CardBox>
          <h6 className="mb-3" style={{ color: '#1ec01e', fontWeight: 700 }}>
            <i className="dw dw-check-circle mr-1" /> Chèques ({pv.cheques.length})
          </h6>
          <div className="table-responsive">
            <table className="table table-sm table-hover">
              <thead style={{ background: '#f8f9fa' }}>
                <tr><th>Date</th><th>N° Chèque</th><th>Montant</th><th>N° DR</th><th>Observation</th></tr>
              </thead>
              <tbody>
                {pv.cheques.map((c: any, i: number) => (
                  <tr key={i}>
                    <td style={{ fontSize: 13 }}>{toDisplay(c.date_cheque)}</td>
                    <td><code>{c.num_cheque}</code></td>
                    <td style={{ fontWeight: 600 }}>{formatMontant(c.montant)}</td>
                    <td style={{ fontSize: 13 }}>{c.num_dr || '—'}</td>
                    <td style={{ fontSize: 13, color: '#888' }}>{c.observation || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardBox>
      )}
    </div>
  )
}
