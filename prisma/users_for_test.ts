import { Roles } from '@prisma/client';

export const users = [
  { name: 'admin_test', role: Roles.ADMIN },
  { name: 'guest_test', role: Roles.USER },
];
