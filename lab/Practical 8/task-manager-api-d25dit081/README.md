# Practical 8: Performance Optimization and Lazy Loading in React

This project implements route-based code splitting and lazy loading in the React Task Management application using `React.lazy()` and `Suspense`.

---

## 🚀 Features

- **Route-Based Code Splitting**:
  - Dynamically imports route components (`Home`, `Projects`, `Contact`, `NotFound`) on demand using `React.lazy(() => import(...))`.
  - Decreases initial bundle size and initial page load time.
- **Suspense Fallback UI**:
  - Encapsulates routes with `<Suspense fallback={<PageLoader />}>` to render a non-blocking loading state during chunk fetching.
- **Empirical Performance Measurement**:
  - Measured and verified bundle sizes and generated chunk files using Vite build output and DevTools Network profiling.

---

## 📊 Before vs After Optimization Comparison

| Metric | Before Optimization (Single Bundle) | After Optimization (Code Splitting) |
| :--- | :---: | :---: |
| **Initial JS Bundle Size** | `254.18 kB` (`79.88 kB` gzip) | **`234.28 kB`** (`75.18 kB` gzip) *(Reduced by ~20 kB)* |
| **Route Chunks** | 0 (All routes loaded upfront) | **4 independent chunks** generated: <br>• `Projects.js`: `17.81 kB`<br>• `Home.js`: `1.72 kB`<br>• `Contact.js`: `1.18 kB`<br>• `NotFound.js`: `0.26 kB` |
| **Network Requests on First Visit (`/`)** | Downloads all app code upfront | Only downloads main bundle + `Home.chunk.js` |
| **Build Time** | `290ms` | **`122ms`** |

---

## 🛠️ Tech Stack

- **Frontend**: React 19, React Router v7, React.lazy, Suspense, Vite
- **Backend**: Node.js, Express 5, Mongoose 9, MongoDB, JWT, Bcrypt

---

## ⚙️ How to Run Locally

### 1. Install Dependencies
```bash
npm install
```

### 2. Build and Verify Code Splitting
```bash
npm run build
```
Notice separate chunk files: `Home-*.js`, `Projects-*.js`, `Contact-*.js`.

### 3. Run Development Server
```bash
npm run dev
```
Open `http://localhost:5173/` with DevTools (Network tab ➔ JS filter) to observe chunks loading dynamically on route navigation.
