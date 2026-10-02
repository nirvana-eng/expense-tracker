# 💰 ExpenseTracker Pro

A full-stack expense tracking and analytics application built with React.js, Express.js, and PostgreSQL.

![Dark Mode](https://img.shields.io/badge/Theme-Dark_Mode-1a1f2e)
![React](https://img.shields.io/badge/Frontend-React_18-61DAFB)
![Express](https://img.shields.io/badge/Backend-Express.js-000000)
![PostgreSQL](https://img.shields.io/badge/Database-PostgreSQL-336791)
![Bootstrap](https://img.shields.io/badge/UI-Bootstrap_5-7952B3)

## ✨ Features

- 🔐 **JWT Authentication** — Secure login/register with bcrypt password hashing
- 💸 **Expense CRUD** — Add, edit, delete expenses with category management
- 🔍 **Advanced Filtering** — Search, filter by category/date/amount, sort
- 📎 **Receipt Upload** — Attach receipt images or PDFs (up to 5MB)
- 📊 **Analytics Dashboard** — Monthly trends, category breakdown, spending insights
- 🌙 **Dark Mode** — Beautiful glassmorphism dark theme
- 📱 **Responsive** — Works on desktop, tablet, and mobile
- 🛡️ **Security** — Helmet, CORS, rate limiting, input validation, XSS prevention
- ✅ **Tested** — Jest + Supertest edge case tests

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL 12+
- npm or yarn

### 1. Clone & Install

```bash
# Install all dependencies (root + server + client)
npm run install-all
```

### 2. Set Up Database

```bash
# Create the PostgreSQL database
psql -U postgres -c "CREATE DATABASE expense_tracker;"
```

### 3. Configure Environment

Edit `server/.env` and update:
```env
DB_PASSWORD=your_postgres_password
JWT_SECRET=your_secret_key_here
```

### 4. Start Development

```bash
# Run both server and client concurrently
npm run dev
```

- 🌐 Frontend: http://localhost:5173
- 🔌 API: http://localhost:5000/api
- ❤️ Health: http://localhost:5000/api/health

### 5. Run Tests

```bash
npm test
```

## 📁 Project Structure

```
expense-tracker/
├── server/
│   ├── config/
│   │   ├── db.js           # PostgreSQL connection pool
│   │   └── init.sql        # Database schema & seeds
│   ├── middleware/
│   │   ├── auth.js         # JWT authentication
│   │   ├── validate.js     # Input validation & sanitization
│   │   └── upload.js       # File upload (Multer)
│   ├── routes/
│   │   ├── auth.js         # Register, Login, Profile
│   │   ├── expenses.js     # CRUD + Stats
│   │   └── upload.js       # Receipt uploads
│   ├── tests/
│   │   ├── auth.test.js    # Auth edge case tests
│   │   └── expenses.test.js # Expense edge case tests
│   ├── uploads/            # Uploaded receipts
│   ├── server.js           # Express entry point
│   ├── package.json
│   └── .env
├── client/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navbar.jsx
│   │   │   ├── PrivateRoute.jsx
│   │   │   ├── ExpenseForm.jsx
│   │   │   ├── ExpenseList.jsx
│   │   │   └── ExpenseFilter.jsx
│   │   ├── pages/
│   │   │   ├── Login.jsx
│   │   │   ├── Register.jsx
│   │   │   ├── Dashboard.jsx
│   │   │   ├── Expenses.jsx
│   │   │   └── Analytics.jsx
│   │   ├── context/
│   │   │   └── AuthContext.jsx
│   │   ├── services/
│   │   │   └── api.js
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   └── index.html
├── package.json
├── .gitignore
└── README.md
```

## 🛡️ Security Features

| Feature | Implementation |
|---------|---------------|
| Password Hashing | bcryptjs (12 salt rounds) |
| Authentication | JWT with expiry |
| HTTP Headers | Helmet.js |
| CORS | Whitelisted origins |
| Rate Limiting | 100 req/15min (20 for auth) |
| Input Validation | express-validator + sanitization |
| SQL Injection | Parameterized queries |
| XSS Prevention | HTML tag stripping |
| File Upload | MIME type + extension + size validation |

## 📊 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login |
| GET | `/api/auth/me` | Get current user |
| GET | `/api/expenses` | List expenses (filtered) |
| POST | `/api/expenses` | Create expense |
| PUT | `/api/expenses/:id` | Update expense |
| DELETE | `/api/expenses/:id` | Delete expense |
| GET | `/api/expenses/stats` | Analytics data |
| POST | `/api/upload` | Upload receipt |

## 🧪 Edge Cases Tested

- Empty/missing fields
- Negative and zero amounts
- Future dates
- SQL injection in search
- XSS in description
- Duplicate email registration
- Invalid/expired JWT tokens
- Wrong file types and oversized uploads
- Pagination edge cases (page 0, negative, beyond max)
- Invalid ID formats
- Very long input strings
- Unauthorized access attempts
