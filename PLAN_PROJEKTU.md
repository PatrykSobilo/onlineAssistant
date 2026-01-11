# Plan Aplikacji - Inteligentny Asystent Osobisty

## 📋 Opis Projektu
Aplikacja webowa z AI, która notuje informacje użytkownika zarówno z mikrofonu (speech-to-text), jak i z manualnych wpisów. System analizuje wypowiedzi, tworzy notatki i pomaga w późniejszym wyszukiwaniu informacji.

---

## 🏗️ Architektura Systemu

### **Frontend (React)**
- Single Page Application (SPA)
- Interfejs użytkownika
- Obsługa mikrofonu i nagrywania
- Real-time komunikacja z backendem

### **Backend (Node.js + Express)**
- REST API
- Autoryzacja i autentykacja (JWT)
- Zarządzanie sesjami użytkowników
- Integracja z AI
- Zarządzanie bazą danych

### **Baza Danych**
- MongoDB / PostgreSQL
- Przechowywanie użytkowników
- Notatki i transkrypcje
- Historia interakcji
- Ustawienia personalizacji

### **Integracje AI**
- Speech-to-Text (np. Web Speech API, Google Cloud Speech, OpenAI Whisper)
- LLM (np. OpenAI GPT, Anthropic Claude, Gemini)
- Analiza semantyczna wypowiedzi
- Wyszukiwanie w bazie notatek

---

## 📱 Struktura Aplikacji

### **1. Moduł Autoryzacji**
- **Strona logowania**
  - Email + hasło
  - Opcjonalnie: OAuth (Google, Microsoft)
- **Rejestracja**
  - Walidacja danych
  - Weryfikacja email
- **Reset hasła**

### **2. Moduł Konfiguracji Początkowej**
**Onboarding użytkownika - zbieranie:**
- Imię/pseudonim
- Język preferowany
- Zakres tematyczny (praca, nauka, osobiste)
- Styl komunikacji AI (formalny, przyjacielski, zwięzły)
- Preferencje prywatności
- Ustawienia powiadomień
- Testowe uruchomienie mikrofonu

### **3. Strona Główna (Dashboard)**

#### **Panel Nawigacyjny:**
- 🏠 Dashboard
- 📝 Moje Notatki
- 🔍 Wyszukiwarka
- 💬 Czat z Asystentem
- ⚙️ Ustawienia
- 👤 Profil
- 🚪 Wyloguj

#### **Główny widok Dashboard:**
- **Przycisk URUCHOM/ZATRZYMAJ** (duży, widoczny)
  - Status mikrofonu (aktywny/nieaktywny)
  - Wizualizacja dźwięku (fale audio)
  - Timer aktywnej sesji
  
- **Panel "Ostatnia aktywność"**
  - Ostatnie 5-10 notatek
  - Szybki podgląd
  
- **Panel statystyk**
  - Liczba notatek dzisiaj
  - Liczba notatek w tym tygodniu
  - Najpopularniejsze kategorie

- **Panel szybkiej notatki**
  - Pole tekstowe do manualnego dodania notatki
  - Przycisk "Dodaj notatkę"

### **4. Moduł Nagrywania i Transkrypcji**

#### **Workflow nagrywania:**
1. Użytkownik klika URUCHOM
2. Prośba o dostęp do mikrofonu (jeśli nie przyznany)
3. Rozpoczęcie nagrywania:
   - Ciągłe nasłuchiwanie
   - Wykrywanie mowy (Voice Activity Detection)
   - Podział na segmenty (co X sekund lub po przerwie w mowie)
   
4. **Przetwarzanie w czasie rzeczywistym lub wsadowo:**
   - Audio → Speech-to-Text
   - Transkrypcja → Backend API
   - Backend → AI Processing
   - AI odpowiada: czy to notatka, pytanie, rozmowa?

5. Rezultat zapisywany w bazie

#### **Technologie Speech-to-Text - opcje:**

**Opcja A: Web Speech API** (darmowe, wbudowane w przeglądarkę)
- ✅ Proste w implementacji
- ✅ Działa w czasie rzeczywistym
- ❌ Ograniczone języki
- ❌ Mniejsza dokładność

**Opcja B: OpenAI Whisper API** (płatne, bardzo dokładne)
- ✅ Wysoka dokładność
- ✅ Wiele języków
- ✅ Obsługa akcent i szumów
- ❌ Koszt (~$0.006/minuta)
- ⚠️ Trzeba wysyłać pliki audio

**Opcja C: Google Cloud Speech-to-Text**
- ✅ Bardzo dobra jakość
- ✅ Streaming API
- ❌ Koszt
- ⚠️ Wymaga konfiguracji GCP

**Rekomendacja:** Start z Web Speech API, potem migracja do Whisper

---

## 🤖 Logika AI

### **Prompt System - Analiza Wypowiedzi**

```
Jesteś inteligentnym asystentem osobistym użytkownika [IMIĘ].

Twoje zadania:
1. IDENTYFIKACJA - Określ typ wypowiedzi:
   - NOTATKA: Informacja do zapamiętania (fakty, zadania, pomysły)
   - PYTANIE: Użytkownik pyta o coś z przeszłości
   - ROZMOWA: Swobodna interakcja, nie wymaga zapisu
   
2. EKSTRAKCJA dla notatek:
   - Tytuł (max 50 znaków)
   - Treść (sformatowana, jasna)
   - Kategoria (praca/osobiste/nauka/inne)
   - Tagi (słowa kluczowe)
   - Priorytet (wysoki/średni/niski)
   - Data/czas jeśli wymienione
   
3. ODPOWIEDŹ dla pytań:
   - Przeszukaj bazę notatek użytkownika
   - Zwróć najbardziej relevantne informacje
   - Jeśli brak - powiedz uczciwie
   
4. INTERAKCJA dla rozmowy:
   - Odpowiadaj naturalnie
   - Podtrzymuj kontekst sesji
   - Personalizuj na podstawie profilu użytkownika

Parametry personalizacji:
- Imię: [IMIĘ]
- Styl: [STYL_KOMUNIKACJI]
- Język: [JĘZYK]
- Kontekst: [ZAKRES_TEMATYCZNY]
```

### **Workflow AI:**

```
Transkrypcja → LLM → Klasyfikacja → Akcja
                                      ↓
                            ├─ Zapisz notatkę
                            ├─ Wyszukaj w bazie
                            └─ Odpowiedź w czacie
```

### **Funkcje AI do zaimplementowania:**

1. **Analiza intencji** - co użytkownik chce osiągnąć?
2. **Ekstrakcja encji** - daty, osoby, miejsca, zadania
3. **Kategoryzacja automatyczna**
4. **Generowanie tagów**
5. **Wyszukiwanie semantyczne** (embedding + vector DB)
6. **Sugestie proaktywne** - "Widzę że masz zadanie na jutro..."

---

## 🔍 Moduł Wyszukiwania

### **Typy wyszukiwania:**
1. **Pełnotekstowe** (klasyczne) - szybkie, po słowach kluczowych
2. **Semantyczne** (AI) - rozumie kontekst i znaczenie
3. **Filtrowanie**:
   - Data (dziś, wczoraj, ten tydzień, zakres)
   - Kategoria
   - Tagi
   - Priorytet

### **Interfejs wyszukiwarki:**
- Pole wyszukiwania z autouzupełnianiem
- Filtry boczne
- Wyniki z highlightingiem
- Sortowanie (trafność, data, priorytet)

### **AI-powered search:**
- Użytkownik: "Co mówiłem o spotkaniu z Anią?"
- AI: Semantyczne wyszukiwanie + zwrócenie notatek

---

## 💬 Moduł Czatu z Asystentem

### **Funkcjonalności:**
- Historia czatu (persystentna)
- Kontekst konwersacji
- Quick actions:
  - "Przypomnij mi o..."
  - "Znajdź notatkę o..."
  - "Podsumuj dzisiejsze notatki"
- Sugestie pytań
- Voice input w czacie (opcjonalnie)

### **UI Czatu:**
- Interfejs typu messenger
- Bąbelki wiadomości
- Timestamp
- Markdown support
- Możliwość edycji/usunięcia wiadomości

---

## 📝 Moduł Zarządzania Notatkami

### **Widok listy notatek:**
- Kafelki/lista
- Sortowanie (data, tytuł, kategoria)
- Filtrowanie
- Wyszukiwanie lokalne
- Akcje grupowe (usuwanie, eksport)

### **Szczegóły notatki:**
- Pełna treść
- Metadata (data, kategoria, tagi, źródło)
- Edycja
- Usuwanie
- Eksport (TXT, PDF, JSON)
- Historia zmian (opcjonalnie)

### **Tworzenie notatki:**
- Edytor WYSIWYG / Markdown
- Dodawanie tagów
- Wybór kategorii
- Priorytet
- Przypomnienia (opcjonalnie)

---

## ⚙️ Moduł Ustawień

### **Ustawienia użytkownika:**
- **Profil**
  - Zmiana imienia, email
  - Zmiana hasła
  - Avatar
  
- **Personalizacja AI**
  - Styl komunikacji
  - Język
  - Zakres tematyczny
  - Poziom szczegółowości notatek
  
- **Audio**
  - Wybór mikrofonu
  - Test mikrofonu
  - Czułość wykrywania mowy
  - Auto-start nagrywania
  
- **Powiadomienia**
  - Email
  - Push (opcjonalnie)
  - Rodzaje powiadomień
  
- **Prywatność**
  - Zarządzanie danymi
  - Eksport danych
  - Usunięcie konta
  
- **Plan/Billing** (jeśli będzie płatny)

---

## 🛠️ Stack Technologiczny - Propozycje

### **Frontend:**
- **React 18+** (z Hooks)
- **React Router** - routing
- **Context API / Redux** - state management
- **Axios** - HTTP client
- **TailwindCSS / Material-UI** - styling
- **Web Speech API** - speech recognition
- **Recorder.js / MediaRecorder API** - nagrywanie audio
- **React-Toastify** - notyfikacje
- **Chart.js / Recharts** - wykresy statystyk

### **Backend:**
- **Node.js 18+**
- **Express.js** - framework
- **JWT** - autentykacja
- **bcrypt** - hashowanie haseł
- **Multer** - upload plików (audio)
- **Socket.io** - real-time (opcjonalnie)
- **Axios** - zapytania do AI APIs

### **Baza Danych:**
- **MongoDB** + Mongoose (elastyczność, łatwy start)
  - Kolekcje: Users, Notes, ChatHistory, Settings
- **Alternatywa: PostgreSQL** (relacyjna, bardziej strukturalna)

### **AI & ML:**
- **OpenAI API** (GPT-4 dla analizy, Whisper dla STT)
- **Langchain** (opcjonalnie - orchestracja LLM)
- **Pinecone / Weaviate** - vector database dla semantic search (zaawansowane)

### **Deployment:**
- **Frontend:** Vercel / Netlify
- **Backend:** Railway / Render / AWS / DigitalOcean
- **Database:** MongoDB Atlas / Supabase / AWS RDS

### **Dev Tools:**
- **Vite** - bundler dla React
- **ESLint + Prettier** - code quality
- **Jest / React Testing Library** - testy
- **Postman** - testowanie API

---

## 📐 Struktura Katalogów

```
onlineAssistant/
│
├── client/                      # Frontend React
│   ├── public/
│   ├── src/
│   │   ├── components/          # Komponenty UI
│   │   │   ├── Auth/
│   │   │   │   ├── Login.jsx
│   │   │   │   ├── Register.jsx
│   │   │   │   └── Onboarding.jsx
│   │   │   ├── Dashboard/
│   │   │   │   ├── Dashboard.jsx
│   │   │   │   ├── RecordButton.jsx
│   │   │   │   ├── ActivityPanel.jsx
│   │   │   │   └── StatsPanel.jsx
│   │   │   ├── Notes/
│   │   │   │   ├── NotesList.jsx
│   │   │   │   ├── NoteDetail.jsx
│   │   │   │   └── NoteEditor.jsx
│   │   │   ├── Chat/
│   │   │   │   ├── ChatWindow.jsx
│   │   │   │   └── MessageBubble.jsx
│   │   │   ├── Search/
│   │   │   │   └── SearchPage.jsx
│   │   │   ├── Settings/
│   │   │   │   └── SettingsPage.jsx
│   │   │   └── Common/
│   │   │       ├── Navbar.jsx
│   │   │       ├── Sidebar.jsx
│   │   │       └── AudioVisualizer.jsx
│   │   │
│   │   ├── contexts/            # Context API
│   │   │   ├── AuthContext.jsx
│   │   │   └── AudioContext.jsx
│   │   │
│   │   ├── hooks/               # Custom hooks
│   │   │   ├── useAudio.js
│   │   │   ├── useSpeechRecognition.js
│   │   │   └── useAuth.js
│   │   │
│   │   ├── services/            # API calls
│   │   │   ├── api.js
│   │   │   ├── authService.js
│   │   │   ├── noteService.js
│   │   │   └── aiService.js
│   │   │
│   │   ├── utils/               # Utility functions
│   │   │   └── audioUtils.js
│   │   │
│   │   ├── App.jsx
│   │   └── main.jsx
│   │
│   ├── package.json
│   └── vite.config.js
│
├── server/                      # Backend Node.js
│   ├── src/
│   │   ├── controllers/         # Route controllers
│   │   │   ├── authController.js
│   │   │   ├── noteController.js
│   │   │   ├── chatController.js
│   │   │   └── userController.js
│   │   │
│   │   ├── models/              # Database models
│   │   │   ├── User.js
│   │   │   ├── Note.js
│   │   │   └── ChatMessage.js
│   │   │
│   │   ├── routes/              # API routes
│   │   │   ├── auth.js
│   │   │   ├── notes.js
│   │   │   ├── chat.js
│   │   │   └── users.js
│   │   │
│   │   ├── middleware/          # Express middleware
│   │   │   ├── auth.js
│   │   │   └── errorHandler.js
│   │   │
│   │   ├── services/            # Business logic
│   │   │   ├── aiService.js     # Integracja z OpenAI/inne
│   │   │   ├── sttService.js    # Speech-to-Text
│   │   │   └── searchService.js # Wyszukiwanie
│   │   │
│   │   ├── config/              # Konfiguracja
│   │   │   └── database.js
│   │   │
│   │   └── app.js               # Express app
│   │
│   ├── package.json
│   └── .env.example
│
├── shared/                      # Wspólny kod (opcjonalnie)
│   └── types.js
│
├── PLAN_PROJEKTU.md            # Ten dokument
├── README.md
└── .gitignore
```

---

## 🚀 Plan Implementacji (Fazy)

### **FAZA 1: Podstawy (MVP)** ⭐ PRIORYTET
**Cel:** Działająca aplikacja z podstawową funkcjonalnością

1. **Setup projektu**
   - Inicjalizacja React (Vite)
   - Inicjalizacja Node.js + Express
   - Konfiguracja bazy danych
   - Git repository

2. **Autoryzacja**
   - Backend: JWT, register, login
   - Frontend: formularz logowania/rejestracji
   - Ochrona tras

3. **Prosty onboarding**
   - Formularz z podstawowymi danymi
   - Zapis w bazie

4. **Dashboard**
   - Layout z nawigacją
   - Przycisk URUCHOM (placeholder)
   - Lista notatek (pusta)

5. **Manualne dodawanie notatek**
   - Formularz tekstowy
   - Zapis do bazy
   - Wyświetlanie listy

6. **Podstawowa integracja AI**
   - Połączenie z OpenAI API
   - Prosty prompt: analiza tekstu i stworzenie notatki
   - Test na manualnych notatkach

**Rezultat:** Działający system logowania + dodawanie notatek tekstowych + podstawowe AI

---

### **FAZA 2: Speech-to-Text**
**Cel:** Dodanie nagrywania i transkrypcji

7. **Implementacja Web Speech API**
   - Hook do nagrywania
   - Przycisk URUCHOM działa
   - Real-time transkrypcja

8. **Przetwarzanie audio**
   - Wysyłanie transkrypcji do backendu
   - Backend → AI → analiza → notatka
   - Automatyczny zapis

9. **Wizualizacja audio**
   - Fale dźwiękowe
   - Status mikrofonu
   - Timer sesji

**Rezultat:** Można mówić i system tworzy notatki automatycznie

---

### **FAZA 3: Inteligentne funkcje AI**
**Cel:** AI rozumie kontekst i pomaga

10. **Ulepszone prompty AI**
    - Klasyfikacja: notatka/pytanie/rozmowa
    - Ekstrakcja metadata (kategoria, tagi, priorytet)
    - Personalizacja na podstawie profilu

11. **Moduł czatu**
    - Interfejs czatu
    - Historia konwersacji
    - Kontekst sesji

12. **Wyszukiwanie w notatkach**
    - AI odpowiada na pytania użytkownika
    - Przeszukiwanie bazy notatek
    - Zwracanie relevantnych informacji

**Rezultat:** AI rozumie co mówisz i pomaga znajdować informacje

---

### **FAZA 4: Wyszukiwarka i UX**
**Cel:** Profesjonalny interfejs i zaawansowane wyszukiwanie

13. **Strona wyszukiwania**
    - UI z filtrami
    - Pełnotekstowe wyszukiwanie
    - Highlighting wyników

14. **Szczegóły notatki**
    - Widok pojedynczej notatki
    - Edycja
    - Usuwanie

15. **Statystyki i dashboard**
    - Wykresy aktywności
    - Podsumowania
    - Szybki dostęp

**Rezultat:** Pełnofunkcjonalna aplikacja z dobrym UX

---

### **FAZA 5: Zaawansowane funkcje (Nice to have)**
**Cel:** Funkcje wyróżniające aplikację

16. **Semantyczne wyszukiwanie**
    - Embeddings (OpenAI)
    - Vector database
    - Wyszukiwanie kontekstowe

17. **Proaktywne sugestie AI**
    - "Zapomniałeś o zadaniu z wczoraj"
    - Podsumowania dnia/tygodnia

18. **Export i import**
    - PDF, TXT, JSON
    - Backup danych

19. **Powiadomienia**
    - Przypomnienia
    - Email notifications

20. **Mobile responsive**
    - PWA (opcjonalnie)
    - Dostosowanie do mobile

**Rezultat:** Zaawansowana aplikacja z unikalymi funkcjami

---

## 💰 Szacunkowe Koszty API (miesięcznie przy średnim użyciu)

### **OpenAI:**
- **Whisper (STT):** ~$0.006/min → ~$3-10/mies (przy 500-1500 min)
- **GPT-4 (analiza):** ~$0.01/1k tokens → ~$5-20/mies (zależnie od użycia)
- **Embeddings (semantic search):** ~$0.0001/1k tokens → ~$1-3/mies

**Razem:** ~$10-35/miesiąc na użytkownika (przy aktywnym użyciu)

### **Alternatywy darmowe/tańsze:**
- Web Speech API (darmowe, ale słabsza jakość)
- Gemini API (ma free tier)
- Lokalne modele (Whisper self-hosted)

---

## 🔒 Bezpieczeństwo i Prywatność

### **Zabezpieczenia:**
1. **HTTPS** - szyfrowane połączenie
2. **JWT** - bezpieczna autoryzacja
3. **Hashowanie haseł** - bcrypt
4. **Rate limiting** - ochrona przed spamem
5. **Walidacja inputów** - sanityzacja danych
6. **CORS** - kontrola dostępu
7. **Environment variables** - bezpieczne klucze API

### **Prywatność:**
1. **Szyfrowanie danych wrażliwych** w bazie
2. **Możliwość usunięcia konta** i wszystkich danych
3. **Eksport danych** - zgodnie z RODO
4. **Transparentność** - użytkownik wie co jest przechowywane
5. **Nie sharing danych** z third-party (poza niezbędnym API)

---

## 📊 Metryki Sukcesu

### **Techniczne:**
- ✅ Aplikacja działa stabilnie
- ✅ Czas odpowiedzi API < 2s
- ✅ Dokładność transkrypcji > 90%
- ✅ AI prawidłowo klasyfikuje wypowiedzi > 85%

### **Użytkowe:**
- ✅ Intuicyjny interfejs
- ✅ Szybkie wyszukiwanie
- ✅ Spersonalizowana interakcja

---

## 🎯 Następne Kroki

1. **Przeczytaj ten plan i dodaj uwagi**
2. **Ustalmy priorytety** - co najważniejsze dla Ciebie?
3. **Wybierzmy technologie** - ostateczne decyzje
4. **Zaczniemy od Fazy 1** - setup i MVP

---

## 💡 Pytania do ustalenia:

1. **Język aplikacji:** Polski / Angielski / Oba?
2. **Target użytkowników:** Tylko Ty / Demo dla szkoły / Publikacja?
3. **Budget API:** Czy możesz wydać ~$10-20/mies na API?
4. **Hosting:** Darmowy (ograniczenia) / Płatny?
5. **Deadline:** Kiedy projekt musi być gotowy?
6. **Zakres MVP:** Czy chcesz wszystkie funkcje czy minimum do prezentacji?

---

**Gotowy do uszczegółowienia planu? Powiedz co myślisz! 🚀**
