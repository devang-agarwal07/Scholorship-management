# Adaptive Scholarship Management System

A full-stack scholarship management platform built with **React 18**, **Express**, **Prisma**, and **PostgreSQL**. Features role-based access control, document verification workflows, automated notification pipelines, and comprehensive reporting.

## 🏗️ Architecture

```
scholarship-system/
├── backend/           # Node.js + Express + Prisma + TypeScript
│   ├── prisma/        # Schema, migrations, seed
│   ├── src/
│   │   ├── config/    # Env, database, S3 configs
│   │   ├── middleware/# Auth, RBAC, error handler, rate limiter
│   │   ├── utils/     # JWT, hashing, S3 upload, PDF gen
│   │   ├── jobs/      # BullMQ queues and workers
│   │   ├── modules/   # Feature modules (auth, scholarship, etc.)
│   │   └── app.ts     # Express entry point
│   └── Dockerfile
├── frontend/          # React 18 + Vite + TypeScript + Tailwind
│   ├── src/
│   │   ├── api/       # Axios client and API functions
│   │   ├── store/     # Zustand auth store
│   │   ├── hooks/     # TanStack Query hooks
│   │   ├── components/# UI + Layout + Shared components
│   │   ├── pages/     # Role-based page modules
│   │   └── App.tsx    # Router with role-based routing
│   └── Dockerfile
├── docker-compose.yml # Full stack orchestration
└── .github/workflows/ # CI/CD pipeline
```

## 🚀 Quick Start

### Prerequisites
- Node.js 20+
- PostgreSQL 16+
- Redis 7+
- npm

### 1. Clone & Install

```bash
# Backend
cd backend
cp .env.example .env
npm install
npx prisma generate
npx prisma db push
npx prisma db seed

# Frontend
cd ../frontend
npm install
```

### 2. Run Development Servers

```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
cd frontend
npm run dev
```

### 3. Docker (Full Stack)

```bash
docker-compose up --build
```

## 🔐 Default Credentials

| Role | Email | Password |
|------|-------|----------|
| Super Admin | admin@scholarship.edu | Password123! |
| Verifier | verifier@scholarship.edu | Password123! |
| Committee | committee@scholarship.edu | Password123! |
| Student | student@scholarship.edu | Password123! |

## 📋 Features

### For Students
- Browse and search scholarships
- Multi-step application form with auto-save
- Document upload with drag-and-drop
- Real-time application status tracking

### For Verifiers
- Document review queue
- Verify/reject with remarks
- Auto-workflow progression on verification

### For Committee Members
- Application review with personal statements
- Approve/reject/waitlist actions
- Workflow history tracking

### For Admins
- Dashboard with KPIs and charts
- Scholarship CRUD management
- User management
- Reports with CSV/PDF export
- Budget tracking and utilization

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, TypeScript, Vite, Tailwind CSS |
| State | Zustand (auth), TanStack Query (server) |
| UI | shadcn/ui components, Recharts |
| Backend | Express, TypeScript, Prisma ORM |
| Database | PostgreSQL 16 |
| Cache/Queue | Redis 7, BullMQ |
| Storage | AWS S3 / MinIO |
| Auth | JWT (access + refresh tokens) |
| Validation | Zod (both frontend & backend) |

## 📡 API Endpoints

| Module | Endpoint | Description |
|--------|----------|-------------|
| Auth | POST /api/auth/register | Register new user |
| Auth | POST /api/auth/login | Login |
| Auth | POST /api/auth/refresh | Refresh token |
| Scholarship | GET /api/scholarships | List scholarships |
| Scholarship | POST /api/scholarships | Create (admin) |
| Application | POST /api/applications | Create application |
| Application | POST /api/applications/:id/submit | Submit |
| Document | POST /api/documents/upload | Upload document |
| Document | PUT /api/documents/:id/review | Review (verifier) |
| Workflow | POST /api/workflow/:id/action | Take action |
| Report | GET /api/reports/summary | Dashboard KPIs |

## 📄 License

MIT
