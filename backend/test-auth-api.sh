#!/bin/bash

# Script de test pour l'API d'authentification JWT
# Ce script teste tous les endpoints d'authentification

BASE_URL="http://localhost:3000/api"
echo "🧪 Test de l'API d'authentification JWT"
echo "========================================"
echo ""

# Couleurs pour l'affichage
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test 1: Inscription d'un nouvel utilisateur
echo -e "${BLUE}📝 Test 1: Inscription d'un nouvel utilisateur${NC}"
REGISTER_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@example.com",
    "password": "password123"
  }')

echo "$REGISTER_RESPONSE" | jq '.'
TOKEN=$(echo "$REGISTER_RESPONSE" | jq -r '.token')

if [ "$TOKEN" != "null" ] && [ -n "$TOKEN" ]; then
  echo -e "${GREEN}✅ Inscription réussie!${NC}"
  echo "Token: $TOKEN"
else
  echo -e "${RED}❌ Échec de l'inscription${NC}"
fi
echo ""

# Test 2: Connexion avec le compte créé
echo -e "${BLUE}🔐 Test 2: Connexion${NC}"
LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }')

echo "$LOGIN_RESPONSE" | jq '.'
LOGIN_TOKEN=$(echo "$LOGIN_RESPONSE" | jq -r '.token')

if [ "$LOGIN_TOKEN" != "null" ] && [ -n "$LOGIN_TOKEN" ]; then
  echo -e "${GREEN}✅ Connexion réussie!${NC}"
  TOKEN=$LOGIN_TOKEN
else
  echo -e "${RED}❌ Échec de la connexion${NC}"
fi
echo ""

# Test 3: Récupérer le profil utilisateur
echo -e "${BLUE}👤 Test 3: Récupération du profil${NC}"
ME_RESPONSE=$(curl -s -X GET "$BASE_URL/auth/me" \
  -H "Authorization: Bearer $TOKEN")

echo "$ME_RESPONSE" | jq '.'

if echo "$ME_RESPONSE" | jq -e '.user' > /dev/null; then
  echo -e "${GREEN}✅ Profil récupéré avec succès!${NC}"
else
  echo -e "${RED}❌ Échec de la récupération du profil${NC}"
fi
echo ""

# Test 4: Créer un post (route protégée)
echo -e "${BLUE}📄 Test 4: Création d'un post (route protégée)${NC}"
POST_RESPONSE=$(curl -s -X POST "$BASE_URL/posts" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "content": "Mon premier post avec authentification JWT! 🎉",
    "image_url": "https://picsum.photos/400/300"
  }')

echo "$POST_RESPONSE" | jq '.'

if echo "$POST_RESPONSE" | jq -e '.post' > /dev/null; then
  echo -e "${GREEN}✅ Post créé avec succès!${NC}"
  POST_ID=$(echo "$POST_RESPONSE" | jq -r '.post.id')
  echo "ID du post: $POST_ID"
else
  echo -e "${RED}❌ Échec de la création du post${NC}"
fi
echo ""

# Test 5: Ajouter un commentaire (route protégée)
if [ -n "$POST_ID" ]; then
  echo -e "${BLUE}💬 Test 5: Ajout d'un commentaire (route protégée)${NC}"
  COMMENT_RESPONSE=$(curl -s -X POST "$BASE_URL/posts/$POST_ID/comments" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $TOKEN" \
    -d '{
      "comment": "Super post! 👍"
    }')

  echo "$COMMENT_RESPONSE" | jq '.'

  if echo "$COMMENT_RESPONSE" | jq -e '.comment' > /dev/null; then
    echo -e "${GREEN}✅ Commentaire ajouté avec succès!${NC}"
  else
    echo -e "${RED}❌ Échec de l'ajout du commentaire${NC}"
  fi
  echo ""
fi

# Test 6: Liker un post (route protégée)
if [ -n "$POST_ID" ]; then
  echo -e "${BLUE}❤️  Test 6: Liker un post (route protégée)${NC}"
  LIKE_RESPONSE=$(curl -s -X PUT "$BASE_URL/posts/$POST_ID/like" \
    -H "Authorization: Bearer $TOKEN")

  echo "$LIKE_RESPONSE" | jq '.'

  if echo "$LIKE_RESPONSE" | jq -e '.post' > /dev/null; then
    echo -e "${GREEN}✅ Like ajouté avec succès!${NC}"
  else
    echo -e "${RED}❌ Échec de l'ajout du like${NC}"
  fi
  echo ""
fi

# Test 7: Mise à jour du profil
echo -e "${BLUE}✏️  Test 7: Mise à jour du profil${NC}"
UPDATE_RESPONSE=$(curl -s -X PUT "$BASE_URL/auth/update-profile" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "username": "testuser_updated"
  }')

echo "$UPDATE_RESPONSE" | jq '.'

if echo "$UPDATE_RESPONSE" | jq -e '.user' > /dev/null; then
  echo -e "${GREEN}✅ Profil mis à jour avec succès!${NC}"
else
  echo -e "${RED}❌ Échec de la mise à jour du profil${NC}"
fi
echo ""

# Test 8: Changement de mot de passe
echo -e "${BLUE}🔑 Test 8: Changement de mot de passe${NC}"
PASSWORD_RESPONSE=$(curl -s -X PUT "$BASE_URL/auth/change-password" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "currentPassword": "password123",
    "newPassword": "newpassword123"
  }')

echo "$PASSWORD_RESPONSE" | jq '.'

if echo "$PASSWORD_RESPONSE" | jq -e '.message' > /dev/null; then
  echo -e "${GREEN}✅ Mot de passe changé avec succès!${NC}"
else
  echo -e "${RED}❌ Échec du changement de mot de passe${NC}"
fi
echo ""

# Test 9: Connexion avec le nouveau mot de passe
echo -e "${BLUE}🔐 Test 9: Connexion avec le nouveau mot de passe${NC}"
NEW_LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "newpassword123"
  }')

echo "$NEW_LOGIN_RESPONSE" | jq '.'

if echo "$NEW_LOGIN_RESPONSE" | jq -e '.token' > /dev/null; then
  echo -e "${GREEN}✅ Connexion avec nouveau mot de passe réussie!${NC}"
else
  echo -e "${RED}❌ Échec de la connexion avec nouveau mot de passe${NC}"
fi
echo ""

# Test 10: Tentative d'accès sans token (doit échouer)
echo -e "${BLUE}🚫 Test 10: Tentative d'accès sans token (doit échouer)${NC}"
NO_AUTH_RESPONSE=$(curl -s -X POST "$BASE_URL/posts" \
  -H "Content-Type: application/json" \
  -d '{
    "content": "Ce post ne devrait pas être créé"
  }')

echo "$NO_AUTH_RESPONSE" | jq '.'

if echo "$NO_AUTH_RESPONSE" | jq -e '.error' > /dev/null; then
  echo -e "${GREEN}✅ Accès refusé comme prévu!${NC}"
else
  echo -e "${RED}❌ La route devrait être protégée${NC}"
fi
echo ""

# Test 11: Déconnexion
echo -e "${BLUE}👋 Test 11: Déconnexion${NC}"
LOGOUT_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/logout" \
  -H "Authorization: Bearer $TOKEN")

echo "$LOGOUT_RESPONSE" | jq '.'

if echo "$LOGOUT_RESPONSE" | jq -e '.message' > /dev/null; then
  echo -e "${GREEN}✅ Déconnexion réussie!${NC}"
else
  echo -e "${RED}❌ Échec de la déconnexion${NC}"
fi
echo ""

echo "========================================"
echo -e "${GREEN}✅ Tests terminés!${NC}"
