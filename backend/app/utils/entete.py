# app/utils/entete.py
import os
import io
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.units import cm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import (
    HRFlowable, Image as RLImage, Paragraph, Spacer, Table, TableStyle,
)


# ============================================================
# CHARGEMENT DES POLICES .OTF VIA FONTTOOLS
# ============================================================

_polices_enregistrees = {}


def _charger_police_otf(nom_police: str, chemin: str) -> bool:
    """
    Charge un fichier .otf ou .ttf dans ReportLab via fonttools.
    Les fichiers .otf CFF sont convertis en mémoire automatiquement.

    Returns:
        bool: True si chargement réussi, False sinon.
    """
    try:
        from fonttools.ttLib import TTFont as FTFont
        ft_font = FTFont(chemin)
        buffer = io.BytesIO()
        ft_font.flavor = None   # retire l'enveloppe CFF/SFNT → TTF pur
        ft_font.save(buffer)
        buffer.seek(0)
        pdfmetrics.registerFont(TTFont(nom_police, buffer))
        print(f"Police '{nom_police}' chargée : {os.path.basename(chemin)}")
        return True
    except Exception as e:
        print(f"  Échec chargement '{nom_police}' ({os.path.basename(chemin)}) : {e}")
        return False


def _enregistrer_polices():
    """
    Enregistre les polices Latin Modern 12pt dans ReportLab.
    fonts/ est dans app/, un niveau au-dessus de utils/.
    Appelé une seule fois grâce au cache _polices_enregistrees.
    """
    fonts_dir = os.path.normpath(
        os.path.join(os.path.dirname(__file__), "..", "fonts")
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
        else:
            print(f" Police '{nom_police}' introuvable dans {fonts_dir} — fallback Helvetica.")


def _police(style: str = "normal") -> str:
    """
    Retourne le nom ReportLab de la police selon le style demandé.
    style: 'normal' | 'bold' | 'italic'
    """
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


# ============================================================
# UTILITAIRE
# ============================================================

def extraire_nom_poste_simple(nom_complet: str) -> str:
    """Extrait le nom de ville uniquement depuis le nom complet du poste."""
    nom_upper = nom_complet.upper()
    if "MAROUA" in nom_upper:
        return "MAROUA"
    elif "LIMANI" in nom_upper:
        return "LIMANI"
    return nom_complet.upper()


# ============================================================
# CONSTRUCTION DE L'EN-TÊTE COMME FLOWABLES REPORTLAB
# ============================================================

def get_entete_flowables(
    poste_nom: str,
    poste_code: str,
    base_url: str = ".",
    avec_trait: bool = True,
    page_size: tuple = None,
) -> list:
    """
    Retourne la liste de Flowables ReportLab constituant l'en-tête officielle.
    À insérer en début de story dans n'importe quel générateur PDF.

    Paramètres
    ----------
    poste_nom   : Nom du poste douanier (ex. "MAROUA").
    poste_code  : Code du poste (ex. "488").
    base_url    : Répertoire de base pour chercher le logo (défaut : ".").
    avec_trait  : Si True, ajoute un trait horizontal sous l'en-tête.
                  Défaut True — les appelants existants gardent leur comportement.
    page_size   : Tuple (largeur, hauteur) en points ReportLab.
                  Si None, utilise A4 portrait.  Passer landscape(A4) pour le
                  paysage ; l'en-tête occupera alors toute la largeur utile.
    """
    _enregistrer_polices()

    nom_poste_simple = extraire_nom_poste_simple(poste_nom)

    # ── Largeur utile selon le format transmis ───────────────────────────────
    # Les marges gauche + droite valent 3 cm (1,5 cm × 2) dans les deux formats.
    # On soustrait donc toujours 3 cm à la largeur de la page.
    if page_size is not None:
        page_width = page_size[0] - 3.0 * cm
    else:
        page_width = A4[0] - 3.0 * cm   # ≈ 17,7 cm pour A4 portrait

    # ── Styles ──────────────────────────────────────────────────────────────
    def st(style="normal", size=8):
        return ParagraphStyle(
            name=f"Entete_{style}_{size}",
            fontName=_police(style),
            fontSize=size,
            leading=size * 1.3,
            alignment=1,
            spaceAfter=0,
            spaceBefore=0,
        )

    def p(texte, style="normal", size=8):
        return Paragraph(texte, st(style, size))

    def sep():
        return Paragraph("* * * * * *", st("normal", 7))

    # ── Colonne GAUCHE — français ────────────────────────────────────────────
    col_fr = [
        p("REPUBLIQUE DU CAMEROUN", "bold", 8),
        p("Paix – Travail – Patrie", "normal", 8),
        sep(),
        p("MINISTERE DES FINANCES", "bold", 8),
        sep(),
        p("DIRECTION GENERALE DES DOUANES", "bold", 8),
        sep(),
        p("SECTEUR DE L'EXTREME-NORD", "normal", 8),
        sep(),
        p(f"RECETTE PRINCIPALE DES DOUANES DE {nom_poste_simple}", "bold", 8),
        p(poste_code, "normal", 8),
    ]

    # ── Logo ────────────────────────────────────────────────────────────────
    logo_candidats = [
        os.path.join(base_url, "img", "tresor.png"),
        os.path.join(os.path.dirname(__file__), "..", "img", "tresor.png"),
        os.path.join(os.path.dirname(__file__), "img", "tresor.png"),
    ]
    logo_path = next((lp for lp in logo_candidats if os.path.exists(lp)), None)
    logo_element = (
        RLImage(logo_path, width=2.5 * cm, height=2.5 * cm)
        if logo_path else p("[LOGO]")
    )

    # ── Colonne DROITE — anglais ─────────────────────────────────────────────
    col_en = [
        p("REPUBLIC OF CAMEROON", "bold", 8),
        p("Peace – Work – Fatherland", "normal", 8),
        sep(),
        p("MINISTRY OF FINANCE", "bold", 8),
        sep(),
        p("DIRECTORATE GENERAL OF CUSTOMS", "bold", 8),
        sep(),
        p("FAR NORTH SECTOR", "normal", 8),
        sep(),
        p(f"CUSTOMS REVENUE COLLECTION OFFICE OF {nom_poste_simple}", "bold", 8),
        p(poste_code, "normal", 8),
    ]

    # ── Tableau 3 colonnes (40% | 20% | 40%) ────────────────────────────────
    # Les proportions sont appliquées sur page_width, qui varie selon le format.
    # En paysage, le tableau s'étend donc sur toute la largeur utile (~25,3 cm).
    col_widths = [
        page_width * 0.40,
        page_width * 0.20,
        page_width * 0.40,
    ]

    header_table = Table(
        [[col_fr, [logo_element], col_en]],
        colWidths=col_widths,
    )
    header_table.setStyle(TableStyle([
        ("ALIGN",         (0, 0), (-1, -1), "CENTER"),
        ("VALIGN",        (0, 0), (-1, -1), "TOP"),
        ("TOPPADDING",    (0, 0), (-1, -1), 2),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 2),
        ("LEFTPADDING",   (0, 0), (-1, -1), 4),
        ("RIGHTPADDING",  (0, 0), (-1, -1), 4),
    ]))

    # ── Assemblage final ─────────────────────────────────────────────────────
    flowables = [header_table, Spacer(1, 6)]

    if avec_trait:
        flowables.append(
            HRFlowable(width="100%", thickness=1, color=colors.black, spaceAfter=0)
        )

    return flowables


# ── Aliases (compatibilité ascendante) ───────────────────────────────────────
def generer_entete_pdf(poste_nom: str, poste_code: str, base_url: str = ".") -> list:
    return get_entete_flowables(poste_nom, poste_code, base_url)

def get_entete_pdf_bytes(poste_nom: str, poste_code: str, base_url: str = ".") -> list:
    return get_entete_flowables(poste_nom, poste_code, base_url)