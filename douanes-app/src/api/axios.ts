// src/api/axios.ts
import axios from 'axios'
import toast from 'react-hot-toast'
import { useAuthStore } from '../store/authStore'

// ✅ 127.0.0.1 au lieu de localhost — plus fiable dans Electron packagé
const api = axios.create({ baseURL: 'http://127.0.0.1:8000' })

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  (res) => res,
  (error) => {
    const status = error.response?.status
    const url = error.config?.url ?? ''

    // Routes d'auth publiques — laisser le composant gérer lui-même l'erreur
    const isAuthRoute = url.includes('/api/auth/login') || url.includes('/api/auth/postes')

    if (status === 401) {
      if (isAuthRoute) {
        return Promise.reject(error)
      }
      useAuthStore.getState().logout()
      window.location.href = '/'
      toast.error('Session expirée, veuillez vous reconnecter')
    } else if (status === 403) {
      if (isAuthRoute) {
        return Promise.reject(error)
      }
      toast.error(error.response?.data?.detail || 'Accès non autorisé')
    } else if (status === 422) {
      const details = error.response.data?.detail
      if (Array.isArray(details)) {
        details.forEach((d: { loc: string[]; msg: string }) =>
          toast.error(`${d.loc?.[d.loc.length - 1]}: ${d.msg}`)
        )
      } else if (typeof details === 'string') {
        toast.error(details)
      } else {
        toast.error('Données invalides')
      }
    } else if (status && status >= 500) {
      toast.error("Erreur serveur — contactez l'administrateur")
    }
    return Promise.reject(error)
  }
)

export default api
