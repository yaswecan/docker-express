# Documentation WebSocket (Socket.IO)

## Vue d'ensemble

L'API utilise **Socket.IO** pour fournir des mises à jour en temps réel aux clients connectés. Lorsqu'un nouveau post est créé, tous les clients connectés reçoivent une notification instantanée via WebSocket.

## Configuration

### Serveur Socket.IO

**URL de connexion**: `http://localhost:3000`

**Configuration CORS**:

- Origins autorisées: `http://localhost:5173`, `http://localhost:3000`
- Méthodes: `GET`, `POST`
- Credentials: `true`

## Événements WebSocket

### 1. Connexion au serveur

#### Côté Client (JavaScript)

```javascript
import { io } from "socket.io-client";

const socket = io("http://localhost:3000", {
  withCredentials: true,
});

socket.on("connect", () => {
  console.log("✅ Connecté au serveur WebSocket:", socket.id);
});

socket.on("disconnect", () => {
  console.log("❌ Déconnecté du serveur WebSocket");
});
```

### 2. Événement: `newPost`

Cet événement est émis automatiquement par le serveur lorsqu'un nouveau post est créé via l'endpoint `POST /api/posts`.

#### Structure de l'événement

**Nom de l'événement**: `newPost`

**Données émises**:

```javascript
{
  id: number,              // ID du post
  author: string,          // Nom d'utilisateur de l'auteur
  author_image_url: string | null,  // URL de l'image de profil de l'auteur
  user_id: number,         // ID de l'utilisateur auteur
  image_url: string | null,  // URL de l'image du post
  content: string,         // Contenu du post
  likes: number,           // Nombre de likes (0 pour un nouveau post)
  created_at: string,      // Date de création (ISO 8601)
  comments: []             // Tableau de commentaires (vide pour un nouveau post)
}
```

#### Exemple de données reçues

```json
{
  "id": 8654,
  "author": "swaggertest",
  "author_image_url": null,
  "user_id": 3,
  "image_url": "https://example.com/test.jpg",
  "content": "Test post from Swagger testing!",
  "likes": 0,
  "created_at": "2025-10-24T17:28:55.000Z",
  "comments": []
}
```

#### Écouter l'événement (Côté Client)

```javascript
socket.on("newPost", (post) => {
  console.log("📡 Nouveau post reçu:", post);

  // Ajouter le post à votre interface utilisateur
  addPostToUI(post);

  // Afficher une notification
  showNotification(`Nouveau post de ${post.author}`);
});
```

## Intégration avec l'API REST

### Flux de création de post

1. **Client A** envoie une requête `POST /api/posts` avec un token JWT
2. **Serveur** crée le post dans la base de données
3. **Serveur** émet l'événement `newPost` via Socket.IO
4. **Tous les clients connectés** (y compris Client A) reçoivent le nouveau post
5. **Serveur** retourne la réponse HTTP au Client A

```
Client A                    Serveur                     Clients B, C, D
   |                           |                              |
   |-- POST /api/posts ------->|                              |
   |                           |                              |
   |                           |-- Créer post en DB           |
   |                           |                              |
   |                           |-- emit('newPost', data) ---->|
   |                           |                              |
   |<-- 201 Created ----------|                              |
   |                           |                              |
   |<-- WebSocket: newPost ----|                              |
   |                           |<-- WebSocket: newPost -------|
```

## Exemples d'implémentation

### React avec Socket.IO Client

```javascript
import { useEffect, useState } from "react";
import { io } from "socket.io-client";

function PostsFeed() {
  const [posts, setPosts] = useState([]);
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    // Connexion au serveur WebSocket
    const newSocket = io("http://localhost:3000", {
      withCredentials: true,
    });

    newSocket.on("connect", () => {
      console.log("✅ Connecté:", newSocket.id);
    });

    // Écouter les nouveaux posts
    newSocket.on("newPost", (post) => {
      console.log("📡 Nouveau post:", post);
      setPosts((prevPosts) => [post, ...prevPosts]);
    });

    newSocket.on("disconnect", () => {
      console.log("❌ Déconnecté");
    });

    setSocket(newSocket);

    // Nettoyage à la déconnexion du composant
    return () => {
      newSocket.close();
    };
  }, []);

  return (
    <div>
      {posts.map((post) => (
        <PostCard key={post.id} post={post} />
      ))}
    </div>
  );
}
```

### Vanilla JavaScript

```javascript
// Connexion
const socket = io("http://localhost:3000");

// Gestion de la connexion
socket.on("connect", () => {
  console.log("✅ Connecté au serveur WebSocket");
  document.getElementById("status").textContent = "Connecté";
});

// Écouter les nouveaux posts
socket.on("newPost", (post) => {
  console.log("📡 Nouveau post reçu:", post);

  // Créer un élément HTML pour le post
  const postElement = document.createElement("div");
  postElement.className = "post";
  postElement.innerHTML = `
    <div class="post-header">
      <img src="${post.author_image_url || "/default-avatar.png"}" alt="${
    post.author
  }">
      <span>${post.author}</span>
    </div>
    <div class="post-content">${post.content}</div>
    ${post.image_url ? `<img src="${post.image_url}" alt="Post image">` : ""}
    <div class="post-footer">
      <span>❤️ ${post.likes}</span>
      <span>💬 ${post.comments.length}</span>
    </div>
  `;

  // Ajouter au début de la liste
  const postsContainer = document.getElementById("posts");
  postsContainer.insertBefore(postElement, postsContainer.firstChild);

  // Animation d'apparition
  postElement.classList.add("new-post-animation");
});

// Gestion de la déconnexion
socket.on("disconnect", () => {
  console.log("❌ Déconnecté du serveur WebSocket");
  document.getElementById("status").textContent = "Déconnecté";
});

// Gestion des erreurs
socket.on("connect_error", (error) => {
  console.error("❌ Erreur de connexion:", error);
});
```

## Code Serveur (Référence)

### Émission de l'événement dans `api.js`

```javascript
// POST /api/posts - Créer un nouveau post
router.post("/posts", authenticateToken, async (req, res) => {
  try {
    const { image_url, content } = req.body;
    const user_id = req.user.id;

    // ... validation et création du post ...

    // Émettre l'événement Socket.IO pour notifier les clients
    try {
      const io = getIO();
      io.emit("newPost", postWithComments);
      console.log(
        `📡 Notification Socket.IO envoyée pour le nouveau post #${result.insertId}`
      );
    } catch (error) {
      console.log("⚠️ Socket.IO pas disponible, notification ignorée");
    }

    res.status(201).json({
      message: "Post créé avec succès",
      post: postWithComments,
    });
  } catch (error) {
    // ... gestion d'erreur ...
  }
});
```

## Tests WebSocket

### Test avec Socket.IO Client (Node.js)

```javascript
const io = require("socket.io-client");

const socket = io("http://localhost:3000");

socket.on("connect", () => {
  console.log("✅ Connecté:", socket.id);
});

socket.on("newPost", (post) => {
  console.log("📡 Nouveau post reçu:");
  console.log(JSON.stringify(post, null, 2));
});

socket.on("disconnect", () => {
  console.log("❌ Déconnecté");
});

// Garder la connexion ouverte
setTimeout(() => {
  console.log("Test terminé");
  socket.close();
}, 60000); // 60 secondes
```

### Test avec curl + Socket.IO

1. **Terminal 1**: Écouter les événements WebSocket

```bash
npm install -g socket.io-client
node test-websocket.js
```

2. **Terminal 2**: Créer un post via l'API

```bash
TOKEN="votre_token_jwt"
curl -X POST http://localhost:3000/api/posts \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"content":"Test WebSocket","image_url":"https://example.com/test.jpg"}'
```

3. **Terminal 1**: Vous devriez voir le nouveau post apparaître

## Avantages des WebSockets

✅ **Temps réel**: Les clients reçoivent les mises à jour instantanément
✅ **Bidirectionnel**: Communication dans les deux sens
✅ **Efficace**: Pas besoin de polling HTTP
✅ **Scalable**: Supporte de nombreuses connexions simultanées
✅ **Automatique**: Reconnexion automatique en cas de déconnexion

## Cas d'usage

1. **Feed en temps réel**: Afficher les nouveaux posts sans rafraîchir la page
2. **Notifications**: Alerter les utilisateurs de nouveaux contenus
3. **Collaboration**: Plusieurs utilisateurs voient les mêmes mises à jour
4. **Dashboard**: Mise à jour en temps réel des statistiques

## Dépannage

### Problème: Pas de connexion WebSocket

**Vérifications**:

1. Le serveur backend est démarré
2. L'URL de connexion est correcte (`http://localhost:3000`)
3. Les CORS sont configurés pour votre origine
4. Socket.IO client est installé: `npm install socket.io-client`

### Problème: Événements non reçus

**Vérifications**:

1. Le listener est bien configuré: `socket.on('newPost', ...)`
2. Le socket est connecté: vérifier l'événement `connect`
3. Vérifier les logs serveur pour confirmer l'émission
4. Tester avec plusieurs clients pour confirmer la diffusion

### Problème: Erreur CORS

**Solution**: Ajouter votre origine dans `backend/src/config/socket.js`:

```javascript
cors: {
  origin: ["http://localhost:5173", "http://localhost:3000", "votre-origine"],
  methods: ["GET", "POST"],
  credentials: true,
}
```

## Ressources

- [Socket.IO Documentation](https://socket.io/docs/v4/)
- [Socket.IO Client API](https://socket.io/docs/v4/client-api/)
- [Socket.IO Server API](https://socket.io/docs/v4/server-api/)

## Résumé

L'API utilise Socket.IO pour diffuser en temps réel les nouveaux posts créés. Tous les clients connectés reçoivent automatiquement l'événement `newPost` avec les données complètes du post, permettant une mise à jour instantanée de l'interface utilisateur sans nécessiter de rafraîchissement de page.
