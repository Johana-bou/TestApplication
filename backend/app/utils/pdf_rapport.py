# app/utils/pdf_rapport.py
from reportlab.lib import colors
from reportlab.lib.pagesizes import landscape, A4
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, HRFlowable
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import cm
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT
from reportlab.platypus import Image as RLImage
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from io import BytesIO
from datetime import date
import os
import io
import re


MOIS_NOMS = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
             'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre']


# ── Extraction nom simple du poste ─────────────────────────────────────────
def extraire_nom_poste_simple(nom_complet: str) -> str:
    nom_upper = nom_complet.strip().upper()

    mots_a_ignorer = {
        "RECETTE", "PRINCIPALE", "BUREAU", "DES", "DE", "DU", "LA", "LE", "LES",
        "DOUANES", "POSTE", "BPHC", "BS", "BPH", "SECTEUR", "UNITE", "SOUS",
        "PRINCIPAL", "ANNEXE", "FRONTIERE", "FRONTIERES", "CONTROLE",
    }

    tokens = re.split(r"[\s\-/]+", nom_upper)
    tokens_filtres = [t for t in tokens if t and t not in mots_a_ignorer and not t.isdigit()]

    if tokens_filtres:
        return tokens_filtres[-1]

    return nom_upper


# ── Chargement polices Latin Modern (LaTeX) ────────────────────────────────
_polices_enregistrees = {}

def _charger_police_otf(nom_police: str, chemin: str) -> bool:
    try:
        from fonttools.ttLib import TTFont as FTFont
        ft_font = FTFont(chemin)
        buf = io.BytesIO()
        ft_font.flavor = None
        ft_font.save(buf)
        buf.seek(0)
        pdfmetrics.registerFont(TTFont(nom_police, buf))
        return True
    except Exception as e:
        print(f"⚠️  Échec police '{nom_police}': {e}")
        return False

def _enregistrer_polices():
    import sys as _sys
    fonts_dir = os.path.join(
        getattr(_sys, "_MEIPASS", os.path.dirname(os.path.dirname(os.path.abspath(__file__)))),
        "app", "fonts"
    )
    polices = {
        "LMRoman":     ["lmroman12-regular.otf", "lmroman10-regular.otf"],
        "LMRomanBold": ["lmroman12-bold.otf",    "lmroman10-bold.otf"],
        "LMRomanItal": ["lmroman12-italic.otf",  "lmroman10-italic.otf"],
    }
    for nom_police, fichiers in polices.items():
        if nom_police in _polices_enregistrees:
            continue
        for fichier in fichiers:
            chemin = os.path.join(fonts_dir, fichier)
            if os.path.exists(chemin):
                if _charger_police_otf(nom_police, chemin):
                    _polices_enregistrees[nom_police] = True
                    break

def _police(style: str = "normal") -> str:
    mapping = {
        "normal": ("LMRoman",     "Helvetica"),
        "bold":   ("LMRomanBold", "Helvetica-Bold"),
        "italic": ("LMRomanItal", "Helvetica-Oblique"),
    }
    nom, fallback = mapping.get(style, ("LMRoman", "Helvetica"))
    try:
        pdfmetrics.getFont(nom)
        return nom
    except KeyError:
        return fallback


# ── Générateur principal ───────────────────────────────────────────────────
def generate_rapport_pdf(type_rapport, date_debut, date_fin, tableau_data, utilisateur):
    _enregistrer_polices()

    buffer   = BytesIO()
    pagesize = landscape(A4)
    page_w, page_h = pagesize
    margin   = 1.2 * cm
    usable_w = page_w - 2 * margin

    doc = SimpleDocTemplate(
        buffer,
        pagesize=pagesize,
        topMargin=1.0 * cm,
        bottomMargin=1.2 * cm,
        leftMargin=margin,
        rightMargin=margin,
    )

    # ── Styles ─────────────────────────────────────────────────────────
    def st(style="normal", size=9, align=TA_CENTER):
        return ParagraphStyle(
            name=f"rp_{style}_{size}_{align}",
            fontName=_police(style),
            fontSize=size,
            leading=size * 1.25,
            alignment=align,
            spaceAfter=0,
            spaceBefore=0,
        )

    def p(texte, style="normal", size=9, align=TA_CENTER):
        return Paragraph(texte, st(style, size, align))

    story = []

    # ── Nom du poste — simple et complet ───────────────────────────────
    nom_poste_brut = (utilisateur.poste.nom_poste
                      if hasattr(utilisateur, 'poste') and utilisateur.poste
                      else 'MAROUA')
    nom_poste_simple = extraire_nom_poste_simple(nom_poste_brut)

    # ── Logo ───────────────────────────────────────────────────────────
    logo_path = os.path.normpath(
        os.path.join(os.path.dirname(__file__), "..", "img", "tresor.png")
    )
    logo_element = (
        RLImage(logo_path, width=2.5 * cm, height=2.5 * cm)
        if os.path.exists(logo_path)
        else p("[LOGO]", size=8)
    )

    # ── Colonnes en-tête français / logo / anglais ─────────────────────
    col_fr = [
        p("REPUBLIQUE DU CAMEROUN",                                          "bold",   10),
        p("Paix – Travail – Patrie",                                         "normal",  9),
        p("* * *",                                                           "normal",  7),
        p("DIRECTION GENERALE DES DOUANES",                                  "bold",    9),
        p("* * *",                                                           "normal",  7),
        p("SECTEUR DE L'EXTREME-NORD",                                       "bold",    9),
        p("* * *",                                                           "normal",  7),
        p(f"RECETTE PRINCIPALE DES DOUANES DE {nom_poste_simple}",           "bold",    9),
    ]

    col_en = [
        p("REPUBLIC OF CAMEROON",                                            "bold",   10),
        p("Peace – Work – Fatherland",                                       "normal",  9),
        p("* * *",                                                           "normal",  7),
        p("DIRECTORATE GENERAL OF CUSTOMS",                                  "bold",    9),
        p("* * *",                                                           "normal",  7),
        p("FAR NORTH SECTOR",                                                "bold",    9),
        p("* * *",                                                           "normal",  7),
        p(f"CUSTOMS REVENUE COLLECTION OFFICE OF {nom_poste_simple}",        "bold",    9),
    ]

    # 44% | 12% | 44% = 100% de usable_w
    col_w = [usable_w * 0.44, usable_w * 0.12, usable_w * 0.44]

    entete_table = Table(
        [[col_fr, [logo_element], col_en]],
        colWidths=col_w,
        hAlign='LEFT',
    )
    entete_table.setStyle(TableStyle([
        ('ALIGN',         (0, 0), (-1, -1), 'CENTER'),
        ('VALIGN',        (0, 0), (-1, -1), 'TOP'),
        ('TOPPADDING',    (0, 0), (-1, -1), 1),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 1),
        ('LEFTPADDING',   (0, 0), (-1, -1), 0),
        ('RIGHTPADDING',  (0, 0), (-1, -1), 0),
    ]))

    story.append(entete_table)
    story.append(Spacer(1, 4))
    story.append(HRFlowable(width="100%", thickness=0.8, color=colors.black, spaceAfter=6))

    # ── Titre ──────────────────────────────────────────────────────────
    mois_debut_nom = MOIS_NOMS[date_debut.month - 1].upper()
    mois_fin_nom   = MOIS_NOMS[date_fin.month - 1].upper()
    annee          = date_debut.year
    titre = f"TABLEAU RECAPITULATIF {type_rapport} DE {mois_debut_nom} À {mois_fin_nom} {annee}"
    story.append(Paragraph(titre, st("bold", 11, TA_CENTER)))
    story.append(Spacer(1, 8))

    # ── Tableau de données ─────────────────────────────────────────────
    if not tableau_data:
        story.append(Paragraph("Aucune donnée pour la période.", st("normal", 9, TA_LEFT)))
        doc.build(story)
        buffer.seek(0)
        return buffer.getvalue()

    mois_cles = sorted(tableau_data[0]['montants_par_mois'].keys())
    nb_mois   = len(mois_cles)

    # Largeurs colonnes adaptatives
    unite_w = 3.2 * cm
    total_w = 2.8 * cm
    mois_w  = (usable_w - unite_w - total_w) / max(nb_mois, 1)
    if mois_w < 1.8 * cm:
        unite_w = 2.6 * cm
        total_w = 2.4 * cm
        mois_w  = (usable_w - unite_w - total_w) / max(nb_mois, 1)

    col_widths = [unite_w] + [mois_w] * nb_mois + [total_w]

    # Police adaptative
    fs  = 8 if nb_mois <= 6 else (7 if nb_mois <= 9 else 6)
    pad = 3 if nb_mois <= 9 else 2

    # Construction des données
    header_row = ['Unités'] + [MOIS_NOMS[m - 1] for m in mois_cles] + ['Total']
    data       = [header_row]

    grand_total_mois = {m: 0.0 for m in mois_cles}
    grand_total      = 0.0

    for row in tableau_data:
        ligne = [row['nom_unite']]
        for m in mois_cles:
            montant = row['montants_par_mois'].get(m, 0.0)
            grand_total_mois[m] += montant
            ligne.append(f"{int(montant):,}".replace(',', ' ') if montant else "0")
        total = row['total']
        grand_total += total
        ligne.append(f"{int(total):,}".replace(',', ' '))
        data.append(ligne)

    # Ligne Total général
    total_row = ['Total']
    for m in mois_cles:
        total_row.append(f"{int(grand_total_mois[m]):,}".replace(',', ' '))
    total_row.append(f"{int(grand_total):,}".replace(',', ' '))
    data.append(total_row)

    nb_lignes = len(data)

    table = Table(data, colWidths=col_widths, repeatRows=1)
    table.setStyle(TableStyle([
        ('GRID',          (0, 0),  (-1, -1),  0.4, colors.black),

        # En-tête tableau
        ('BACKGROUND',    (0, 0),  (-1, 0),   colors.HexColor("#C0C0C0")),
        ('FONTNAME',      (0, 0),  (-1, 0),   _police("bold")),
        ('FONTSIZE',      (0, 0),  (-1, 0),   fs),
        ('ALIGN',         (0, 0),  (-1, 0),   'CENTER'),

        # Corps
        ('FONTNAME',      (0, 1),  (-1, -1),  _police("normal")),
        ('FONTSIZE',      (0, 1),  (-1, -1),  fs),
        ('ALIGN',         (0, 1),  (0,  -1),  'LEFT'),
        ('ALIGN',         (1, 1),  (-1, -1),  'RIGHT'),

        # Ligne Total
        ('BACKGROUND',    (0, -1), (-1, -1),  colors.HexColor("#D8D8D8")),
        ('FONTNAME',      (0, -1), (-1, -1),  _police("bold")),

        # Alternance lignes
        *[('BACKGROUND',  (0, i),  (-1, i),   colors.HexColor("#F5F5F5"))
          for i in range(2, nb_lignes - 1, 2)],

        ('TOPPADDING',    (0, 0),  (-1, -1),  pad),
        ('BOTTOMPADDING', (0, 0),  (-1, -1),  pad),
        ('LEFTPADDING',   (0, 0),  (-1, -1),  3),
        ('RIGHTPADDING',  (0, 0),  (-1, -1),  3),
        ('VALIGN',        (0, 0),  (-1, -1),  'MIDDLE'),
    ]))

    story.append(table)
    story.append(Spacer(1, 16))

    # ── Signature alignée à droite avec décalage ───────────────────────
    today_str = date.today().strftime('%d/%m/%Y')

    sig = Table(
        [
            [Paragraph("", st()),
             Paragraph(f"{nom_poste_simple}, le {today_str}", st("normal", 9, TA_RIGHT))],
            [Paragraph("", st()),
             Paragraph("Le Receveur",                         st("bold",   9, TA_RIGHT))],
        ],
        colWidths=[usable_w * 0.58, usable_w * 0.42],
    )
    sig.setStyle(TableStyle([
        ('ALIGN',         (0, 0), (-1, -1), 'RIGHT'),
        ('VALIGN',        (0, 0), (-1, -1), 'TOP'),
        ('TOPPADDING',    (0, 0), (-1, -1), 2),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 2),
    ]))
    story.append(sig)

    doc.build(story)
    buffer.seek(0)
    return buffer.getvalue()