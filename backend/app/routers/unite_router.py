# app/routers/unite_router.py
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Unite, Poste, Utilisateur, EtatEncaissement
from app.security.auth import get_current_user
from app.models.etat_encaissement import EtatEncaissement  
from sqlalchemy.exc import IntegrityError
router = APIRouter(tags=["Unités"])

@router.get("/")
def get_all_unites(
    skip: int = 0, limit: int = 100,
    db: Session = Depends(get_db),
    current_user: Utilisateur = Depends(get_current_user)
):
    unites = db.query(Unite).offset(skip).limit(limit).all()
    return [
        {"id_unite": u.id_unite, "nom_unite": u.nom_unite,
         "id_poste": u.id_poste, "created_at": u.created_at}
        for u in unites
    ]

@router.get("/poste/{poste_id}")
def get_unites_by_poste(
    poste_id: int,
    db: Session = Depends(get_db),
    current_user: Utilisateur = Depends(get_current_user)
):
    unites = db.query(Unite).filter(Unite.id_poste == poste_id).all()
    return [{"id_unite": u.id_unite, "nom_unite": u.nom_unite} for u in unites]

@router.get("/{unite_id}")
def get_unite_by_id(
    unite_id: int,
    db: Session = Depends(get_db),
    current_user: Utilisateur = Depends(get_current_user)
):
    unite = db.query(Unite).filter(Unite.id_unite == unite_id).first()
    if not unite:
        raise HTTPException(status_code=404, detail="Unité non trouvée")
    return {"id_unite": unite.id_unite, "nom_unite": unite.nom_unite,
            "id_poste": unite.id_poste, "created_at": unite.created_at}

@router.post("/", status_code=status.HTTP_201_CREATED)
def create_unite(
    data: dict,
    db: Session = Depends(get_db),
    current_user: Utilisateur = Depends(get_current_user)
):
    # ✅ ADMIN et RECEVEUR peuvent créer une unité
    if current_user.role not in ["ADMIN", "RECEVEUR"]:
        raise HTTPException(status_code=403, detail="Droits insuffisants")

    poste = db.query(Poste).filter(Poste.id_poste == data.get("id_poste")).first()
    if not poste:
        raise HTTPException(status_code=404, detail="Poste non trouvé")

    unite = Unite(nom_unite=data.get("nom_unite"), id_poste=data.get("id_poste"))
    db.add(unite)
    db.commit()
    db.refresh(unite)
    return {"id_unite": unite.id_unite, "nom_unite": unite.nom_unite, "id_poste": unite.id_poste}

@router.put("/{unite_id}")
def update_unite(
    unite_id: int, data: dict,
    db: Session = Depends(get_db),
    current_user: Utilisateur = Depends(get_current_user)
):
    # ✅ ADMIN et RECEVEUR peuvent modifier
    if current_user.role not in ["ADMIN", "RECEVEUR"]:
        raise HTTPException(status_code=403, detail="Droits insuffisants")

    unite = db.query(Unite).filter(Unite.id_unite == unite_id).first()
    if not unite:
        raise HTTPException(status_code=404, detail="Unité non trouvée")

    if "nom_unite" in data:
        unite.nom_unite = data["nom_unite"]

    db.commit()
    db.refresh(unite)
    return {"id_unite": unite.id_unite, "nom_unite": unite.nom_unite, "id_poste": unite.id_poste}



@router.delete("/{unite_id}", status_code=200)
def delete_unite(
    unite_id: int,
    force: bool = False,
    db: Session = Depends(get_db),
    current_user: Utilisateur = Depends(get_current_user)
):
    from sqlalchemy import text
    from sqlalchemy.exc import IntegrityError

    unite = db.query(Unite).filter(Unite.id_unite == unite_id).first()
    if not unite:
        raise HTTPException(404, "Unité introuvable")

    if current_user.role != "ADMIN":
        raise HTTPException(403, "Seul un administrateur peut supprimer une unité")

    TABLES_LIEES = [
        "etats_encaissement",
        "etat_encaissement",   # ← ancienne table ajoutée aussi
        "suivis_unites",
    ]

    if not force:
        dependances = []
        for table in TABLES_LIEES:
            try:
                nb = db.execute(
                    text(f"SELECT COUNT(*) FROM {table} WHERE id_unite = :id"),
                    {"id": unite_id}
                ).scalar()
                if nb and nb > 0:
                    dependances.append(f"{table} ({nb} enregistrement(s))")
            except Exception:
                pass

        if dependances:
            raise HTTPException(
                status_code=409,
                detail={
                    "message": "Cette unité est encore référencée par :",
                    "dependances": dependances,
                    "conseil": "Relancez avec ?force=true pour tout supprimer."
                }
            )

    try:
        # ← Désactiver les FK SQLite le temps de la suppression
        db.execute(text("PRAGMA foreign_keys = OFF"))

        if force:
            db.execute(text("DELETE FROM etat_encaissement  WHERE id_unite = :id"), {"id": unite_id})
            db.execute(text("DELETE FROM etats_encaissement WHERE id_unite = :id"), {"id": unite_id})
            db.execute(text("DELETE FROM suivis_unites       WHERE id_unite = :id"), {"id": unite_id})

        # Suppression en SQL pur pour éviter tout blocage ORM
        db.execute(text("DELETE FROM unites WHERE id_unite = :id"), {"id": unite_id})
        db.commit()
        return {"message": "Unité supprimée avec succès"}

    except Exception as e:
        db.rollback()
        raise HTTPException(400, f"Suppression impossible : {str(e)}")

    finally:
        # ← Toujours réactiver les FK après
        db.execute(text("PRAGMA foreign_keys = ON"))
        db.commit()