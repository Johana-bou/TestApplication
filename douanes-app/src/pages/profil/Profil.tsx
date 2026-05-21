import { useEffect } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { getMonProfil, updateUtilisateur } from '../../api/admin.api'
import { CardBox } from '../../components/ui/CardBox'
import { Spinner } from '../../components/ui/Spinner'
import { useAuth } from '../../hooks/useAuth'

interface ProfilForm {
  nom: string
  prenom: string
  email?: string
  mot_de_passe?: string
  confirm_mdp?: string
}

export default function Profil() {
  const { user, poste, initiales, userId } = useAuth()
  const { data: profil, isLoading } = useQuery({ queryKey: ['mon-profil'], queryFn: getMonProfil })
  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<ProfilForm>()

  useEffect(() => {
    if (profil) {
      setValue('nom', profil.nom || '')
      setValue('prenom', profil.prenom || '')
      setValue('email', profil.email || '')
    }
  }, [profil, setValue])

  const mutation = useMutation({
    mutationFn: (data: ProfilForm) => {
      const payload: Record<string, unknown> = {
        nom: data.nom,
        prenom: data.prenom,
        email: data.email || undefined,
      }
      if (data.mot_de_passe) payload.mot_de_passe = data.mot_de_passe
      return updateUtilisateur(userId!, payload)
    },
    onSuccess: () => toast.success('Profil mis à jour'),
    onError: (e: any) => toast.error(e?.response?.data?.detail || 'Erreur'),
  })

  const mdp = watch('mot_de_passe')
  if (isLoading) return <Spinner fullPage />

  return (
    <div className="min-height-200px">
      <div className="page-header">
        <div className="row">
          <div className="col">
            <div className="title"><h4>Mon Profil</h4></div>
            <nav aria-label="breadcrumb">
              <ol className="breadcrumb">
                <li className="breadcrumb-item"><a href="/dashboard">Accueil</a></li>
                <li className="breadcrumb-item active">Mon profil</li>
              </ol>
            </nav>
          </div>
        </div>
      </div>

      <div className="row">
        {/* Carte identité */}
        <div className="col-lg-4 mb-20">
          <CardBox>
            <div className="text-center py-3">
              <div style={{
                width: 80, height: 80, borderRadius: '50%',
                background: 'linear-gradient(135deg, #7934f3, #04a9f5)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#fff', fontWeight: 800, fontSize: 28, margin: '0 auto 16px',
              }}>
                {initiales}
              </div>
              <h5 style={{ fontWeight: 700, marginBottom: 4 }}>{user?.prenom} {user?.nom}</h5>
              <p style={{ color: '#888', fontSize: 13, marginBottom: 8 }}>@{user?.pseudo}</p>
              <span className={`badge badge-${user?.role === 'ADMIN' ? 'primary' : 'secondary'}`}>
                {user?.role}
              </span>
            </div>
            <div style={{ height: 1, background: '#f0f0f0', margin: '16px 0' }} />
            {[
              { icon: 'dw-bank', label: 'Poste', value: poste?.nom_poste },
              { icon: 'dw-id-card', label: 'Code', value: poste?.code_poste },
              { icon: 'dw-user1', label: 'Identifiant', value: user?.pseudo },
            ].map(item => (
              <div key={item.label} className="d-flex align-items-center mb-2" style={{ gap: 10 }}>
                <i className={`dw ${item.icon}`} style={{ color: '#7934f3', width: 18 }} />
                <span style={{ fontSize: 12, color: '#888' }}>{item.label} :</span>
                <strong style={{ fontSize: 13 }}>{item.value}</strong>
              </div>
            ))}
          </CardBox>
        </div>

        {/* Formulaire */}
        <div className="col-lg-8">
          <form onSubmit={handleSubmit(d => mutation.mutate(d))}>
            <CardBox className="mb-20">
              <h5 className="mb-4 h6" style={{ borderBottom: '2px solid #7934f3', paddingBottom: 8 }}>
                Informations personnelles
              </h5>
              <div className="row">
                <div className="col-md-6">
                  <div className="form-group">
                    <label className="font-weight-600">Prénom</label>
                    <input {...register('prenom', { required: true })} className="form-control" />
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="form-group">
                    <label className="font-weight-600">Nom</label>
                    <input {...register('nom', { required: true })} className="form-control" />
                  </div>
                </div>
              </div>
              <div className="row">
                <div className="col-md-6">
                  <div className="form-group">
                    <label className="font-weight-600">Email</label>
                    <input {...register('email')} type="email" className="form-control" placeholder="votre@email.com" />
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="form-group">
                    <label className="font-weight-600">Identifiant (pseudo)</label>
                    <input className="form-control" value={user?.pseudo || ''} readOnly
                      style={{ background: '#f8f9fa', color: '#888' }} />
                    <small className="text-muted">Non modifiable</small>
                  </div>
                </div>
              </div>
            </CardBox>

            <CardBox className="mb-20">
              <h5 className="mb-4 h6" style={{ borderBottom: '2px solid #e55353', paddingBottom: 8 }}>
                Changer le mot de passe
              </h5>
              <div className="alert alert-info" style={{ fontSize: 12 }}>
                <i className="dw dw-information mr-1" />
                Laissez vide si vous ne souhaitez pas changer votre mot de passe.
              </div>
              <div className="row">
                <div className="col-md-6">
                  <div className="form-group">
                    <label className="font-weight-600">Nouveau mot de passe</label>
                    <input
                      {...register('mot_de_passe', { minLength: { value: 6, message: 'Min. 6 caractères' } })}
                      type="password"
                      className={`form-control ${errors.mot_de_passe ? 'is-invalid' : ''}`}
                      placeholder="Laisser vide pour ne pas changer"
                    />
                    {errors.mot_de_passe && <div className="invalid-feedback">{errors.mot_de_passe.message}</div>}
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="form-group">
                    <label className="font-weight-600">Confirmer</label>
                    <input
                      {...register('confirm_mdp', {
                        validate: v => !mdp || v === mdp || 'Les mots de passe ne correspondent pas'
                      })}
                      type="password"
                      className={`form-control ${errors.confirm_mdp ? 'is-invalid' : ''}`}
                    />
                    {errors.confirm_mdp && <div className="invalid-feedback">{errors.confirm_mdp.message}</div>}
                  </div>
                </div>
              </div>
            </CardBox>

            <button type="submit" className="btn btn-primary" disabled={mutation.isPending}>
              {mutation.isPending
                ? <><span className="spinner-border spinner-border-sm mr-2" />Enregistrement...</>
                : <><i className="dw dw-check-circle mr-1" />Enregistrer les modifications</>}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
