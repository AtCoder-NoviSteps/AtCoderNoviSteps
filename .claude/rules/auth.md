---
description: Authentication rules
paths:
  - 'src/lib/server/auth.ts'
  - 'src/routes/(auth)/**'
  - 'src/features/auth/**'
  - 'src/routes/(admin)/**'
  - 'src/hooks.server.ts'
---

# Authentication

## Lucia v2

- Session validation in `src/hooks.server.ts`
- Session data attached to `event.locals.user`
- User properties: `id`, `name`, `role`, `atcoder_name`, `is_validated`

## Protected Routes

- Validate `event.locals.user` in `+page.server.ts` load functions
- Redirect unauthenticated users to `/login`
- Validate `role` for admin-only routes

## Form Validation

- Use Superforms + Zod for auth forms
- Server-side validation is authoritative
- Return structured error responses

## Key Files

- `src/lib/server/auth.ts`: Lucia configuration
- `src/hooks.server.ts`: Global request handler
- `src/features/auth/services/session.ts`:
  - `getLoggedInUser(locals, url?)` — returns logged-in user or redirects to `/login`
  - `ensureSessionOrRedirect(locals, url?)` — guard-only; redirects if no session
- `src/features/auth/services/admin_access.ts`:
  - `validateAdminAccess(locals, url?)` — for page routes; redirects to `/login` for both unauthenticated and non-admin users (do not use in `+server.ts`)
  - `validateAdminAccessForApi(locals)` — for API routes (`+server.ts`); throws `error(401)` if unauthenticated, `error(403)` if not admin
- `src/features/auth/utils/login.ts`: `buildLoginPath(url?)` — generates `/login` or `/login?redirectTo=...`
- `src/features/auth/utils/signup.ts`: `buildSignupPath(url?)` — generates `/signup` or `/signup?redirectTo=...` (same signature as `buildLoginPath`)
- `prisma/schema.prisma`: User, Session, Key models

## Redirect After Login Pattern

After login/signup, redirect users back to their original intended page instead of hardcoding `/`.

- Protected `load()`: pass `url` to `getLoggedInUser(locals, url)` — appends `?redirectTo=` automatically
- Login/signup actions: validate `redirectTo` with `isSameOriginRedirect()` before using (see `src/lib/utils/url.ts`)

## Security

- Never expose session secrets in client code
- Use HTTPS in production
- Validate all user inputs server-side
- **SvelteKit's `redirect()` does not validate origin** — always validate user-provided redirect destinations with `isSameOriginRedirect()`
