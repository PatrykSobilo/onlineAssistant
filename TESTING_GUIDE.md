# 🧪 Jak testować API - Przewodnik

## 📋 Przygotowanie

### 1. Uruchom serwer
```bash
cd server
npm run dev
```
Serwer powinien być dostępny na: `http://localhost:5000`

### 2. Wypełnij bazę danymi testowymi
```bash
cd server
npm run seed
```

Po wykonaniu tego polecenia będziesz mieć:
- **Użytkownika testowego**: `test@example.com` / `test123`
- **4 kategorie** z hierarchią subkategorii
- **9 przykładowych notatek**

---

## 🔧 Narzędzia do testowania

### Opcja 1: Thunder Client (VSCode Extension)
1. Zainstaluj rozszerzenie "Thunder Client" w VSCode
2. Otwórz Thunder Client (ikona pioruna w lewym pasku)
3. Kliknij "Collections" → "Menu" → "Import"
4. Wybierz plik: `thunder-client-collection.json`
5. Gotowe! Masz 30+ gotowych requestów

### Opcja 2: Postman
1. Otwórz Postman
2. File → Import → wybierz `thunder-client-collection.json`
3. Kolekcja zostanie zaimportowana

### Opcja 3: cURL (Terminal)
Możesz też używać przykładów z tego pliku bezpośrednio w terminalu.

---

## 🚀 Podstawowy workflow testowania

### Krok 1: Zaloguj się i zdobądź token

**Request:**
```bash
POST http://localhost:5000/api/auth/login
Content-Type: application/json

{
  "email": "test@example.com",
  "password": "test123"
}
```

**Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "name": "Test User",
    "email": "test@example.com"
  }
}
```

**⚠️ WAŻNE**: Skopiuj wartość `token` - będzie potrzebny do wszystkich kolejnych requestów!

---

### Krok 2: Użyj tokena w nagłówku

Do wszystkich requestów (oprócz login/register) dodaj nagłówek:
```
Authorization: Bearer TWÓJ_SKOPIOWANY_TOKEN
```

**W Thunder Client:**
- Kliknij na request
- Zakładka "Headers"
- Znajdź `Authorization`
- Zamień `YOUR_TOKEN_HERE` na swój token

**W cURL:**
```bash
curl -H "Authorization: Bearer TWÓJ_TOKEN" http://localhost:5000/api/categories
```

---

### Krok 3: Testuj endpointy

## 📁 Przykłady requestów

### 1. Pobierz wszystkie kategorie
```bash
GET http://localhost:5000/api/categories
Authorization: Bearer TWÓJ_TOKEN
```

**Czego się spodziewać:**
```json
[
  {
    "id": 1,
    "name": "Praca",
    "icon": "💼",
    "color": "#3B82F6",
    "subcategories": [...]
  },
  {
    "id": 2,
    "name": "Hobby - Piłka nożna",
    "icon": "⚽",
    "color": "#10B981"
  }
  ...
]
```

---

### 2. Pobierz drzewo hierarchii dla kategorii "Praca" (id=1)
```bash
GET http://localhost:5000/api/subcategories/tree/1
Authorization: Bearer TWÓJ_TOKEN
```

**Czego się spodziewać:**
Otrzymasz pełne drzewo hierarchiczne z 5 poziomami:
```json
{
  "category": {
    "id": 1,
    "name": "Praca",
    "icon": "💼"
  },
  "tree": [
    {
      "id": 1,
      "name": "Klient ABC",
      "level": 1,
      "children": [
        {
          "id": 4,
          "name": "Faktury zakupu",
          "level": 2,
          "children": [
            {
              "id": 7,
              "name": "Zakup usług",
              "level": 3,
              "isUnlocked": true,
              "children": [...]
            }
          ]
        }
      ]
    }
  ]
}
```

---

### 3. Pobierz notatki z konkretnej ścieżki hierarchii
```bash
GET http://localhost:5000/api/notes?categoryId=1&subCategoryId1=1&subCategoryId2=4
Authorization: Bearer TWÓJ_TOKEN
```

To zwróci notatki z: **Praca → Klient ABC → Faktury zakupu**

---

### 4. Wyszukaj notatki po tagach
```bash
GET http://localhost:5000/api/notes?tags=pilne,faktura
Authorization: Bearer TWÓJ_TOKEN
```

Zwróci wszystkie notatki zawierające tagi "pilne" ORAZ "faktura"

---

### 5. Utwórz nową notatkę z hierarchią
```bash
POST http://localhost:5000/api/notes
Authorization: Bearer TWÓJ_TOKEN
Content-Type: application/json

{
  "noteCategoryId": 1,
  "noteSubCategoryId1": 1,
  "noteSubCategoryId2": 4,
  "noteSubCategoryId3": 7,
  "content": "Moja nowa faktura za hosting - 299 PLN",
  "tags": ["hosting", "IT", "2025"],
  "source": "text",
  "language": "pl"
}
```

Ta notatka będzie w ścieżce: **Praca → Klient ABC → Faktury zakupu → Zakup usług**

---

### 6. Odblokuj poziom 3-5 subkategorii
```bash
PUT http://localhost:5000/api/subcategories/8/unlock
Authorization: Bearer TWÓJ_TOKEN
```

Subkategoria ID 8 ("Zakup towarów" poziom 3) zostanie odblokowana i będzie można tworzyć w niej notatki.

---

### 7. Pobierz ścieżkę (breadcrumb) do subkategorii
```bash
GET http://localhost:5000/api/subcategories/7/path
Authorization: Bearer TWÓJ_TOKEN
```

**Response:**
```json
{
  "path": [
    { "type": "category", "id": 1, "name": "Praca", "icon": "💼" },
    { "type": "subcategory", "id": 1, "name": "Klient ABC", "level": 1 },
    { "type": "subcategory", "id": 4, "name": "Faktury zakupu", "level": 2 },
    { "type": "subcategory", "id": 7, "name": "Zakup usług", "level": 3 }
  ]
}
```

Idealne do wyświetlania breadcrumbs w UI!

---

### 8. Pobierz statystyki notatek
```bash
GET http://localhost:5000/api/notes/stats
Authorization: Bearer TWÓJ_TOKEN
```

**Response:**
```json
{
  "totalNotes": 9,
  "bySource": [
    { "source": "text", "count": 6 },
    { "source": "voice", "count": 3 }
  ],
  "byCategory": [
    { "noteCategoryId": 1, "count": 4, "category": {...} },
    { "noteCategoryId": 2, "count": 2, "category": {...} }
  ]
}
```

---

## 🎯 Scenariusze testowe

### Scenariusz 1: Dodaj nową kategorię z subkategoriami

1. **Utwórz kategorię**
```bash
POST /api/categories
{
  "name": "Finanse",
  "icon": "💰",
  "color": "#F59E0B"
}
```

2. **Zapamiętaj `id` zwrócone w response (np. 5)**

3. **Utwórz subkategorię poziom 1**
```bash
POST /api/subcategories
{
  "categoryId": 5,
  "parentSubCategoryId": null,
  "name": "Wydatki"
}
```

4. **Zapamiętaj `id` (np. 22)**

5. **Utwórz subkategorię poziom 2**
```bash
POST /api/subcategories
{
  "categoryId": 5,
  "parentSubCategoryId": 22,
  "name": "Rachunki"
}
```

6. **Sprawdź drzewo**
```bash
GET /api/subcategories/tree/5
```

---

### Scenariusz 2: Przefiltruj notatki po hierarchii

1. **Pobierz kategorię "Praca"**
```bash
GET /api/categories/1
```

2. **Pobierz subkategorie poziom 1 dla Praca**
```bash
GET /api/subcategories?categoryId=1&rootOnly=true
```

3. **Wybierz "Klient ABC" (id=1), pobierz jego dzieci**
```bash
GET /api/subcategories?parentId=1
```

4. **Wybierz "Faktury zakupu" (id=4), pobierz notatki**
```bash
GET /api/notes?categoryId=1&subCategoryId1=1&subCategoryId2=4
```

---

### Scenariusz 3: Zarządzanie tagami

1. **Znajdź notatkę z tagiem**
```bash
GET /api/notes?tags=pilne
```

2. **Dodaj nowy tag do notatki**
```bash
POST /api/notes/1/tags
{
  "tag": "ważne"
}
```

3. **Usuń tag z notatki**
```bash
DELETE /api/notes/1/tags
{
  "tag": "pilne"
}
```

---

## 🐛 Troubleshooting

### Problem: "No authentication token"
**Rozwiązanie**: Upewnij się, że dodałeś nagłówek `Authorization: Bearer TOKEN`

### Problem: "Token is not valid"
**Rozwiązanie**: Zaloguj się ponownie i użyj nowego tokena

### Problem: "Category not found"
**Rozwiązanie**: Sprawdź czy `categoryId` należy do zalogowanego użytkownika

### Problem: "Level 3-5 are locked"
**Rozwiązanie**: Odblokuj subkategorię przez `PUT /api/subcategories/:id/unlock`

### Problem: Serwer nie odpowiada
**Rozwiązanie**: 
1. Sprawdź czy serwer działa: `npm run dev` w folderze `server`
2. Sprawdź czy baza MySQL działa (XAMPP)

---

## 📊 Struktura danych testowych

Po seedowaniu masz:

```
📁 Praca (id: 1) - 4 notatki
  ├─ 🏢 Klient ABC (id: 1)
  │   ├─ 📄 Faktury zakupu (id: 4) - 2 notatki
  │   │   ├─ 💰 Zakup usług (id: 7) [ODBLOKOWANE]
  │   │   │   └─ 🧹 Czyszczenie komputera (id: 10) [ZABLOKOWANE]
  │   │   └─ 📦 Zakup towarów (id: 8) [ZABLOKOWANE]
  │   ├─ 💵 Faktury sprzedaży (id: 5)
  │   └─ 🤝 Spotkania (id: 6) - 1 notatka
  ├─ 🏢 Klient XYZ (id: 2)
  └─ 💼 Projekty wewnętrzne (id: 3)
      └─ 🚀 Projekt Alpha (id: 11) - 1 notatka

📁 Hobby - Piłka nożna (id: 2) - 2 notatki
  ├─ 🏃 Trening (id: 12)
  │   ├─ 🏃 Bieganie (id: 14) - 1 notatka
  │   └─ 💪 Siłownia (id: 15)
  └─ ⚽ Mecze (id: 13) - 1 notatka

📁 Hobby - Wędkarstwo (id: 3) - 2 notatki
  ├─ 🎣 Sprzęt (id: 16)
  │   ├─ 🪝 Haczyki (id: 18) - 1 notatka
  │   └─ 🎣 Wędki (id: 19)
  └─ 🗺️ Łowiska (id: 17) - 1 notatka

📁 Osobiste (id: 4) - 1 notatka
```

---

## 💡 Wskazówki

1. **Zawsze używaj tokena** - bez niego dostaniesz błąd 401
2. **ID kategorii i subkategorii** - zapisuj sobie je, przydadzą się
3. **Poziomy 3-5 zablokowane** - musisz je odblokować przed użyciem
4. **Soft delete** - kategorie/subkategorie nie są usuwane, tylko oznaczane jako `isActive: false`
5. **Filtruj mądrze** - możesz łączyć filtry: `?categoryId=1&tags=pilne&search=faktura`

---

## 🎉 Gotowe!

Teraz możesz testować całe API. Zaczynaj od prostych requestów (GET) i przechodź do bardziej złożonych (POST, PUT).

Powodzenia! 🚀
