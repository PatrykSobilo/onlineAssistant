# API Endpoints - onlineAssistant

## BASE URL
```
http://localhost:5000/api
```

---

## Authentication
Wszystkie endpointy wymagają nagłówka:
```
Authorization: Bearer <token>
```

---

## 1. KATEGORIE NOTATEK

### GET /categories
Pobierz wszystkie kategorie użytkownika
```json
Response:
[
  {
    "id": 1,
    "userId": 1,
    "name": "Praca",
    "icon": "💼",
    "color": "#3B82F6",
    "isActive": true,
    "subcategories": []
  }
]
```

### POST /categories
Utwórz nową kategorię
```json
Request Body:
{
  "name": "Praca",
  "icon": "💼",
  "color": "#3B82F6"
}

Response: (201)
{
  "id": 1,
  "userId": 1,
  "name": "Praca",
  "icon": "💼",
  "color": "#3B82F6",
  "isActive": true
}
```

### GET /categories/:id
Pobierz pojedynczą kategorię

### PUT /categories/:id
Aktualizuj kategorię
```json
Request Body:
{
  "name": "Praca - nowa nazwa",
  "icon": "🏢",
  "color": "#10B981"
}
```

### DELETE /categories/:id
Usuń kategorię (soft delete)

### GET /categories/:id/stats
Pobierz statystyki kategorii
```json
Response:
{
  "category": {...},
  "stats": {
    "notesCount": 15,
    "subcategoriesCount": 8
  }
}
```

---

## 2. SUBKATEGORIE

### GET /subcategories
Pobierz subkategorie z filtrowaniem
```
Query params:
- categoryId: filtruj po kategorii
- parentId: filtruj po parent (dzieci danego node)
- rootOnly=true: tylko poziom 1
- level: filtruj po poziomie (1-5)

Przykład:
GET /subcategories?categoryId=1&rootOnly=true
```

### GET /subcategories/tree/:categoryId
Pobierz całe drzewo hierarchii dla kategorii
```json
Response:
{
  "category": {...},
  "tree": [
    {
      "id": 1,
      "name": "Klient ABC",
      "level": 1,
      "children": [
        {
          "id": 2,
          "name": "Faktury zakupu",
          "level": 2,
          "children": [...]
        }
      ]
    }
  ]
}
```

### POST /subcategories
Utwórz nową subkategorię
```json
Request Body:
{
  "categoryId": 1,
  "parentSubCategoryId": null,  // null dla poziomu 1
  "name": "Klient ABC"
}

Response: (201)
{
  "id": 1,
  "userId": 1,
  "categoryId": 1,
  "parentSubCategoryId": null,
  "level": 1,
  "name": "Klient ABC",
  "isActive": true,
  "isUnlocked": true
}
```

### GET /subcategories/:id
Pobierz pojedynczą subkategorię z relacjami

### GET /subcategories/:id/path
Pobierz ścieżkę (breadcrumb) do subkategorii
```json
Response:
{
  "path": [
    { "type": "category", "id": 1, "name": "Praca", "icon": "💼" },
    { "type": "subcategory", "id": 1, "name": "Klient ABC", "level": 1 },
    { "type": "subcategory", "id": 2, "name": "Faktury zakupu", "level": 2 }
  ]
}
```

### PUT /subcategories/:id
Aktualizuj subkategorię
```json
Request Body:
{
  "name": "Klient ABC - nowa nazwa"
}
```

### PUT /subcategories/:id/unlock
Odblokuj subkategorię (poziomy 3-5)

### DELETE /subcategories/:id
Usuń subkategorię (soft delete z kaskadą na dzieci)

---

## 3. NOTATKI

### GET /notes
Pobierz wszystkie notatki z filtrowaniem
```
Query params:
- categoryId: filtruj po kategorii
- subCategoryId1-5: filtruj po subkategoriach (hierarchia)
- tags: filtruj po tagach (comma-separated)
- search: wyszukaj w treści
- source: filtruj po źródle (voice/text)
- language: filtruj po języku

Przykład:
GET /notes?categoryId=1&subCategoryId1=5&tags=pilne,ważne
```

### POST /notes
Utwórz nową notatkę
```json
Request Body:
{
  "noteCategoryId": 1,
  "noteSubCategoryId1": 1,
  "noteSubCategoryId2": 2,
  "noteSubCategoryId3": 3,
  "noteSubCategoryId4": null,
  "noteSubCategoryId5": null,
  "tags": ["pilne", "ważne", "2025"],
  "content": "Treść notatki...",
  "source": "text",
  "language": "pl",
  "aiResponse": "Odpowiedź AI..."
}

Response: (201)
{
  "id": 1,
  "userId": 1,
  "noteCategoryId": 1,
  "noteSubCategoryId1": 1,
  "noteSubCategoryId2": 2,
  "noteSubCategoryId3": 3,
  "noteSubCategoryId4": null,
  "noteSubCategoryId5": null,
  "tags": ["pilne", "ważne", "2025"],
  "content": "Treść notatki...",
  "source": "text",
  "language": "pl",
  "aiResponse": "Odpowiedź AI...",
  "category": {...},
  "subCategory1": {...},
  "subCategory2": {...},
  "subCategory3": {...}
}
```

### GET /notes/:id
Pobierz pojedynczą notatkę z relacjami

### PUT /notes/:id
Aktualizuj notatkę
```json
Request Body:
{
  "content": "Nowa treść...",
  "tags": ["zaktualizowane", "pilne"]
}
```

### DELETE /notes/:id
Usuń notatkę (hard delete)

### GET /notes/stats
Pobierz statystyki notatek użytkownika
```json
Response:
{
  "totalNotes": 127,
  "bySource": [
    { "source": "text", "count": 85 },
    { "source": "voice", "count": 42 }
  ],
  "byCategory": [
    { "noteCategoryId": 1, "count": 50, "category": {...} },
    { "noteCategoryId": 2, "count": 35, "category": {...} }
  ]
}
```

### POST /notes/:id/tags
Dodaj tag do notatki
```json
Request Body:
{
  "tag": "nowy-tag"
}
```

### DELETE /notes/:id/tags
Usuń tag z notatki
```json
Request Body:
{
  "tag": "tag-do-usuniecia"
}
```

---

## Przykładowe workflow:

1. **Zarejestruj się / zaloguj**
   ```
   POST /auth/register
   POST /auth/login
   ```

2. **Utwórz kategorię główną**
   ```
   POST /categories
   { "name": "Praca", "icon": "💼", "color": "#3B82F6" }
   ```

3. **Utwórz subkategorię poziom 1**
   ```
   POST /subcategories
   { "categoryId": 1, "parentSubCategoryId": null, "name": "Klient ABC" }
   ```

4. **Utwórz subkategorię poziom 2 (dziecko poprzedniej)**
   ```
   POST /subcategories
   { "categoryId": 1, "parentSubCategoryId": 1, "name": "Faktury zakupu" }
   ```

5. **Utwórz notatkę z hierarchią**
   ```
   POST /notes
   {
     "noteCategoryId": 1,
     "noteSubCategoryId1": 1,
     "noteSubCategoryId2": 2,
     "content": "Faktura nr 123/2025...",
     "tags": ["faktura", "2025"]
   }
   ```

6. **Pobierz drzewo kategorii**
   ```
   GET /subcategories/tree/1
   ```

7. **Filtruj notatki po ścieżce**
   ```
   GET /notes?categoryId=1&subCategoryId1=1&subCategoryId2=2
   ```

---

## Przykładowa hierarchia:

```
📁 Praca (kategoria)
  └─ 🏢 Klient ABC (subcategory level 1)
      └─ 📄 Faktury zakupu (subcategory level 2)
          └─ 💰 Zakup usług (subcategory level 3) [wymaga unlock]
              └─ 🧹 Czyszczenie komputera (subcategory level 4) [wymaga unlock]
                  └─ 📝 Szczegóły (subcategory level 5) [wymaga unlock]

📁 Hobby - Piłka nożna (kategoria)
  └─ ⚽ Trening (subcategory level 1)
      └─ 🏃 Bieganie (subcategory level 2)

📁 Hobby - Wędkarstwo (kategoria)
  └─ 🎣 Sprzęt (subcategory level 1)
      └─ 🪝 Haczyki (subcategory level 2)
```

---

## Uwagi:

- **Poziomy 1-2**: Odblokowane domyślnie
- **Poziomy 3-5**: Wymagają odblokowania przez `PUT /subcategories/:id/unlock`
- **Soft delete**: Kategorie i subkategorie tylko oznaczane jako `isActive: false`
- **Hard delete**: Notatki usuwane permanentnie
- **Kaskada**: Usunięcie kategorii oznacza jako nieaktywne wszystkie subkategorie
- **Kaskada**: Usunięcie subkategorii oznacza jako nieaktywne wszystkie dzieci
- **Tags**: Przechowywane jako JSON array, można filtrować przez comma-separated lista w query
