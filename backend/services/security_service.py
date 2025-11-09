"""Service de sécurité avancé"""
import pyotp
import qrcode
import io
import base64
from typing import Optional
import logging

logger = logging.getLogger(__name__)

class SecurityService:
    def __init__(self, issuer_name: str = "AOK"):
        self.issuer_name = issuer_name
    
    def generate_2fa_secret(self) -> str:
        """Génère un secret 2FA"""
        return pyotp.random_base32()
    
    def generate_2fa_qr_code(self, email: str, secret: str) -> str:
        """Génère un QR code pour 2FA"""
        # Créer l'URI TOTP
        totp_uri = pyotp.totp.TOTP(secret).provisioning_uri(
            name=email,
            issuer_name=self.issuer_name
        )
        
        # Générer le QR code
        qr = qrcode.QRCode(version=1, box_size=10, border=5)
        qr.add_data(totp_uri)
        qr.make(fit=True)
        
        img = qr.make_image(fill_color="black", back_color="white")
        
        # Convertir en base64
        buffered = io.BytesIO()
        img.save(buffered, format="PNG")
        img_str = base64.b64encode(buffered.getvalue()).decode()
        
        return f"data:image/png;base64,{img_str}"
    
    def verify_2fa_token(self, secret: str, token: str) -> bool:
        """Vérifie un token 2FA"""
        totp = pyotp.TOTP(secret)
        return totp.verify(token, valid_window=1)
    
    def check_password_strength(self, password: str) -> dict:
        """Vérifie la force d'un mot de passe"""
        issues = []
        score = 0
        
        if len(password) >= 8:
            score += 1
        else:
            issues.append("Le mot de passe doit contenir au moins 8 caractères")
        
        if any(c.isupper() for c in password):
            score += 1
        else:
            issues.append("Ajoutez au moins une majuscule")
        
        if any(c.islower() for c in password):
            score += 1
        else:
            issues.append("Ajoutez au moins une minuscule")
        
        if any(c.isdigit() for c in password):
            score += 1
        else:
            issues.append("Ajoutez au moins un chiffre")
        
        if any(c in "!@#$%^&*()_+-=[]{}|;:,.<>?" for c in password):
            score += 1
        else:
            issues.append("Ajoutez au moins un caractère spécial")
        
        strength = "Faible"
        if score >= 4:
            strength = "Moyen"
        if score == 5:
            strength = "Fort"
        
        return {
            "score": score,
            "max_score": 5,
            "strength": strength,
            "issues": issues,
            "valid": score >= 3
        }
