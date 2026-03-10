# Online Assistant 🤖

A voice-first, AI-powered personal note-taking app. Speak your thoughts, and the app uses **Google Gemini** to extract, categorize, and store them as structured notes. You can then have context-aware AI conversations based on your own knowledge base.

> Built with the help of AI — using a "reviewer" approach: the project structure was defined upfront, and AI generated the implementation which was then reviewed, corrected, and refined.

**Live demo:** [sobit.uk](https://sobit.uk)

---

## Features

### 📝 Note Capture
- **Voice recording** with real-time speech-to-text transcription (interim + final)
- **Automatic silence detection** — sends to AI after 10 seconds of no speech
- **Manual text input** as an alternative to voice
- **File import** — VTT, SRT, SBV, TXT (meeting recordings, lecture transcripts)
- Notes go through **Google Gemini** before being saved — there's a short processing delay by design

### 📁 Organization
- **Categories** with emoji icons and colors
- Up to **5 levels of subcategories** per category
- When a new subcategory is created, existing notes are automatically moved to an **"Unassigned"** folder to preserve hierarchy integrity
- Subcategory levels 3–5 have an optional **lock/unlock** mechanism

### 🤖 AI Organization
- **Auto-organize unassigned notes** — AI assigns each note to the most appropriate subcategory
- **Re-organize all notes** in a category from scratch
- **Merge similar notes** into a single consolidated note
- **Create a note from a description** — describe what you want and the AI writes it

### 💬 Discussions
- Context-aware **chat with AI** tied to a specific category
- AI pulls your notes from that category as context — it reasons based on your own knowledge base
- Multiple separate discussions, each with full message history

### 👤 Account
- JWT-based authentication
- Profile editing, password change, full account deletion (all data removed)

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React + Vite |
| Backend | Node.js + Express |
| ORM | Sequelize |
| Database | MySQL |
| AI | Google Gemini (gemini-2.5-flash) |
| Auth | JWT |
| Deployment | DigitalOcean + Nginx + PM2 |
| SSL | Let's Encrypt |

---

## Project Structure

```
onlineAssistant/
├── client/                  # React frontend (Vite)
│   └── src/
│       ├── pages/           # Login, Register, Dashboard, Notes, Categories, Discussions, Settings
│       ├── components/      # Navbar, RecordButton, TranscriptionDisplay, ...
│       ├── hooks/           # useSpeechRecognition
│       ├── services/        # api.js (Axios instance)
│       └── context/         # AuthContext
└── server/                  # Node.js + Express backend
    └── src/
        ├── controllers/     # authController, noteController, noteAiController, ...
        ├── services/        # aiService, noteOrganizer
        ├── models/          # Sequelize models
        ├── routes/          # Express routes
        ├── middleware/      # authMiddleware
        └── config/          # database.js, constants.js
```

---

## Getting Started

### Prerequisites
- Node.js 18+
- MySQL
- Google Gemini API key

### 1. Clone the repository

```bash
git clone https://github.com/PatrykSobilo/onlineAssistant.git
cd onlineAssistant
```

### 2. Configure environment variables

Create `server/.env`:

```env
PORT=5000
DB_HOST=localhost
DB_USER=your_mysql_user
DB_PASSWORD=your_mysql_password
DB_NAME=online_assistant
JWT_SECRET=your_secret_key
GEMINI_API_KEY=your_gemini_api_key
CLIENT_URL=http://localhost:5173
NODE_ENV=development
```

Create `client/.env`:

```env
VITE_API_URL=http://localhost:5000
```

### 3. Set up the database

```bash
mysql -u root -p < server/create_database.sql
```

### 4. Install dependencies & run

```bash
# Backend
cd server
npm install
npm run dev

# Frontend (separate terminal)
cd client
npm install
npm run dev
```

Frontend runs on `http://localhost:5173`, backend on `http://localhost:5000`.

---

## First Use

1. Register an account and log in
2. Go to **Categories** and create at least one category before using any other features
3. Return to the **Dashboard** and start recording notes

---

## Security

- Rate limiting on `/api/auth` (10 requests / 15 min)
- JWT secret validated at startup — server refuses to start without it
- Passwords hashed with bcrypt
- 401 responses automatically clear the session and redirect to login
- Database transactions for multi-step operations

---

## License

ISC
