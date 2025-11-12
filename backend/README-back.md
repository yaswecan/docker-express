# Configuration MySQL et phpMyAdmin

## Vue d'ensemble

Ce projet utilise MySQL comme base de données et phpMyAdmin pour la gestion de la base de données via une interface web.

## Services Docker

### MySQL

- **Image**: mysql:8.0
- **Port**: 3306
- **Container**: mysql-db
- **Base de données**: social_media_db

### phpMyAdmin

- **Image**: phpmyadmin:latest
- **Port**: 8080
- **Container**: phpmyadmin
- **URL**: http://localhost:8080

### Backend (Express)

- **Port**: 3000
- **Container**: express-backend

## Structure de la base de données

### Table: posts

```sql
CREATE TABLE posts (
  id INT PRIMARY KEY AUTO_INCREMENT,
  author VARCHAR(255) NOT NULL,
  image_url VARCHAR(500),
  content TEXT NOT NULL,
  likes INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Table: comments

```sql
CREATE TABLE comments (
  id INT PRIMARY KEY AUTO_INCREMENT,
  post_id INT NOT NULL,
  user VARCHAR(255) NOT NULL,
  comment TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE
);
```

## Démarrage

### 1. Démarrer tous les services

```bash
cd backend
docker-compose up -d
```

### 2. Vérifier les logs

```bash
docker-compose logs -f backend
```

### 3. Accéder aux services

- **Backend API**: http://localhost:3000
- **phpMyAdmin**: http://localhost:8080
- **API Posts**: http://localhost:3000/api/posts

## 📝 Migration des données

Au premier démarrage, le backend va automatiquement :

1. Créer les tables `posts` et `comments`
2. Migrer les 30 posts existants depuis `data/posts.js`
3. Migrer tous les commentaires associés

## 🔒 Sécurité

⚠️ **Important**: Les identifiants par défaut sont pour le développement uniquement.
En production, vous devez :

- Changer tous les mots de passe
- Utiliser des variables d'environnement sécurisées
- Limiter l'accès à phpMyAdmin
- Utiliser HTTPS
