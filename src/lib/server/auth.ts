// See:
// https://lucia-auth.com/getting-started/sveltekit/
// https://lucia-auth.com/database-adapters/prisma/
import { lucia } from 'lucia';
import { sveltekit } from 'lucia/middleware';
import { dev } from '$app/environment';
import { prisma } from '@lucia-auth/adapter-prisma';
import client from '$lib/server/database';

export const auth = lucia({
  env: dev ? 'DEV' : 'PROD',
  middleware: sveltekit(),
  adapter: prisma(client),
});

export type Auth = typeof auth;
