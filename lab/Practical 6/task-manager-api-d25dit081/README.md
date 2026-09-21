# Practical 6: Full Stack Integration (React + Node.js/Express + MongoDB)

This project integrates the React frontend with the Node.js/Express REST API and MongoDB database into a fully functioning full-stack Task Management application.

---

## 🚀 Features

- **Full Stack CRUD Operations**:
  - **Create**: Add new tasks with title, description, and priority level (`low`, `medium`, `high`) via `POST /tasks`.
  - **Read**: Fetch all saved tasks from MongoDB on page load via `GET /tasks`.
  - **Update**: Toggle completion status or edit task information in real-time via `PUT /tasks/:id`.
  - **Delete**: Remove tasks from MongoDB via `DELETE /tasks/:id`.
- **CORS Configured Backend**: Cross-Origin Resource Sharing enabled on the Express server to seamlessly handle frontend API calls.
- **Centralized API Service**: Encapsulated network requests inside `src/services/api.js`.
- **Interactive UI Feedback**:
  - Loading spinner indicator during data fetching.
  - Connection error banner with automatic retry functionality.
  - Toast notifications confirming task creation, status updates, and deletions.
  - Confirmation dialog before deleting any task.
  - Filtering by **All**, **Pending**, and **Completed** tasks with live counters.
- **Data Persistence**: All task state is permanently preserved in MongoDB across browser reloads and server restarts.

---

## 🛠️ Tech Stack

- **Frontend**: React 19, React Router v7, Vite, Vanilla CSS
- **Backend**: Node.js, Express 5, Mongoose 9, CORS, Dotenv
- **Database**: MongoDB (Local or Atlas)

---

## ⚙️ How to Run Locally

### 1. Prerequisites
- Node.js (v18+) and npm installed
- MongoDB installed and running locally (`mongodb://127.0.0.1:27017`) or a MongoDB Atlas URI

### 2. Environment Configuration
Ensure `.env` exists in the root folder with the following variables:
```env
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/task-manager-api
```

### 3. Install Dependencies
```bash
npm install
```

### 4. Running Both Servers

Run the backend and frontend concurrently in two separate terminal windows:

#### **Terminal 1: Start Backend Server**
```bash
npm run server
```
*The Express backend server runs on `http://localhost:5000`.*

#### **Terminal 2: Start Frontend App**
```bash
npm run dev
```
*The Vite React frontend application runs on `http://localhost:5173`.*

Open your browser at:
👉 **`http://localhost:5173/tasks`** (or `http://localhost:5173/projects`)

---

## 🧪 Verification & Testing Guide

1. **Verify Read (GET)**: Opening `http://localhost:5173/tasks` shows a loading indicator followed by the task list fetched from MongoDB.
2. **Verify Create (POST)**: Fill out the task form, select priority, and click "+ Add Task". The new task appears in the list, and a success toast is shown.
3. **Verify Update (PUT)**: Check the checkbox on a task item. The title strikethrough updates and the status is saved to MongoDB.
4. **Verify Delete (DELETE)**: Click "Delete". A confirmation modal prompts you to confirm. On confirming, the task is removed from both UI and database.
5. **Verify Persistence**: Refresh the browser (F5) to verify that all created, updated, and deleted tasks remain intact.
