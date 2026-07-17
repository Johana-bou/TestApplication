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

  const totalVirements = (pv.virements || []).reduce((sum: number, v: any) => sum + (v.montant || 0), 0)
  const totalCheques = (pv.cheques || []).reduce((sum: number, c: any) => sum + (c.montant || 0), 0)
  const hasVirements = pv.virements && pv.virements.length > 0
  const hasCheques = pv.cheques && pv.cheques.length > 0

  return (
    <div className="min-height-200px">
      <div className="page-header">
        <div className="row align-items-center">
          <div className="col">
            <div className="title"><h4>Procès-Verbal <span style={{ color: '#7934f3' }}>{pv.num_pv}</span></h4></div>
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

      {/* ── Informations générales ── */}
      <CardBox className="mb-20">
        <h6 className="mb-3" style={{ color: '#7934f3', fontWeight: 700, borderBottom: '2px solid #7934f3', paddingBottom: 8 }}>
          <i className="dw dw-file mr-2" /> Informations générales
        </h6>
        <div className="row">
          <div className="col-md-6">
            <table className="table table-sm table-borderless">
              <tbody>
                <tr><th style={{ width: 140, color: '#888' }}>N° PV</th><td><strong style={{ fontSize: 16 }}>{pv.num_pv}</strong></td></tr>
                <tr><th style={{ color: '#888' }}>Date</th><td>{pv.date_pv ? toDisplay(pv.date_pv) : '—'}</td></tr>
                <tr><th style={{ color: '#888' }}>Poste</th><td><strong>{pv.nom_poste || '—'}</strong></td></tr>
                <tr><th style={{ color: '#888' }}>Période</th><td>
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
                <tr><th style={{ width: 160, color: '#888' }}>Solde dernier contrôle</th><td><strong>{formatMontant(pv.solde_dernier_controle || 0)}</strong></td></tr>
                <tr><th style={{ color: '#888' }}>Mouvements débiteurs</th><td style={{ color: '#04a9f5' }}><strong>{formatMontant(pv.mouvements_debiteurs || 0)}</strong></td></tr>
                <tr><th style={{ color: '#888' }}>Mouvements créditeurs</th><td style={{ color: '#e55353' }}><strong>{formatMontant(pv.mouvements_crediteurs || 0)}</strong></td></tr>
                <tr>
                  <th style={{ color: '#888' }}>Solde théorique</th>
                  <td>
                    <strong style={{ color: '#7934f3', fontSize: 18 }}>
                      {formatMontant(pv.solde_theorique || 0)}
                    </strong>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {pv.observation && (
          <div className="mt-3" style={{
            background: '#fff8e1',
            borderRadius: 8,
            padding: '12px 16px',
            borderLeft: '4px solid #ff9f1c'
          }}>
            <strong style={{ color: '#ff9f1c' }}><i className="dw dw-edit-2 mr-1" /> Observation :</strong>
            <span style={{ marginLeft: 8, fontSize: 13 }}>{pv.observation}</span>
          </div>
        )}
      </CardBox>

      {/* ── Virements (affiché uniquement s'il y en a) ── */}
      {hasVirements && (
        <CardBox className="mb-20">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h6 style={{ color: '#04a9f5', fontWeight: 700, margin: 0 }}>
              <i className="dw dw-money-2 mr-2" /> Virements
              <span className="badge badge-light ml-2">{pv.virements.length}</span>
            </h6>
            <span style={{ fontSize: 13, color: '#888' }}>
              Total : <strong style={{ color: '#04a9f5', fontSize: 15 }}>
                {formatMontant(totalVirements)}
              </strong>
            </span>
          </div>
          <div className="table-responsive">
            <table className="table table-sm table-hover" style={{ marginBottom: 0 }}>
              <thead style={{ background: '#f0faff' }}>
                <tr>
                  <th>Date</th>
                  <th>N° Virement</th>
                  <th className="text-right">Montant</th>
                  <th>Observation</th>
                </tr>
              </thead>
              <tbody>
                {pv.virements.map((v: any, i: number) => (
                  <tr key={i}>
                    <td style={{ fontSize: 13 }}>{toDisplay(v.date_virement)}</td>
                    <td><code style={{ background: '#f0faff', padding: '2px 8px', borderRadius: 4 }}>{v.num_virement}</code></td>
                    <td className="text-right" style={{ fontWeight: 600 }}>{formatMontant(v.montant)}</td>
                    <td style={{ fontSize: 13, color: '#888' }}>{v.observation || '—'}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot style={{ borderTop: '2px solid #04a9f5', background: '#f8fcff' }}>
                <tr>
                  <td colSpan={2} className="text-right font-weight-700">TOTAL</td>
                  <td className="text-right font-weight-700" style={{ color: '#04a9f5' }}>
                    {formatMontant(totalVirements)}
                  </td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </CardBox>
      )}

      {/* ── Chèques (affiché uniquement s'il y en a) ── */}
      {hasCheques && (
        <CardBox className="mb-20">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h6 style={{ color: '#1ec01e', fontWeight: 700, margin: 0 }}>
              <i className="dw dw-money-bag mr-2" /> Chèques
              <span className="badge badge-light ml-2">{pv.cheques.length}</span>
            </h6>
            <span style={{ fontSize: 13, color: '#888' }}>
              Total : <strong style={{ color: '#1ec01e', fontSize: 15 }}>
                {formatMontant(totalCheques)}
              </strong>
            </span>
          </div>
          <div className="table-responsive">
            <table className="table table-sm table-hover" style={{ marginBottom: 0 }}>
              <thead style={{ background: '#f0faf0' }}>
                <tr>
                  <th>Date</th>
                  <th>N° Chèque</th>
                  <th className="text-right">Montant</th>
                  <th>N° DR</th>
                  <th>Observation</th>
                </tr>
              </thead>
              <tbody>
                {pv.cheques.map((c: any, i: number) => (
                  <tr key={i}>
                    <td style={{ fontSize: 13 }}>{toDisplay(c.date_cheque)}</td>
                    <td><code style={{ background: '#f0faf0', padding: '2px 8px', borderRadius: 4 }}>{c.num_cheque}</code></td>
                    <td className="text-right" style={{ fontWeight: 600 }}>{formatMontant(c.montant)}</td>
                    <td style={{ fontSize: 13 }}>{c.num_dr || '—'}</td>
                    <td style={{ fontSize: 13, color: '#888' }}>{c.observation || '—'}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot style={{ borderTop: '2px solid #1ec01e', background: '#f8fff8' }}>
                <tr>
                  <td colSpan={2} className="text-right font-weight-700">TOTAL</td>
                  <td className="text-right font-weight-700" style={{ color: '#1ec01e' }}>
                    {formatMontant(totalCheques)}
                  </td>
                  <td colSpan={2}></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </CardBox>
      )}

      {/* ── Message si aucun virement ni chèque ── */}
      {!hasVirements && !hasCheques && (
        <CardBox className="mb-20">
          <div className="text-center py-3 text-muted" style={{ fontStyle: 'italic' }}>
            <i className="dw dw-info mr-2" />
            Aucun virement ni chèque enregistré pour ce PV.
          </div>
        </CardBox>
      )}

      {/* ── RÉSUMÉ GLOBAL ── */}
      <CardBox>
        <h6 className="mb-3" style={{ color: '#7934f3', fontWeight: 700, borderBottom: '2px solid #7934f3', paddingBottom: 8 }}>
          <i className="dw dw-statistics mr-2" /> Résumé des montants
        </h6>
        <div className="row text-center">
          <div className="col-md-3">
            <div style={{ padding: '12px', background: '#f8f9fa', borderRadius: 8 }}>
              <div style={{ fontSize: 11, color: '#888' }}>Solde dernier contrôle</div>
              <div style={{ fontWeight: 700, fontSize: 16 }}>{formatMontant(pv.solde_dernier_controle || 0)}</div>
            </div>
          </div>
          <div className="col-md-3">
            <div style={{ padding: '12px', background: '#f0faff', borderRadius: 8, border: '1px solid #04a9f5' }}>
              <div style={{ fontSize: 11, color: '#888' }}>Total virements</div>
              <div style={{ fontWeight: 700, fontSize: 16, color: '#04a9f5' }}>{formatMontant(totalVirements)}</div>
            </div>
          </div>
          <div className="col-md-3">
            <div style={{ padding: '12px', background: '#f0faf0', borderRadius: 8, border: '1px solid #1ec01e' }}>
              <div style={{ fontSize: 11, color: '#888' }}>Total chèques</div>
              <div style={{ fontWeight: 700, fontSize: 16, color: '#1ec01e' }}>{formatMontant(totalCheques)}</div>
            </div>
          </div>
          <div className="col-md-3">
            <div style={{ padding: '12px', background: '#f0e8ff', borderRadius: 8, border: '2px solid #7934f3' }}>
              <div style={{ fontSize: 11, color: '#888' }}>Solde théorique</div>
              <div style={{ fontWeight: 700, fontSize: 18, color: '#7934f3' }}>{formatMontant(pv.solde_theorique || 0)}</div>
            </div>
          </div>
        </div>
      </CardBox>
    </div>
  )
}
