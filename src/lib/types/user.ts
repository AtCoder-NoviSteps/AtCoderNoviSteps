export enum Roles {
  ADMIN = 'ADMIN',
  USER = 'USER',
}

export type AuthUser = {
  userId: string;
  username: string;
  role: Roles;
};
