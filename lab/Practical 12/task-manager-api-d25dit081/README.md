# Practical 12: CI/CD Pipeline with GitHub Actions

[![CI/CD Pipeline](https://github.com/RudraMaiyariya/ITUE301---Advanced-Web-Development-Frameworks-ITUE301-/actions/workflows/ci.yml/badge.svg)](https://github.com/RudraMaiyariya/ITUE301---Advanced-Web-Development-Frameworks-ITUE301-/actions/workflows/ci.yml)

This project implements an automated Continuous Integration and Continuous Deployment (CI/CD) pipeline for the Task Management application using **GitHub Actions**.

---

## 🚀 Pipeline Features

- **Automated Workflow (`.github/workflows/ci.yml`)**:
  - Triggers on every `push` to `main` and on all `pull_request` events targeting `main` (Supplementary Q2).
  - Runs in an isolated Ubuntu Linux virtual environment (`ubuntu-latest`).
- **Pipeline Jobs**:
  1. **Job 1: Lint & Code Style Check (Supplementary Q1)**:
     - Verifies backend file syntax across `server.js`, `cache.js`, `events.js`, `listeners.js` before executing tests.
  2. **Job 2: Build & Automated Tests (Main Problem)**:
     - Installs application dependencies (`npm install`).
     - Executes automated test suite (`npm test`).
     - Builds production frontend bundle (`npm run build`).
- **Live Status Badge (Supplementary Q3)**:
  - Dynamically displays build status (Passing / Failing) at the top of the README.

---

## 🧪 Automated Test Suite (`test/api.test.js`)

The test suite exercises core backend and business logic:
- `Test 1`: Environment configuration and default port verification (`5000`).
- `Test 2`: JWT token generation, expiration, and payload decoding.
- `Test 3`: Task payload schema validation (required `title` string and `priority` enum: `low | medium | high`).
- `Test 4`: In-memory cache default TTL verification (`60s`).

---

## 🔄 Demonstrating Failed vs Passed Pipeline

### 1. Failing Pipeline Run (Deliberately Broken Test)
To demonstrate failure in CI:
- Change line in `test/api.test.js`:
  ```javascript
  // Deliberately broken assertion:
  assert.equal(defaultPort, 9999); // Expected 5000, got 9999
  ```
- Push to GitHub:
  - GitHub Actions runs `npm test` ➔ exits with code `1`.
  - Workflow status turns **Red X ❌ (Failed)** in the GitHub Actions tab.

### 2. Passing Pipeline Run (Fixed Test)
- Revert the assertion back to:
  ```javascript
  assert.equal(defaultPort, 5000);
  ```
- Push to GitHub:
  - Tests pass `4/4` ➔ exits with code `0`.
  - Workflow status turns **Green Checkmark ✔️ (Passed)** in the GitHub Actions tab.

---

## ⚙️ How to Run Tests Locally

```bash
npm test
```
