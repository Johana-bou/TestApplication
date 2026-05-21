export interface RapportLigne {
  mois?: number;      // 0 pour janvier, 11 pour décembre
  montant?: number;
  unite?: string;
  // Ajoutez d'autres champs selon la réponse réelle de votre API
}