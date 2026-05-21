import { useEffect } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { getConfigImpression, saveConfigImpression, type ConfigImpression } from '../../api/config-impression.api'
import { CardBox } from '../../components/ui/CardBox'
import { Spinner } from '../../components/ui/Spinner'
import { useAuth } from '../../hooks/useAuth'

export default function ConfigImpressionPage() {
  const { poste } = useAuth()
  const { register, handleSubmit, setValue, watch } = useForm<ConfigImpression>({
    defaultValues: {
      entete: '',
      pied_page: 'Document officiel - Direction Générale des Douanes',
      nom_receveur: 'Le Receveur',
      grade_receveur: 'Inspecteur des Douanes',
    }
  })

  const { data: config, isLoading } = useQuery({
    queryKey: ['config-impression', poste?.id_poste],
    queryFn: () => getConfigImpression(poste!.id_poste),
    enabled: !!poste?.id_poste,
  })

  useEffect(() => {
    if (config) {
      setValue('entete', config.entete || '')
      setValue('pied_page', config.pied_page || '')
      setValue('nom_receveur', config.nom_receveur || '')
      setValue('grade_receveur', config.grade_receveur || '')
    }
  }, [config, setValue])

  const mutation = useMutation({
    mutationFn: (data: ConfigImpression) =>
      saveConfigImpression({ ...data, id_poste: poste!.id_poste }),
    onSuccess: () => toast.success('Configuration d\'impression enregistrée'),
    onError: () => toast.error('Erreur lors de l\'enregistrement'),
  })

  if (isLoading) return <Spinner fullPage />

  const entete = watch('entete')
  const piedPage = watch('pied_page')
  const nomReceveur = watch('nom_receveur')
  const gradeReceveur = watch('grade_receveur')

  return (
    <div className="min-height-200px">
      <div className="page-header">
        <div className="row">
          <div className="col">
            <div className="title"><h4>Configuration d'impression</h4></div>
            <nav aria-label="breadcrumb">
              <ol className="breadcrumb">
                <li className="breadcrumb-item"><a href="/dashboard">Accueil</a></li>
                <li className="breadcrumb-item active">Config. impression</li>
              </ol>
            </nav>
          </div>
        </div>
      </div>

      <div className="row">
        <div className="col-lg-7">
          <form onSubmit={handleSubmit(d => mutation.mutate(d))}>
            <CardBox className="mb-20">
              <h5 className="mb-4 h6" style={{ borderBottom: '2px solid #7934f3', paddingBottom: 8 }}>
                <i className="dw dw-printer mr-2" style={{ color: '#7934f3' }} />
                Paramètres de la page imprimée — Poste de {poste?.nom_poste}
              </h5>

              <div className="form-group">
                <label className="font-weight-600">En-tête du document</label>
                <small className="text-muted d-block mb-1">
                  Texte affiché en haut de chaque document imprimé (ex: adresse, téléphone...)
                </small>
                <textarea
                  {...register('entete')}
                  className="form-control"
                  rows={3}
                  placeholder={`REPUBLIQUE DU CAMEROUN\nDirection Générale des Douanes\nRecette Principale — Poste de ${poste?.nom_poste}`}
                />
              </div>

              <div className="form-group">
                <label className="font-weight-600">Pied de page</label>
                <small className="text-muted d-block mb-1">
                  Texte affiché en bas de chaque document imprimé
                </small>
                <input
                  {...register('pied_page')}
                  className="form-control"
                  placeholder="Document officiel - Direction Générale des Douanes"
                />
              </div>

              <div className="row">
                <div className="col-md-6">
                  <div className="form-group">
                    <label className="font-weight-600">Nom du Receveur</label>
                    <input
                      {...register('nom_receveur')}
                      className="form-control"
                      placeholder="Nom et prénom du receveur"
                    />
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="form-group">
                    <label className="font-weight-600">Grade / Fonction</label>
                    <input
                      {...register('grade_receveur')}
                      className="form-control"
                      placeholder="ex: Inspecteur Principal des Douanes"
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                className="btn btn-primary"
                disabled={mutation.isPending}
              >
                {mutation.isPending
                  ? <><span className="spinner-border spinner-border-sm mr-2" />Enregistrement...</>
                  : <><i className="dw dw-check-circle mr-1" />Enregistrer la configuration</>
                }
              </button>
            </CardBox>
          </form>
        </div>

        {/* Aperçu */}
        <div className="col-lg-5">
          <CardBox>
            <h5 className="mb-3 h6">
              <i className="dw dw-eye mr-2" style={{ color: '#04a9f5' }} />
              Aperçu du document imprimé
            </h5>
            <div style={{
              border: '2px solid #eee', borderRadius: 8, padding: 20,
              fontFamily: 'serif', fontSize: 12, background: '#fff',
              boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
            }}>
              {/* En-tête */}
              <div style={{ textAlign: 'center', borderBottom: '2px solid #333', paddingBottom: 12, marginBottom: 12 }}>
                <div style={{ fontWeight: 700, fontSize: 13, whiteSpace: 'pre-line' }}>
                  {entete || `REPUBLIQUE DU CAMEROUN\nDirection Générale des Douanes\nRecette Principale — Poste de ${poste?.nom_poste}`}
                </div>
              </div>

              {/* Corps simulé */}
              <div style={{ minHeight: 120, color: '#666' }}>
                <div style={{ textAlign: 'center', fontWeight: 700, fontSize: 14, marginBottom: 12 }}>
                  PROCÈS-VERBAL DE CAISSE N° PV-2026-001
                </div>
                <div style={{ background: '#f8f9fa', borderRadius: 4, padding: '8px 12px', marginBottom: 8 }}>
                  <div>Période : Avril 2026</div>
                  <div>Solde théorique : 1 250 000 FCFA</div>
                </div>
                <div style={{ height: 40, background: '#f0f0f0', borderRadius: 4, marginBottom: 8 }} />
              </div>

              {/* Signature */}
              <div style={{ marginTop: 24, paddingTop: 12, borderTop: '1px dashed #ccc', textAlign: 'right' }}>
                <div style={{ fontStyle: 'italic', marginBottom: 4 }}>Le Receveur Principal,</div>
                <div style={{ fontWeight: 700 }}>{nomReceveur || 'Nom du Receveur'}</div>
                <div style={{ color: '#666', fontSize: 11 }}>{gradeReceveur || 'Grade'}</div>
              </div>

              {/* Pied de page */}
              <div style={{
                marginTop: 20, paddingTop: 8, borderTop: '1px solid #eee',
                textAlign: 'center', color: '#999', fontSize: 10,
              }}>
                {piedPage || 'Document officiel - Direction Générale des Douanes'}
              </div>
            </div>

            <div className="alert alert-info mt-3" style={{ fontSize: 12 }}>
              <i className="dw dw-information mr-1" />
              Ces paramètres s'appliquent à tous les documents PDF générés pour ce poste :
              PV, rapports, états nominatifs, rapprochements.
            </div>
          </CardBox>
        </div>
      </div>
    </div>
  )
}
