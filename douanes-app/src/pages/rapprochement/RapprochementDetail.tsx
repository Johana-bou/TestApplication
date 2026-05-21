import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { getRapprochement } from '../../api/rapprochement.api'
import { getComptes } from '../../api/admin.api'
import { CardBox } from '../../components/ui/CardBox'
import { Spinner } from '../../components/ui/Spinner'
import { BoutonImprimer } from '../../components/shared/BoutonImprimer'
import { formatMontant } from '../../utils/formatMontant'
import { toDisplay } from '../../utils/formatDate'

export default function RapprochementDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { data: rap, isLoading } = useQuery({
    queryKey: ['rapprochement', id],
    queryFn: () => getRapprochement(Number(id)),
  })
  const { data: comptes } = useQuery({ queryKey: ['comptes'], queryFn: getComptes })

  if (isLoading) return <Spinner fullPage />
  if (!rap) return <div className="alert alert-danger">Rapprochement introuvable</div>

  const compte = (comptes || []).find((c: Record<string, unknown>) => c.id_compte === rap.id_compte)

  return (
    <div className="min-height-200px">
      <div className="page-header">
        <div className="row align-items-center">
          <div className="col">
            <div className="title"><h4>Rapprochement #{rap.id_rapprochement}</h4></div>
          </div>
          <div className="col-auto d-flex" style={{ gap: 8 }}>
            <BoutonImprimer url={`/api/etats-rapprochement/${id}/pdf`} label="Imprimer PDF" size="md" avecOrientation />
            <button className="btn btn-secondary" onClick={() => navigate('/rapprochement')}>Retour</button>
          </div>
        </div>
      </div>
      <CardBox>
        <div className="row">
          <div className="col-md-6">
            <table className="table table-sm table-borderless">
              <tbody>
                <tr><th>N° Compte</th><td><strong>{compte ? compte.num_compte : `#${rap.id_compte}`}</strong></td></tr>
                <tr><th>Nom du compte</th><td>{compte ? compte.nom_compte : '—'}</td></tr>
                <tr><th>Intitulé</th><td>{rap.intitule}</td></tr>
                <tr><th>Date</th><td>{rap.date_rapprochement ? toDisplay(rap.date_rapprochement) : '-'}</td></tr>
                <tr><th>Observation</th><td>{rap.observation || <span className="text-muted">—</span>}</td></tr>
              </tbody>
            </table>
          </div>
          <div className="col-md-6">
            <div style={{ background: '#f8f9fa', borderRadius: 10, padding: 20 }}>
              {[
                { label: 'Solde balance', value: rap.solde_balance, color: '#353535' },
                { label: 'Opér. ACCT non constatées', value: rap.operation_acct_non_constate, color: '#04a9f5' },
                { label: 'Opér. poste non constatées', value: rap.operation_poste_non_constate, color: '#e55353' },
              ].map(item => (
                <div key={item.label} className="d-flex justify-content-between mb-2" style={{ fontSize: 13 }}>
                  <span className="text-muted">{item.label}</span>
                  <span style={{ color: item.color, fontWeight: 600 }}>{formatMontant(item.value || 0)}</span>
                </div>
              ))}
              <div style={{ height: 1, background: '#dee2e6', margin: '12px 0' }} />
              <div className="d-flex justify-content-between mb-2">
                <span className="font-weight-700">Solde théorique</span>
                <span style={{ color: '#7934f3', fontWeight: 700 }}>{formatMontant(rap.solde_theorique || 0)}</span>
              </div>
              <div className="d-flex justify-content-between">
                <span className="font-weight-700">Écart</span>
                <span style={{ color: rap.ecart === 0 ? '#1ec01e' : '#e55353', fontWeight: 700 }}>
                  {formatMontant(Math.abs(rap.ecart || 0))}
                  {rap.ecart === 0 && <i className="dw dw-check-circle ml-1" />}
                </span>
              </div>
            </div>
          </div>
        </div>
      </CardBox>
    </div>
  )
}