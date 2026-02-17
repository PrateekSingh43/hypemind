# HypeMind Problem Report (End-to-End)

Date: 2026-02-17  
Scope: `apps/web`, `apps/api`, `packages/db`, `packages/validation`, screenshots of `/dashboard/unsorted`

## 1) What the 3 screenshots are telling us

### Problem 1.1: Dashboard shell state is not stable or persisted
- What you see:
  - Screenshot A: left sidebar expanded, right sidebar collapsed.
  - Screenshot B: left sidebar expanded, right sidebar expanded.
  - Screenshot C: left sidebar collapsed, right sidebar collapsed.
- Where:
  - `apps/web/app/dashboard/layout.tsx`
- Why it happens:
  - Collapse state is managed only in local component state (`leftCollapsed`, `rightCollapsed`) and resize handlers.
  - No persistence (`localStorage`, server prefs, or URL state) is used.
  - Resizable panel state can change quickly through drag thresholds (`<80px` logic), which creates abrupt state changes.
- Impact:
  - Same route can look very different between interactions/sessions.
  - Users perceive layout behavior as inconsistent.

### Problem 1.2: Light-mode contrast bug in AI chat
- What you see:
  - In Screenshot B (light mode), user message bubble text is hard to read.
- Where:
  - `apps/web/components/dashboard/right-sidebar.tsx`
- Why it happens:
  - User bubble uses `bg-primary/20` with `text-foreground`.
  - In light mode, `text-foreground` is dark and `bg-primary/20` is also dark-ish tinted, producing low contrast.
- Impact:
  - Accessibility/readability issue in one theme.

### Problem 1.3: UI is mostly mock/static, not real workspace data
- What you see:
  - The same demo items/messages/areas across screenshots.
- Where:
  - `apps/web/app/dashboard/unsorted/page.tsx`
  - `apps/web/components/dashboard/left-sidebar.tsx`
  - `apps/web/components/dashboard/right-sidebar.tsx`
  - `apps/web/components/dashboard/quick-create-modal.tsx`
- Why it happens:
  - These components use hardcoded arrays (`UNSORTED_ITEMS`, `AREAS`, `INITIAL_MESSAGES`) and local state only.
  - No API fetch or mutation wiring is present for these screens.
- Impact:
  - Dashboard appears functional but is not truly connected to backend data.
  - "Process", quick capture, and AI chat interactions are UI-only.

## 2) Hard blockers currently in repo

### Problem 2.1: Web production build is broken
- Evidence:
  - `pnpm --filter web build` fails.
- Where:
  - `apps/web/app/(auth)/verify-email/page.tsx`
- Why it happens:
  - Imports non-existent modules:
    - `../../lib/api` (wrong relative path for this file, and missing expected export)
    - `../../providers/auth-provider` (file/folder does not exist)
- Impact:
  - Web app cannot produce a production build.

### Problem 2.2: Auth/session path in frontend is incomplete
- Where:
  - `apps/web/app/(auth)/verify-email/page.tsx`
  - `apps/web/lib/api.ts`
  - `apps/web/app/(auth)/login/page.tsx` (empty file)
- Why it happens:
  - Verify-email page expects `setAccessToken` and `storeWorkspaceId`, but these session helpers are missing.
  - Login route has no implementation.
  - Frontend currently lacks a coherent auth/session provider layer for protected API calls.
- Impact:
  - End-to-end auth flow cannot be completed reliably.

### Problem 2.3: API base URL and versioning are inconsistent in frontend
- Where:
  - `apps/web/lib/api.ts` uses `NEXT_PUBLIC_API_URL` default `http://localhost:3000/api`
  - Auth pages use `NEXT_PUBLIC_API_BASE_URL` default `http://localhost:4000/api/v1`
- Why it happens:
  - Multiple env variable names and different base defaults are used.
  - Some paths are `/api`, others are `/api/v1`.
- Impact:
  - Requests can hit wrong host/path depending on code path.
  - Local setup becomes fragile and confusing.

### Problem 2.4: Root type-check pipeline is broken
- Evidence:
  - `pnpm check-types` fails: turbo cannot find `check-types` tasks.
- Where:
  - Root `package.json` + `turbo.json` + package scripts.
- Why it happens:
  - Root script expects a monorepo-wide `check-types` task, but not all packages define it.
- Impact:
  - No reliable single-command type safety gate in CI/dev.

## 3) Backend and integration issues

### Problem 3.1: AI route is a stub, not real assistant behavior
- Where:
  - `apps/api/src/routes.ts` (`POST /api/v1/ai/chat`)
- Why it happens:
  - Route validates membership and returns placeholder text only.
- Impact:
  - Right sidebar "AI partner" cannot perform real workspace reasoning.

### Problem 3.2: Email/token utilities are duplicated and partially disconnected
- Where:
  - Active logic: `apps/api/src/auth/auth.service.ts`
  - Extra utility logic: `apps/api/src/utils/token.ts`, `apps/api/src/utils/email/email.ts`
- Why it happens:
  - Parallel token/email implementations exist.
  - Utility files are not used by current auth service path.
- Impact:
  - Higher maintenance risk and drift.
  - Easier to introduce inconsistent security behavior over time.

### Problem 3.3: Shared validation layer is out of sync with current domain model
- Where:
  - `packages/validation/src/node.ts`
  - `packages/validation/src/item.ts`
  - Current canonical schema: `packages/db/prisma/schema.prisma`
- Why it happens:
  - Validation package still carries legacy Node/Collection vocabulary and old enums (`NOTE`, etc.) while Prisma uses `Item` + `ItemType` (`QUICK_NOTE`, `PAGE`, etc.).
- Impact:
  - High risk of request/response contract mismatch when wiring frontend/backend strongly.

### Problem 3.4: Frontend does not consume existing workspace APIs
- Where:
  - APIs exist in `apps/api/src/workspaces/workspace.route.ts` and `workspace.service.ts`
  - Dashboard pages/components in `apps/web` are mostly static
- Why it happens:
  - Integration layer from dashboard screens to backend endpoints is largely missing.
- Impact:
  - Large feature gap despite backend endpoints existing.

## 4) Data layer/tooling issues

### Problem 4.1: No Prisma migrations in repo
- Where:
  - `packages/db/prisma/migrations` folder is missing.
- Why it happens:
  - Schema exists, but migrations are not committed/generated in repo.
- Impact:
  - Environment setup and schema evolution are hard to reproduce safely.

### Problem 4.2: Prisma client generation currently fails on this machine
- Evidence:
  - `pnpm --filter @repo/db db:generate` fails with Windows `EPERM` rename on Prisma engine DLL.
- Where:
  - `node_modules/.pnpm/.../.prisma/client/query_engine-windows.dll.node`
- Why it happens:
  - File lock/permission issue on Windows during Prisma engine replacement.
- Impact:
  - `@repo/db` build and local regeneration are blocked.

### Problem 4.3: DB/API docs are incomplete for current architecture
- Where:
  - `packages/db/DATABASE.md` is empty.
  - `apps/web/README.md` is default Next.js boilerplate.
  - `apps/web/.env.example` is missing.
- Impact:
  - Onboarding and debugging are slower.
  - Environment setup is error-prone.

## 5) Why this produces the current behavior you showed

- The dashboard screen looks polished but is mostly mock UI, so it always shows similar items and assistant text.
- Layout state is local and not persisted, so left/right panes appear in different states across captures.
- Theme toggling works, but color tokens create low contrast for specific elements in light mode.
- The app still has major wiring gaps (auth/session, API base consistency, build errors), so even when UI renders, end-to-end behavior is not reliable yet.

## 6) Fix order (recommended)

1. Fix hard build blockers in web auth pages (missing imports/provider/session helpers).
2. Normalize API base env strategy (one variable, one versioned base path).
3. Implement session/auth provider and attach access token flow for protected routes.
4. Replace dashboard mock data with real API queries (`bootstrap`, `inbox`, `areas`, `projects`, `items`).
5. Fix UI contrast and sidebar state persistence.
6. Clean up duplicate token/email utilities and align validation schemas with Prisma model.
7. Add/commit Prisma migrations and resolve Prisma generate lock issue on Windows.
8. Restore monorepo type-check pipeline and add missing docs/env examples.
