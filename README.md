# ORDO — Your Life. In Order.

> Premium monochrome SaaS personal routine, task, calendar, and productivity platform. Built with Next.js, Express, TypeScript, and MongoDB.

---

## 🌟 Vision & Core Philosophy

ORDO is a personal operating system designed to manage realistic 24-hour days. Its core loop is:

$$\text{Plan} \longrightarrow \text{Execute} \longrightarrow \text{Track} \longrightarrow \text{Understand} \longrightarrow \text{Improve}$$

Unlike simple to-do lists, ORDO helps you:
- Structure your day on an interactive **24-hour timeline** with fixed commitments, flexible learning blocks, and unplanned interruptions.
- Record precise task outcomes (**Success**, **Pending**, **Failed**, **Half**) along with predefined reason categories and handwritten **Actual Reasons**.
- Create and apply reusable **Daily & Weekly Routine Templates** with intelligent conflict detection.
- Unified **Calendar View** (Day, Week, Month) with bidirectional Google Calendar integration.
- In-depth **Productivity Analytics & Trends** (time accuracy, weekday heatmaps, root cause distraction analysis).
- Guided **Weekly Reviews** and non-intrusive **AI Productivity Coaching**.

---

## 📂 Architecture

ORDO is architected as two independent applications communicating over a typed REST API contract (`/api/v1`):

```text
ORDO/
├── backend/            # Express, Node.js, TypeScript, Mongoose, Zod, OpenAPI
├── frontend/           # Next.js 14 (App Router), TypeScript, Tailwind CSS, shadcn/ui
├── docs/               # PRD, API Contract, and Database Setup guides
│   ├── PRD.md
│   ├── API_CONTRACT.md
│   └── DATABASE_SETUP.md
└── README.md
```

---

## 🚀 Quick Start

### 1. Prerequisites
- **Node.js**: v18.0.0 or higher
- **npm** or **pnpm**
- **MongoDB Atlas** account (or runs with built-in in-memory fallback for local testing)

### 2. Backend Setup
```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your MongoDB Atlas URI or leave default for in-memory DB
npm run dev
```
Backend runs at `http://localhost:5000`. API documentation is available at `http://localhost:5000/api/docs`.

### 3. Frontend Setup
```bash
cd frontend
npm install
cp .env.example .env.local
npm run dev
```
Frontend runs at `http://localhost:3000`.

---

## 🔒 Security & Quality Standards
- Strict user-scoped database isolation on all queries (anti-IDOR).
- HttpOnly, Secure, SameSite session cookies.
- Argon2 / bcrypt password hashing.
- Google OAuth 2.0 with decoupled Calendar scopes.
- Strict Monochrome Design System inspired by shadcn/ui, Clerk, Neon, and Cal.com.

---

## 📄 Documentation
- [Product Requirements Document (PRD)](./docs/PRD.md)
- [API Contract Specification](./docs/API_CONTRACT.md)
- [MongoDB & Database Setup Guide](./docs/DATABASE_SETUP.md)

