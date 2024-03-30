// See https://kit.svelte.dev/docs/types#app

import type { Roles } from '@prisma/client';

// for information about these interfaces
declare global {
  namespace App {
    // interface Error {}
    interface Locals {
      auth: import('lucia').AuthRequest;
      user: {
        id: string;
        name: string;
        role: Roles;
        atcoder_name: string;
        is_validated: boolean | null;
      };
    }
    // interface PageData {}
    // interface Platform {}
  }
}

// See:
// https://lucia-auth.com/getting-started/sveltekit/
/// <reference types="lucia" />
declare global {
  namespace Lucia {
    type Auth = import('$lib/server/auth').Auth;
    type UserAttributes = {
      username: string;
      role: Roles;
    };
    // type SessionAttributes = {};
  }
}

// THIS IS IMPORTANT!!!
export {};
