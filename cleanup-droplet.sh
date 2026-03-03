#!/bin/bash

# 🗑️ Skrypt czyszczenia dropleta przed nowym wdrożeniem
# Użycie: ./cleanup-droplet.sh

echo "================================"
echo "🗑️  CZYSZCZENIE DROPLETA"
echo "================================"
echo ""

# Kolory dla lepszej czytelności
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 1. Zatrzymanie PM2
echo -e "${YELLOW}[1/7] Zatrzymywanie procesów PM2...${NC}"
if command -v pm2 &> /dev/null; then
    pm2 stop all
    pm2 delete all
    pm2 kill
    echo -e "${GREEN}✓ PM2 wyczyszczone${NC}"
else
    echo -e "${YELLOW}⚠ PM2 nie zainstalowane${NC}"
fi
echo ""

# 2. Usunięcie plików aplikacji
echo -e "${YELLOW}[2/7] Usuwanie plików aplikacji z /var/www/onlineassistant...${NC}"
if [ -d "/var/www/onlineassistant" ]; then
    rm -rf /var/www/onlineassistant
    echo -e "${GREEN}✓ Pliki aplikacji usunięte${NC}"
else
    echo -e "${YELLOW}⚠ Katalog /var/www/onlineassistant nie istnieje${NC}"
fi
echo ""

# 3. Usunięcie konfiguracji Nginx
echo -e "${YELLOW}[3/7] Usuwanie konfiguracji Nginx...${NC}"
if [ -f "/etc/nginx/sites-enabled/onlineassistant" ]; then
    rm /etc/nginx/sites-enabled/onlineassistant
    echo -e "${GREEN}✓ Symlink usunięty${NC}"
fi
if [ -f "/etc/nginx/sites-available/onlineassistant" ]; then
    rm /etc/nginx/sites-available/onlineassistant
    echo -e "${GREEN}✓ Konfiguracja Nginx usunięta${NC}"
fi
echo ""

# 4. Test i reload Nginx
echo -e "${YELLOW}[4/7] Przeładowanie Nginx...${NC}"
if command -v nginx &> /dev/null; then
    nginx -t && systemctl reload nginx
    echo -e "${GREEN}✓ Nginx przeładowany${NC}"
else
    echo -e "${YELLOW}⚠ Nginx nie zainstalowany${NC}"
fi
echo ""

# 5. Wyczyszczenie bazy danych (OPCJONALNE - odkomentuj jeśli chcesz)
echo -e "${YELLOW}[5/7] Baza danych...${NC}"
read -p "Czy chcesz usunąć bazę danych onlineassistant_db? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    mysql -u root -p -e "DROP DATABASE IF EXISTS onlineassistant_db;"
    mysql -u root -p -e "DROP USER IF EXISTS 'onlineassistant_user'@'localhost';"
    mysql -u root -p -e "FLUSH PRIVILEGES;"
    echo -e "${GREEN}✓ Baza danych i użytkownik usunięci${NC}"
else
    echo -e "${YELLOW}⚠ Baza danych pozostawiona${NC}"
fi
echo ""

# 6. Usunięcie certyfikatów SSL (OPCJONALNE)
echo -e "${YELLOW}[6/7] Certyfikaty SSL...${NC}"
read -p "Czy chcesz usunąć certyfikaty SSL dla sobit.uk? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    if command -v certbot &> /dev/null; then
        certbot delete --cert-name sobit.uk
        echo -e "${GREEN}✓ Certyfikaty SSL usunięte${NC}"
    else
        echo -e "${YELLOW}⚠ Certbot nie zainstalowany${NC}"
    fi
else
    echo -e "${YELLOW}⚠ Certyfikaty SSL pozostawione${NC}"
fi
echo ""

# 7. Podsumowanie
echo -e "${YELLOW}[7/7] Sprawdzanie pozostałości...${NC}"
echo ""
echo "Status procesów PM2:"
pm2 list 2>/dev/null || echo "Brak procesów PM2"
echo ""
echo "Pliki w /var/www:"
ls -la /var/www/ 2>/dev/null || echo "Brak katalogu /var/www"
echo ""
echo "Konfiguracje Nginx:"
ls -la /etc/nginx/sites-enabled/ 2>/dev/null | grep onlineassistant || echo "Brak konfiguracji onlineassistant"
echo ""

echo "================================"
echo -e "${GREEN}✅ CZYSZCZENIE ZAKOŃCZONE!${NC}"
echo "================================"
echo ""
echo "Droplet jest gotowy do nowego wdrożenia."
echo "Możesz teraz uruchomić proces deployment według DEPLOYMENT.md"
