from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import cm
from io import BytesIO

def generate_pv_pdf(pv, virements, cheques):
    """Génère le PDF du procès-verbal"""
    
    buffer = BytesIO()
    doc = SimpleDocTemplate(
        buffer, 
        pagesize=A4, 
        rightMargin=2*cm, 
        leftMargin=2*cm,
        topMargin=2*cm, 
        bottomMargin=2*cm
    )
    
    styles = getSampleStyleSheet()
    story = []
    
    # Style pour les titres
    title_style = ParagraphStyle(
        'CustomTitle',
        parent=styles['Heading1'],
        fontSize=14,
        alignment=1,  # Centré
        spaceAfter=20
    )
    
    # Style pour les sous-titres
    subtitle_style = ParagraphStyle(
        'CustomSubtitle',
        parent=styles['Heading2'],
        fontSize=12,
        alignment=1,
        spaceAfter=10
    )
    
    # En-tête
    story.append(Paragraph("REPUBLIQUE DU CAMEROUN", title_style))
    story.append(Paragraph("Paix - Travail - Patrie", title_style))
    story.append(Spacer(1, 10))
    story.append(Paragraph("MINISTERE DES FINANCES", subtitle_style))
    story.append(Paragraph("DIRECTION GENERALE DES DOUANES", subtitle_style))
    story.append(Paragraph(f"RECETTE PRINCIPALE DES DOUANES DE {pv.poste.nom_poste.upper()}", subtitle_style))
    story.append(Spacer(1, 20))
    
    # Titre du document
    story.append(Paragraph("PROCES VERBAL DE CONTROLE INTERNE", title_style))
    story.append(Spacer(1, 20))
    
    # Introduction
    intro_text = f"""
    L'an Deux Mil Vingt-Six et le {pv.date_pv.strftime('%d')} du mois de {pv.date_pv.strftime('%B')} {pv.date_pv.year},
    nous <b>{pv.receveur_nom or '_________________'}</b>, {pv.receveur_grade or 'Inspecteur du Trésor'}, Receveur des Douanes de {pv.poste.nom_poste},
    avons procédé au contrôle interne mensuel de la caisse du poste.
    """
    story.append(Paragraph(intro_text, styles['Normal']))
    story.append(Spacer(1, 10))
    
    intro2 = f"""
    Après l'arrêt des livres journaux de premières écritures et divers registres auxiliaires,
    il se dégage la situation ci-après :
    """
    story.append(Paragraph(intro2, styles['Normal']))
    story.append(Spacer(1, 20))
    
    # Détermination du solde
    story.append(Paragraph("<b>Détermination du solde :</b>", styles['Heading3']))
    story.append(Spacer(1, 10))
    
    solde_data = [
        ["Solde au dernier contrôle au", pv.date_debut_periode.strftime('%d/%m/%Y'), f"{pv.solde_dernier_controle:,.0f}"],
        ["Mouvements débiteurs du", f"{pv.date_debut_periode.strftime('%d/%m/%Y')} au {pv.date_fin_periode.strftime('%d/%m/%Y')}", f"{pv.mouvements_debiteurs:,.0f}"],
        ["Total Débit", "", f"{pv.solde_dernier_controle + pv.mouvements_debiteurs:,.0f}"],
        ["Mouvements créditeurs du", f"{pv.date_debut_periode.strftime('%d/%m/%Y')} au {pv.date_fin_periode.strftime('%d/%m/%Y')}", f"{pv.mouvements_crediteurs:,.0f}"],
        ["Solde théorique au", pv.date_fin_periode.strftime('%d/%m/%Y'), f"{pv.solde_theorique:,.0f}"],
        ["SOLDE", "", f"{pv.solde_theorique:,.0f}"],
        ["Différence", "", f"{pv.difference:,.0f}"],
    ]
    
    solde_table = Table(solde_data, colWidths=[250, 150, 100])
    solde_table.setStyle(TableStyle([
        ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
        ('FONTSIZE', (0, 0), (-1, -1), 10),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('ALIGN', (2, 0), (2, -1), 'RIGHT'),
        ('BACKGROUND', (0, 0), (-1, 0), colors.lightgrey),
    ]))
    story.append(solde_table)
    story.append(Spacer(1, 20))
    
    # Observations
    if pv.observations:
        story.append(Paragraph(f"<b>OBSERVATIONS :</b> {pv.observations}", styles['Normal']))
        story.append(Spacer(1, 20))
    
    # Situation des virements
    if virements:
        story.append(Paragraph("<b>SITUATION DES VIREMENTS RECUS :</b>", styles['Heading3']))
        story.append(Spacer(1, 10))
        
        virement_data = [["Date", "N° du détail de virement", "Montant reçu à l'ACCT", "Observations"]]
        total_virements = 0
        for v in virements:
            virement_data.append([
                v.date_virement.strftime('%d/%m/%Y'),
                v.num_virement,
                f"{v.montant:,.0f}",
                v.observation or ''
            ])
            total_virements += v.montant
        
        virement_data.append(["", "", "", ""])
        virement_data.append(["", "TOTAL", f"{total_virements:,.0f}", ""])
        
        virement_table = Table(virement_data, colWidths=[80, 120, 100, 100])
        virement_table.setStyle(TableStyle([
            ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
            ('FONTSIZE', (0, 0), (-1, -1), 9),
            ('GRID', (0, 0), (-1, -2), 0.5, colors.grey),
            ('BACKGROUND', (0, 0), (-1, 0), colors.lightgrey),
            ('ALIGN', (2, 1), (2, -2), 'RIGHT'),
            ('ALIGN', (2, -1), (2, -1), 'RIGHT'),
        ]))
        story.append(virement_table)
        story.append(Spacer(1, 20))
    else:
        story.append(Paragraph("<b>SITUATION DES VIREMENTS RECUS :</b> Aucun virement", styles['Normal']))
        story.append(Spacer(1, 20))
    
    # Situation des chèques
    if cheques:
        story.append(Paragraph("<b>SITUATION DES CHEQUES RECUS :</b>", styles['Heading3']))
        story.append(Spacer(1, 10))
        
        cheque_data = [["Date", "N° du chèque", "Montant", "N° de la DR", "Observations"]]
        total_cheques = 0
        for c in cheques:
            cheque_data.append([
                c.date_cheque.strftime('%d/%m/%Y'),
                c.num_cheque,
                f"{c.montant:,.0f}",
                c.num_dr or '',
                c.observation or ''
            ])
            total_cheques += c.montant
        
        cheque_data.append(["", "", "", "", ""])
        cheque_data.append(["", "TOTAL", f"{total_cheques:,.0f}", "", ""])
        
        cheque_table = Table(cheque_data, colWidths=[70, 80, 80, 80, 100])
        cheque_table.setStyle(TableStyle([
            ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
            ('FONTSIZE', (0, 0), (-1, -1), 9),
            ('GRID', (0, 0), (-1, -2), 0.5, colors.grey),
            ('BACKGROUND', (0, 0), (-1, 0), colors.lightgrey),
            ('ALIGN', (2, 1), (2, -2), 'RIGHT'),
            ('ALIGN', (2, -1), (2, -1), 'RIGHT'),
        ]))
        story.append(cheque_table)
        story.append(Spacer(1, 20))
    else:
        story.append(Paragraph("<b>SITUATION DES CHEQUES RECUS :</b> Néant", styles['Normal']))
        story.append(Spacer(1, 20))
    
    # Signature
    story.append(Spacer(1, 30))
    story.append(Paragraph(f"Fait à {pv.poste.nom_poste} le {pv.date_pv.strftime('%d/%m/%Y')}", styles['Normal']))
    story.append(Spacer(1, 30))
    story.append(Paragraph("LE RECEVEUR DES DOUANES", styles['Normal']))
    story.append(Spacer(1, 10))
    story.append(Paragraph(f"<b>{pv.receveur_nom or '_________________'}</b>", styles['Normal']))
    story.append(Paragraph(f"<i>{pv.receveur_grade or 'Inspecteur du Trésor'}</i>", styles['Normal']))
    
    # Construction du document
    doc.build(story)
    buffer.seek(0)
    return buffer.getvalue()
