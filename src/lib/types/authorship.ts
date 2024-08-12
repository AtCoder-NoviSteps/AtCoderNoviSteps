import type { Roles } from '$lib/types/user';

export type Authorship = {
  authorId: string;
  userId: string;
};

export interface AuthorshipForRead extends Authorship {
  isPublished: boolean;
}

export interface AuthorshipForEdit extends Authorship {
  isPublished: boolean;
  role: Roles;
}

export type AuthorshipForDelete = Authorship;
