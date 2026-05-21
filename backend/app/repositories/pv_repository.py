from sqlalchemy.orm import Session
from typing import Optional, List
from app.models.proces_verbal import ProcesVerbal
from backend.app.models.situation_virement import Virement
from backend.app.models.situation_cheque import Cheque
from app.repositories.base import BaseRepository

class PVRepository(BaseRepository[ProcesVerbal]):
    def __init__(self, db: Session):
        super().__init__(ProcesVerbal, db)

    def get_by_num_pv(self, num_pv: str) -> Optional[ProcesVerbal]:
        return self.db.query(ProcesVerbal)\
            .filter(ProcesVerbal.num_pv == num_pv)\
            .first()

    def get_by_poste(self, poste_id: int) -> List[ProcesVerbal]:
        return self.db.query(ProcesVerbal)\
            .filter(ProcesVerbal.poste_id == poste_id)\
            .order_by(ProcesVerbal.date_pv.desc())\
            .all()

    def create_with_details(
        self,
        pv: ProcesVerbal,
        virements: List[Virement],
        cheques: List[Cheque]
    ) -> ProcesVerbal:
        self.db.add(pv)
        self.db.flush()  # récupère pv.id sans commit

        for v in virements:
            v.pv_id = pv.id
            self.db.add(v)

        for c in cheques:
            c.pv_id = pv.id
            self.db.add(c)

        self.db.commit()
        self.db.refresh(pv)
        return pv

    def delete_with_details(self, pv_id: int) -> bool:
        pv = self.get_by_id(pv_id)
        if not pv:
            return False
        self.db.query(Virement).filter(Virement.pv_id == pv_id).delete()
        self.db.query(Cheque).filter(Cheque.pv_id == pv_id).delete()
        self.db.delete(pv)
        self.db.commit()
        return True