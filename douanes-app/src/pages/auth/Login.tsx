// src/pages/auth/Login.tsx
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useNavigate, Navigate } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { login } from '../../api/auth.api'
import { useAuthStore } from '../../store/authStore'

const schema = z.object({
  pseudo: z.string().min(1, 'Pseudo requis'),
  mot_de_passe: z.string().min(1, 'Mot de passe requis'),
})
type FormData = z.infer<typeof schema>

export default function Login() {
  const navigate = useNavigate()
  const { poste, login: storeLogin, isAuthenticated } = useAuthStore()

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema) as any,
  })

  const mutation = useMutation({
    mutationFn: (data: FormData) =>
      login({ code_poste: poste!.code_poste, ...data }),
    onSuccess: (data) => {
      storeLogin({
        token: data.access_token,
        user: data.user,
        poste: data.poste,
      })
      toast.success(`Bienvenue, ${data.user.prenom} !`)
      navigate('/dashboard')
    },
    onError: (error: any) => {
      const msg = error?.response?.data?.detail || 'Identifiants incorrects'
      toast.error(msg)
    },
  })

  // ✅ Guards APRÈS les hooks — utiliser <Navigate> et non navigate()
  if (isAuthenticated) return <Navigate to="/dashboard" replace />
  if (!poste) return <Navigate to="/" replace />

  return (
    <div style={{ minHeight: '100vh', display: 'flex' }}>
      {/* Colonne gauche — Photo */}
      <div className="d-none d-lg-flex col-lg-7" style={{ position: 'relative', overflow: 'hidden' }}>
        <img
          src="/vendors/images/login-page-img.jpeg"
          alt="Douanes"
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
        />
      </div>

      {/* Colonne droite — Formulaire */}
      <div className="col-lg-5 d-flex align-items-center" style={{ background: '#f2f4f9' }}>
        <div style={{ width: '100%', padding: '40px' }}>
          <div style={{ maxWidth: 420, margin: '0 auto' }}>

            <div className="mb-4 text-center">
              <img src="/vendors/images/logo-tresor.png" alt=""
                style={{ width: 60, height: 60, objectFit: 'contain', marginBottom: 12 }} />
              <h4 style={{ fontWeight: 700, color: '#154115ff', marginBottom: 4 }}>Connexion</h4>
              <p style={{ color: '#888', fontSize: 13 }}>Douanes Extrême-Nord</p>
            </div>

            {/* Bandeau poste */}
            <div className="mb-3 p-2 rounded d-flex align-items-center justify-content-between"
              style={{ background: '#e8f4fd', border: '1px solid #04a9f5' }}>
              <span style={{ fontSize: 13, color: '#04a9f5', fontWeight: 600 }}>
                {poste.nom_poste}
              </span>
              <button type="button" className="btn btn-sm btn-outline-secondary"
                style={{ fontSize: 11, padding: '2px 8px' }}
                onClick={() => navigate('/')}>
                Changer
              </button>
            </div>

            {/* Message d'erreur inline (en plus du toast) */}
            {mutation.isError && (
              <div className="alert alert-danger d-flex align-items-center mb-3"
                style={{ fontSize: 13, padding: '10px 14px', borderRadius: 8 }}>
                <i className="dw dw-warning2 mr-2" style={{ fontSize: 16 }} />
                {(mutation.error as any)?.response?.data?.detail || 'Identifiants incorrects'}
              </div>
            )}

            <form onSubmit={handleSubmit(d => mutation.mutate(d))}>
              <div className="form-group">
                <label style={{ fontWeight: 600, fontSize: 13 }}>Pseudo</label>
                <input
                  {...register('pseudo')}
                  className={`form-control ${errors.pseudo ? 'is-invalid' : ''}`}
                  placeholder="Votre identifiant"
                  autoFocus
                  disabled={mutation.isPending}
                />
                {errors.pseudo && <div className="invalid-feedback">{errors.pseudo.message}</div>}
              </div>

              <div className="form-group">
                <label style={{ fontWeight: 600, fontSize: 13 }}>Mot de passe</label>
                <input
                  {...register('mot_de_passe')}
                  type="password"
                  className={`form-control ${errors.mot_de_passe ? 'is-invalid' : ''}`}
                  placeholder="Votre mot de passe"
                  disabled={mutation.isPending}
                />
                {errors.mot_de_passe && <div className="invalid-feedback">{errors.mot_de_passe.message}</div>}
              </div>

              <button
                type="submit"
                className="btn btn-primary btn-block"
                disabled={mutation.isPending}
                style={{ marginTop: 8, fontWeight: 600 }}
              >
                {mutation.isPending
                  ? <><span className="spinner-border spinner-border-sm mr-2" />Connexion en cours...</>
                  : 'Se connecter'}
              </button>
            </form>

          </div>
        </div>
      </div>
    </div>
  )
}