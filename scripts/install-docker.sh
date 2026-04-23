#!/usr/bin/env bash
set -euo pipefail

echo "==> Mise à jour des paquets"
sudo apt update

echo "==> Installation des dépendances"
sudo apt install -y ca-certificates curl

echo "==> Création du dossier des clés APT"
sudo install -m 0755 -d /etc/apt/keyrings

echo "==> Téléchargement de la clé GPG Docker"
if [ ! -f /etc/apt/keyrings/docker.asc ]; then
  sudo curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
fi
sudo chmod a+r /etc/apt/keyrings/docker.asc

echo "==> Ajout du dépôt officiel Docker"
ARCH="$(dpkg --print-architecture)"
CODENAME="$(. /etc/os-release && echo "${UBUNTU_CODENAME:-$VERSION_CODENAME}")"

sudo tee /etc/apt/sources.list.d/docker.sources > /dev/null <<EOF
Types: deb
URIs: https://download.docker.com/linux/ubuntu
Suites: ${CODENAME}
Components: stable
Architectures: ${ARCH}
Signed-By: /etc/apt/keyrings/docker.asc
EOF

echo "==> Mise à jour des index APT"
sudo apt update

echo "==> Installation de Docker Engine + Compose plugin"
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

echo "==> Activation et démarrage du service Docker"
sudo systemctl enable docker
sudo systemctl start docker

echo "==> Ajout de l'utilisateur courant au groupe docker"
sudo groupadd docker 2>/dev/null || true
sudo usermod -aG docker "$USER"

echo "==> Vérifications"
docker --version
docker compose version
sudo systemctl --no-pager --full status docker | head -n 15

echo ""
echo "Installation terminée."
echo "Déconnecte-toi / reconnecte-toi pour utiliser docker sans sudo."
echo "Test ensuite avec : docker run hello-world"