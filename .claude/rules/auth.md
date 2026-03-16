---
description: Authentication rules
paths:
  - 'src/lib/server/auth.ts'
  - 'src/routes/(auth)/**'
  - 'src/routes/(admin)/_utils/auth.ts'
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
- `src/routes/(admin)/_utils/auth.ts`:
  - `validateAdminAccess(locals)` — for page routes; redirects to `/login` for both unauthenticated and non-admin users (do not use in `+server.ts`)
  - `validateAdminAccessForApi(locals)` — for API routes (`+server.ts`); throws `error(401)` if unauthenticated, `error(403)` if not admin
- `prisma/schema.prisma`: User, Session, Key models

## Security

- Never expose session secrets in client code
- Use HTTPS in production
- Validate all user inputs server-side
