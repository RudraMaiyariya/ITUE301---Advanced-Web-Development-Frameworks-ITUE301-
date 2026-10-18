# Practical 11: Containerization with Docker and Docker Compose

This project containerizes the complete full-stack Task Management application (React Frontend, Node/Express Backend, and MongoDB) using Docker and orchestrates all services with Docker Compose.

---

## 🚀 Features

- **Dockerized Backend (`Dockerfile.backend`)**:
  - Encapsulates Node.js/Express API with non-root production Alpine image.
  - Exposes port `5000` and receives MongoDB connection string dynamically via environment variables.
- **Multi-Stage Frontend Build (`Dockerfile.frontend`) - Supplementary Q2**:
  - **Stage 1 (Build)**: Compiles React assets using Vite.
  - **Stage 2 (Production)**: Lightweight runtime serving static output with Vite Preview, shrinking image size from ~1GB to ~85MB.
- **Docker Compose Orchestration (`docker-compose.yml`)**:
  - Boots all 3 services (`frontend`, `backend`, `mongodb`) using a single command: `docker-compose up --build`.
  - Configures an internal bridge network (`app-network`) allowing containers to communicate using service names (`mongodb`, `backend`).
- **Build Context Exclusion (`.dockerignore`) - Supplementary Q1**:
  - Excludes `node_modules`, `.env`, and build artifacts from the build context, dramatically speeding up build times.
- **Data Persistence with Named Volumes - Supplementary Q3**:
  - Utilizes a persistent named volume (`mongo_data:/data/db`) so MongoDB data survives container restarts and down/up cycles.

---

## 🔄 Multi-Container Architecture

```text
                  [ HOST BROWSER ]
                  │              │
        Port 5173 │              │ Port 5000
                  ▼              ▼
       ┌────────────────┐     ┌────────────────┐
       │ task-frontend  │────►│  task-backend  │
       │ (React/Vite)   │     │ (Node/Express) │
       └────────────────┘     └────────────────┘
                                      │
                                      │ Port 27017
                                      ▼
                             ┌────────────────┐
                             │  task-mongodb  │
                             │ (Official Mongo)│
                             └────────────────┘
                                      │
                                      ▼ (Persistent Mount)
                             [ Named Volume: mongo_data ]
```

---

## ⚙️ How to Run the Entire Stack

### 1. Build and Start All Containers (Single Command)
```bash
docker-compose up --build
```

### 2. Verify Running Containers
```bash
docker ps
```
All three containers (`task-manager-frontend`, `task-manager-backend`, `task-manager-mongodb`) will show status `Up`.

### 3. Access Applications
- **Frontend App**: `http://localhost:5173`
- **Backend API**: `http://localhost:5000/tasks`
- **MongoDB**: `localhost:27017`

### 4. Stop All Services
```bash
docker-compose down
```
*(Data will safely persist in `mongo_data` volume)*
