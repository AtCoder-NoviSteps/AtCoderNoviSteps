// See:
// https://lucia-auth.com/getting-started/sveltekit/
// https://www.reddit.com/r/sveltejs/comments/ozt7mk/sveltekit_with_prisma_fix/?rdt=38249
import Prisma, * as PrismaScope from '@prisma/client';

const PrismaClient = Prisma?.PrismaClient || PrismaScope?.PrismaClient;
const client = new PrismaClient();

export default client;
