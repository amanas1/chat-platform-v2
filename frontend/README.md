# AU RadioChat - Global Radio Engine

AU RadioChat is a modern web application that combines global radio streaming with an encrypted private chat engine.

## Project Structure

- `/components`: Frontend React components.
- `/services`: Frontend logic and socket handlers.
- `/server`: Node.js backend with Socket.io and Moderation logic.
- `/public`: Static assets.

## Quick Start

### 1. Frontend Setup
From the root directory:
```bash
npm install
npm run dev
```

### 2. Backend Setup
From the root directory:
```bash
cd server
npm install
npm start
```

## Features
- **Global Radio**: Stream stations from around the world.
- **E2EE Chat**: Private end-to-end encrypted messaging.
- **Moderation**: Intelligent rate-limiting and content filtering.
- **Persistence**: Moderation logs and bans persist through restarts.

## Moderation Admin API
- `GET /api/moderation/violations`: View violation logs.
- `GET /api/moderation/bans`: View active bans.
- `POST /api/moderation/ban`: Manually ban a user.

---

## 🤖 For AI Agents
This repository is configured for automated development by AI models.
- **Automation Keys**: Personal tokens for Vercel, GitHub, and Railway are stored in `.env.local` (Gitignored).
- **Deployment**: Use `npx vercel --prod --yes` for production deployments.
- **Git Hooks**: For AI agents, use the `GITHUB_TOKEN` from `.env.local` if SSH/standard auth fails.

Developed with Advanced Agentic Coding @ Google DeepMind.
