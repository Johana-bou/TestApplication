# app/routers/rapport_router.py
from fastapi import APIRouter, Depends, HTTPException, Query, Response
from sqlalchemy.orm import Session
from sqlalchemy import func, extract
from datetime import date, timedelta
from collections import defaultdict
from typing import List
from app.database import get_db
from app.models import Unite, EtatEncaissement, LigneBudgetaire, Utilisateur
from app.security.auth import get_current_user

router = APIRouter(prefix="/rapports", tags=["Rapports"])

@router.get("/tableau")
def get_tableau_rapport(
    type_rapport: str = Query(..., regex="^(PROTOCOLE|CAC)$"),
    date_debut: date = Query(...),
    date_fin: date = Query(...),
    db: Session = Depends(get_db),
    current_user: Utilisateur = Depends(get_current_user)
):
    # Récupérer toutes les unités (tous postes)
    unites = db.query(Unite).order_by(Unite.nom_unite).all()
    if not unites:
        return []

    # Agrégation : pour chaque unité et mois, somme des montants
    # des encaissements dont la ligne a code_taxe == type_rapport
    subq = db.query(
        EtatEncaissement.id_unite,
        extract('year', EtatEncaissement.date_encaissement).label('annee'),
        extract('month', EtatEncaissement.date_encaissement).label('mois'),
        func.sum(EtatEncaissement.montant).label('total')
    ).join(
        LigneBudgetaire, EtatEncaissement.id_ligne == LigneBudgetaire.id   # ← Correction ici
    ).filter(
        EtatEncaissement.date_encaissement.between(date_debut, date_fin),
        LigneBudgetaire.code_taxe == type_rapport
    ).group_by(
        EtatEncaissement.id_unite, 'annee', 'mois'
    ).subquery()

    rows = db.query(subq).all()
    unite_montants = defaultdict(lambda: defaultdict(float))
    for row in rows:
        unite_montants[row.id_unite][int(row.mois)] = float(row.total)

    # Déterminer la liste des mois dans la période (pour l'ordre d'affichage)
    mois_dans_periode = []
    d = date_debut
    while d <= date_fin:
        mois = d.month
        if mois not in mois_dans_periode:
            mois_dans_periode.append(mois)
        if d.month == 12:
            d = d.replace(year=d.year+1, month=1)
        else:
            d = d.replace(month=d.month+1)
    mois_dans_periode.sort()

    result = []
    for unite in unites:
        montants = unite_montants.get(unite.id_unite, {})
        ligne_mois = {m: montants.get(m, 0.0) for m in mois_dans_periode}
        total = sum(ligne_mois.values())
        result.append({
            "id_unite": unite.id_unite,
            "nom_unite": unite.nom_unite,
            "montants_par_mois": ligne_mois,
            "total": total
        })
    return result


@router.get("/pdf")
def export_rapport_pdf(
    type_rapport: str = Query(..., regex="^(PROTOCOLE|CAC)$"),
    date_debut: date = Query(...),
    date_fin: date = Query(...),
    db: Session = Depends(get_db),
    current_user: Utilisateur = Depends(get_current_user)
):
    from app.utils.pdf_rapport import generate_rapport_pdf
    tableau_data = get_tableau_rapport(type_rapport, date_debut, date_fin, db, current_user)
    pdf_bytes = generate_rapport_pdf(type_rapport, date_debut, date_fin, tableau_data, current_user)
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{type_rapport}_{date_debut}_{date_fin}.pdf"'}
    )