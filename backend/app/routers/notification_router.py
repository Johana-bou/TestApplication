# app/routers/notification_router.py
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Notification, Utilisateur
from app.security.auth import get_current_user

router = APIRouter(tags=["Notifications"])

@router.get("/")
def get_my_notifications(
    skip: int = 0,
    limit: int = 50,
    only_non_lues: bool = False,
    db: Session = Depends(get_db),
    current_user: Utilisateur = Depends(get_current_user)
):
    query = db.query(Notification).filter(Notification.id_user == current_user.id_user)
    
    if only_non_lues:
        query = query.filter(Notification.lu == False)
    
    notifications = query.order_by(Notification.date_notif.desc()).offset(skip).limit(limit).all()
    
    return [
        {
            "id_notif": n.id_notif,
            "type": n.type,
            "message": n.message,
            "lu": n.lu,
            "date_notif": n.date_notif
        }
        for n in notifications
    ]

@router.get("/non-lues/count")
def get_non_lues_count(
    db: Session = Depends(get_db),
    current_user: Utilisateur = Depends(get_current_user)
):
    count = db.query(Notification).filter(
        Notification.id_user == current_user.id_user,
        Notification.lu == False
    ).count()
    
    return {"non_lues_count": count}

@router.put("/{notif_id}/read")
def mark_as_read(
    notif_id: int,
    db: Session = Depends(get_db),
    current_user: Utilisateur = Depends(get_current_user)
):
    notification = db.query(Notification).filter(
        Notification.id_notif == notif_id,
        Notification.id_user == current_user.id_user
    ).first()
    
    if not notification:
        raise HTTPException(status_code=404, detail="Notification non trouvée")
    
    notification.lu = True
    db.commit()
    
    return {"message": "Notification marquée comme lue"}

@router.put("/read-all")
def mark_all_as_read(
    db: Session = Depends(get_db),
    current_user: Utilisateur = Depends(get_current_user)
):
    db.query(Notification).filter(
        Notification.id_user == current_user.id_user,
        Notification.lu == False
    ).update({"lu": True})
    
    db.commit()
    
    return {"message": "Toutes les notifications ont été marquées comme lues"}

@router.post("/", status_code=status.HTTP_201_CREATED)
def create_notification(
    data: dict,
    db: Session = Depends(get_db),
    current_user: Utilisateur = Depends(get_current_user)
):
    """Créer une notification (admin seulement)"""
    if current_user.role not in ["ADMIN"]:
        raise HTTPException(status_code=403, detail="Droits insuffisants")
    
    notification = Notification(
        id_user=data.get("id_user"),
        type=data.get("type", "INFO"),
        message=data.get("message"),
        lu=False
    )
    db.add(notification)
    db.commit()
    db.refresh(notification)
    
    return {
        "id_notif": notification.id_notif,
        "message": "Notification créée"
    }

@router.delete("/{notif_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_notification(
    notif_id: int,
    db: Session = Depends(get_db),
    current_user: Utilisateur = Depends(get_current_user)
):
    notification = db.query(Notification).filter(
        Notification.id_notif == notif_id,
        Notification.id_user == current_user.id_user
    ).first()
    
    if not notification:
        raise HTTPException(status_code=404, detail="Notification non trouvée")
    
    db.delete(notification)
    db.commit()