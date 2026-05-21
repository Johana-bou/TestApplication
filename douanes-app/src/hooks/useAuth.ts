import { useAuthStore } from '../store/authStore'

export function useAuth() {
  const { token, user, poste, isAuthenticated, logout } = useAuthStore()
  const isAdmin = user?.role === 'ADMIN'
  const isReceveur = user?.role === 'RECEVEUR'
  const initiales = user
    ? `${(user.prenom || 'U')[0]}${(user.nom || 'S')[0]}`.toUpperCase()
    : 'US'
  const nomComplet = user ? `${user.prenom} ${user.nom}` : ''
  // id_user est le vrai champ backend
  const userId = user?.id_user
  return { token, user, poste, isAuthenticated, logout, isAdmin, isReceveur, initiales, nomComplet, userId }
}
