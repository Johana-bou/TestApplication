# app/routers/audit_log_router.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import AuditLog, Utilisateur
from app.security.auth import get_current_user

router = APIRouter(tags=["Audit Logs"])

@router.get("/")
def get_audit_logs(
    skip: int = 0,
    limit: int = 100,
    table: str = None,
    db: Session = Depends(get_db),
    current_user: Utilisateur = Depends(get_current_user)
):
    if current_user.role not in ["ADMIN"]:
        raise HTTPException(status_code=403, detail="Droits insuffisants")
    
    query = db.query(AuditLog)
    
    if table:
        query = query.filter(AuditLog.table_concernee == table)
    
    logs = query.order_by(AuditLog.date_action.desc()).offset(skip).limit(limit).all()
    
    return [
        {
            "id_log": l.id_log,
            "id_user": l.id_user,
            "action": l.action,
            "table_concernee": l.table_concernee,
            "ip_address": l.ip_address,
            "date_action": l.date_action
        }
        for l in logs
    ]

@router.get("/utilisateur/{user_id}")
def get_logs_by_user(
    user_id: int,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: Utilisateur = Depends(get_current_user)
):
    if current_user.role not in ["ADMIN"] and current_user.id_user != user_id:
        raise HTTPException(status_code=403, detail="Droits insuffisants")
    
    logs = db.query(AuditLog).filter(AuditLog.id_user == user_id).order_by(
        AuditLog.date_action.desc()
    ).offset(skip).limit(limit).all()
    
    return [
        {
            "id_log": l.id_log,
            "action": l.action,
            "table_concernee": l.table_concernee,
            "date_action": l.date_action
        }
        for l in logs
    ]