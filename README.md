# Relay

Relay is a Postman-inspired API workspace for composing, organizing, sending, and reviewing HTTP requests.

## Features

- Workspace sign-in and session handling
- Request builder with method, URL, headers, query parameters, and body editing
- Saved collections and request history
- Environment variables for reusable request values
- Request runner and response viewer

## Tech stack

- React and Vite
- Express and Bun
- MongoDB and Mongoose
- JWT authentication and Zod validation

## Prerequisites

- [Bun](https://bun.sh/) 1.3 or later
- MongoDB running locally on `127.0.0.1:27017`
- Git Bash (or another Bash-compatible shell) to use the startup script

## Getting started

```bash
git clone https://github.com/Aakash-star320/Relay.git
cd Relay
bun install
bun start
```

The frontend runs on `http://localhost:3000` and the API runs on `http://localhost:8000`. Relay creates local environment files when needed, seeds demo data, and checks the MongoDB connection before starting.

## Useful commands

| Command | Description |
| --- | --- |
| `bun start` | Seed demo data and start the frontend and backend. |
| `bun run seed` | Reset the local demo data. |
| `bun run dev:frontend` | Start only the Vite frontend. |
| `bun run dev:backend` | Start only the API with file watching. |
| `cd frontend && bun run build` | Create a production frontend build. |

## Project structure

```text
frontend/  # React client
backend/   # Express API and MongoDB models
```
