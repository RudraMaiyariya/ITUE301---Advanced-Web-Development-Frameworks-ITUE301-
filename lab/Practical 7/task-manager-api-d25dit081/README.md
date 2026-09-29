# Practical 7: Authentication and Middleware Pipeline with JWT

This project implements a full-stack Task Management application featuring JWT-based authentication, bcrypt password hashing, input validation middleware, and protected API routes.

---

## 🚀 Features

- **User Authentication**:
  - **User Registration (`POST /register`)**: Hashes user passwords using `bcrypt` (salt rounds: 10) before saving to MongoDB.
  - **User Login (`POST /login`)**: Compares passwords using `bcrypt.compare()` and issues a signed JSON Web Token (JWT) with 1-hour expiration.
  - **User Profile (`GET /me`)**: Returns currently authenticated user details via decoded JWT.
- **Middleware Pipeline**:
  - **Authentication Middleware (`middleware/auth.js`)**: Inspects `Authorization: Bearer <token>` header, verifies token validity, and sets `req.user`.
  - **Server-Side Input Validation (`middleware/validation.js`)**: Enforces required fields, email format, and password length before requests reach the database.
  - **Content-Type & ObjectId Validation**: Rejects invalid payloads and malformed MongoDB IDs.
- **Protected Task Management CRUD**:
  - All task endpoints (`GET`, `POST`, `PUT`, `DELETE` on `/tasks`) are protected by JWT authentication middleware.
- **Frontend Integration**:
  - React UI with Sign In / Register toggle, JWT storage in `localStorage`, user header, sign-out functionality, and automatic redirect on token expiration (HTTP 401).

---

## 🛠️ Tech Stack

- **Frontend**: React 19, React Router v7, Vite, Vanilla CSS
- **Backend**: Node.js, Express 5, Mongoose 9, CORS, Dotenv, bcryptjs, jsonwebtoken
- **Database**: MongoDB (Local or Atlas)

---

## ⚙️ How to Run Locally

### 1. Prerequisites
- Node.js (v18+) and npm installed
- MongoDB running locally on `mongodb://127.0.0.1:27017`

### 2. Configure Environment Variables
Copy `.env.example` to `.env`:
```env
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/task-manager-api
JWT_SECRET=your_jwt_secret_key_here
```

### 3. Install Dependencies
```bash
npm install
```

### 4. Start the Application
Run in two separate terminals:

```bash
# Terminal 1: Backend Server (Port 5000)
npm run server

# Terminal 2: Frontend Client (Port 5173)
npm run dev
```

Visit: **`http://localhost:5173/tasks`**
