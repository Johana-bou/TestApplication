# app/routers/config_impression_router.py
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import ConfigImpression, Poste, Utilisateur
from app.security.auth import get_current_user

router = APIRouter(tags=["Configuration Impression"])

@router.get("/poste/{poste_id}")
def get_config_by_poste(
    poste_id: int,
    db: Session = Depends(get_db),
    current_user: Utilisateur = Depends(get_current_user)
):
    config = db.query(ConfigImpression).filter(ConfigImpression.id_poste == poste_id).first()
    if not config:
        return {
            "id_poste": poste_id,
            "logo_path": None,
            "entete": "",
            "pied_page": "Document officiel - Direction Générale des Douanes",
            "nom_receveur": "Le Receveur",
            "grade_receveur": "Inspecteur des Douanes"
        }
    return {
        "id_config": config.id_config,
        "id_poste": config.id_poste,
        "logo_path": config.logo_path,
        "entete": config.entete,
        "pied_page": config.pied_page,
        "nom_receveur": config.nom_receveur,
        "grade_receveur": config.grade_receveur
    }

@router.post("/")
def create_or_update_config(
    data: dict,
    db: Session = Depends(get_db),
    current_user: Utilisateur = Depends(get_current_user)
):
    # ✅ ADMIN et RECEVEUR peuvent créer/modifier la config d'impression
    if current_user.role not in ["ADMIN", "RECEVEUR"]:
        raise HTTPException(status_code=403, detail="Droits insuffisants")

    poste = db.query(Poste).filter(Poste.id_poste == data.get("id_poste")).first()
    if not poste:
        raise HTTPException(status_code=404, detail="Poste non trouvé")

    config = db.query(ConfigImpression).filter(ConfigImpression.id_poste == data.get("id_poste")).first()

    if config:
        if "logo_path" in data:
            config.logo_path = data["logo_path"]
        if "entete" in data:
            config.entete = data["entete"]
        if "pied_page" in data:
            config.pied_page = data["pied_page"]
        if "nom_receveur" in data:
            config.nom_receveur = data["nom_receveur"]
        if "grade_receveur" in data:
            config.grade_receveur = data["grade_receveur"]
    else:
        config = ConfigImpression(
            id_poste=data.get("id_poste"),
            logo_path=data.get("logo_path"),
            entete=data.get("entete"),
            pied_page=data.get("pied_page"),
            nom_receveur=data.get("nom_receveur"),
            grade_receveur=data.get("grade_receveur")
        )
        db.add(config)

    db.commit()
    return {"message": "Configuration enregistrée", "id_poste": config.id_poste}