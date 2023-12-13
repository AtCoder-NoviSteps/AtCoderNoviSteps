export enum Roles {
  ADMIN = 'ADMIN',
  USER = 'USER',
}

export type User = {
  userId: string;
  username: string;
  role: Roles;
};

export interface AuthUser extends User {}
