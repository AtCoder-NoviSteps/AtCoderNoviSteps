// See https://kit.svelte.dev/docs/types#app

import type { Roles } from '@prisma/client';

// for information about these interfaces
declare global {
  namespace App {
    // interface Error {}
    interface Locals {
      auth: import('$lib/server/auth').AuthRequest;
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

// THIS IS IMPORTANT!!!
export {};
