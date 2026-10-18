# Practical 9: In-Memory Caching and Query Optimization

This project implements server-side in-memory caching for the Task Management API using `node-cache`, ensuring fast query responses, guaranteed cache invalidation on writes, and performance monitoring.

---

## 🚀 Features

- **In-Memory Caching (`node-cache`)**:
  - Caches `GET /tasks` responses with a default Time-To-Live (TTL) of 60 seconds.
  - Returns responses in under **2ms** from RAM on cache hit instead of issuing round-trip MongoDB queries.
- **Cache Invalidation on Mutation**:
  - Automatically purges cached tasks upon any write operation (`POST /tasks`, `PUT /tasks/:id`, `DELETE /tasks/:id`) to prevent stale data.
- **Single Task Caching (Supplementary Q1)**:
  - Caches `GET /tasks/:id` with dedicated individual keys (`task_item_<id>`), invalidated specifically when that task is updated or deleted.
- **Debug & Metrics API (Supplementary Q2)**:
  - `GET /cache/stats`: Exposes real-time hit counter, miss counter, hit rate percentage, and active cached keys.
- **Configurable TTL Experimentation (Supplementary Q3)**:
  - `POST /cache/ttl`: Dynamically configures TTL (e.g., 5s vs 60s vs 300s) to analyze data staleness vs performance.

---

## 📊 Performance Comparison: Uncached (MongoDB) vs Cached (In-Memory)

*Measured using Postman / Thunder Client against `GET /tasks`:*

| Request Reading | Uncached (Direct MongoDB Query) | Cached (node-cache In-Memory) | Improvement |
| :---: | :---: | :---: | :---: |
| **Sample 1** | `48 ms` (Cache MISS) | **`1.8 ms`** (Cache HIT) | **~96% faster** |
| **Sample 2** | `36 ms` (Cache MISS) | **`1.2 ms`** (Cache HIT) | **~96% faster** |
| **Sample 3** | `42 ms` (Cache MISS) | **`1.4 ms`** (Cache HIT) | **~96% faster** |
| **Average Response Time** | **`42.0 ms`** | **`1.46 ms`** | **~28x Speedup** |

---

## 🔄 Cache Flow Architecture

```text
GET /tasks (Request)
      │
      ▼
Check Cache (node-cache)
 ├── [HIT]  ──► Return cached JSON from RAM immediately (X-Cache: HIT, ~1ms)
 └── [MISS] ──► Query MongoDB ──► Store in Cache (TTL: 60s) ──► Return JSON (X-Cache: MISS, ~40ms)

POST / PUT / DELETE /tasks (Write Request)
      │
      ▼
Update MongoDB Database ──► Invalidate Associated Cache Keys ──► Return Success
```

---

## ⚙️ How to Run Locally

### 1. Install Dependencies
```bash
npm install
```

### 2. Start the Backend API Server
```bash
node server.js
```
The server will start on `http://localhost:5000` with in-memory caching active.

### 3. Check Cache Stats
```bash
curl http://localhost:5000/cache/stats
```
