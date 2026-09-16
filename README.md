# Relay

Relay is a developer workspace for building, organizing, executing, and analyzing HTTP requests. The current Phase 1 implementation provides account sign-in and the responsive workspace shell. Request execution and collection behavior are the next implementation phases; controls for those features remain disabled in the shell.

## Technology

- React 19 and Vite 8 for the frontend
- Express 5 on Bun for the backend API
- MongoDB and Mongoose for persistence
- Zod for API input validation
- JWT and bcrypt for account authentication
- Bun workspaces and the committed `bun.lock` for installation
- The repository's existing Prettier configuration for JavaScript formatting

## Structure

```text
.
├── frontend/
│   ├── src/features/       # Login, workspace, request, response, and navigation UI
│   └── src/shared/         # API client, theme, and reusable UI
├── backend/
│   └── src/
│       ├── features/auth/  # Account login and session API
│       ├── scripts/        # Deterministic demo-account seed
│       └── shared/         # MongoDB, configuration, auth, and errors
├── .vscode/launch.json     # Debug configuration
├── hackerrank.yml          # Authoritative install and run commands
├── setup.sh                # Local environment and database preparation
├── CODING_STANDARDS.md     # Supplemental code organization and quality rules
├── GUIDELINES.md           # Assignment acceptance contract
└── skills/validate/        # Submission verifier
```

## Prerequisites

- Bun 1.3 or later
- MongoDB 8.0 or later, reachable at `127.0.0.1:27017`
- Bash for `setup.sh` (Git Bash on Windows)

MongoDB runs as a separate local service. The backend uses the `MONGODB_URI` from `backend/.env`, which setup creates from `backend/.env.example`. The default database is `relay_db`. Setup generates a random local JWT signing secret when it creates the environment file; local `.env` files are ignored by Git.

## Run

From the repository root:

```bash
bun install
bun start
```

`bun start` runs `setup.sh --start`, checks MongoDB, restores the seeded database state, then starts the frontend on port `3000` and backend on port `8000`. The frontend proxies `/api` to the backend. MongoDB health is available at `http://localhost:8000/api/v1/health`.

The exact HackerRank install command is:

```bash
bun install && bash setup.sh --seed
```

The exact HackerRank run command is `bun start`.

## Seeded access

```text
Email: alex.morgan@relay.dev
Password: password123
```

A second seeded account is `jordan.smith@relay.dev` with the same demo password. Each account signs in directly; there is no profile-selection step. The seed script replaces the Relay demo accounts each time the complete application starts. Running only the backend development watcher does not reset the database.

## Commands

| Command | Purpose |
| --- | --- |
| `bun start` | Seed MongoDB and start the complete application. |
| `bun run seed` | Reset Relay demo accounts in MongoDB. |
| `bun run dev:backend` | Start the Express API with Bun's watcher. |
| `bun run dev:frontend` | Start the Vite frontend. |
| `cd frontend && bun run build` | Build the production frontend. |

The frontend and backend are structured by feature. Backend HTTP handlers, business rules, and database operations remain separate so later request, collection, environment, history, and runner features can be added without changing the approved stack.
