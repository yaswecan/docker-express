# Comment Consulter la Documentation Swagger API

## 🔌 Fonctionnalités Temps Réel

**Important**: Cette API utilise **WebSocket (Socket.IO)** pour les mises à jour en temps réel!

Lorsqu'un nouveau post est créé via `POST /api/posts`, tous les clients connectés reçoivent automatiquement une notification via l'événement `newPost`.

📖 **Documentation complète**: Voir [WEBSOCKET_DOCUMENTATION.md](./WEBSOCKET_DOCUMENTATION.md)

## 🚀 Accès Rapide

### Étape 1: Démarrer le serveur backend

```bash
cd backend
npm start
```

### Étape 2: Ouvrir la documentation dans votre navigateur

Une fois le serveur démarré, ouvrez votre navigateur et accédez à:

```
http://localhost:3000/api-docs
```

## 📖 Interface Swagger UI

Vous verrez une interface interactive avec:

### 1. **Section Authentication** (Authentification)

- `POST /api/auth/register` - Créer un nouveau compte
- `POST /api/auth/login` - Se connecter
- `GET /api/auth/me` - Voir son profil (🔒 protégé)
- `POST /api/auth/logout` - Se déconnecter (🔒 protégé)
- `PUT /api/auth/update-profile` - Modifier son profil (🔒 protégé)
- `PUT /api/auth/change-password` - Changer son mot de passe (🔒 protégé)

### 2. **Section Posts** (Publications)

- `GET /api/posts` - Voir tous les posts
- `GET /api/posts/{id}` - Voir un post spécifique
- `POST /api/posts` - Créer un post (🔒 protégé)
- `POST /api/posts/{id}/comments` - Ajouter un commentaire (🔒 protégé)
- `PUT /api/posts/{id}/like` - Liker un post (🔒 protégé)
- `POST /api/posts/generate` - Générer des posts automatiquement

## 🔐 Tester les Endpoints Protégés

### Étape 1: Se connecter

1. Cliquez sur `POST /api/auth/login`
2. Cliquez sur **"Try it out"**
3. Entrez vos identifiants:
   ```json
   {
     "email": "votre@email.com",
     "password": "votremotdepasse"
   }
   ```
4. Cliquez sur **"Execute"**
5. **Copiez le token** dans la réponse

### Étape 2: Autoriser avec le token

1. Cliquez sur le bouton **"Authorize"** 🔓 en haut de la page
2. Dans le champ qui apparaît, entrez: `Bearer VOTRE_TOKEN`
   - Exemple: `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
3. Cliquez sur **"Authorize"**
4. Cliquez sur **"Close"**

### Étape 3: Tester les endpoints protégés

Maintenant vous pouvez tester tous les endpoints marqués avec 🔒

## 💡 Exemples d'Utilisation

### Créer un Post (avec notification WebSocket)

1. Allez sur `POST /api/posts`
2. Cliquez sur **"Try it out"**
3. Entrez:
   ```json
   {
     "content": "Mon premier post!",
     "image_url": "https://example.com/image.jpg"
   }
   ```
4. Cliquez sur **"Execute"**

**🔔 Note**: Après la création, tous les clients connectés via WebSocket recevront ce post en temps réel!

### Ajouter un Commentaire

1. Allez sur `POST /api/posts/{id}/comments`
2. Cliquez sur **"Try it out"**
3. Entrez l'ID du post (exemple: 1)
4. Entrez:
   ```json
   {
     "comment": "Super post!"
   }
   ```
5. Cliquez sur **"Execute"**

### Liker un Post

1. Allez sur `PUT /api/posts/{id}/like`
2. Cliquez sur **"Try it out"**
3. Entrez l'ID du post
4. Cliquez sur **"Execute"**

## 📱 Fonctionnalités de l'Interface

### Pour chaque endpoint, vous pouvez voir:

- ✅ **Description**: Ce que fait l'endpoint
- ✅ **Paramètres**: Les données requises
- ✅ **Exemples**: Des exemples de requêtes
- ✅ **Réponses**: Les différentes réponses possibles (200, 400, 401, etc.)
- ✅ **Schémas**: La structure des données

### Boutons disponibles:

- **"Try it out"**: Activer le mode test
- **"Execute"**: Envoyer la requête
- **"Clear"**: Effacer les données
- **"Authorize"**: S'authentifier avec un token JWT

## 🔌 WebSocket - Mises à Jour en Temps Réel

### Qu'est-ce que c'est?

Lorsque vous créez un post, le serveur:

1. ✅ Crée le post dans la base de données
2. ✅ Retourne le post dans la réponse HTTP (201)
3. ✅ **Émet un événement `newPost` via WebSocket à tous les clients connectés**

### Comment l'utiliser?

**Exemple avec JavaScript**:

```javascript
import { io } from "socket.io-client";

// Se connecter au serveur WebSocket
const socket = io("http://localhost:3000");

// Écouter les nouveaux posts
socket.on("newPost", (post) => {
  console.log("📡 Nouveau post reçu:", post);
  // Ajouter le post à votre interface
});
```

**Exemple avec React**:

```javascript
useEffect(() => {
  const socket = io("http://localhost:3000");

  socket.on("newPost", (post) => {
    setPosts((prevPosts) => [post, ...prevPosts]);
  });

  return () => socket.close();
}, []);
```

📖 **Documentation complète**: [WEBSOCKET_DOCUMENTATION.md](./WEBSOCKET_DOCUMENTATION.md)

## 🎯 Cas d'Usage Courants

### 1. Créer un compte et se connecter

```
1. POST /api/auth/register → Créer un compte
2. POST /api/auth/login → Se connecter et obtenir un token
3. Authorize → Entrer le token
4. GET /api/auth/me → Vérifier son profil
```

### 2. Créer et interagir avec des posts

```
1. POST /api/posts → Créer un post
2. GET /api/posts → Voir tous les posts
3. POST /api/posts/{id}/comments → Commenter
4. PUT /api/posts/{id}/like → Liker
```

### 3. Gérer son profil

```
1. GET /api/auth/me → Voir son profil
2. PUT /api/auth/update-profile → Modifier son profil
3. PUT /api/auth/change-password → Changer son mot de passe
```

## 🔍 Codes de Réponse

- **200 OK**: Succès
- **201 Created**: Ressource créée avec succès
- **400 Bad Request**: Données invalides
- **401 Unauthorized**: Token manquant ou invalide
- **404 Not Found**: Ressource non trouvée
- **409 Conflict**: Conflit (ex: email déjà utilisé)
- **500 Internal Server Error**: Erreur serveur

## 📥 Exporter la Documentation

Vous pouvez aussi accéder à la spécification OpenAPI en JSON:

```
http://localhost:3000/api-docs.json
```

Cette URL peut être utilisée avec:

- Postman
- Insomnia
- Autres outils API

## ❓ Problèmes Courants

### "Unauthorized" (401)

- Vérifiez que vous avez cliqué sur "Authorize"
- Vérifiez que votre token est valide
- Format correct: `Bearer votre_token`

### Page non trouvée (404)

- Vérifiez que le serveur backend est démarré
- URL correcte: `http://localhost:3000/api-docs`

### Token expiré

- Reconnectez-vous avec `POST /api/auth/login`
- Copiez le nouveau token
- Cliquez à nouveau sur "Authorize"

## 🎨 Avantages de Swagger

✅ **Interface Interactive**: Testez l'API directement depuis le navigateur
✅ **Documentation Automatique**: Toujours à jour avec le code
✅ **Exemples Intégrés**: Voyez des exemples pour chaque endpoint
✅ **Validation**: Vérifiez vos requêtes avant de les envoyer
✅ **Pas besoin de Postman**: Tout est dans le navigateur

## 📚 Documentation Complète

Pour plus de détails, consultez:

- `SWAGGER_DOCUMENTATION.md` - Documentation complète en anglais
- `WEBSOCKET_DOCUMENTATION.md` - Documentation WebSocket/Socket.IO
- `AUTH_API_DOCUMENTATION.md` - Documentation de l'authentification
- `README.md` - Documentation générale du projet

## 🚀 Démarrage Rapide

```bash
# 1. Installer les dépendances (si pas déjà fait)
cd backend
npm install

# 2. Démarrer le serveur
npm start

# 3. Ouvrir dans le navigateur
# http://localhost:3000/api-docs
```

## 🌟 Résumé des Fonctionnalités

✅ **API REST**: 12 endpoints documentés avec Swagger
✅ **WebSocket**: Mises à jour en temps réel via Socket.IO
✅ **Authentification**: JWT Bearer Token
✅ **Documentation Interactive**: Testez directement depuis le navigateur
✅ **Exemples**: Code d'exemple pour chaque fonctionnalité

Voilà! Vous êtes prêt à explorer et tester votre API! 🎉
