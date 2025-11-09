# Sécurité de la Plateforme RTB

## Vue d'ensemble

Cette plateforme RTB implémente de nombreuses mesures de sécurité pour protéger les données des utilisateurs et assurer l'intégrité du système.

## Fonctionnalités de Sécurité

### 1. Authentification & Autorisation

#### Hachage de Mots de Passe
- Tous les mots de passe sont hachés avec **bcrypt** avant stockage
- Salage automatique pour chaque mot de passe
- Jamais de stockage en texte clair

#### Tokens JWT
- Authentification basée sur JWT (JSON Web Tokens)
- Expiration des tokens après 24 heures
- Token requis pour toutes les routes protégées
- Signature avec clé secrète (configurable via JWT_SECRET)

#### Contrôle d'Accès Basé sur les Rôles (RBAC)
- **Super Admin** : Accès complet, peut créer d'autres admins
- **Admin** : Gestion des utilisateurs et statistiques
- **Annonceur** : Gestion de campagnes et paiements
- **Éditeur** : Gestion d'inventaires

### 2. Protection des Endpoints

#### Middleware d'Authentification
```python
async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security))
```
- Vérifie la validité du token JWT
- Vérifie si l'utilisateur existe
- Vérifie si le compte est actif

#### Middleware d'Autorisation
```python
async def require_admin(current_user: dict = Depends(get_current_user))
async def require_super_admin(current_user: dict = Depends(get_current_user))
```
- Protection des routes administratives
- Vérification des rôles avant accès

### 3. Sécurité des Paiements

#### Protection contre la Manipulation de Prix
- ✅ Packages de paiement définis côté serveur uniquement
- ✅ Le frontend n'envoie que l'ID du package
- ✅ Montants récupérés depuis la base de données backend
- ✅ Impossible de modifier les prix depuis le client

#### Intégration Stripe Sécurisée
- Clé API Stripe stockée en variable d'environnement
- Webhooks signés pour validation
- URLs de succès/annulation dynamiques
- Transactions enregistrées avec statut de paiement

#### Prévention des Doubles Paiements
- Vérification du statut avant crédit du compte
- Une seule mise à jour par session_id
- Suivi des transactions dans la base de données

### 4. Validation des Données

#### Validation avec Pydantic
- Tous les inputs validés avec des modèles Pydantic
- Validation des types de données
- Validation des emails avec EmailStr
- Validation des énumérations (rôles, statuts)

#### Protection CORS
- Configuration CORS côté serveur
- Origines contrôlées via variable d'environnement
- Headers et méthodes autorisés configurables

### 5. Protection de la Base de Données

#### MongoDB
- Connexion sécurisée via MONGO_URL
- Pas d'injection NoSQL (utilisation de l'ODM Motor)
- Indexation appropriée pour les performances
- Exclusion des champs sensibles dans les requêtes (_id, password)

#### Gestion des Mots de Passe
- Hachage bcrypt avec salage
- Jamais retournés dans les API
- Validation de force (à implémenter côté frontend)

### 6. Isolation des Rôles

#### Super Admin
- **Protections** :
  - Ne peut pas être désactivé par d'autres admins
  - Seul rôle pouvant créer d'autres admins
  - Accès à toutes les fonctionnalités

#### Admin
- Peut gérer les utilisateurs (sauf super admin)
- Accès aux statistiques globales
- Ne peut pas créer d'autres admins

#### Utilisateurs Réguliers
- Accès limité à leurs propres ressources
- Validation de propriété sur les modifications
- Isolation des données entre utilisateurs

### 7. Gestion des Sessions

#### Statuts de Compte
- Champ `is_active` pour désactiver les comptes
- Vérification à chaque requête authentifiée
- Empêche l'accès des comptes désactivés

#### Expiration de Token
- Tokens JWT avec expiration automatique
- Renouvellement nécessaire après 24h
- Pas de tokens de rafraîchissement (pour simplifier)

## Bonnes Pratiques Implémentées

### ✅ Sécurité Implémentée

1. **Hachage de Mots de Passe** : bcrypt avec salage
2. **Authentication JWT** : Tokens avec expiration
3. **RBAC** : Contrôle d'accès basé sur les rôles
4. **Validation des Données** : Pydantic pour tous les inputs
5. **Protection des Paiements** : Pas de montants du frontend
6. **CORS** : Configuration stricte
7. **Isolation des Données** : Utilisateurs ne voient que leurs données
8. **Protection Super Admin** : Ne peut pas être modifié
9. **Audit des Transactions** : Enregistrement de tous les paiements
10. **URLs Dynamiques** : Pas de hardcoding des URLs de callback

### 🔄 Améliorations Futures Recommandées

1. **Rate Limiting** : Limiter les tentatives de connexion
2. **2FA** : Authentification à deux facteurs
3. **Logs d'Audit** : Enregistrement des actions sensibles
4. **Validation de Mot de Passe** : Force minimum du mot de passe
5. **Cryptage des Données Sensibles** : Chiffrement des PII
6. **Monitoring de Sécurité** : Détection d'anomalies
7. **Backups Automatiques** : Sauvegarde régulière de la DB
8. **Certificats SSL** : HTTPS obligatoire en production
9. **Tokens de Rafraîchissement** : Pour sessions plus longues
10. **Webhook Validation** : Vérification des signatures Stripe

## Configuration de Production

### Variables d'Environnement Critiques

```env
# À CHANGER EN PRODUCTION !
JWT_SECRET=<secret-fort-et-aleatoire-256-bits>
STRIPE_API_KEY=<cle-stripe-production>
MONGO_URL=<url-mongodb-securisee>
CORS_ORIGINS=<domaines-autorises-uniquement>
```

### Checklist de Déploiement Sécurisé

- [ ] Changer JWT_SECRET par une valeur aléatoire forte
- [ ] Utiliser HTTPS uniquement
- [ ] Configurer CORS avec origines spécifiques
- [ ] Utiliser une base de données avec authentification
- [ ] Activer les logs de sécurité
- [ ] Configurer un pare-feu
- [ ] Limiter les tentatives de connexion
- [ ] Activer le monitoring
- [ ] Configurer des backups automatiques
- [ ] Tester la sécurité avec un audit

## Credentials Super Admin Initial

Un script est fourni pour créer le premier super admin :

```bash
cd /app/backend
python init_super_admin.py
```

⚠️ **Important** : Changez le mot de passe après la première connexion !

## Support

Pour signaler une vulnérabilité de sécurité, contactez : security@rtb-platform.com

---

**Note** : Cette plateforme implémente des mesures de sécurité robustes, mais une révision de sécurité professionnelle est recommandée avant le déploiement en production.
