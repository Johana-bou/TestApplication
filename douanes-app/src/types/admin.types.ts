export interface Unite {
  id_unite: number
  nom_unite: string
  id_poste: number
  nom_poste?: string
}

export interface Utilisateur {
  id_utilisateur: number
  nom: string
  prenom: string
  pseudo: string
  role: 'ADMIN' | 'RECEVEUR'
  actif: boolean
}

export interface Affectation {
  id_affectation: number
  id_utilisateur: number
  id_poste: number
  date_debut: string
  date_fin?: string
  utilisateur?: Utilisateur
  poste?: { id_poste: number; nom_poste: string }
}

export interface Notification {
  id_notification: number
  message: string
  lu: boolean
  date_creation: string
}
