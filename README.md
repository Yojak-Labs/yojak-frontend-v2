# Yojak AI Frontend (v2)

AI-powered construction project management frontend built with Next.js App Router, TypeScript, React Query, and a custom design system.

## Overview

Yojak AI helps teams:
- Manage construction projects and tasks
- Track progress, priorities, and timelines
- Use role-based experiences for users and admins
- Access a demo-friendly dashboard flow when unauthenticated
- Work with token-based auth + automatic refresh flow

This repository is the frontend app that integrates with the backend API:
- `https://yojak-backend.onrender.com/v1/yojakai`

## Tech Stack

- Next.js `16.2.0` (App Router)
- React `19`
- TypeScript `5.7`
- Tailwind CSS `4`
- Radix UI primitives + custom UI components
- TanStack React Query (`@tanstack/react-query`)
- Zustand (auth state persistence)
- Axios (API client/interceptors)
- Zod + React Hook Form (validation/forms)
- Sonner (toast notifications)
- next-themes (light/dark theme support)

## Project Structure

```txt
app/
  page.tsx                          # Landing page
  layout.tsx                        # Root metadata/theme provider
  globals.css                       # Global design tokens + theme variables

  (auth)/
    layout.tsx
    login/page.tsx
    register/page.tsx
    forgot-password/page.tsx

  (dashboard)/
    layout.tsx
    dashboard/page.tsx
    profile/page.tsx
    projects/page.tsx
    projects/new/page.tsx
    projects/[id]/page.tsx
    projects/[id]/edit/page.tsx
    tasks/page.tsx
    tasks/[id]/page.tsx
    admin/layout.tsx
    admin/users/page.tsx
    admin/admins/page.tsx
    admin/agents/page.tsx
    admin/tools/page.tsx

components/
  layout/                           # Sidebar, mobile nav, logo components, route guard
  providers/                        # AuthProvider, QueryProvider
  projects/, tasks/, ui/            # Feature and reusable UI components

lib/
  api/                              # API modules by domain
  stores/auth-store.ts              # Auth store (Zustand)
  types.ts                          # Shared types
  utils.ts                          # Utility helpers

public/
  logo.png                          # Current project logo
  icon-*.png, apple-icon.png        # App/browser icons
```

## Features

### Authentication
- Login, register, OTP verification, forgot/reset password
- JWT + refresh token persistence in localStorage
- Automatic token refresh on `401` via `/auth/refresh-token`
- Robust token parsing for both camelCase and snake_case fields

### Demo-friendly Protected Routes
- `RouteGuard` allows unauthenticated users to see dashboard pages in demo mode
- Shows a top banner prompting Sign In / Get Started
- Avoids forced login redirect for pure demo sessions

### Project Management
- Create, update, delete projects
- Filter projects by status with backend query param format:
  - `/projects?status=planned`
- Project status values:
  - `planned`, `in_progress`, `completed`, `on_hold`, `cancelled`

### Task Management
- CRUD tasks
- Filter by status and project
- Status values:
  - `pending`, `in_progress`, `completed`, `blocked`

### Admin Area
- Admin users management
- Admin account management
- Agent management
- Tool management

### Profile
- Update personal details
- Displays company/college data with key fallback support
- Displays email verification badge/status

### Design/Theming
- Token-driven theme in `app/globals.css`
- Dark mode currently uses a navy-tinted palette (not pure black)
- Reusable glass/gradient utilities and animated visual accents

### Branding
- New project logo integrated across:
  - Landing page
  - Sidebar/mobile nav
  - Auth screens
  - Browser/app icons metadata

## API Layer

API modules are under `lib/api`:

- `auth.ts`
  - `register`, `login`, `logout`, `sendOtp`, `verifyOtp`, `resetPassword`, `checkHealth`
- `projects.ts`
  - `getAll(status?)`, `getById`, `create`, `update`, `delete`
- `tasks.ts`
  - `getAll({ status?, projectId? })`, `getById`, `create`, `update`, `delete`
- `users.ts`, `admin.ts`, `agents.ts`, `tools.ts`

### Axios Client Behavior (`lib/api/client.ts`)

- Adds `Authorization: Bearer <token>` when token is available
- On `401`:
  1. Attempts refresh using stored refresh token
  2. Saves new access + refresh tokens
  3. Retries original request
- Uses queueing while refresh is in progress to avoid duplicate refresh calls
- Redirects to login only when there was a real auth session to recover

## Routing

### Public
- `/` (landing)
- `/login`
- `/register`
- `/forgot-password`

### App
- `/dashboard`
- `/projects`, `/projects/new`, `/projects/:id`, `/projects/:id/edit`
- `/tasks`, `/tasks/:id`
- `/profile`

### Admin
- `/admin/users`
- `/admin/admins`
- `/admin/agents`
- `/admin/tools`

## Getting Started

### Prerequisites
- Node.js 20+ recommended
- npm, pnpm, or yarn

### Install

```bash
npm install
# or
pnpm install
```

### Run in Development

```bash
npm run dev
# or
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

### Build / Start

```bash
npm run build
npm run start
```

### Lint

```bash
npm run lint
```

## Configuration Notes

- Backend API base URL is currently hardcoded in `lib/api/client.ts`:
  - `https://yojak-backend.onrender.com/v1/yojakai`
- Recommended improvement:
  - Move it to an environment variable like `NEXT_PUBLIC_API_BASE_URL`

## Data Types

Main domain types live in `lib/types.ts`:
- `User`, `Admin`
- `Project`, `ProjectStatus`, `ProjectType`
- `Task`, `TaskStatus`, `TaskPriority`
- `Agent`, `Tool`

## Recent Project-Specific Adjustments

- Project status filter now explicitly uses backend expected query format (`?status=...`)
- Dashboard and project screens rely on backend-scoped data instead of extra frontend ownership filtering
- Refresh-token flow hardened for different backend token key formats
- Demo route experience preserved without auto-login redirect loop
- Logo replaced with `public/logo.png` and applied across app UI + metadata icons

## Recommended Next Improvements

- Introduce `.env`-based API configuration
- Add unit/integration tests for API client + auth refresh logic
- Add route-level test coverage for demo vs authenticated rendering
- Add CI checks for lint, type-check, and build

## License

Private project. All rights reserved.
