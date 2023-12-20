import type { User } from '@prisma/client';
import type { Session } from '@prisma/client';
import type { Key } from '@prisma/client';
import type { Task } from '@prisma/client';
import type { Tag } from '@prisma/client';
import type { TaskTag } from '@prisma/client';
import type { TaskAnswer } from '@prisma/client';
import type { SubmissionStatus } from '@prisma/client';
import type { Roles } from '@prisma/client';
import type { ContestType } from '@prisma/client';
import type { TaskGrade } from '@prisma/client';
import type { AtcoderProblemsDifficulty } from '@prisma/client';
import { Prisma } from '@prisma/client';
import { Resolver } from '@quramy/prisma-fabbrica/lib/internal';
export {
  initialize,
  resetSequence,
  registerScalarFieldValueGenerator,
  resetScalarFieldValueGenerator,
} from '@quramy/prisma-fabbrica/lib/internal';
type BuildDataOptions = {
  readonly seq: number;
};
type UserFactoryDefineInput = {
  id?: string;
  username?: string;
  role?: Roles;
  created_at?: Date;
  updated_at?: Date;
  auth_session?: Prisma.SessionCreateNestedManyWithoutUserInput;
  key?: Prisma.KeyCreateNestedManyWithoutUserInput;
  taskAnswer?: Prisma.TaskAnswerCreateNestedManyWithoutUserInput;
};
type UserFactoryDefineOptions = {
  defaultData?: Resolver<UserFactoryDefineInput, BuildDataOptions>;
  traits?: {
    [traitName: string | symbol]: {
      data: Resolver<Partial<UserFactoryDefineInput>, BuildDataOptions>;
    };
  };
};
type UserTraitKeys<TOptions extends UserFactoryDefineOptions> = keyof TOptions['traits'];
export interface UserFactoryInterfaceWithoutTraits {
  readonly _factoryFor: 'User';
  build(inputData?: Partial<Prisma.UserCreateInput>): PromiseLike<Prisma.UserCreateInput>;
  buildCreateInput(
    inputData?: Partial<Prisma.UserCreateInput>,
  ): PromiseLike<Prisma.UserCreateInput>;
  buildList(
    inputData: number | readonly Partial<Prisma.UserCreateInput>[],
  ): PromiseLike<Prisma.UserCreateInput[]>;
  pickForConnect(inputData: User): Pick<User, 'id'>;
  create(inputData?: Partial<Prisma.UserCreateInput>): PromiseLike<User>;
  createList(inputData: number | readonly Partial<Prisma.UserCreateInput>[]): PromiseLike<User[]>;
  createForConnect(inputData?: Partial<Prisma.UserCreateInput>): PromiseLike<Pick<User, 'id'>>;
}
export interface UserFactoryInterface<
  TOptions extends UserFactoryDefineOptions = UserFactoryDefineOptions,
> extends UserFactoryInterfaceWithoutTraits {
  use(
    name: UserTraitKeys<TOptions>,
    ...names: readonly UserTraitKeys<TOptions>[]
  ): UserFactoryInterfaceWithoutTraits;
}
/**
 * Define factory for {@link User} model.
 *
 * @param options
 * @returns factory {@link UserFactoryInterface}
 */
export declare function defineUserFactory<TOptions extends UserFactoryDefineOptions>(
  options?: TOptions,
): UserFactoryInterface<TOptions>;
type SessionuserFactory = {
  _factoryFor: 'User';
  build: () => PromiseLike<Prisma.UserCreateNestedOneWithoutAuth_sessionInput['create']>;
};
type SessionFactoryDefineInput = {
  id?: string;
  active_expires?: bigint | number;
  idle_expires?: bigint | number;
  user: SessionuserFactory | Prisma.UserCreateNestedOneWithoutAuth_sessionInput;
};
type SessionFactoryDefineOptions = {
  defaultData: Resolver<SessionFactoryDefineInput, BuildDataOptions>;
  traits?: {
    [traitName: string | symbol]: {
      data: Resolver<Partial<SessionFactoryDefineInput>, BuildDataOptions>;
    };
  };
};
type SessionTraitKeys<TOptions extends SessionFactoryDefineOptions> = keyof TOptions['traits'];
export interface SessionFactoryInterfaceWithoutTraits {
  readonly _factoryFor: 'Session';
  build(inputData?: Partial<Prisma.SessionCreateInput>): PromiseLike<Prisma.SessionCreateInput>;
  buildCreateInput(
    inputData?: Partial<Prisma.SessionCreateInput>,
  ): PromiseLike<Prisma.SessionCreateInput>;
  buildList(
    inputData: number | readonly Partial<Prisma.SessionCreateInput>[],
  ): PromiseLike<Prisma.SessionCreateInput[]>;
  pickForConnect(inputData: Session): Pick<Session, 'id'>;
  create(inputData?: Partial<Prisma.SessionCreateInput>): PromiseLike<Session>;
  createList(
    inputData: number | readonly Partial<Prisma.SessionCreateInput>[],
  ): PromiseLike<Session[]>;
  createForConnect(
    inputData?: Partial<Prisma.SessionCreateInput>,
  ): PromiseLike<Pick<Session, 'id'>>;
}
export interface SessionFactoryInterface<
  TOptions extends SessionFactoryDefineOptions = SessionFactoryDefineOptions,
> extends SessionFactoryInterfaceWithoutTraits {
  use(
    name: SessionTraitKeys<TOptions>,
    ...names: readonly SessionTraitKeys<TOptions>[]
  ): SessionFactoryInterfaceWithoutTraits;
}
/**
 * Define factory for {@link Session} model.
 *
 * @param options
 * @returns factory {@link SessionFactoryInterface}
 */
export declare function defineSessionFactory<TOptions extends SessionFactoryDefineOptions>(
  options: TOptions,
): SessionFactoryInterface<TOptions>;
type KeyuserFactory = {
  _factoryFor: 'User';
  build: () => PromiseLike<Prisma.UserCreateNestedOneWithoutKeyInput['create']>;
};
type KeyFactoryDefineInput = {
  id?: string;
  hashed_password?: string | null;
  user: KeyuserFactory | Prisma.UserCreateNestedOneWithoutKeyInput;
};
type KeyFactoryDefineOptions = {
  defaultData: Resolver<KeyFactoryDefineInput, BuildDataOptions>;
  traits?: {
    [traitName: string | symbol]: {
      data: Resolver<Partial<KeyFactoryDefineInput>, BuildDataOptions>;
    };
  };
};
type KeyTraitKeys<TOptions extends KeyFactoryDefineOptions> = keyof TOptions['traits'];
export interface KeyFactoryInterfaceWithoutTraits {
  readonly _factoryFor: 'Key';
  build(inputData?: Partial<Prisma.KeyCreateInput>): PromiseLike<Prisma.KeyCreateInput>;
  buildCreateInput(inputData?: Partial<Prisma.KeyCreateInput>): PromiseLike<Prisma.KeyCreateInput>;
  buildList(
    inputData: number | readonly Partial<Prisma.KeyCreateInput>[],
  ): PromiseLike<Prisma.KeyCreateInput[]>;
  pickForConnect(inputData: Key): Pick<Key, 'id'>;
  create(inputData?: Partial<Prisma.KeyCreateInput>): PromiseLike<Key>;
  createList(inputData: number | readonly Partial<Prisma.KeyCreateInput>[]): PromiseLike<Key[]>;
  createForConnect(inputData?: Partial<Prisma.KeyCreateInput>): PromiseLike<Pick<Key, 'id'>>;
}
export interface KeyFactoryInterface<
  TOptions extends KeyFactoryDefineOptions = KeyFactoryDefineOptions,
> extends KeyFactoryInterfaceWithoutTraits {
  use(
    name: KeyTraitKeys<TOptions>,
    ...names: readonly KeyTraitKeys<TOptions>[]
  ): KeyFactoryInterfaceWithoutTraits;
}
/**
 * Define factory for {@link Key} model.
 *
 * @param options
 * @returns factory {@link KeyFactoryInterface}
 */
export declare function defineKeyFactory<TOptions extends KeyFactoryDefineOptions>(
  options: TOptions,
): KeyFactoryInterface<TOptions>;
type TaskFactoryDefineInput = {
  id?: string;
  contest_type?: ContestType;
  contest_id?: string;
  task_table_index?: string;
  task_id?: string;
  title?: string;
  grade?: TaskGrade;
  atcoder_problems_difficulty?: AtcoderProblemsDifficulty;
  created_at?: Date;
  updated_at?: Date;
  task_answers?: Prisma.TaskAnswerCreateNestedManyWithoutTaskInput;
  tags?: Prisma.TaskTagCreateNestedManyWithoutTaskInput;
};
type TaskFactoryDefineOptions = {
  defaultData?: Resolver<TaskFactoryDefineInput, BuildDataOptions>;
  traits?: {
    [traitName: string | symbol]: {
      data: Resolver<Partial<TaskFactoryDefineInput>, BuildDataOptions>;
    };
  };
};
type TaskTraitKeys<TOptions extends TaskFactoryDefineOptions> = keyof TOptions['traits'];
export interface TaskFactoryInterfaceWithoutTraits {
  readonly _factoryFor: 'Task';
  build(inputData?: Partial<Prisma.TaskCreateInput>): PromiseLike<Prisma.TaskCreateInput>;
  buildCreateInput(
    inputData?: Partial<Prisma.TaskCreateInput>,
  ): PromiseLike<Prisma.TaskCreateInput>;
  buildList(
    inputData: number | readonly Partial<Prisma.TaskCreateInput>[],
  ): PromiseLike<Prisma.TaskCreateInput[]>;
  pickForConnect(inputData: Task): Pick<Task, 'id'>;
  create(inputData?: Partial<Prisma.TaskCreateInput>): PromiseLike<Task>;
  createList(inputData: number | readonly Partial<Prisma.TaskCreateInput>[]): PromiseLike<Task[]>;
  createForConnect(inputData?: Partial<Prisma.TaskCreateInput>): PromiseLike<Pick<Task, 'id'>>;
}
export interface TaskFactoryInterface<
  TOptions extends TaskFactoryDefineOptions = TaskFactoryDefineOptions,
> extends TaskFactoryInterfaceWithoutTraits {
  use(
    name: TaskTraitKeys<TOptions>,
    ...names: readonly TaskTraitKeys<TOptions>[]
  ): TaskFactoryInterfaceWithoutTraits;
}
/**
 * Define factory for {@link Task} model.
 *
 * @param options
 * @returns factory {@link TaskFactoryInterface}
 */
export declare function defineTaskFactory<TOptions extends TaskFactoryDefineOptions>(
  options?: TOptions,
): TaskFactoryInterface<TOptions>;
type TagFactoryDefineInput = {
  id?: string;
  is_published?: boolean;
  is_official?: boolean;
  name?: string;
  created_at?: Date;
  updated_at?: Date;
  tasks?: Prisma.TaskTagCreateNestedManyWithoutTagInput;
};
type TagFactoryDefineOptions = {
  defaultData?: Resolver<TagFactoryDefineInput, BuildDataOptions>;
  traits?: {
    [traitName: string | symbol]: {
      data: Resolver<Partial<TagFactoryDefineInput>, BuildDataOptions>;
    };
  };
};
type TagTraitKeys<TOptions extends TagFactoryDefineOptions> = keyof TOptions['traits'];
export interface TagFactoryInterfaceWithoutTraits {
  readonly _factoryFor: 'Tag';
  build(inputData?: Partial<Prisma.TagCreateInput>): PromiseLike<Prisma.TagCreateInput>;
  buildCreateInput(inputData?: Partial<Prisma.TagCreateInput>): PromiseLike<Prisma.TagCreateInput>;
  buildList(
    inputData: number | readonly Partial<Prisma.TagCreateInput>[],
  ): PromiseLike<Prisma.TagCreateInput[]>;
  pickForConnect(inputData: Tag): Pick<Tag, 'id'>;
  create(inputData?: Partial<Prisma.TagCreateInput>): PromiseLike<Tag>;
  createList(inputData: number | readonly Partial<Prisma.TagCreateInput>[]): PromiseLike<Tag[]>;
  createForConnect(inputData?: Partial<Prisma.TagCreateInput>): PromiseLike<Pick<Tag, 'id'>>;
}
export interface TagFactoryInterface<
  TOptions extends TagFactoryDefineOptions = TagFactoryDefineOptions,
> extends TagFactoryInterfaceWithoutTraits {
  use(
    name: TagTraitKeys<TOptions>,
    ...names: readonly TagTraitKeys<TOptions>[]
  ): TagFactoryInterfaceWithoutTraits;
}
/**
 * Define factory for {@link Tag} model.
 *
 * @param options
 * @returns factory {@link TagFactoryInterface}
 */
export declare function defineTagFactory<TOptions extends TagFactoryDefineOptions>(
  options?: TOptions,
): TagFactoryInterface<TOptions>;
type TaskTagtaskFactory = {
  _factoryFor: 'Task';
  build: () => PromiseLike<Prisma.TaskCreateNestedOneWithoutTagsInput['create']>;
};
type TaskTagtagFactory = {
  _factoryFor: 'Tag';
  build: () => PromiseLike<Prisma.TagCreateNestedOneWithoutTasksInput['create']>;
};
type TaskTagFactoryDefineInput = {
  id?: string;
  priority?: number;
  created_at?: Date;
  updated_at?: Date;
  task?: TaskTagtaskFactory | Prisma.TaskCreateNestedOneWithoutTagsInput;
  tag?: TaskTagtagFactory | Prisma.TagCreateNestedOneWithoutTasksInput;
};
type TaskTagFactoryDefineOptions = {
  defaultData?: Resolver<TaskTagFactoryDefineInput, BuildDataOptions>;
  traits?: {
    [traitName: string | symbol]: {
      data: Resolver<Partial<TaskTagFactoryDefineInput>, BuildDataOptions>;
    };
  };
};
type TaskTagTraitKeys<TOptions extends TaskTagFactoryDefineOptions> = keyof TOptions['traits'];
export interface TaskTagFactoryInterfaceWithoutTraits {
  readonly _factoryFor: 'TaskTag';
  build(inputData?: Partial<Prisma.TaskTagCreateInput>): PromiseLike<Prisma.TaskTagCreateInput>;
  buildCreateInput(
    inputData?: Partial<Prisma.TaskTagCreateInput>,
  ): PromiseLike<Prisma.TaskTagCreateInput>;
  buildList(
    inputData: number | readonly Partial<Prisma.TaskTagCreateInput>[],
  ): PromiseLike<Prisma.TaskTagCreateInput[]>;
  pickForConnect(inputData: TaskTag): Pick<TaskTag, 'task_id' | 'tag_id'>;
  create(inputData?: Partial<Prisma.TaskTagCreateInput>): PromiseLike<TaskTag>;
  createList(
    inputData: number | readonly Partial<Prisma.TaskTagCreateInput>[],
  ): PromiseLike<TaskTag[]>;
  createForConnect(
    inputData?: Partial<Prisma.TaskTagCreateInput>,
  ): PromiseLike<Pick<TaskTag, 'task_id' | 'tag_id'>>;
}
export interface TaskTagFactoryInterface<
  TOptions extends TaskTagFactoryDefineOptions = TaskTagFactoryDefineOptions,
> extends TaskTagFactoryInterfaceWithoutTraits {
  use(
    name: TaskTagTraitKeys<TOptions>,
    ...names: readonly TaskTagTraitKeys<TOptions>[]
  ): TaskTagFactoryInterfaceWithoutTraits;
}
/**
 * Define factory for {@link TaskTag} model.
 *
 * @param options
 * @returns factory {@link TaskTagFactoryInterface}
 */
export declare function defineTaskTagFactory<TOptions extends TaskTagFactoryDefineOptions>(
  options?: TOptions,
): TaskTagFactoryInterface<TOptions>;
type TaskAnswertaskFactory = {
  _factoryFor: 'Task';
  build: () => PromiseLike<Prisma.TaskCreateNestedOneWithoutTask_answersInput['create']>;
};
type TaskAnsweruserFactory = {
  _factoryFor: 'User';
  build: () => PromiseLike<Prisma.UserCreateNestedOneWithoutTaskAnswerInput['create']>;
};
type TaskAnswerstatusFactory = {
  _factoryFor: 'SubmissionStatus';
  build: () => PromiseLike<Prisma.SubmissionStatusCreateNestedOneWithoutTask_answerInput['create']>;
};
type TaskAnswerFactoryDefineInput = {
  id?: string;
  created_at?: Date;
  updated_at?: Date;
  task?: TaskAnswertaskFactory | Prisma.TaskCreateNestedOneWithoutTask_answersInput;
  user?: TaskAnsweruserFactory | Prisma.UserCreateNestedOneWithoutTaskAnswerInput;
  status?: TaskAnswerstatusFactory | Prisma.SubmissionStatusCreateNestedOneWithoutTask_answerInput;
};
type TaskAnswerFactoryDefineOptions = {
  defaultData?: Resolver<TaskAnswerFactoryDefineInput, BuildDataOptions>;
  traits?: {
    [traitName: string | symbol]: {
      data: Resolver<Partial<TaskAnswerFactoryDefineInput>, BuildDataOptions>;
    };
  };
};
type TaskAnswerTraitKeys<TOptions extends TaskAnswerFactoryDefineOptions> =
  keyof TOptions['traits'];
export interface TaskAnswerFactoryInterfaceWithoutTraits {
  readonly _factoryFor: 'TaskAnswer';
  build(
    inputData?: Partial<Prisma.TaskAnswerCreateInput>,
  ): PromiseLike<Prisma.TaskAnswerCreateInput>;
  buildCreateInput(
    inputData?: Partial<Prisma.TaskAnswerCreateInput>,
  ): PromiseLike<Prisma.TaskAnswerCreateInput>;
  buildList(
    inputData: number | readonly Partial<Prisma.TaskAnswerCreateInput>[],
  ): PromiseLike<Prisma.TaskAnswerCreateInput[]>;
  pickForConnect(inputData: TaskAnswer): Pick<TaskAnswer, 'task_id' | 'user_id'>;
  create(inputData?: Partial<Prisma.TaskAnswerCreateInput>): PromiseLike<TaskAnswer>;
  createList(
    inputData: number | readonly Partial<Prisma.TaskAnswerCreateInput>[],
  ): PromiseLike<TaskAnswer[]>;
  createForConnect(
    inputData?: Partial<Prisma.TaskAnswerCreateInput>,
  ): PromiseLike<Pick<TaskAnswer, 'task_id' | 'user_id'>>;
}
export interface TaskAnswerFactoryInterface<
  TOptions extends TaskAnswerFactoryDefineOptions = TaskAnswerFactoryDefineOptions,
> extends TaskAnswerFactoryInterfaceWithoutTraits {
  use(
    name: TaskAnswerTraitKeys<TOptions>,
    ...names: readonly TaskAnswerTraitKeys<TOptions>[]
  ): TaskAnswerFactoryInterfaceWithoutTraits;
}
/**
 * Define factory for {@link TaskAnswer} model.
 *
 * @param options
 * @returns factory {@link TaskAnswerFactoryInterface}
 */
export declare function defineTaskAnswerFactory<TOptions extends TaskAnswerFactoryDefineOptions>(
  options?: TOptions,
): TaskAnswerFactoryInterface<TOptions>;
type SubmissionStatusFactoryDefineInput = {
  id?: string;
  user_id?: string | null;
  status_name?: string;
  is_AC?: boolean;
  label_name?: string;
  image_path?: string;
  button_color?: string;
  sort_order?: number;
  task_answer?: Prisma.TaskAnswerCreateNestedManyWithoutStatusInput;
};
type SubmissionStatusFactoryDefineOptions = {
  defaultData?: Resolver<SubmissionStatusFactoryDefineInput, BuildDataOptions>;
  traits?: {
    [traitName: string | symbol]: {
      data: Resolver<Partial<SubmissionStatusFactoryDefineInput>, BuildDataOptions>;
    };
  };
};
type SubmissionStatusTraitKeys<TOptions extends SubmissionStatusFactoryDefineOptions> =
  keyof TOptions['traits'];
export interface SubmissionStatusFactoryInterfaceWithoutTraits {
  readonly _factoryFor: 'SubmissionStatus';
  build(
    inputData?: Partial<Prisma.SubmissionStatusCreateInput>,
  ): PromiseLike<Prisma.SubmissionStatusCreateInput>;
  buildCreateInput(
    inputData?: Partial<Prisma.SubmissionStatusCreateInput>,
  ): PromiseLike<Prisma.SubmissionStatusCreateInput>;
  buildList(
    inputData: number | readonly Partial<Prisma.SubmissionStatusCreateInput>[],
  ): PromiseLike<Prisma.SubmissionStatusCreateInput[]>;
  pickForConnect(inputData: SubmissionStatus): Pick<SubmissionStatus, 'id'>;
  create(inputData?: Partial<Prisma.SubmissionStatusCreateInput>): PromiseLike<SubmissionStatus>;
  createList(
    inputData: number | readonly Partial<Prisma.SubmissionStatusCreateInput>[],
  ): PromiseLike<SubmissionStatus[]>;
  createForConnect(
    inputData?: Partial<Prisma.SubmissionStatusCreateInput>,
  ): PromiseLike<Pick<SubmissionStatus, 'id'>>;
}
export interface SubmissionStatusFactoryInterface<
  TOptions extends SubmissionStatusFactoryDefineOptions = SubmissionStatusFactoryDefineOptions,
> extends SubmissionStatusFactoryInterfaceWithoutTraits {
  use(
    name: SubmissionStatusTraitKeys<TOptions>,
    ...names: readonly SubmissionStatusTraitKeys<TOptions>[]
  ): SubmissionStatusFactoryInterfaceWithoutTraits;
}
/**
 * Define factory for {@link SubmissionStatus} model.
 *
 * @param options
 * @returns factory {@link SubmissionStatusFactoryInterface}
 */
export declare function defineSubmissionStatusFactory<
  TOptions extends SubmissionStatusFactoryDefineOptions,
>(options?: TOptions): SubmissionStatusFactoryInterface<TOptions>;
