import { Roles } from '@prisma/client';

export const users = [
  { id: '1', name: 'admin', role: Roles.ADMIN },
  { id: '2', name: 'guest', role: Roles.USER },
  { id: '3', name: 'Alice', role: Roles.USER },
  { id: '4', name: 'Bob23', role: Roles.USER },
  { id: '5', name: 'Carol', role: Roles.USER },
  { id: '6', name: 'Dave4', role: Roles.USER },
  { id: '7', name: 'Ellen', role: Roles.USER },
  { id: '8', name: 'Frank', role: Roles.USER },
  { id: '9', name: 'hogehoge', role: Roles.USER },
];

export const USER_PASSWORD_FOR_SEED = 'Ch0kuda1';
