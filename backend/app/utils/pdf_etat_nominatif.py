# backend/app/utils/pdf_etat_nominatif.py
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4, landscape
from reportlab.lib.units import cm
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
)
from io import BytesIO
from datetime import datetime

from app.utils.entete_nominatif import get_entete_flowables, _enregistrer_polices, _police
from app.models import Compte
from app.schemas.etat_nominatif import TypeEtat

def format_franc(montant):
    """Formate un montant en francs CFA"""
    if montant is None:
        return "0"
    return f"{int(montant):,}".replace(",", " ")


def format_date_fr(date_obj):
    """
    Formate une date avec le mois en toutes lettres majuscules.
    Ex: date(2026, 2, 28) → "28 FEVRIER 2026"
    """
    mois_fr = [
        'JANVIER', 'FEVRIER', 'MARS', 'AVRIL', 'MAI', 'JUIN',
        'JUILLET', 'AOUT', 'SEPTEMBRE', 'OCTOBRE', 'NOVEMBRE', 'DECEMBRE'
    ]
    return f"{date_obj.day} {mois_fr[date_obj.month - 1]} {date_obj.year}"


def _calculer_fusions_observations(observations: list) -> list:
    """
    Calcule les plages de fusion pour la colonne OBSERVATIONS.
    - Groupes consécutifs identiques (ou vides/RAS) → fusion
    Retourne une liste de (row_start, row_end) en indices tableau (header = row 0).
    """
    if not observations:
        return []
    obs_norm = [o.strip().upper() if o and o.strip() else "RAS" for o in observations]
    fusions = []
    i = 0
    while i < len(obs_norm):
        j = i
        while j < len(obs_norm) - 1 and obs_norm[j + 1] == obs_norm[j]:
            j += 1
        if j > i:
            fusions.append((i + 1, j + 1))   # +1 décalage header
        i = j + 1
    return fusions


def generate_etat_nominatif_pdf(etat, lignes_detail, utilisateur, poste,
                                 orientation="portrait", compte=None):
    """
    Génère le PDF de l'état nominatif.
    compte : objet Compte (optionnel, pour les AMENDES)
    """
    _enregistrer_polices()
    buffer = BytesIO()

    if orientation == "paysage":
        page_size = landscape(A4)
    else:
        page_size = A4

    doc = SimpleDocTemplate(
        buffer, pagesize=page_size,
        topMargin=1.5*cm, bottomMargin=1.5*cm,
        leftMargin=1.5*cm, rightMargin=1.5*cm,
    )

    FN = _police("normal")
    FB = _police("bold")
    FS = 9

    def st(bold=False, align=1, size=None):
        sz = size or FS
        return ParagraphStyle(
            f"EN_{bold}_{align}_{sz}",
            fontName=FB if bold else FN,
            fontSize=sz, leading=sz*1.35,
            alignment=align, spaceAfter=0, spaceBefore=0,
        )

    def p(texte, bold=False, align=1, size=None):
        return Paragraph(texte, st(bold, align, size))

    title_style  = st(bold=True,  align=1, size=11)
    normal_style = st(bold=False, align=0, size=FS)
    header_style = st(bold=True,  align=1, size=FS)
    cell_left    = st(bold=False, align=0, size=FS-1)
    cell_center  = st(bold=False, align=1, size=FS-1)
    cell_right   = st(bold=False, align=2, size=FS-1)
    cell_bold_c  = st(bold=True,  align=1, size=FS-1)
    cell_bold_r  = st(bold=True,  align=2, size=FS-1)

    HEADER_BG  = colors.HexColor("#C8C8C8")
    TOTAL_BG   = colors.HexColor("#E8E8E8")
    BORDER_CLR = colors.black
    GREY_GRID  = colors.grey

    total_physique = sum(item['ligne'].montant_rar_physique or 0 for item in lignes_detail)
    total_balance  = sum(item['ligne'].montant_rar_balance  or 0 for item in lignes_detail)
    total_ecart    = total_physique - total_balance

    if orientation == "paysage":
        col_widths = [3.5*cm, 2.5*cm, 3.5*cm, 3.0*cm, 3.0*cm, 2.2*cm, 3.0*cm]
    else:
        col_widths = [3.0*cm, 2.2*cm, 3.2*cm, 2.6*cm, 2.6*cm, 2.0*cm, 2.8*cm]

    nom_poste  = poste.nom_poste.upper()  if poste and poste.nom_poste  else "MAROUA"
    code_poste = poste.code_poste         if poste and poste.code_poste else "488"

    story = []

    # 1. EN-TÊTE
    story += get_entete_flowables(avec_trait=False)
    story.append(Spacer(1, 8))

    # 2. POSTE
    story.append(Paragraph(f'<u>Poste</u> : <b>{nom_poste}</b>', st(align=0)))
    story.append(Spacer(1, 4))
    story.append(Paragraph(f'<u>Code</u> : <b>{code_poste}</b>', st(align=0)))
    story.append(Spacer(1, 10))

    # 3. TITRE
    date_formattee = format_date_fr(etat.date_etat)
    type_str = etat.type if isinstance(etat.type, str) else etat.type.value

    if type_str == "AMENDE":
        titre = (f"ETAT NOMINATIF DES RESTES A RECOUVRER "
                 f"SUR RECETTES FISCALES AMENDES DOUANIERES AU {date_formattee}")
    else:
        titre = (f"ETAT NOMINATIF DES RESTES A RECOUVRER "
                 f"SUR RECETTES FISCALES DOUANES AU {date_formattee}")

    story.append(Paragraph(titre, title_style))
    story.append(Spacer(1, 15))

    # ─── plus d'affichage séparé du compte AMENDE ───

    # 4. TABLEAU
    headers = [
        Paragraph("USAGERS",                           header_style),
        Paragraph("COMPTES",                           header_style),
        Paragraph("LIBELLES",                          header_style),
        Paragraph("Montants RAR sur titres physiques", header_style),
        Paragraph("Montants RAR Sur Balance",          header_style),
        Paragraph("Ecart",                             header_style),
        Paragraph("Observation",                       header_style),
    ]
    table_data = [headers]
    observation_etat = (etat.observation or "RAS").strip()
    obs_list = []

    # Déterminer le numéro de compte à afficher dans la colonne "COMPTES"
    if type_str == "AMENDE" and compte:
        compte_a_afficher = compte.num_compte
    else:
        compte_a_afficher = None  # on utilisera le compte de chaque usager

    for item in lignes_detail:
        ligne  = item['ligne']
        usager = item['usager']
        compte_ligne = item['compte']

        physique = ligne.montant_rar_physique or 0
        balance  = ligne.montant_rar_balance  or 0
        ecart    = physique - balance

        nom_usager = ""
        if usager:
            nom_usager = usager.raison_sociale or usager.nom_usager or ""

        # Choix du numéro de compte pour cette ligne
        if compte_a_afficher is not None:
            num_compte = compte_a_afficher
        else:
            num_compte = compte_ligne.num_compte if compte_ligne else ""

        obs_list.append(observation_etat)
        table_data.append([
            Paragraph(str(nom_usager),              cell_left),
            Paragraph(str(num_compte),              cell_center),
            Paragraph(ligne.libelle or "",          cell_left),
            Paragraph(format_franc(physique),       cell_right),
            Paragraph(format_franc(balance),        cell_right),
            Paragraph(format_franc(ecart),          cell_right),
            Paragraph(observation_etat,             cell_center),
        ])

    # Ligne TOTAL
    table_data.append([
        Paragraph("<b>TOTAL</b>",                           cell_bold_c),
        Paragraph("",                                       cell_center),
        Paragraph("",                                       cell_center),
        Paragraph(f"<b>{format_franc(total_physique)}</b>", cell_bold_r),
        Paragraph(f"<b>{format_franc(total_balance)}</b>",  cell_bold_r),
        Paragraph(f"<b>{format_franc(total_ecart)}</b>",    cell_bold_r),
        Paragraph("",                                       cell_center),
    ])

    tableau_style = [
        ('GRID',          (0,0),  (-1,-2), 0.5, GREY_GRID),
        ('BOX',           (0,0),  (-1,-1), 0.8, BORDER_CLR),
        ('BACKGROUND',    (0,0),  (-1,0),  HEADER_BG),
        ('LINEBELOW',     (0,0),  (-1,0),  1,   BORDER_CLR),
        ('BACKGROUND',    (0,-1), (-1,-1), TOTAL_BG),
        ('LINEABOVE',     (0,-1), (-1,-1), 1,   BORDER_CLR),
        ('LINEAFTER',     (2,-1), (2,-1),  0.5, BORDER_CLR),
        ('LINEAFTER',     (3,-1), (3,-1),  0.5, BORDER_CLR),
        ('LINEAFTER',     (4,-1), (4,-1),  0.5, BORDER_CLR),
        ('LINEAFTER',     (5,-1), (5,-1),  0.5, BORDER_CLR),
        ('SPAN',          (0,-1), (2,-1)),
        ('VALIGN',        (0,0),  (-1,-1), 'MIDDLE'),
        ('TOPPADDING',    (0,0),  (-1,-1), 4),
        ('BOTTOMPADDING', (0,0),  (-1,-1), 4),
        ('LEFTPADDING',   (0,0),  (-1,-1), 4),
        ('RIGHTPADDING',  (0,0),  (-1,-1), 4),
    ]

    for (r_start, r_end) in _calculer_fusions_observations(obs_list):
        tableau_style.append(('SPAN',   (6,r_start), (6,r_end)))
        tableau_style.append(('VALIGN', (6,r_start), (6,r_end), 'MIDDLE'))
        tableau_style.append(('ALIGN',  (6,r_start), (6,r_end), 'CENTER'))

    tableau = Table(table_data, colWidths=col_widths, repeatRows=1)
    tableau.setStyle(TableStyle(tableau_style))
    story.append(tableau)
    story.append(Spacer(1, 40))

    # 5. SIGNATURE
    story.append(Paragraph("Le Chef de Poste", st(bold=False, align=2)))

    doc.build(story)
    buffer.seek(0)
    return buffer.getvalue()