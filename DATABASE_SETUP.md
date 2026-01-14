# Database Setup Instructions

## MySQL Setup

### 1. Install MySQL
Download and install MySQL from: https://dev.mysql.com/downloads/mysql/

### 2. Create Database
Open MySQL command line or workbench and run:

```sql
CREATE DATABASE onlineassistant CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 3. Configure .env
Update your `.env` file with database credentials:

```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=onlineassistant
```

### 4. Tables Structure
The tables will be created automatically by Sequelize when you start the server:

#### Users Table
- id (INT, PRIMARY KEY, AUTO_INCREMENT)
- name (VARCHAR(100), NOT NULL)
- email (VARCHAR(255), UNIQUE, NOT NULL)
- password (VARCHAR(255), NOT NULL)
- createdAt (DATETIME)
- updatedAt (DATETIME)

#### User_Settings Table
- id (INT, PRIMARY KEY, AUTO_INCREMENT)
- userId (INT, FOREIGN KEY → users.id, ON DELETE CASCADE)
- language (VARCHAR(10), DEFAULT 'en-US')
- theme (VARCHAR(20), DEFAULT 'light')
- notificationsEnabled (BOOLEAN, DEFAULT true)
- defaultVoiceLanguage (VARCHAR(10), DEFAULT 'en-US')
- createdAt (DATETIME)
- updatedAt (DATETIME)

#### Notes Table
- id (INT, PRIMARY KEY, AUTO_INCREMENT)
- userId (INT, FOREIGN KEY → users.id, ON DELETE CASCADE)
- title (VARCHAR(255))
- content (TEXT, NOT NULL)
- source (ENUM('voice', 'text'), DEFAULT 'text')
- language (VARCHAR(10))
- aiResponse (TEXT)
- createdAt (DATETIME)
- updatedAt (DATETIME)

### 5. Start Server
Once database is created and credentials are set, run:

```bash
cd server
npm run dev
```

Sequelize will automatically:
- Connect to database
- Create all tables
- Set up relationships
- Synchronize schema

### 6. Verify Connection
You should see in console:
```
✅ Database connection established successfully.
✅ All models synchronized successfully.
🚀 Server running on http://localhost:5000
```

## Notes
- All existing in-memory users will be lost
- You'll need to re-register users
- Database will persist data between server restarts
- Sequelize uses `sync({ alter: true })` to automatically update schema
