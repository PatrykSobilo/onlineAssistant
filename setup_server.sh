#!/bin/bash

# ============================================================
# Online Assistant - Server Setup Script
# Droplet IP: 157.230.20.16 | Domain: sobit.uk
# Repo: https://github.com/PatrykSobilo/onlineAssistant.git
# ============================================================
# Uruchomienie: bash setup_server.sh

set -e  # Zatrzymaj przy błędzie
export DEBIAN_FRONTEND=noninteractive

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

GITHUB_REPO="https://github.com/PatrykSobilo/onlineAssistant.git"
APP_DIR="/var/www/onlineassistant"
DOMAIN="sobit.uk"
DB_NAME="onlineassistant_db"
DB_USER="onlineassistant_user"

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  Online Assistant - Server Setup${NC}"
echo -e "${BLUE}========================================${NC}\n"

# ============================================================
# KROK 1: Czyszczenie poprzedniej instalacji
# ============================================================
echo -e "${YELLOW}[1/9] Czyszczenie poprzedniej instalacji...${NC}"

# Zatrzymaj PM2 jeśli działa
pm2 stop onlineassistant 2>/dev/null || true
pm2 delete onlineassistant 2>/dev/null || true

# Usuń stare pliki aplikacji
if [ -d "$APP_DIR" ]; then
    echo "Usuwam $APP_DIR..."
    rm -rf "$APP_DIR"
fi

# Usuń stary virtual host nginx
rm -f /etc/nginx/sites-enabled/onlineassistant
rm -f /etc/nginx/sites-available/onlineassistant

echo -e "${GREEN}✅ Wyczyszczono poprzednią instalację${NC}\n"

# ============================================================
# KROK 2: Aktualizacja systemu i instalacja zależności
# ============================================================
echo -e "${YELLOW}[2/9] Aktualizacja systemu...${NC}"

apt-get update -qq
apt-get install -y -qq -o Dpkg::Options::='--force-confdef' -o Dpkg::Options::='--force-confold' curl git nginx certbot python3-certbot-nginx

echo -e "${GREEN}✅ System zaktualizowany${NC}\n"

# ============================================================
# KROK 3: Instalacja Node.js 20 (jeśli nie ma)
# ============================================================
echo -e "${YELLOW}[3/9] Sprawdzanie Node.js...${NC}"

if ! command -v node &> /dev/null || [[ $(node -v | cut -d'v' -f2 | cut -d'.' -f1) -lt 18 ]]; then
    echo "Instaluję Node.js 20..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt-get install -y nodejs
else
    echo "Node.js $(node -v) już zainstalowany"
fi

# Instalacja PM2 globalnie
npm install -g pm2 --silent

echo -e "${GREEN}✅ Node.js $(node -v) i PM2 gotowe${NC}\n"

# ============================================================
# KROK 4: Instalacja i konfiguracja MySQL
# ============================================================
echo -e "${YELLOW}[4/9] Konfiguracja MySQL...${NC}"

if ! command -v mysql &> /dev/null; then
    echo "Instaluję MySQL..."
    apt-get install -y -qq mysql-server
    systemctl start mysql
    systemctl enable mysql
else
    echo "MySQL już zainstalowany"
fi

# Generuj silne hasło do bazy
DB_PASSWORD=$(openssl rand -base64 32 | tr -d '/+=')

# Utwórz bazę i użytkownika
mysql -u root << MYSQL_SCRIPT
-- Usuń jeśli istnieje i utwórz od nowa
DROP DATABASE IF EXISTS ${DB_NAME};
DROP USER IF EXISTS '${DB_USER}'@'localhost';

CREATE DATABASE ${DB_NAME} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER '${DB_USER}'@'localhost' IDENTIFIED BY '${DB_PASSWORD}';
GRANT ALL PRIVILEGES ON ${DB_NAME}.* TO '${DB_USER}'@'localhost';
FLUSH PRIVILEGES;
MYSQL_SCRIPT

echo -e "${GREEN}✅ MySQL skonfigurowany${NC}\n"

# ============================================================
# KROK 5: Klonowanie repozytorium z GitHub
# ============================================================
echo -e "${YELLOW}[5/9] Klonowanie repozytorium...${NC}"

mkdir -p "$APP_DIR"
git clone "$GITHUB_REPO" "$APP_DIR"

echo -e "${GREEN}✅ Repozytorium sklonowane${NC}\n"

# ============================================================
# KROK 6: Tworzenie pliku .env na serwerze
# ============================================================
echo -e "${YELLOW}[6/9] Tworzenie pliku .env...${NC}"

# Generuj JWT secret
JWT_SECRET=$(openssl rand -hex 64)

# GEMINI_API_KEY można podać jako zmienną środowiskową lub argument skryptu
if [ -z "$GEMINI_API_KEY" ]; then
    if [ -n "$1" ]; then
        GEMINI_API_KEY="$1"
    else
        echo -e "${RED}⚠️  Musisz podać klucz Gemini API!${NC}"
        echo -n "Wpisz GEMINI_API_KEY: "
        read GEMINI_API_KEY
    fi
fi

if [ -z "$GEMINI_API_KEY" ]; then
    echo -e "${RED}❌ GEMINI_API_KEY nie może być pusty!${NC}"
    exit 1
fi

cat > "$APP_DIR/server/.env" << EOF
NODE_ENV=production
PORT=5000
CLIENT_URL=https://${DOMAIN}

DB_HOST=localhost
DB_PORT=3306
DB_USER=${DB_USER}
DB_PASSWORD=${DB_PASSWORD}
DB_NAME=${DB_NAME}

JWT_SECRET=${JWT_SECRET}

GEMINI_API_KEY=${GEMINI_API_KEY}
EOF

# Zabezpiecz plik .env
chmod 600 "$APP_DIR/server/.env"

echo -e "${GREEN}✅ Plik .env utworzony${NC}\n"

# ============================================================
# KROK 7: Instalacja zależności i build frontendu
# ============================================================
echo -e "${YELLOW}[7/9] Instalacja zależności i build...${NC}"

# Backend
cd "$APP_DIR/server"
npm install --production

# Frontend
cd "$APP_DIR/client"
npm install

# Build z produkcyjnym URL API
VITE_API_URL="https://${DOMAIN}" npm run build

echo -e "${GREEN}✅ Build zakończony${NC}\n"

# ============================================================
# KROK 8: Konfiguracja Nginx
# ============================================================
echo -e "${YELLOW}[8/9] Konfiguracja Nginx...${NC}"

cat > /etc/nginx/sites-available/onlineassistant << 'NGINX_CONF'
server {
    listen 80;
    listen [::]:80;
    server_name sobit.uk www.sobit.uk;

    # Frontend - statyczne pliki
    root /var/www/onlineassistant/client/dist;
    index index.html;

    # Gzip
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/json;

    # Backend API proxy
    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # SPA routing - wszystkie ścieżki → index.html
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Cache statycznych assetów
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Blokuj dostęp do ukrytych plików
    location ~ /\. {
        deny all;
    }

    client_max_body_size 10M;
}
NGINX_CONF

# Aktywuj konfigurację
ln -sf /etc/nginx/sites-available/onlineassistant /etc/nginx/sites-enabled/

# Usuń defaultową stronę nginx
rm -f /etc/nginx/sites-enabled/default

# Test konfiguracji
nginx -t
systemctl reload nginx

echo -e "${GREEN}✅ Nginx skonfigurowany${NC}\n"

# ============================================================
# KROK 9: Uruchomienie aplikacji przez PM2
# ============================================================
echo -e "${YELLOW}[9/9] Uruchamianie aplikacji...${NC}"

# Utwórz katalog logów
mkdir -p "$APP_DIR/logs"

# Uruchom przez PM2
cd "$APP_DIR"
pm2 start ecosystem.config.js
pm2 save
pm2 startup systemd -u root --hp /root | tail -1 | bash

echo -e "${GREEN}✅ Aplikacja uruchomiona${NC}\n"

# ============================================================
# PODSUMOWANIE
# ============================================================
echo -e "${BLUE}========================================${NC}"
echo -e "${GREEN}🎉 Instalacja zakończona!${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""
echo -e "📱 Aplikacja: ${YELLOW}http://${DOMAIN}${NC}"
echo -e "🔑 DB Password: ${YELLOW}${DB_PASSWORD}${NC} (zapisz!)"
echo ""
echo -e "${YELLOW}Następny krok - SSL (HTTPS):${NC}"
echo -e "  certbot --nginx -d ${DOMAIN} -d www.${DOMAIN}"
echo ""
echo -e "${YELLOW}Przydatne komendy:${NC}"
echo -e "  pm2 status           - status aplikacji"
echo -e "  pm2 logs             - logi aplikacji"
echo -e "  pm2 restart all      - restart"
echo -e "  nginx -t             - test konfiguracji nginx"
echo ""
