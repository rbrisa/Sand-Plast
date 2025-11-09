"""Service de génération de PDF professionnels"""
from reportlab.lib import colors
from reportlab.lib.pagesizes import letter, A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, Image
from reportlab.pdfgen import canvas
from datetime import datetime
import os
from typing import List, Dict, Any

class PDFService:
    def __init__(self, output_dir: str):
        self.output_dir = output_dir
        os.makedirs(output_dir, exist_ok=True)
    
    def generate_invoice(self, invoice_data: Dict[str, Any]) -> str:
        """Génère une facture PDF"""
        filename = f"invoice_{invoice_data['invoice_number']}_{datetime.now().strftime('%Y%m%d')}.pdf"
        filepath = os.path.join(self.output_dir, filename)
        
        doc = SimpleDocTemplate(filepath, pagesize=A4)
        elements = []
        styles = getSampleStyleSheet()
        
        # En-tête
        title_style = ParagraphStyle(
            'CustomTitle',
            parent=styles['Heading1'],
            fontSize=24,
            textColor=colors.HexColor('#1a73e8'),
            spaceAfter=30,
        )
        elements.append(Paragraph("AOK PLATFORM", title_style))
        elements.append(Paragraph("FACTURE", styles['Heading2']))
        elements.append(Spacer(1, 0.3 * inch))
        
        # Informations facture
        invoice_info = [
            ["N° Facture:", invoice_data['invoice_number']],
            ["Date:", datetime.now().strftime('%d/%m/%Y')],
            ["Client:", invoice_data['customer_name']],
            ["Email:", invoice_data['customer_email']],
        ]
        
        info_table = Table(invoice_info, colWidths=[2*inch, 4*inch])
        info_table.setStyle(TableStyle([
            ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 10),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 12),
        ]))
        elements.append(info_table)
        elements.append(Spacer(1, 0.5 * inch))
        
        # Détails des items
        items_data = [["Description", "Quantité", "Prix unitaire", "Total"]]
        for item in invoice_data.get('items', []):
            items_data.append([
                item['description'],
                str(item['quantity']),
                f"${item['unit_price']:.2f}",
                f"${item['total']:.2f}"
            ])
        
        # Total
        items_data.append(["" , "", "Total:", f"${invoice_data['total']:.2f}"])
        
        items_table = Table(items_data, colWidths=[3*inch, 1*inch, 1.5*inch, 1.5*inch])
        items_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1a73e8')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (1, 0), (-1, -1), 'CENTER'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 12),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            ('BACKGROUND', (0, 1), (-1, -2), colors.beige),
            ('GRID', (0, 0), (-1, -2), 1, colors.black),
            ('FONTNAME', (0, -1), (-1, -1), 'Helvetica-Bold'),
            ('FONTSIZE', (0, -1), (-1, -1), 12),
            ('BACKGROUND', (0, -1), (-1, -1), colors.HexColor('#e8f5e9')),
        ]))
        elements.append(items_table)
        elements.append(Spacer(1, 0.5 * inch))
        
        # Footer
        footer_text = "Merci pour votre confiance !<br/>AOK Platform - Plateforme RTB Professionnelle"
        elements.append(Paragraph(footer_text, styles['Normal']))
        
        doc.build(elements)
        return filepath
    
    def generate_campaign_report(self, campaign_data: Dict[str, Any]) -> str:
        """Génère un rapport de campagne PDF"""
        filename = f"report_{campaign_data['campaign_id']}_{datetime.now().strftime('%Y%m%d')}.pdf"
        filepath = os.path.join(self.output_dir, filename)
        
        doc = SimpleDocTemplate(filepath, pagesize=A4)
        elements = []
        styles = getSampleStyleSheet()
        
        # Titre
        title = Paragraph(f"Rapport de Campagne: {campaign_data['campaign_name']}", styles['Title'])
        elements.append(title)
        elements.append(Spacer(1, 0.3 * inch))
        
        # Résumé
        summary_data = [
            ["Métrique", "Valeur"],
            ["Impressions", f"{campaign_data.get('impressions', 0):,}"],
            ["Clics", f"{campaign_data.get('clicks', 0):,}"],
            ["CTR", f"{campaign_data.get('ctr', 0):.2f}%"],
            ["Conversions", f"{campaign_data.get('conversions', 0):,}"],
            ["CVR", f"{campaign_data.get('cvr', 0):.2f}%"],
            ["Dépenses", f"${campaign_data.get('spend', 0):,.2f}"],
        ]
        
        summary_table = Table(summary_data, colWidths=[3*inch, 3*inch])
        summary_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 12),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 12),
            ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
            ('GRID', (0, 0), (-1, -1), 1, colors.black),
        ]))
        elements.append(summary_table)
        
        doc.build(elements)
        return filepath
