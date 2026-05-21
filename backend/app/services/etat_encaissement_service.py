from fastapi import HTTPException, status
from sqlalchemy import func
from sqlalchemy.orm import Session
from app.models.etat_encaissement import EtatEncaissement
from app.models.ligne_budgetaire import LigneBudgetaire
from app.models.suivi_mensuel import SuiviMensuel
from app.models.suivi_unite import SuiviUnite
from app.schemas.etat_encaissement import EtatEncaissementCreate

class EtatEncaissementService:
    def __init__(self, db: Session):
        self.db = db

    def verifier_ligne(self, num_ligne: str, id_poste: int) -> LigneBudgetaire:
        """
        Vérifie si num_ligne existe pour ce poste.
        Retourne la ligne avec son code_taxe et intitulé.
        """
        ligne = self.db.query(LigneBudgetaire).filter(
            LigneBudgetaire.num_ligne == num_ligne,
            LigneBudgetaire.id_poste  == id_poste,
        ).first()
        if not ligne:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Ligne budgétaire '{num_ligne}' introuvable pour ce poste"
            )
        return ligne

    def creer(self, data: EtatEncaissementCreate,
              utilisateur_id: int, id_poste: int) -> EtatEncaissement:
        # 1. Vérifier et récupérer la ligne budgétaire
        ligne = self.verifier_ligne(data.num_ligne, id_poste)

        # 2. Créer l'encaissement
        enc = EtatEncaissement(
            id_unite          = data.id_unite,
            id_ligne          = ligne.id,
            utilisateur_id    = utilisateur_id,
            date_encaissement = data.date_encaissement,
            mois              = data.date_encaissement.month,
            annee             = data.date_encaissement.year,
            montant           = data.montant,
        )
        self.db.add(enc)
        self.db.commit()
        self.db.refresh(enc)

        # 3. Mettre à jour le suivi mensuel
        self._maj_suivi(data.id_unite, enc.mois, enc.annee, ligne.code_taxe)
        return enc

    def _maj_suivi(self, id_unite: int, mois: int, annee: int, code_taxe: str):
        """
        Somme tous les encaissements du mois pour cette unité
        dont le code_taxe correspond à CAC ou protocole.
        """
        for type_suivi in ["CAC", "protocole"]:
            total = self.db.query(
                func.coalesce(func.sum(EtatEncaissement.montant), 0)
            ).join(LigneBudgetaire).filter(
                EtatEncaissement.id_unite         == id_unite,
                EtatEncaissement.mois             == mois,
                EtatEncaissement.annee            == annee,
                LigneBudgetaire.code_taxe         == type_suivi,
            ).scalar()

            suivi = self.db.query(SuiviMensuel).filter(
                SuiviMensuel.type  == type_suivi,
                SuiviMensuel.mois  == mois,
                SuiviMensuel.annee == annee,
            ).first()

            if float(total) == 0:
                continue

            if not suivi:
                suivi = SuiviMensuel(
                    type=type_suivi, mois=mois, annee=annee,
                    id_user=1
                )
                self.db.add(suivi)
                self.db.flush()

            suivi_unite = self.db.query(SuiviUnite).filter(
                SuiviUnite.id_suivi == suivi.id_suivi,
                SuiviUnite.id_unite == id_unite,
            ).first()

            if not suivi_unite:
                suivi_unite = SuiviUnite(
                    id_suivi=suivi.id_suivi,
                    id_unite=id_unite
                )
                self.db.add(suivi_unite)

            suivi_unite.montant = float(total)

        self.db.commit()

    def get_by_unite(self, id_unite: int):
        return self.db.query(EtatEncaissement)\
            .filter(EtatEncaissement.id_unite == id_unite)\
            .order_by(EtatEncaissement.date_encaissement.desc())\
            .all()

    def supprimer(self, id_encaissement: int):
        enc = self.db.query(EtatEncaissement)\
            .filter(EtatEncaissement.id_encaissement == id_encaissement).first()
        if not enc:
            raise HTTPException(status_code=404, detail="Encaissement non trouvé")
        id_unite, mois, annee = enc.id_unite, enc.mois, enc.annee
        code_taxe = enc.ligne_budgetaire.code_taxe
        self.db.delete(enc)
        self.db.commit()
        self._maj_suivi(id_unite, mois, annee, code_taxe)