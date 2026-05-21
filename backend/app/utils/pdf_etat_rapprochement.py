# backend/app/utils/pdf_etat_rapprochement.py
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4, landscape
from reportlab.lib.units import cm
from reportlab.lib.styles import ParagraphStyle
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
)
from io import BytesIO

from app.utils.entete import get_entete_flowables, _enregistrer_polices, _police


def format_franc(montant):
    """Formate un montant en francs CFA. Retourne '//' si zéro."""
    if montant is None or montant == 0:
        return "//"
    return f"{int(montant):,}".replace(",", " ")


def generate_etat_rapprochement_pdf(rapprochement, compte, utilisateur, poste, orientation="paysage"):
    """
    Génère le PDF de l'état de rapprochement des comptes (SYSTAC/SYGMA).
    Toujours en paysage. L'en-tête est calculée sur la largeur paysage.
    """
    _enregistrer_polices()

    # ── Format de page : toujours paysage ────────────────────────────────────
    PAGE = landscape(A4)   # (841.89 x 595.28 pts)

    buffer = BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=PAGE,
        topMargin=1.5 * cm,
        bottomMargin=1.5 * cm,
        leftMargin=1.5 * cm,
        rightMargin=1.5 * cm,
    )

    # ── Polices Latin Modern ──────────────────────────────────────────────────
    FN = _police("normal")
    FB = _police("bold")
    FS = 9

    def st(bold=False, align=1, size=None):
        sz = size or FS
        return ParagraphStyle(
            f"ER_{bold}_{align}_{sz}",
            fontName=FB if bold else FN,
            fontSize=sz,
            leading=sz * 1.35,
            alignment=align,
            spaceAfter=0,
            spaceBefore=0,
        )

    def p(texte, bold=False, align=1, size=None):
        return Paragraph(texte, st(bold, align, size))

    # Styles nommés
    title_style   = st(bold=True,  align=1, size=11)
    periode_style = st(bold=True,  align=1, size=10)
    normal_style  = st(bold=False, align=0, size=FS)
    header_style  = st(bold=True,  align=1, size=8)
    cell_left     = st(bold=False, align=0, size=8)
    cell_center   = st(bold=False, align=1, size=8)
    cell_right    = st(bold=False, align=2, size=8)
    cell_bold_r   = st(bold=True,  align=2, size=8)

    # ── Couleurs ──────────────────────────────────────────────────────────────
    HEADER_BG  = colors.HexColor("#C8C8C8")
    BORDER_CLR = colors.black
    GREY_GRID  = colors.grey

    # ── Calculs ───────────────────────────────────────────────────────────────
    solde_theorique = (
        rapprochement.solde_balance
        + rapprochement.operation_acct_non_constate
        - rapprochement.operation_poste_non_constate
    )

    # ── Largeur utile paysage ─────────────────────────────────────────────────
    page_w = PAGE[0] - 3.0 * cm   # ~25.3 cm

    # ── Colonnes du tableau ───────────────────────────────────────────────────
    col_widths = [
        page_w * 0.10,   # COMPTES
        page_w * 0.18,   # INTITULE
        page_w * 0.13,   # A - Solde balance
        page_w * 0.15,   # (+) B - ACCT non constatées
        page_w * 0.15,   # (-) C - Poste non constatées
        page_w * 0.13,   # D - Solde théorique
        page_w * 0.08,   # E - Ecart
        page_w * 0.08,   # OBSERVATION
    ]

    # ============================================================
    # STORY
    # ============================================================
    story = []

    # ── 1. EN-TÊTE ────────────────────────────────────────────────────────────
    story += get_entete_flowables(
        poste.nom_poste  if poste else "MAROUA",
        poste.code_poste if poste else "488",
        avec_trait=False,
        page_size=PAGE,
    )
    story.append(Spacer(1, 10))

    # ── 2. TITRE ─────────────────────────────────────────────────────────────
    mois_fr = [
        'JANVIER', 'FEVRIER', 'MARS', 'AVRIL', 'MAI', 'JUIN',
        'JUILLET', 'AOUT', 'SEPTEMBRE', 'OCTOBRE', 'NOVEMBRE', 'DECEMBRE'
    ]
    date_ref = rapprochement.date_rapprochement
    periode  = f"JANVIER A {mois_fr[date_ref.month - 1]} {date_ref.year}"

    story.append(p(
        f"ETAT ANNUEL DE RAPPROCHEMENT DES COMPTES - "
        f"TRANSFERT FICHIER SYSTAC/SYGMA",
        bold=True, align=1, size=11
    ))
    story.append(Spacer(1, 4))
    story.append(p(f"Période : {periode}", bold=True, align=1, size=10))
    story.append(Spacer(1, 15))

    # ── 3. TABLEAU ───────────────────────────────────────────────────────────
    headers1 = [
        Paragraph("COMPTES",     header_style),
        Paragraph("INTITULE",    header_style),
        Paragraph("A",           header_style),
        Paragraph("(+) B (*)",   header_style),
        Paragraph("(-) C (*)",   header_style),
        Paragraph("D",           header_style),
        Paragraph("E",           header_style),
        Paragraph("OBSERVATION", header_style),
    ]

    headers2 = [
        Paragraph("", header_style),
        Paragraph("", header_style),
        Paragraph("SOLDE DANS LA BALANCE DU POSTE",               header_style),
        Paragraph("OPÉRATIONS DE L'ACCT NON CONSTATÉES AU POSTE", header_style),
        Paragraph("OPÉRATIONS DU POSTE NON CONSTATÉES À L'ACCT",  header_style),
        Paragraph("SOLDE THÉORIQUE HISTORIQUE ACCT",              header_style),
        Paragraph("ÉCART",                                         header_style),
        Paragraph("", header_style),
    ]

    row_data = [
        Paragraph(compte.num_compte if compte else "",                       cell_center),
        Paragraph("Transferts Fichiers Virement",                            cell_left),
        Paragraph(format_franc(rapprochement.solde_balance),                 cell_right),
        Paragraph(format_franc(rapprochement.operation_acct_non_constate),   cell_right),
        Paragraph(format_franc(rapprochement.operation_poste_non_constate),  cell_right),
        Paragraph(format_franc(solde_theorique),                             cell_right),
        Paragraph(format_franc(rapprochement.ecart),                         cell_right),
        Paragraph(rapprochement.observation or "Pas d'historique ACCT",      cell_left),
    ]

    table_data = [headers1, headers2, row_data]

    tableau = Table(table_data, colWidths=col_widths, repeatRows=2)
    tableau.setStyle(TableStyle([
        ('GRID',          (0, 0), (-1, -1), 0.5, GREY_GRID),
        ('BOX',           (0, 0), (-1, -1), 0.8, BORDER_CLR),
        ('BACKGROUND',    (0, 0), (-1, 1),  HEADER_BG),
        ('LINEBELOW',     (0, 0), (-1, 0),  0.8, BORDER_CLR),
        ('LINEBELOW',     (0, 1), (-1, 1),  0.8, BORDER_CLR),
        ('VALIGN',        (0, 0), (-1, -1), 'MIDDLE'),
        ('TOPPADDING',    (0, 0), (-1, -1), 5),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
        ('LEFTPADDING',   (0, 0), (-1, -1), 4),
        ('RIGHTPADDING',  (0, 0), (-1, -1), 4),
    ]))

    story.append(tableau)
    story.append(Spacer(1, 40))

    # ── 4. SIGNATURE à droite ────────────────────────────────────────────────
    story.append(p("LE RECEVEUR DES DOUANES", bold=False, align=2, size=FS))

    doc.build(story)
    buffer.seek(0)
    return buffer.getvalue()