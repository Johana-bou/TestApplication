// Champs exacts retournés par le backend lors du login
export interface User {
  id_user: number   // ← backend renvoie id_user
  nom: string
  prenom: string
  pseudo: string
  role: 'ADMIN' | 'RECEVEUR'
  poste_id?: number
  actif?: boolean
  email?: string
}

export interface Poste {
  id_poste: number
  code_poste: string
  nom_poste: string
  adresse?: string
}
