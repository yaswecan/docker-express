## Vue d'ensemble

Cette API REST complète offre des fonctionnalités d'authentification, de gestion de posts et de commentaires, avec des mises à jour en temps réel via WebSocket.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Client Applications                      │
│  (React, Vue, Angular, Mobile Apps, etc.)                   │
└────────────┬────────────────────────────────┬───────────────┘
             │                                │
             │ HTTP REST API                  │ WebSocket
             │ (JWT Auth)                     │ (Socket.IO)
             │                                │
┌────────────▼────────────────────────────────▼───────────────┐
│                    Backend Server (Express)                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │ Auth Routes  │  │  API Routes  │  │  Socket.IO   │     │
│  │ /api/auth/*  │  │  /api/*      │  │  Events      │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              Swagger Documentation                    │  │
│  │              /api-docs                                │  │
│  └──────────────────────────────────────────────────────┘  │
└────────────────────────────┬────────────────────────────────┘
                             │
                             │ MySQL
                             │
┌────────────────────────────▼────────────────────────────────┐
│                      MySQL Database                          │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐                 │
│  │  users   │  │  posts   │  │ comments │                 │
│  └──────────┘  └──────────┘  └──────────┘                 │
└─────────────────────────────────────────────────────────────┘
```

## 🔐 Authentification (JWT)

### Endpoints

- **POST /api/auth/register** - Créer un compte
- **POST /api/auth/login** - Se connecter
- **GET /api/auth/me** - Profil utilisateur (protégé)
- **POST /api/auth/logout** - Se déconnecter (protégé)
- **PUT /api/auth/update-profile** - Modifier profil (protégé)
- **PUT /api/auth/change-password** - Changer mot de passe (protégé)

### Fonctionnalités

- ✅ Hachage des mots de passe (bcrypt)
- ✅ Tokens JWT avec expiration (24h)
- ✅ Validation des emails
- ✅ Validation des mots de passe (min 6 caractères)
- ✅ Vérification unicité email/username
- ✅ Middleware d'authentification

## 📝 Posts

### Endpoints

- **GET /api/posts** - Liste des posts (public)
- **GET /api/posts/:id** - Post spécifique (public)
- **POST /api/posts** - Créer un post (protégé)
- **PUT /api/posts/:id/like** - Liker un post (protégé)
- **POST /api/posts/generate** - Générer des posts (public)

### Fonctionnalités

- ✅ Création de posts avec contenu et image optionnelle
- ✅ Système de likes
- ✅ Association avec l'auteur
- ✅ Génération automatique de posts (cron job toutes les 5 min)
- ✅ Génération manuelle de posts (1-100)
- ✅ **Notification WebSocket lors de la création**

## 💬 Commentaires

### Endpoints

- **POST /api/posts/:id/comments** - Ajouter un commentaire (protégé)

### Fonctionnalités

- ✅ Commentaires liés aux posts
- ✅ Association avec l'auteur
- ✅ Affichage avec informations utilisateur
- ✅ Tri chronologique

## 🔌 WebSocket (Socket.IO)

### Configuration

- **URL**: `http://localhost:3000`
- **CORS**: `localhost:5173`, `localhost:3000`
- **Protocole**: Socket.IO v4

### Événements

#### `newPost`

**Déclenché**: Lors de la création d'un post via `POST /api/posts`

**Données émises**:

```javascript
{
  id: number,
  author: string,
  author_image_url: string | null,
  user_id: number,
  image_url: string | null,
  content: string,
  likes: number,
  created_at: string,
  comments: []
}
```

**Utilisation**:

```javascript
socket.on("newPost", (post) => {
  // Mise à jour de l'interface en temps réel
});
```

### Fonctionnalités

- ✅ Connexion/déconnexion automatique
- ✅ Diffusion à tous les clients connectés
- ✅ Reconnexion automatique
- ✅ Gestion des erreurs

## 📚 Documentation Interactive (Swagger)

### Accès

- **Interface**: `http://localhost:3000/api-docs`
- **JSON**: `http://localhost:3000/api-docs.json`

### Fonctionnalités

- ✅ Documentation OpenAPI 3.0
- ✅ Interface interactive Swagger UI
- ✅ Test des endpoints depuis le navigateur
- ✅ Authentification Bearer Token intégrée
- ✅ Schémas de données détaillés
- ✅ Exemples de requêtes/réponses
- ✅ Codes d'erreur documentés

### Schémas Documentés

- User, Post, Comment, Error
- RegisterRequest, LoginRequest
- CreatePostRequest, CreateCommentRequest
- UpdateProfileRequest, ChangePasswordRequest
- GeneratePostsRequest

## 🗄️ Base de Données (MySQL)

### Tables

#### `users`

```sql
- id (INT, PRIMARY KEY, AUTO_INCREMENT)
- username (VARCHAR, UNIQUE)
- email (VARCHAR, UNIQUE)
- password (VARCHAR, hashed)
- image_url (VARCHAR, nullable)
- created_at (TIMESTAMP)
```

#### `posts`

```sql
- id (INT, PRIMARY KEY, AUTO_INCREMENT)
- user_id (INT, FOREIGN KEY → users.id)
- content (TEXT)
- image_url (VARCHAR, nullable)
- likes (INT, default 0)
- created_at (TIMESTAMP)
```

#### `comments`

```sql
- id (INT, PRIMARY KEY, AUTO_INCREMENT)
- post_id (INT, FOREIGN KEY → posts.id)
- user_id (INT, FOREIGN KEY → users.id)
- comment (TEXT)
- created_at (TIMESTAMP)
```

### Fonctionnalités

- ✅ Initialisation automatique des tables
- ✅ Migration des données depuis JSON

## 🤖 Automatisation

### Cron Job

- **Fréquence**: Toutes les 5 minutes
- **Action**: Génère 10 posts automatiquement
- **Librairie**: node-cron
- **Statut**: Actif au démarrage du serveur

### Fonctionnalités

- ✅ Génération automatique de contenu
- ✅ Posts avec images aléatoires
- ✅ Attribution à des utilisateurs existants

## 🔒 Sécurité

### Mesures Implémentées

- ✅ **Hachage des mots de passe**: bcrypt avec salt
- ✅ **JWT**: Tokens signés avec secret
- ✅ **CORS**: Configuration stricte
- ✅ **Validation**: Données entrantes validées
- ✅ **Middleware Auth**: Protection des routes sensibles
- ✅ **SQL Injection**: Requêtes préparées (mysql2)

### Headers de Sécurité

- Content-Type validation
- Authorization Bearer Token
- CORS headers

## 📊 Codes de Réponse HTTP

### Succès

- **200 OK**: Requête réussie
- **201 Created**: Ressource créée

### Erreurs Client

- **400 Bad Request**: Données invalides
- **401 Unauthorized**: Non authentifié
- **404 Not Found**: Ressource introuvable
- **409 Conflict**: Conflit (email/username existant)

### Erreurs Serveur

- **500 Internal Server Error**: Erreur serveur

## 🛠️ Technologies Utilisées

### Backend

- **Express.js** - Framework web
- **MySQL2** - Driver MySQL avec Promises
- **bcryptjs** - Hachage de mots de passe
- **jsonwebtoken** - Authentification JWT
- **Socket.IO** - WebSocket temps réel
- **node-cron** - Tâches planifiées
- **cors** - Gestion CORS

### Documentation

- **swagger-jsdoc** - Génération OpenAPI
- **swagger-ui-express** - Interface Swagger

### DevOps

- **Docker** - Conteneurisation
- **docker-compose** - Orchestration
- **nodemon** - Hot reload (dev)

## 📖 Documentation Disponible

### Fichiers Créés

1. **`SWAGGER_DOCUMENTATION.md`** - Guide Swagger complet (EN)
2. **`COMMENT_UTILISER_SWAGGER.md`** - Guide Swagger (FR)
3. **`WEBSOCKET_DOCUMENTATION.md`** - Documentation WebSocket complète
4. **`SWAGGER_TEST_RESULTS.md`** - Résultats des tests
5. **`AUTH_API_DOCUMENTATION.md`** - Documentation authentification
6. **`API_FEATURES.md`** - Ce fichier (récapitulatif)

### Accès Rapide

- Swagger UI: http://localhost:3000/api-docs
- API Root: http://localhost:3000/
- WebSocket: ws://localhost:3000

## 🚀 Démarrage Rapide

```bash
# 1. Installer les dépendances
cd backend
npm install

# 2. Démarrer le serveur
npm start

# 3. Accéder à la documentation
# http://localhost:3000/api-docs
```

## 🎯 Cas d'Usage

### 1. Application de Réseau Social

- Création de posts
- Commentaires
- Likes
- Profils utilisateurs
- Feed en temps réel

### Création d'un Post

```
1. Client → POST /api/posts (avec JWT)
2. Serveur → Valide le token
3. Serveur → Crée le post en DB
4. Serveur → Émet 'newPost' via WebSocket
5. Serveur → Retourne 201 + post au client
6. Tous les clients → Reçoivent 'newPost'
```

### Authentification

```
1. Client → POST /api/auth/login
2. Serveur → Vérifie credentials
3. Serveur → Génère JWT token
4. Serveur → Retourne token + user
5. Client → Stocke token
6. Client → Utilise token pour requêtes protégées
```
