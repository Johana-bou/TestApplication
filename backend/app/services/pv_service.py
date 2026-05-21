from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from app.repositories.pv_repository import PVRepository
from app.schemas.pv import PVCreate
from app.models.proces_verbal import ProcesVerbal
from backend.app.models.situation_virement import Virement
from backend.app.models.situation_cheque import Cheque
from app.pdf.pdf_service import generate_pdf

class PVService:
    def __init__(self, db: Session):
        self.repo = PVRepository(db)

    def creer_pv(self, data: PVCreate, utilisateur_id: int) -> ProcesVerbal:
        if self.repo.get_by_num_pv(data.num_pv):
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Le PV {data.num_pv} existe deja")
        solde_theorique = data.solde_dernier_controle + data.mouvements_debiteurs - data.mouvements_crediteurs
        difference = solde_theorique - data.solde_dernier_controle
        pv = ProcesVerbal(
            num_pv=data.num_pv, date_pv=data.date_pv,
            date_debut_periode=data.date_debut_periode, date_fin_periode=data.date_fin_periode,
            poste_id=data.poste_id, utilisateur_id=utilisateur_id,
            solde_dernier_controle=data.solde_dernier_controle,
            mouvements_debiteurs=data.mouvements_debiteurs,
            mouvements_crediteurs=data.mouvements_crediteurs,
            solde_theorique=solde_theorique, difference=difference,
            observations=data.observations, receveur_nom=data.receveur_nom, receveur_grade=data.receveur_grade,
        )
        virements = [Virement(date_virement=v.date_virement, num_virement=v.num_virement, montant=v.montant, observation=v.observation) for v in data.virements]
        cheques = [Cheque(date_cheque=c.date_cheque, num_cheque=c.num_cheque, montant=c.montant, num_dr=c.num_dr, observation=c.observation) for c in data.cheques]
        return self.repo.create_with_details(pv, virements, cheques)

    def get_pv(self, pv_id: int) -> ProcesVerbal:
        pv = self.repo.get_by_id(pv_id)
        if not pv:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="PV non trouve")
        return pv

    def get_pvs_par_poste(self, poste_id: int):
        return self.repo.get_by_poste(poste_id)

    def generer_pdf(self, pv_id: int) -> bytes:
        pv = self.get_pv(pv_id)
        return generate_pdf("pv", {"pv": pv, "poste": pv.poste, "virements": pv.virements, "cheques": pv.cheques})
