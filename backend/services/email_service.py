"""Service d'envoi d'emails professionnel"""
import os
from typing import Optional, List
from sendgrid import SendGridAPIClient
from sendgrid.helpers.mail import Mail, Email, To, Content
import logging
from datetime import datetime

logger = logging.getLogger(__name__)

class EmailService:
    def __init__(self, api_key: str, from_email: str, from_name: str):
        self.api_key = api_key
        self.from_email = from_email
        self.from_name = from_name
        self.client = SendGridAPIClient(api_key) if api_key else None
    
    async def send_email(self, to_email: str, subject: str, html_content: str, plain_text: Optional[str] = None):
        """Envoie un email"""
        if not self.client:
            logger.warning(f"SendGrid not configured. Would send email to {to_email}: {subject}")
            print(f"\n📧 EMAIL (Mock): To: {to_email}\nSubject: {subject}\nContent: {html_content[:100]}...\n")
            return True
        
        try:
            message = Mail(
                from_email=Email(self.from_email, self.from_name),
                to_emails=To(to_email),
                subject=subject,
                html_content=Content("text/html", html_content)
            )
            
            if plain_text:
                message.add_content(Content("text/plain", plain_text))
            
            response = self.client.send(message)
            logger.info(f"Email sent to {to_email}: {subject} (Status: {response.status_code})")
            return True
        except Exception as e:
            logger.error(f"Failed to send email to {to_email}: {str(e)}")
            return False
    
    async def send_welcome_email(self, user_email: str, user_name: str, user_role: str):
        """Email de bienvenue"""
        subject = f"Bienvenue sur {self.from_name} !"
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
                .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                .header {{ background: linear-gradient(135deg, #1a73e8 0%, #4285f4 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }}
                .content {{ background: white; padding: 30px; border: 1px solid #e0e0e0; }}
                .button {{ background: #1a73e8; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; margin-top: 20px; }}
                .footer {{ text-align: center; padding: 20px; color: #666; font-size: 12px; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>🎉 Bienvenue sur AOK !</h1>
                </div>
                <div class="content">
                    <h2>Bonjour {user_name},</h2>
                    <p>Nous sommes ravis de vous accueillir sur <strong>AOK</strong>, la plateforme RTB nouvelle génération !</p>
                    <p>Votre compte <strong>{user_role}</strong> a été créé avec succès.</p>
                    
                    <h3>🚀 Prochaines étapes :</h3>
                    <ul>
                        {'<li>Créez votre première campagne publicitaire</li><li>Ajoutez vos créatifs</li><li>Rechargez votre compte</li>' if user_role == 'advertiser' else '<li>Ajoutez vos inventaires publicitaires</li><li>Configurez vos espaces pub</li><li>Commencez à gagner de l\'argent</li>'}
                    </ul>
                    
                    <p>Si vous avez des questions, notre équipe support est là pour vous aider.</p>
                    
                    <a href="{self.from_email}" class="button">Accéder à mon compte</a>
                </div>
                <div class="footer">
                    <p>© 2024 AOK Platform. Tous droits réservés.</p>
                    <p>Cet email a été envoyé à {user_email}</p>
                </div>
            </div>
        </body>
        </html>
        """
        return await self.send_email(user_email, subject, html_content)
    
    async def send_withdrawal_notification(self, user_email: str, amount: float, status: str):
        """Notification de retrait"""
        status_text = {
            "pending": "en attente",
            "approved": "approuvé",
            "rejected": "rejeté",
            "completed": "complété"
        }.get(status, status)
        
        subject = f"Demande de retrait {status_text} - ${amount}"
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <body style="font-family: Arial, sans-serif;">
            <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                <h2>Mise à jour de votre demande de retrait</h2>
                <p>Votre demande de retrait de <strong>${amount}</strong> a été <strong>{status_text}</strong>.</p>
                {'<p>Le montant sera transféré sous 3-5 jours ouvrés.</p>' if status == 'approved' else ''}
                {'<p>Le montant a été remboursé sur votre compte.</p>' if status == 'rejected' else ''}
                <p>Merci d\'utiliser AOK !</p>
            </div>
        </body>
        </html>
        """
        return await self.send_email(user_email, subject, html_content)
    
    async def send_payment_confirmation(self, user_email: str, amount: float, credits: float):
        """Confirmation de paiement"""
        subject = f"Paiement confirmé - ${amount}"
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <body style="font-family: Arial, sans-serif;">
            <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                <h2>✅ Paiement confirmé</h2>
                <p>Votre paiement de <strong>${amount}</strong> a été traité avec succès.</p>
                <p>Votre compte a été crédité de <strong>{credits} crédits</strong>.</p>
                <p>Vous pouvez maintenant utiliser ces crédits pour vos campagnes publicitaires.</p>
                <p>Merci pour votre confiance !</p>
            </div>
        </body>
        </html>
        """
        return await self.send_email(user_email, subject, html_content)
    
    async def send_low_balance_alert(self, user_email: str, balance: float):
        """Alerte solde faible"""
        subject = "⚠️ Solde faible sur votre compte AOK"
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <body style="font-family: Arial, sans-serif;">
            <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                <h2>⚠️ Solde faible</h2>
                <p>Votre solde actuel est de <strong>${balance}</strong>.</p>
                <p>Pour continuer vos campagnes publicitaires sans interruption, nous vous recommandons de recharger votre compte.</p>
                <a href="#" style="background: #1a73e8; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; margin-top: 20px;">Recharger mon compte</a>
            </div>
        </body>
        </html>
        """
        return await self.send_email(user_email, subject, html_content)
