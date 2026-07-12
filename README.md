# EduSys — Frontend

A React + TypeScript Single Page Application (SPA) built with Vite for the **EduSys** platform — an integrated management system for academic performance and career readiness tracking at **iCET (Institute of Computer Engineering Technology), Panadura**.

EduSys replaces fragmented spreadsheets, manual attendance sheets, and disconnected learning platforms with a single, role-based web app that tracks both a student's **academic performance** and their **career readiness** through a dual-track progress system.

## Tech Stack

| Layer            | Technology                        |
|-------------------|------------------------------------|
| Language          | TypeScript                         |
| Framework         | React 19                           |
| Build Tool        | Vite                                |
| Styling           | Tailwind CSS 4                     |
| UI Components     | shadcn/ui (`base-nova` style) + Base UI |
| Icons             | lucide-react                       |
| Linting           | Oxlint                             |
| Backend (separate repo) | Spring Boot (Java) REST API  |
| Database (backend)      | MySQL                        |

## Project Structure

```
edusys-frontend/
├── src/
│   ├── assets/                # Static assets (images, icons)
│   ├── components/
│   │   └── ui/                # shadcn/ui components (button, etc.)
│   ├── lib/
│   │   └── utils.ts           # Shared utility helpers (cn, etc.)
│   ├── App.tsx                # Root application component
│   ├── main.tsx                # Application entry point
│   └── index.css              # Tailwind + global styles
├── public/                    # Static public assets
├── components.json            # shadcn/ui configuration
├── vite.config.ts             # Vite configuration (@ alias -> src/)
├── tsconfig.json / tsconfig.app.json / tsconfig.node.json
└── package.json
```

## Getting Started

### Prerequisites

- Node.js 20+
- npm 10+
- The [EduSys backend](#related-repositories) running locally (or a reachable API URL) for full functionality

### 1. Clone the repository

```bash
git clone https://github.com/your-org/edusys-frontend.git
cd edusys-frontend
```

### 2. Install dependencies

```bash
npm install
```

### 3. Run the development server

```bash
npm run dev
```

The app starts on `http://localhost:5173` by default.

### 4. Build for production

```bash
npm run build
```

### 5. Preview the production build

```bash
npm run preview
```

## Available Scripts

| Script            | Description                                  |
|-------------------|-----------------------------------------------|
| `npm run dev`     | Start the Vite dev server with HMR            |
| `npm run build`   | Type-check (`tsc -b`) and build for production |
| `npm run lint`    | Run Oxlint over the codebase                  |
| `npm run preview` | Preview the built app locally                 |

## Feature Modules

The frontend is being built out to cover the 5 feature sets (14 modules) defined in the EduSys project scope:

### Feature Set 1 — Institute Administration
- **User & Role Management UI** — Admin views for managing Admin, Teacher, Reviewer, Student, and Parent accounts
- **Course & Calendar Views** — Course structure setup and academic calendar management
- **Admissions Console** — Track admission inquiries and assign initial Career Scale Level

### Feature Set 2 — Student Lifecycle & Finance
- **Fee Management UI** — View payments, digital receipts, and overdue balance reminders
- **Student Profile & Lifecycle Views** — From admission through graduation

### Feature Set 3 — Academic Process Management
- **Online Exam Interface** — Timed, one-attempt tests drawn from a central question bank
- **Course Material & Assignment Views** — Upload/view materials, submit and grade assignments
- **Results Dashboard** — Auto-published results with instant feedback

### Feature Set 4 — Career Scale Process Management ★
- **Career Scale Task Board** — Create and browse career tasks with point values and rubrics
- **Reviewer Evaluation UI** — Review submissions and assign Career Scale Levels (L1–L7)
- **Career Points Visualization** — Real-time display of calculated career points and level progression

### Feature Set 5 — Stakeholder Portals & Communication
- **QR Attendance UI** — Generate/scan time-sensitive QR codes for attendance
- **Dual-Progress Dashboards** — Combined Academic + Career Scale charts for students and parents
- **Reports View** — Attendance, progress, financial balance, and merit list reports

## User Roles

| Role      | Access |
|-----------|--------|
| Admin     | Full system access — user management, courses, finance, reports |
| Teacher   | Course materials, assignments, grading, exam scheduling, QR attendance |
| Reviewer  | Career Scale submissions review and level assignment |
| Student   | Own academic + career scale dashboard, exam attempts, attendance |
| Parent    | Read-only view of their child's dual-progress dashboard |

## Path Aliases

The `@` alias is configured in [vite.config.ts](vite.config.ts) and `tsconfig.json` to point to `src/`:

```ts
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
```

## Adding shadcn/ui Components

This project uses [shadcn/ui](https://ui.shadcn.com) with the `base-nova` style and `neutral` base color. To add a new component:

```bash
npx shadcn@latest add <component-name>
```

Components are added to `src/components/ui/` and can be imported via the `@/components/ui` alias.

## Troubleshooting

**Blank page / white screen on `npm run dev`**
Check the browser console for errors. Confirm `npm install` completed without errors and that you're using Node.js 20+.

**Tailwind classes not applying**
Ensure `src/index.css` is imported in `main.tsx` and that the Tailwind Vite plugin is present in `vite.config.ts`.

**`@/...` imports not resolving**
Confirm the alias exists in both `vite.config.ts` (`resolve.alias`) and `tsconfig.app.json` (`compilerOptions.paths`).

**Type errors on `npm run build` but not in the editor**
Run `tsc -b` directly to see the full project-wide error output — the editor may only be checking the currently open file.

**API requests failing / CORS errors**
Confirm the backend is running and reachable, and that its CORS configuration allows requests from `http://localhost:5173`.

## Contributing

### Branching Strategy

```
main            — stable, production-ready code
dev             — integration branch for completed features
feature/<name>  — individual feature branches (branch off dev)
fix/<name>      — bug fix branches
```

Always branch from `dev`, never directly from `main`.

### Workflow

1. Branch from `dev`:
   ```bash
   git checkout dev
   git pull origin dev
   git checkout -b feature/your-feature-name
   ```
2. Make your changes and write meaningful commit messages:
   ```bash
   git commit -m "feat: add career scale dashboard chart"
   ```
3. Push your branch and open a Pull Request targeting `dev`:
   ```bash
   git push origin feature/your-feature-name
   ```
4. Describe what changed and why in the PR, and reference any related issue numbers.

### Commit Message Convention

Use [Conventional Commits](https://www.conventionalcommits.org/):

| Prefix       | Use for                                  |
|--------------|--------------------------------------------|
| `feat:`      | New feature                                 |
| `fix:`       | Bug fix                                     |
| `refactor:`  | Code restructure without behaviour change   |
| `style:`     | Formatting / UI styling tweaks              |
| `docs:`      | Documentation only                          |
| `chore:`     | Build config, dependencies                  |

### Code Standards

- Follow standard TypeScript/React naming conventions (`camelCase` for variables/functions, `PascalCase` for components)
- Keep components small and composable — colocate component-specific logic, lift shared logic into `src/lib`
- Run `npm run lint` before opening a PR
- Do not commit build output (`dist/`) or environment files

## Related Repositories

| Repository        | Description                        |
|--------------------|--------------------------------------|
| `edusys-frontend`  | This repo — React SPA (dashboards, portals) |
| `edusys-backend`   | Spring Boot REST API                |
