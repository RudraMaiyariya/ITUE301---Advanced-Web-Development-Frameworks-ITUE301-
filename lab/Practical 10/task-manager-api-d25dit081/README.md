# Practical 10: Asynchronous Processing with Event-Driven Architecture

This project implements non-blocking, asynchronous background processing for the Task Management API using Node.js native `EventEmitter`, without relying on external message queues.

---

## 🚀 Features

- **Asynchronous Background Processing (`events.js` & `listeners.js`)**:
  - Uses native `EventEmitter` to decouple background side-effects (notifications, audit logging) from the critical HTTP request-response cycle.
  - When `POST /tasks` is called, the API responds with `201 Created` immediately, while background listeners process notifications asynchronously.
- **Timestamp Evidence (Synchronous vs Asynchronous)**:
  - Logs timestamps at both API response time and listener completion time.
  - Proves that the API response is dispatched before the background task completes.
- **Task Deletion Audit Event (Supplementary Q1)**:
  - Emits and listens to `task-deleted` events on `DELETE /tasks/:id` to log archival audit trails.
- **Resilient Error Listener (Supplementary Q2)**:
  - Registers an `error` listener on the event bus to catch and log errors safely without terminating the server.
- **Simulated Slow Background Handler (Supplementary Q3)**:
  - Injects a simulated 2-second background delay in the notification handler, proving the client receives responses in under 20ms unaffected by background latency.

---

## 🔄 Architecture Flow

```text
POST /tasks (Request from Client)
      │
      ▼
Save Task to MongoDB
      │
      ▼
Send HTTP 201 Response ──► [CLIENT RECEIVES RESPONSE IMMEDIATELY (~20ms)]
      │
      ▼ (Asynchronous emit)
emit('task-created', taskData)
      │
      ▼
Background Listener ('task-created')
      ├── Logs task title, user, timestamp
      └── Simulates heavy work (2s delay) ──► Logs completion at T + 2s
```

---

## 📊 Timestamp Comparison Log Evidence

```text
[API RESPONSE SENT] 201 Created sent to client at: 2026-10-18T17:15:00.120Z

---------------------------------------------------------
[EVENT TRIGGERED] 'task-created' received at 2026-10-18T17:15:00.122Z
[EVENT PAYLOAD] Task: "Complete AWDF Practical 10" | User: Rudra Maiyariya
[BACKGROUND TASK] Dispatching notification email (simulating 2s delay)...
[BACKGROUND TASK FINISHED] Notification sent for "Complete AWDF Practical 10" at 2026-10-18T17:15:02.124Z
---------------------------------------------------------
```
*Note: Client received the HTTP response at `17:15:00.120Z`, while background notification completed at `17:15:02.124Z` (2 seconds later) without blocking the client.*

---

## ⚙️ How to Run Locally

### 1. Start API Server
```bash
node server.js
```

### 2. Create a Task (Observe Console Order)
Send `POST http://localhost:5000/tasks` with Postman/curl and observe the server terminal.
