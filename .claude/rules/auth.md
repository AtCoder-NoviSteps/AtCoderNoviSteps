---
description: Authentication rules
globs:
  - 'src/lib/server/auth.ts'
  - 'src/routes/(auth)/**'
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
- `prisma/schema.prisma`: User, Session, Key models

## Security

- Never expose session secrets in client code
- Use HTTPS in production
- Validate all user inputs server-side
