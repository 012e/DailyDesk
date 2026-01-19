# DailyDesk Copilot Instructions

## Project Overview
**DailyDesk** is a Trello-like task management application with real-time collaboration, AI assistant, and board templates. It's a **pnpm monorepo** with backend (Hono + Drizzle ORM + SQLite) and frontend (React + Vite + React Router).

## Architecture

### Backend (`/backend`)
- **Framework**: Hono.js with OpenAPI/Zod validation (`@hono/zod-openapi`)
- **Database**: SQLite via Drizzle ORM (supports local file + Cloudflare D1)
- **Auth**: Auth0 JWT Bearer tokens (jose library for verification)
- **Real-time**: Server-Sent Events (SSE) via `channel-ts` for board updates
- **AI Chat**: OpenAI SDK with tool calling for board operations (see [backend/src/routes/chat/tools](backend/src/routes/chat/tools))
- **Deployment**: Cloudflare Workers (see [backend/wrangler.jsonc](backend/wrangler.jsonc))

### Frontend (`/frontend`)
- **Framework**: React 19 + React Router 7 + Vite
- **Styling**: Tailwind CSS v4 + Radix UI components + shadcn/ui patterns
- **State**: Jotai atoms (see [frontend/src/stores](frontend/src/stores))
- **API Client**: Axios with auto-retry on 401 (see [frontend/src/lib/client.ts](frontend/src/lib/client.ts))
- **Real-time**: EventSource for SSE subscriptions
- **Auth**: Auth0 React SDK

### Data Model (see [backend/src/lib/db/schema.ts](backend/src/lib/db/schema.ts))
```
User (Auth0) → Boards → Lists → Cards
                     → Members (role-based access)
                     → Labels (user-specific)
Cards → ChecklistItems, Attachments, Comments
      → Due dates, reminders, recurrence
```

**Authorization**: Role-based (owner/admin/member) via [backend/src/services/authorization.service.ts](backend/src/services/authorization.service.ts). All content operations verify board access through `getBoardAccess()`.

## Critical Developer Workflows

### Setup & Running
```bash
pnpm install              # Install all workspaces
pnpm update-db            # Push Drizzle schema to SQLite (backend only)
pnpm dev                  # Run backend:3000 + frontend:5173 + AI devtools concurrently
```

**Environment**: Backend requires `.env.local` with `AUTH0_ISSUER_URL`, `AUTH0_AUDIENCE`, `OPENAI_API_KEY`. Frontend needs `.env.local` with `VITE_AUTH0_DOMAIN`, `VITE_AUTH0_CLIENT_ID`, `VITE_AUTH0_API_AUDIENCE`.

### Database Migrations
```bash
cd backend
pnpm db:push              # Push schema changes (no migration files)
```
Drizzle Kit uses push-based workflow. Schema defined in [backend/src/lib/db/schema.ts](backend/src/lib/db/schema.ts), config in [backend/drizzle.config.ts](backend/drizzle.config.ts).

### Testing (see [backend/tests/README.md](backend/tests/README.md))
```bash
pnpm test                 # Run Vitest tests (backend only)
pnpm test:watch           # Interactive mode
pnpm test:coverage        # With coverage
```
- **Mocked Auth**: Tests bypass JWT with `mock-jwt-token-for-testing` (see [backend/tests/setup.ts](backend/tests/setup.ts))
- **Isolated DB**: Each test run uses unique SQLite file in `backend/tmp/test-dbs/`
- **Helpers**: Use `createAuthHeaders()` from [backend/tests/helpers/auth.ts](backend/tests/helpers/auth.ts)

### API Documentation
Access OpenAPI spec at `http://localhost:3000/doc` when backend is running. Frontend uses this to generate types via `pnpm openapi` (see [frontend/package.json](frontend/package.json)).

## Code Conventions

### Backend Patterns
1. **Route Structure**: Each resource has routes file (e.g., [backend/src/routes/boards.ts](backend/src/routes/boards.ts)) using `createRoute()` with Zod schemas
2. **Services**: Business logic lives in [backend/src/services/\*.service.ts](backend/src/services/) (e.g., `boards.service.ts`, `authorization.service.ts`)
3. **Authorization**: Always call `checkBoardPermission(boardId, userId, permission)` before mutations
4. **Error Handling**: Throw `AuthorizationError` for 403s, `HTTPException` for other errors
5. **SSE Pattern**: Call `eventService.publish()` after DB changes (see [backend/src/services/events.service.ts](backend/src/services/events.service.ts))

Example route:
```typescript
import { authMiddleware } from "@/lib/auth";
import { checkBoardPermission } from "@/services/authorization.service";

app.use("*", authMiddleware());
app.openapi(createRoute({...}), async (c) => {
  const user = c.get("user");
  await checkBoardPermission(boardId, user.sub, "content:update");
  // ... mutation logic
  eventService.publish(boardId, {...});
});
```

### Frontend Patterns
1. **HTTP Client**: Always use `httpClient` from [frontend/src/lib/client.ts](frontend/src/lib/client.ts) (handles auth + retries)
2. **Component Library**: Use Radix UI primitives wrapped as shadcn components in [frontend/src/components/ui](frontend/src/components/ui)
3. **State Management**: Global atoms in [frontend/src/stores](frontend/src/stores), local React state for UI-only concerns
4. **Forms**: Use React Hook Form + Zod validation (see existing form patterns)
5. **Real-time Updates**: Subscribe to SSE in page components, update local state on events

### Naming Conventions
- **Database tables**: `{entity}Table` (singular, e.g., `cardsTable`)
- **Routes**: `create{Entity}Routes()` functions
- **Services**: `{entity}.service.ts` with exported functions
- **Types**: Match OpenAPI schemas in [backend/src/types](backend/src/types)

## Background Jobs
Two cron jobs run in development (see [backend/src/index.ts](backend/src/index.ts)):
- `startReminderCron()`: Checks for due card reminders every minute
- `startRecurringCron()`: Handles recurring card creation

These are **disabled in tests** via `NODE_ENV === "test"` check.

## AI Chat Integration
The `/chat` endpoint supports tool calling for board operations (create cards, get board info, etc.). Tools are defined in [backend/src/routes/chat/tools](backend/src/routes/chat/tools). AI devtools run on separate port via `pnpm ai-devtool`.

## Deployment
- **Backend**: `pnpm --filter backend deploy` (Cloudflare Workers)
- **Frontend**: `pnpm --filter frontend deploy` (Cloudflare Pages)

Both use `wrangler.jsonc` configs in their respective directories.

## Language Note
Vietnamese is used for UI strings and comments. System messages and API responses may be in English or Vietnamese depending on context.
