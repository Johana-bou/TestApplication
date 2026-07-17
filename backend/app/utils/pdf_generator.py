# backend/app/utils/pdf_generator.py
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import cm
from reportlab.lib.styles import ParagraphStyle
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak
)
import calendar
from io import BytesIO
from PyPDF2 import PdfReader, PdfWriter
from reportlab.pdfbase.pdfmetrics import stringWidth
from app.utils.entete import get_entete_flowables, _police, _enregistrer_polices


# ============================================================
# FONCTIONS UTILITAIRES
# ============================================================

def format_franc(montant):
    if montant is None:
        return "0"
    return f"{int(montant):,}".replace(",", " ")

def nombre_en_lettres(n):
    nombres = {
        1:"un",2:"deux",3:"trois",4:"quatre",5:"cinq",6:"six",7:"sept",
        8:"huit",9:"neuf",10:"dix",11:"onze",12:"douze",13:"treize",
        14:"quatorze",15:"quinze",16:"seize",17:"dix-sept",18:"dix-huit",
        19:"dix-neuf",20:"vingt",21:"vingt-et-un",22:"vingt-deux",
        23:"vingt-trois",24:"vingt-quatre",25:"vingt-cinq",26:"vingt-six",
        27:"vingt-sept",28:"vingt-huit",29:"vingt-neuf",30:"trente",31:"trente-et-un"
    }
    return nombres.get(n, str(n))

def annee_en_lettres(annee):
    milliers  = annee // 1000
    centaines = (annee % 1000) // 100
    dizaines  = (annee % 100) // 10
    unites    = annee % 10
    resultat  = "Deux Mille" if milliers == 2 else ""

    if centaines > 0:
        cl = ["","Cent","Deux Cents","Trois Cents","Quatre Cents",
              "Cinq Cents","Six Cents","Sept Cents","Huit Cents","Neuf Cents"]
        resultat += f" {'Cent' if centaines==1 else cl[centaines]}"

    dl = ["","Dix","Vingt","Trente","Quarante","Cinquante",
          "Soixante","Soixante-dix","Quatre-vingts","Quatre-vingt-dix"]

    if dizaines == 2 and unites == 0: resultat += " Vingt"
    elif dizaines == 2: resultat += f" Vingt-{nombre_en_lettres(unites)}"
    elif dizaines == 3 and unites == 0: resultat += " Trente"
    elif dizaines == 3: resultat += f" Trente-{nombre_en_lettres(unites)}"
    elif dizaines == 4 and unites == 0: resultat += " Quarante"
    elif dizaines == 4: resultat += f" Quarante-{nombre_en_lettres(unites)}"
    elif dizaines == 5 and unites == 0: resultat += " Cinquante"
    elif dizaines == 5: resultat += f" Cinquante-{nombre_en_lettres(unites)}"
    else:
        if dizaines > 0: resultat += f" {dl[dizaines]}"
        if unites > 0 and dizaines != 1:
            if dizaines in (7, 9): resultat += f"-{nombre_en_lettres(unites+10)}"
            else: resultat += f"-{nombre_en_lettres(unites)}"
    return resultat.strip()

def date_chiffres_lettres(jour, mois, annee):
    mois_fr = ['Janvier','Février','Mars','Avril','Mai','Juin',
               'Juillet','Août','Septembre','Octobre','Novembre','Décembre']
    return f"{jour} {mois_fr[mois-1]} {annee}"

def date_complete_lettres(jour, mois, annee):
    jours = ["","premier","deux","trois","quatre","cinq","six","sept","huit","neuf","dix",
             "onze","douze","treize","quatorze","quinze","seize","dix-sept","dix-huit","dix-neuf",
             "vingt","vingt-et-un","vingt-deux","vingt-trois","vingt-quatre","vingt-cinq","vingt-six",
             "vingt-sept","vingt-huit","vingt-neuf","trente","trente-et-un"]
    mois_fr = ['Janvier','Février','Mars','Avril','Mai','Juin',
               'Juillet','Août','Septembre','Octobre','Novembre','Décembre']
    jour_lettre = "Premier" if jour == 1 else jours[jour].capitalize()
    return jour_lettre, mois_fr[mois-1].upper(), annee_en_lettres(annee)

def get_dernier_jour_mois(annee, mois):
    if mois == 2: return 29 if calendar.isleap(annee) else 28
    elif mois in [4,6,9,11]: return 30
    return 31

def get_mois_precedent(annee, mois):
    return (annee-1, 12) if mois == 1 else (annee, mois-1)

def extraire_nom_poste_simple(nom_complet):
    u = nom_complet.upper()
    if "MAROUA" in u: return "MAROUA"
    elif "LIMANI" in u: return "LIMANI"
    return nom_complet


# ============================================================
# HELPERS FUSION OBSERVATIONS
# ============================================================

def _calculer_fusions_observations(observations: list) -> list:
    """
    Calcule les plages de fusion pour la colonne OBSERVATIONS.
    - Si toutes identiques (ou toutes vides/RAS) → une seule grande fusion
    - Si des groupes consécutifs identiques → fusion par groupe
    Retourne une liste de (row_start, row_end) en indices de données (1-based, ligne header=0)
    """
    if not observations:
        return []

    # Normaliser : None / "" → "RAS"
    obs_norm = [o.strip().upper() if o and o.strip() else "RAS" for o in observations]

    fusions = []
    i = 0
    while i < len(obs_norm):
        j = i
        while j < len(obs_norm) - 1 and obs_norm[j+1] == obs_norm[j]:
            j += 1
        if j > i:
            # +1 car ligne header = row 0, données commencent à row 1
            fusions.append((i+1, j+1))
        i = j + 1
    return fusions


# ============================================================
# GÉNÉRATION DU PV COMPLET
# ============================================================

def generate_pv_pdf(pv, virements, cheques, poste, utilisateur):

    _enregistrer_polices()

    buffer = BytesIO()
    doc = SimpleDocTemplate(
        buffer, pagesize=A4,
        topMargin=1.0*cm, bottomMargin=2.0*cm,
        leftMargin=2.0*cm, rightMargin=2.0*cm,
    )

    # ── Polices ──────────────────────────────────────────────────────────────
    FN  = _police("normal")
    FB  = _police("bold")
    FI  = _police("italic")
    FS  = 12          # font size corps
    LH  = FS * 1.5   # interligne 1.5

    # ── Styles ───────────────────────────────────────────────────────────────
    NS = ParagraphStyle('NS', fontName=FN, fontSize=FS, leading=LH,
                        alignment=4,   # JUSTIFY
                        spaceAfter=0, spaceBefore=0)

    NS_LEFT = ParagraphStyle('NSL', fontName=FN, fontSize=FS, leading=LH,
                              alignment=0, spaceAfter=0, spaceBefore=0)

    TS = ParagraphStyle('TS', fontName=FB, fontSize=FS+1,
                        leading=(FS+1)*1.4, alignment=1,
                        spaceAfter=0, spaceBefore=0)

    # Style pour les lignes de solde (monospace-like, justifié)
    SOLDE_ST = ParagraphStyle('SOLDE', fontName=FN, fontSize=FS, leading=LH,
                               alignment=4, spaceAfter=0, spaceBefore=0)
    SOLDE_BOLD_ST = ParagraphStyle('SOLDEB', fontName=FB, fontSize=FS, leading=LH,
                                   alignment=4, spaceAfter=0, spaceBefore=0)

    def stab(bold=False, align=1):
        return ParagraphStyle(
            f'TAB_{bold}_{align}', fontName=FB if bold else FN,
            fontSize=FS-1, leading=(FS-1)*1.35,
            alignment=align, spaceAfter=0, spaceBefore=0)

    HEADER_BG  = colors.HexColor("#C8C8C8")
    TOTAL_BG   = colors.HexColor("#E4E4E4")
    BORDER_CLR = colors.HexColor("#2B2B2B")

    def pn(t):   return Paragraph(t, NS)
    def pnl(t):  return Paragraph(t, NS_LEFT)
    def pt(t):   return Paragraph(t, TS)
    def pc(t, bold=False, align=1): return Paragraph(t, stab(bold, align))

    # ========== DATES ==========
    mc, ac = pv.date_pv.month, pv.date_pv.year
    dj  = get_dernier_jour_mois(ac, mc)
    ap, mp = get_mois_precedent(ac, mc)
    djp = get_dernier_jour_mois(ap, mp)

    dfc  = date_chiffres_lettres(dj, mc, ac)
    dfp  = dfc
    ddc  = date_chiffres_lettres(djp, mp, ap)
    jpl, mpl, apl = date_complete_lettres(dj, mc, ac)

    # ========== NOMS ==========
    nps  = extraire_nom_poste_simple(poste.nom_poste)
    rnom = f"{utilisateur.nom} {utilisateur.prenom}".upper()
    rgrade = getattr(utilisateur, 'grade', 'Inspecteur des Douanes') or 'Inspecteur des Douanes'

    # ========== SOLDE ==========
    mvd  = pv.mouvements_debiteurs or 0
    mvc  = pv.mouvements_crediteurs or 0
    st_  = pv.solde_theorique or 0
    diff = pv.difference or 0
    sdc  = pv.solde_dernier_controle or 0
    tdeb = sdc + mvd

    # Largeur utile pour les pointillés
    page_w = A4[0] - 2.0*cm   

    
    def ligne_solde(libelle, montant, bold=False):
        fn = FB if bold else FN

        st_lib = ParagraphStyle(f'LIB_{bold}', fontName=fn, fontSize=FS,
                                leading=LH, alignment=0,
                                spaceAfter=0, spaceBefore=0)
        st_mnt = ParagraphStyle(f'MNT_{bold}', fontName=fn, fontSize=FS,
                                leading=LH, alignment=2,
                                spaceAfter=0, spaceBefore=0)
        st_pts = ParagraphStyle(f'PTS_{bold}', fontName=fn, fontSize=FS,
                                leading=LH, alignment=1,
                                spaceAfter=0, spaceBefore=0,
                                wordWrap=None)  # empêche le retour à la ligne

        # Largeur exacte du libellé (sans balises HTML)
        libelle_clean = libelle.replace('<b>','').replace('</b>','')\
                            .replace('<i>','').replace('</i>','')
        w_lib = stringWidth(libelle_clean, fn, FS) + 0.3 * cm
        w_mnt = 3.0 * cm

        # Espace restant pour les pointillés
        w_pts = page_w - w_lib - w_mnt

        # Nombre exact de points pour remplir l'espace
        # On utilise le caractère "." espacé pour un rendu plus lisible
        point_char   = "."
        point_width  = stringWidth(point_char, fn, FS)
        nb_points    = int(w_pts / point_width)  # pas de facteur — on remplit exactement
        points       = point_char * nb_points

        row = Table(
            [[Paragraph(libelle, st_lib),
            Paragraph(points,  st_pts),
            Paragraph(montant, st_mnt)]],
            colWidths=[w_lib, w_pts, w_mnt],
        )
        row.setStyle(TableStyle([
            ('TOPPADDING',    (0,0), (-1,-1), 1),
            ('BOTTOMPADDING', (0,0), (-1,-1), 1),
            ('LEFTPADDING',   (0,0), (-1,-1), 0),
            ('RIGHTPADDING',  (0,0), (-1,-1), 0),
            ('VALIGN',        (0,0), (-1,-1), 'MIDDLE'),
            ('ALIGN',         (0,0), (0,0),   'LEFT'),
            ('ALIGN',         (1,0), (1,0),   'CENTER'),  # points centrés dans leur colonne
            ('ALIGN',         (2,0), (2,0),   'RIGHT'),
        ]))
        return row 

    # ============================================================
    # STORY
    # ============================================================
    story = []

    # 1. EN-TÊTE
    story += get_entete_flowables(poste.nom_poste, poste.code_poste, avec_trait=False)
    story.append(Spacer(1, 14))

    # 2. TITRE
    titre_tbl = Table([[pt(
        f"PROCÈS-VERBAL DE CONTRÔLE INTERNE DE LA RECETTE PRINCIPALE "
        f"DES DOUANES DE {nps} AU {dfc}"
    )]], colWidths=[page_w])
    titre_tbl.setStyle(TableStyle([
        ('BOX',           (0,0),(-1,-1), 1,  BORDER_CLR),
        ('ALIGN',         (0,0),(-1,-1), 'CENTER'),
        ('TOPPADDING',    (0,0),(-1,-1), 8),
        ('BOTTOMPADDING', (0,0),(-1,-1), 8),
        ('LEFTPADDING',   (0,0),(-1,-1), 10),
        ('RIGHTPADDING',  (0,0),(-1,-1), 10),
    ]))
    story.append(titre_tbl)
    story.append(Spacer(1, 16))

    # 3. INTRODUCTION
    story.append(pn(
        f"L'an Deux Mil {apl} et le {jpl} du mois de {mpl}, "
        f"nous <b>{rnom}</b>, {rgrade}, Receveur des Douanes de {nps}, "
        f"avons procédé au contrôle interne mensuel de la caisse du poste."
    ))
    story.append(Spacer(1, 10))
    story.append(pn(
        "Après l'arrêt des livres journaux de premières écritures et divers "
        "registres auxiliaires, il se dégage la situation ci-après :"
    ))
    story.append(Spacer(1, 14))

    # 4. DÉTERMINATION DU SOLDE — texte avec pointillés, sans tableau visible
    story.append(Paragraph("<b>Détermination du solde :</b>", NS_LEFT))
    story.append(Spacer(1, 8))

    lignes = [
        (f"Solde au dernier contrôle au {ddc}", format_franc(sdc),  False),
        (f"Mouvements débiteurs du 1er au {dfp}", format_franc(mvd), False),
        ("Total Débit",                          format_franc(tdeb), True),
        (f"Mouvements créditeurs du 1er au {dfp}", format_franc(mvc),False),
        (f"Solde théorique au {dfp}",            format_franc(st_),  False),
        ("SOLDE",                                format_franc(st_),  True),
        ("Différence",                           format_franc(diff), False),
    ]
    for libelle, montant, bold in lignes:
        story.append(ligne_solde(libelle, montant, bold))
        story.append(Spacer(1, 3))

    story.append(Spacer(1, 10))
    story.append(Paragraph(
        f"<b>OBSERVATIONS :</b> {pv.observation or 'SITUATION CONFORME'}", NS_LEFT
    ))
    story.append(Spacer(1, 16))
    story.append(PageBreak())

    # ============================================================
    # 5. TABLEAU DES VIREMENTS
    # ============================================================
    story.append(Paragraph("<b>SITUATION DES VIREMENTS REÇUS :</b>", NS_LEFT))
    story.append(Spacer(1, 8))

    # Colonnes : Date | N° virement | Montant | Observations
    CW_V = [2.4*cm, 5.6*cm, 4.0*cm, 4.0*cm]

    v_head = [
        pc("Date",                     bold=True, align=1),
        pc("N° du détail de virement", bold=True, align=1),
        pc("Montant reçu à l'ACCT",    bold=True, align=1),
        pc("OBSERVATIONS",             bold=True, align=1),
    ]
    virement_rows = []   # lignes données uniquement (sans header, sans total)
    obs_v = []
    total_v = 0

    for v in virements or []:
        obs_v.append(v.observation or "")
        virement_rows.append([
            pc(v.date_virement.strftime('%d/%m/%Y'), align=1),
            pc(v.num_virement or "",                  align=1),
            pc(format_franc(v.montant),               align=2),
            pc(v.observation or "RAS",                align=1),
        ])
        total_v += v.montant

    if not virement_rows:
        obs_v = [""]
        virement_rows.append([pc("", align=1), pc("Néant", align=1), pc("", align=1), pc("", align=1)])

    v_total_row = [
        pc("TOTAL", bold=True, align=1),
        pc("",      bold=True, align=1),
        pc(format_franc(total_v), bold=True, align=2),
        pc("",      bold=True, align=1),
    ]

    virement_data = [v_head] + virement_rows + [v_total_row]
    nb_data_v = len(virement_rows)   # nombre de lignes de données

    # Style de base
    v_style = [
        # Grille sur toutes les lignes sauf TOTAL
        ('GRID',          (0,0),  (-1,-2), 0.5, BORDER_CLR),
        # Bordure externe sur tout le tableau
        ('BOX',           (0,0),  (-1,-1), 0.8, BORDER_CLR),
        # En-tête
        ('BACKGROUND',    (0,0),  (-1,0),  HEADER_BG),
        ('LINEBELOW',     (0,0),  (-1,0),  1.2, BORDER_CLR),
        # Ligne TOTAL
        ('BACKGROUND',    (0,-1), (-1,-1), TOTAL_BG),
        ('LINEABOVE',     (0,-1), (-1,-1), 1.0, BORDER_CLR),
        # Séparateurs verticaux dans la ligne TOTAL
        # col 1 = fin du SPAN → trait après la cellule fusionnée (TOTAL) | Montant
        ('LINEAFTER',     (1,-1), (1,-1),  0.5, BORDER_CLR),
        # col 2 = Montant → trait après | Observations
        ('LINEAFTER',     (2,-1), (2,-1),  0.5, BORDER_CLR),
        # Fusion TOTAL : col 0 + col 1 (Date + N° virement) SEULEMENT
        ('SPAN',          (0,-1), (1,-1)),
        ('TOPPADDING',    (0,0),  (-1,-1), 4),
        ('BOTTOMPADDING', (0,0),  (-1,-1), 4),
        ('LEFTPADDING',   (0,0),  (-1,-1), 5),
        ('RIGHTPADDING',  (0,0),  (-1,-1), 5),
        ('VALIGN',        (0,0),  (-1,-1), 'MIDDLE'),
    ]

    # Fusion colonne OBSERVATIONS (col index 3)
    fusions_v = _calculer_fusions_observations(obs_v)
    for (r_start, r_end) in fusions_v:
        v_style.append(('SPAN', (3, r_start), (3, r_end)))

    virement_table = Table(virement_data, colWidths=CW_V)
    virement_table.setStyle(TableStyle(v_style))
    story.append(virement_table)
    story.append(Spacer(1, 20))

    # ============================================================
    # 6. TABLEAU DES CHÈQUES
    # ============================================================
    story.append(Paragraph("<b>SITUATION DES CHÈQUES REÇUS :</b>", NS_LEFT))
    story.append(Spacer(1, 8))

    # Colonnes : Date | N° chèque | Montant | N° DR | Observations
    CW_C = [2.4*cm, 3.2*cm, 3.2*cm, 2.4*cm, 4.8*cm]

    c_head = [
        pc("Date",         bold=True, align=1),
        pc("N° du chèque", bold=True, align=1),
        pc("Montant",      bold=True, align=1),
        pc("N° de la DR",  bold=True, align=1),
        pc("OBSERVATIONS", bold=True, align=1),
    ]
    cheque_rows = []
    obs_c = []
    total_c = 0

    for c in cheques or []:
        obs_c.append(c.observation or "")
        cheque_rows.append([
            pc(c.date_cheque.strftime('%d/%m/%Y'), align=1),
            pc(c.num_cheque or "",                  align=1),
            pc(format_franc(c.montant),             align=2),
            pc(c.num_dr or "",                      align=1),
            pc(c.observation or "RAS",              align=1),
        ])
        total_c += c.montant

    if not cheque_rows:
        obs_c = [""]
        cheque_rows.append([pc("", align=1), pc("Néant", align=1), pc("", align=1), pc("", align=1), pc("", align=1)])

    c_total_row = [
        pc("TOTAL", bold=True, align=1),
        pc("",      bold=True, align=1),
        pc(format_franc(total_c), bold=True, align=2),
        pc("",      bold=True, align=1),
        pc("",      bold=True, align=1),
    ]

    cheque_data = [c_head] + cheque_rows + [c_total_row]
    nb_data_c = len(cheque_rows)

    c_style = [
        ('GRID',          (0,0),  (-1,-2), 0.5, BORDER_CLR),
        ('BOX',           (0,0),  (-1,-1), 0.8, BORDER_CLR),
        ('BACKGROUND',    (0,0),  (-1,0),  HEADER_BG),
        ('LINEBELOW',     (0,0),  (-1,0),  1.2, BORDER_CLR),
        ('BACKGROUND',    (0,-1), (-1,-1), TOTAL_BG),
        ('LINEABOVE',     (0,-1), (-1,-1), 1.0, BORDER_CLR),
        # Séparateurs verticaux dans la ligne TOTAL
        # col 1 = fin du SPAN → trait | Montant
        ('LINEAFTER',     (1,-1), (1,-1),  0.5, BORDER_CLR),
        # col 2 = Montant → trait | N° DR
        ('LINEAFTER',     (2,-1), (2,-1),  0.5, BORDER_CLR),
        # col 3 = N° DR → trait | Observations
        ('LINEAFTER',     (3,-1), (3,-1),  0.5, BORDER_CLR),
        # Fusion TOTAL : col 0 + col 1 (Date + N° chèque) SEULEMENT
        ('SPAN',          (0,-1), (1,-1)),
        ('TOPPADDING',    (0,0),  (-1,-1), 4),
        ('BOTTOMPADDING', (0,0),  (-1,-1), 4),
        ('LEFTPADDING',   (0,0),  (-1,-1), 5),
        ('RIGHTPADDING',  (0,0),  (-1,-1), 5),
        ('VALIGN',        (0,0),  (-1,-1), 'MIDDLE'),
    ]

    # Fusion colonne OBSERVATIONS (col index 4)
    fusions_c = _calculer_fusions_observations(obs_c)
    for (r_start, r_end) in fusions_c:
        c_style.append(('SPAN', (4, r_start), (4, r_end)))

    cheque_table = Table(cheque_data, colWidths=CW_C)
    cheque_table.setStyle(TableStyle(c_style))
    story.append(cheque_table)
    story.append(Spacer(1, 30))

# 7. SIGNATURE — alignée à droite
    story.append(pn(
        f"Fait à {nps}, le présent procès-verbal, les jour, mois et an que dessus."
    ))
    story.append(Spacer(1, 30))

    NS_RIGHT   = ParagraphStyle("NSR",  fontName=FN, fontSize=FS, leading=LH, alignment=2)
    NS_RIGHT_B = ParagraphStyle("NSRB", fontName=FB, fontSize=FS, leading=LH, alignment=2)
    NS_RIGHT_I = ParagraphStyle("NSRI", fontName=FI, fontSize=FS, leading=LH, alignment=2)

    story.append(Paragraph("LE RECEVEUR DES DOUANES", NS_RIGHT))


    doc.build(story)
    buffer.seek(0)
    return buffer.getvalue()
