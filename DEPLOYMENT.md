# 🚀 Instrukcja wdrożenia Online Assistant na DigitalOcean

## Informacje podstawowe
- **Domena:** sobit.uk
- **Serwer:** Ubuntu (DigitalOcean Droplet)
- **Backend:** Node.js + Express (port 5000)
- **Frontend:** React + Vite (statyczne pliki)
- **Baza danych:** MySQL

---

## KROK 1: Przygotowanie aplikacji lokalnie

### 1.1 Zaktualizuj zmienne środowiskowe

**Backend (.env):**
```bash
# Produkcja
NODE_ENV=production
PORT=5000
CLIENT_URL=https://sobit.uk

# Baza danych
DB_HOST=localhost
DB_USER=onlineassistant_user
DB_PASSWORD=WPISZ_SILNE_HASŁO
DB_NAME=onlineassistant_db

# JWT
JWT_SECRET=WYGENERUJ_DŁUGI_LOSOWY_STRING

# Gemini API
GEMINI_API_KEY=twoj_klucz_api
```

**Frontend (.env.production):**
```bash
VITE_API_URL=https://sobit.uk
```

### 1.2 Zbuduj frontend
```bash
cd client
npm install
npm run build
# Powstanie folder client/dist
```

### 1.3 Przygotuj backend
```bash
cd server
npm install --production
```

---

## KROK 2: Przesłanie plików na serwer

### 2.1 Połącz się SSH
```bash
ssh root@IP_TWOJEGO_DROPLETA
```

### 2.2 Utwórz strukturę katalogów
```bash
mkdir -p /var/www/onlineassistant
cd /var/www/onlineassistant
```

### 2.3 Prześlij pliki (z lokalnego terminala)
```bash
# Backend
scp -r server root@IP_DROPLETA:/var/www/onlineassistant/

# Frontend (zbudowane pliki)
scp -r client/dist root@IP_DROPLETA:/var/www/onlineassistant/client/

# Deployment files
scp ecosystem.config.js root@IP_DROPLETA:/var/www/onlineassistant/
```

---

## KROK 3: Konfiguracja MySQL

```bash
# Zaloguj się do MySQL
sudo mysql -u root -p

# Utwórz bazę i użytkownika
CREATE DATABASE onlineassistant_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'onlineassistant_user'@'localhost' IDENTIFIED BY 'TWOJE_SILNE_HASŁO';
GRANT ALL PRIVILEGES ON onlineassistant_db.* TO 'onlineassistant_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;

# Zaimportuj strukturę (skopiuj plik SQL na serwer)
mysql -u onlineassistant_user -p onlineassistant_db < /var/www/onlineassistant/server/create_database.sql
```

---

## KROK 4: Konfiguracja PM2 (zarządzanie procesem Node.js)

```bash
# Zainstaluj PM2 globalnie (jeśli jeszcze nie masz)
npm install -g pm2

# Uruchom aplikację
cd /var/www/onlineassistant
pm2 start ecosystem.config.js

# Ustaw autostart przy restarcie serwera
pm2 startup
pm2 save

# Sprawdź status
pm2 status
pm2 logs onlineassistant
```

---

## KROK 5: Konfiguracja Nginx

### 5.1 Utwórz plik konfiguracyjny
```bash
sudo nano /etc/nginx/sites-available/onlineassistant
```

Wklej konfigurację z pliku `nginx.conf` (będzie przygotowana).

### 5.2 Aktywuj konfigurację
```bash
sudo ln -s /etc/nginx/sites-available/onlineassistant /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

---

## KROK 6: SSL (Let's Encrypt)

```bash
# Zainstaluj Certbot
sudo apt update
sudo apt install certbot python3-certbot-nginx

# Wygeneruj certyfikat dla sobit.uk
sudo certbot --nginx -d sobit.uk -d www.sobit.uk

# Automatyczne odnawianie (test)
sudo certbot renew --dry-run
```

---

## KROK 7: CloudFlare DNS

1. Zaloguj się do CloudFlare
2. Wybierz domenę **sobit.uk**
3. Przejdź do **DNS Records**
4. Dodaj/zaktualizuj rekordy:
   - **Typ A:** `@` → IP_TWOJEGO_DROPLETA (Proxy: ON)
   - **Typ A:** `www` → IP_TWOJEGO_DROPLETA (Proxy: ON)

5. **SSL/TLS Settings:**
   - Tryb: **Full (strict)**
   
6. Poczekaj 5-15 minut na propagację DNS

---

## KROK 8: Testowanie

```bash
# Sprawdź czy backend działa
curl http://localhost:5000/health

# Sprawdź logi
pm2 logs onlineassistant

# Sprawdź nginx
sudo nginx -t
sudo systemctl status nginx
```

Otwórz w przeglądarce: **https://sobit.uk**

---

## Komendy pomocnicze

### Aktualizacja aplikacji
```bash
# Zatrzymaj PM2
pm2 stop onlineassistant

# Zaktualizuj pliki (scp z lokalu)
# ...

# Restart
pm2 restart onlineassistant
```

### Restart serwisów
```bash
pm2 restart onlineassistant
sudo systemctl restart nginx
sudo systemctl restart mysql
```

### Monitoring
```bash
pm2 monit
pm2 logs onlineassistant --lines 100
```

### Backup bazy danych
```bash
mysqldump -u onlineassistant_user -p onlineassistant_db > backup_$(date +%Y%m%d).sql
```

---

## Troubleshooting

### Backend nie startuje
- Sprawdź logi: `pm2 logs onlineassistant`
- Sprawdź .env: `cat /var/www/onlineassistant/server/.env`
- Sprawdź połączenie z MySQL: `mysql -u onlineassistant_user -p`

### 502 Bad Gateway
- Backend nie działa: `pm2 status`
- Restart: `pm2 restart onlineassistant`

### CORS errors
- Sprawdź CLIENT_URL w backend/.env
- Sprawdź VITE_API_URL w frontend

### SSL issues
- Sprawdź certyfikat: `sudo certbot certificates`
- Odnów: `sudo certbot renew`
