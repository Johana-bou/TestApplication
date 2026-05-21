import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { User, Poste } from '../types/auth.types'

interface AuthStore {
  token: string | null
  user: User | null
  poste: Poste | null
  isAuthenticated: boolean
  login: (data: { token: string; user: User; poste: Poste }) => void
  logout: () => void
  setPoste: (poste: Poste) => void
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      poste: null,
      isAuthenticated: false,
      login: ({ token, user, poste }) =>
        set({ token, user, poste, isAuthenticated: true }),
      logout: () =>
        set({ token: null, user: null, poste: null, isAuthenticated: false }),
      setPoste: (poste) => set({ poste }),
    }),
    { name: 'douanes-auth' }
  )
)
