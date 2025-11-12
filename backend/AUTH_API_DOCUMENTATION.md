# Documentation API d'Authentification JWT

## Vue d'ensemble

Cette API utilise JWT (JSON Web Tokens) pour l'authentification. Les tokens sont valides pendant 7 jours par défaut.

## Configuration

### Variables d'environnement

Vous pouvez configurer les paramètres JWT via les variables d'environnement :

```env
JWT_SECRET=votre_secret_jwt_super_securise
JWT_EXPIRES_IN=7d
```

## Endpoints d'authentification

### 1. Inscription (Register)

**Endpoint:** `POST /api/auth/register`

**Description:** Créer un nouveau compte utilisateur

**Body (JSON):**

```json
{
  "username": "john_doe",
  "email": "john@example.com",
  "password": "motdepasse123"
}
```

**Réponse succès (201):**

```json
{
  "message": "Utilisateur créé avec succès",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "username": "john_doe",
    "email": "john@example.com",
    "created_at": "2024-01-01T12:00:00.000Z"
  }
}
```

**Erreurs possibles:**

- `400` - Champs manquants ou invalides
- `409` - Email ou username déjà utilisé

---

### 2. Connexion (Login)

**Endpoint:** `POST /api/auth/login`

**Description:** Se connecter avec un compte existant

**Body (JSON):**

```json
{
  "email": "john@example.com",
  "password": "motdepasse123"
}
```

**Réponse succès (200):**

```json
{
  "message": "Connexion réussie",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "username": "john_doe",
    "email": "john@example.com",
    "created_at": "2024-01-01T12:00:00.000Z"
  }
}
```

**Erreurs possibles:**

- `400` - Champs manquants
- `401` - Identifiants invalides

---

### 3. Profil utilisateur (Me)

**Endpoint:** `GET /api/auth/me`

**Description:** Récupérer les informations de l'utilisateur connecté

**Headers:**

```
Authorization: Bearer <token>
```

**Réponse succès (200):**

```json
{
  "user": {
    "id": 1,
    "username": "john_doe",
    "email": "john@example.com",
    "created_at": "2024-01-01T12:00:00.000Z"
  }
}
```

**Erreurs possibles:**

- `401` - Token manquant
- `403` - Token invalide ou expiré

---

### 4. Déconnexion (Logout)

**Endpoint:** `POST /api/auth/logout`

**Description:** Déconnecter l'utilisateur (principalement côté client)

**Headers:**

```
Authorization: Bearer <token>
```

**Réponse succès (200):**

```json
{
  "message": "Déconnexion réussie"
}
```

---

### 5. Mise à jour du profil

**Endpoint:** `PUT /api/auth/update-profile`

**Description:** Mettre à jour le nom d'utilisateur

**Headers:**

```
Authorization: Bearer <token>
```

**Body (JSON):**

```json
{
  "username": "nouveau_username"
}
```

**Réponse succès (200):**

```json
{
  "message": "Profil mis à jour avec succès",
  "user": {
    "id": 1,
    "username": "nouveau_username",
    "email": "john@example.com",
    "created_at": "2024-01-01T12:00:00.000Z"
  }
}
```

**Erreurs possibles:**

- `400` - Champ manquant
- `401` - Non authentifié
- `409` - Username déjà utilisé

---

### 6. Changement de mot de passe

**Endpoint:** `PUT /api/auth/change-password`

**Description:** Changer le mot de passe de l'utilisateur

**Headers:**

```
Authorization: Bearer <token>
```

**Body (JSON):**

```json
{
  "currentPassword": "ancien_mot_de_passe",
  "newPassword": "nouveau_mot_de_passe"
}
```

**Réponse succès (200):**

```json
{
  "message": "Mot de passe changé avec succès"
}
```

**Erreurs possibles:**

- `400` - Champs manquants ou nouveau mot de passe trop court
- `401` - Mot de passe actuel incorrect

---

## Routes protégées

Les routes suivantes nécessitent un token JWT valide dans le header `Authorization`:

### Posts

- `POST /api/posts` - Créer un nouveau post
- `POST /api/posts/:id/comments` - Ajouter un commentaire
- `PUT /api/posts/:id/like` - Liker un post

### Utilisation du token

Pour accéder aux routes protégées, incluez le token dans le header Authorization :

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## Exemples avec cURL

### Inscription

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "john_doe",
    "email": "john@example.com",
    "password": "motdepasse123"
  }'
```

### Connexion

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "motdepasse123"
  }'
```

### Créer un post (avec authentification)

```bash
curl -X POST http://localhost:3000/api/posts \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "content": "Mon premier post!",
    "image_url": "https://example.com/image.jpg"
  }'
```

### Récupérer le profil

```bash
curl -X GET http://localhost:3000/api/auth/me \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

## Exemples avec JavaScript (Fetch API)

### Inscription

```javascript
const response = await fetch("http://localhost:3000/api/auth/register", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    username: "john_doe",
    email: "john@example.com",
    password: "motdepasse123",
  }),
});

const data = await response.json();
// Sauvegarder le token
localStorage.setItem("token", data.token);
```

### Connexion

```javascript
const response = await fetch("http://localhost:3000/api/auth/login", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    email: "john@example.com",
    password: "motdepasse123",
  }),
});

const data = await response.json();
localStorage.setItem("token", data.token);
```

### Créer un post (avec authentification)

```javascript
const token = localStorage.getItem("token");

const response = await fetch("http://localhost:3000/api/posts", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  },
  body: JSON.stringify({
    content: "Mon premier post!",
    image_url: "https://example.com/image.jpg",
  }),
});

const data = await response.json();
```

## Gestion des erreurs

Toutes les erreurs suivent le format suivant :

```json
{
  "error": "Type d'erreur",
  "message": "Description détaillée de l'erreur"
}
```

### Codes d'erreur courants

- `400` - Bad Request (données invalides)
- `401` - Unauthorized (non authentifié)
- `403` - Forbidden (token invalide/expiré)
- `404` - Not Found (ressource non trouvée)
- `409` - Conflict (ressource déjà existante)
- `500` - Internal Server Error (erreur serveur)

## Sécurité

### Bonnes pratiques

1. **Stockage du token côté client:**

   - Utilisez `localStorage` ou `sessionStorage` pour stocker le token
   - Ne stockez jamais le token dans les cookies sans flag `httpOnly`

2. **Transmission du token:**

   - Toujours utiliser HTTPS en production
   - Inclure le token dans le header `Authorization`

3. **Gestion de l'expiration:**

   - Vérifier la validité du token avant chaque requête
   - Rediriger vers la page de connexion si le token est expiré

4. **Mot de passe:**
   - Minimum 6 caractères (configurable)
   - Les mots de passe sont hashés avec bcrypt (10 rounds de salt)

### Configuration en production

En production, assurez-vous de :

1. Définir une variable d'environnement `JWT_SECRET` forte et unique
2. Utiliser HTTPS pour toutes les communications
3. Configurer CORS correctement
4. Implémenter un rate limiting pour prévenir les attaques par force brute
5. Ajouter des logs pour surveiller les tentatives de connexion

## Base de données

### Table users

```sql
CREATE TABLE users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  username VARCHAR(255) NOT NULL UNIQUE,
  email VARCHAR(255) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Relation avec les posts

Les posts sont maintenant liés aux utilisateurs via `user_id`:

```sql
ALTER TABLE posts ADD COLUMN user_id INT;
ALTER TABLE posts ADD FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL;
```
