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
import type { PrismaClient } from '@prisma/client';
import {
  getClient,
  ModelWithFields,
  createScreener,
  getScalarFieldValueGenerator,
  Resolver,
  normalizeResolver,
  normalizeList,
  getSequenceCounter,
} from '@quramy/prisma-fabbrica/lib/internal';
export {
  initialize,
  resetSequence,
  registerScalarFieldValueGenerator,
  resetScalarFieldValueGenerator,
} from '@quramy/prisma-fabbrica/lib/internal';

type BuildDataOptions = {
  readonly seq: number;
};

const modelFieldDefinitions: ModelWithFields[] = [
  {
    name: 'User',
    fields: [
      {
        name: 'auth_session',
        type: 'Session',
        relationName: 'SessionToUser',
      },
      {
        name: 'key',
        type: 'Key',
        relationName: 'KeyToUser',
      },
      {
        name: 'taskAnswer',
        type: 'TaskAnswer',
        relationName: 'TaskAnswerToUser',
      },
    ],
  },
  {
    name: 'Session',
    fields: [
      {
        name: 'user',
        type: 'User',
        relationName: 'SessionToUser',
      },
    ],
  },
  {
    name: 'Key',
    fields: [
      {
        name: 'user',
        type: 'User',
        relationName: 'KeyToUser',
      },
    ],
  },
  {
    name: 'Task',
    fields: [
      {
        name: 'task_answers',
        type: 'TaskAnswer',
        relationName: 'TaskToTaskAnswer',
      },
      {
        name: 'tags',
        type: 'TaskTag',
        relationName: 'TaskToTaskTag',
      },
    ],
  },
  {
    name: 'Tag',
    fields: [
      {
        name: 'tasks',
        type: 'TaskTag',
        relationName: 'TagToTaskTag',
      },
    ],
  },
  {
    name: 'TaskTag',
    fields: [
      {
        name: 'task',
        type: 'Task',
        relationName: 'TaskToTaskTag',
      },
      {
        name: 'tag',
        type: 'Tag',
        relationName: 'TagToTaskTag',
      },
    ],
  },
  {
    name: 'TaskAnswer',
    fields: [
      {
        name: 'task',
        type: 'Task',
        relationName: 'TaskToTaskAnswer',
      },
      {
        name: 'user',
        type: 'User',
        relationName: 'TaskAnswerToUser',
      },
      {
        name: 'status',
        type: 'SubmissionStatus',
        relationName: 'SubmissionStatusToTaskAnswer',
      },
    ],
  },
  {
    name: 'SubmissionStatus',
    fields: [
      {
        name: 'task_answer',
        type: 'TaskAnswer',
        relationName: 'SubmissionStatusToTaskAnswer',
      },
    ],
  },
];

type UserScalarOrEnumFields = {
  id: string;
  username: string;
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

function autoGenerateUserScalarsOrEnums({ seq }: { readonly seq: number }): UserScalarOrEnumFields {
  return {
    id: getScalarFieldValueGenerator().String({
      modelName: 'User',
      fieldName: 'id',
      isId: true,
      isUnique: false,
      seq,
    }),
    username: getScalarFieldValueGenerator().String({
      modelName: 'User',
      fieldName: 'username',
      isId: false,
      isUnique: true,
      seq,
    }),
  };
}

function defineUserFactoryInternal<TOptions extends UserFactoryDefineOptions>({
  defaultData: defaultDataResolver,
  traits: traitsDefs = {},
}: TOptions): UserFactoryInterface<TOptions> {
  const getFactoryWithTraits = (traitKeys: readonly UserTraitKeys<TOptions>[] = []) => {
    const seqKey = {};
    const getSeq = () => getSequenceCounter(seqKey);
    const screen = createScreener('User', modelFieldDefinitions);
    const build = async (inputData: Partial<Prisma.UserCreateInput> = {}) => {
      const seq = getSeq();
      const requiredScalarData = autoGenerateUserScalarsOrEnums({ seq });
      const resolveValue = normalizeResolver<UserFactoryDefineInput, BuildDataOptions>(
        defaultDataResolver ?? {},
      );
      const defaultData = await traitKeys.reduce(async (queue, traitKey) => {
        const acc = await queue;
        const resolveTraitValue = normalizeResolver<
          Partial<UserFactoryDefineInput>,
          BuildDataOptions
        >(traitsDefs[traitKey]?.data ?? {});
        const traitData = await resolveTraitValue({ seq });
        return {
          ...acc,
          ...traitData,
        };
      }, resolveValue({ seq }));
      const defaultAssociations = {};
      const data: Prisma.UserCreateInput = {
        ...requiredScalarData,
        ...defaultData,
        ...defaultAssociations,
        ...inputData,
      };
      return data;
    };
    const buildList = (inputData: number | readonly Partial<Prisma.UserCreateInput>[]) =>
      Promise.all(normalizeList(inputData).map((data) => build(data)));
    const pickForConnect = (inputData: User) => ({
      id: inputData.id,
    });
    const create = async (inputData: Partial<Prisma.UserCreateInput> = {}) => {
      const data = await build(inputData).then(screen);
      return await getClient<PrismaClient>().user.create({ data });
    };
    const createList = (inputData: number | readonly Partial<Prisma.UserCreateInput>[]) =>
      Promise.all(normalizeList(inputData).map((data) => create(data)));
    const createForConnect = (inputData: Partial<Prisma.UserCreateInput> = {}) =>
      create(inputData).then(pickForConnect);
    return {
      _factoryFor: 'User' as const,
      build,
      buildList,
      buildCreateInput: build,
      pickForConnect,
      create,
      createList,
      createForConnect,
    };
  };
  const factory = getFactoryWithTraits();
  const useTraits = (
    name: UserTraitKeys<TOptions>,
    ...names: readonly UserTraitKeys<TOptions>[]
  ) => {
    return getFactoryWithTraits([name, ...names]);
  };
  return {
    ...factory,
    use: useTraits,
  };
}

/**
 * Define factory for {@link User} model.
 *
 * @param options
 * @returns factory {@link UserFactoryInterface}
 */
export function defineUserFactory<TOptions extends UserFactoryDefineOptions>(
  options?: TOptions,
): UserFactoryInterface<TOptions> {
  return defineUserFactoryInternal(options ?? {});
}

type SessionScalarOrEnumFields = {
  id: string;
  active_expires: bigint | number;
  idle_expires: bigint | number;
};

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

function isSessionuserFactory(
  x: SessionuserFactory | Prisma.UserCreateNestedOneWithoutAuth_sessionInput | undefined,
): x is SessionuserFactory {
  return (x as any)?._factoryFor === 'User';
}

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

function autoGenerateSessionScalarsOrEnums({
  seq,
}: {
  readonly seq: number;
}): SessionScalarOrEnumFields {
  return {
    id: getScalarFieldValueGenerator().String({
      modelName: 'Session',
      fieldName: 'id',
      isId: true,
      isUnique: false,
      seq,
    }),
    active_expires: getScalarFieldValueGenerator().BigInt({
      modelName: 'Session',
      fieldName: 'active_expires',
      isId: false,
      isUnique: false,
      seq,
    }),
    idle_expires: getScalarFieldValueGenerator().BigInt({
      modelName: 'Session',
      fieldName: 'idle_expires',
      isId: false,
      isUnique: false,
      seq,
    }),
  };
}

function defineSessionFactoryInternal<TOptions extends SessionFactoryDefineOptions>({
  defaultData: defaultDataResolver,
  traits: traitsDefs = {},
}: TOptions): SessionFactoryInterface<TOptions> {
  const getFactoryWithTraits = (traitKeys: readonly SessionTraitKeys<TOptions>[] = []) => {
    const seqKey = {};
    const getSeq = () => getSequenceCounter(seqKey);
    const screen = createScreener('Session', modelFieldDefinitions);
    const build = async (inputData: Partial<Prisma.SessionCreateInput> = {}) => {
      const seq = getSeq();
      const requiredScalarData = autoGenerateSessionScalarsOrEnums({ seq });
      const resolveValue = normalizeResolver<SessionFactoryDefineInput, BuildDataOptions>(
        defaultDataResolver ?? {},
      );
      const defaultData = await traitKeys.reduce(async (queue, traitKey) => {
        const acc = await queue;
        const resolveTraitValue = normalizeResolver<
          Partial<SessionFactoryDefineInput>,
          BuildDataOptions
        >(traitsDefs[traitKey]?.data ?? {});
        const traitData = await resolveTraitValue({ seq });
        return {
          ...acc,
          ...traitData,
        };
      }, resolveValue({ seq }));
      const defaultAssociations = {
        user: isSessionuserFactory(defaultData.user)
          ? {
              create: await defaultData.user.build(),
            }
          : defaultData.user,
      };
      const data: Prisma.SessionCreateInput = {
        ...requiredScalarData,
        ...defaultData,
        ...defaultAssociations,
        ...inputData,
      };
      return data;
    };
    const buildList = (inputData: number | readonly Partial<Prisma.SessionCreateInput>[]) =>
      Promise.all(normalizeList(inputData).map((data) => build(data)));
    const pickForConnect = (inputData: Session) => ({
      id: inputData.id,
    });
    const create = async (inputData: Partial<Prisma.SessionCreateInput> = {}) => {
      const data = await build(inputData).then(screen);
      return await getClient<PrismaClient>().session.create({ data });
    };
    const createList = (inputData: number | readonly Partial<Prisma.SessionCreateInput>[]) =>
      Promise.all(normalizeList(inputData).map((data) => create(data)));
    const createForConnect = (inputData: Partial<Prisma.SessionCreateInput> = {}) =>
      create(inputData).then(pickForConnect);
    return {
      _factoryFor: 'Session' as const,
      build,
      buildList,
      buildCreateInput: build,
      pickForConnect,
      create,
      createList,
      createForConnect,
    };
  };
  const factory = getFactoryWithTraits();
  const useTraits = (
    name: SessionTraitKeys<TOptions>,
    ...names: readonly SessionTraitKeys<TOptions>[]
  ) => {
    return getFactoryWithTraits([name, ...names]);
  };
  return {
    ...factory,
    use: useTraits,
  };
}

/**
 * Define factory for {@link Session} model.
 *
 * @param options
 * @returns factory {@link SessionFactoryInterface}
 */
export function defineSessionFactory<TOptions extends SessionFactoryDefineOptions>(
  options: TOptions,
): SessionFactoryInterface<TOptions> {
  return defineSessionFactoryInternal(options);
}

type KeyScalarOrEnumFields = {
  id: string;
};

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

function isKeyuserFactory(
  x: KeyuserFactory | Prisma.UserCreateNestedOneWithoutKeyInput | undefined,
): x is KeyuserFactory {
  return (x as any)?._factoryFor === 'User';
}

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

function autoGenerateKeyScalarsOrEnums({ seq }: { readonly seq: number }): KeyScalarOrEnumFields {
  return {
    id: getScalarFieldValueGenerator().String({
      modelName: 'Key',
      fieldName: 'id',
      isId: true,
      isUnique: false,
      seq,
    }),
  };
}

function defineKeyFactoryInternal<TOptions extends KeyFactoryDefineOptions>({
  defaultData: defaultDataResolver,
  traits: traitsDefs = {},
}: TOptions): KeyFactoryInterface<TOptions> {
  const getFactoryWithTraits = (traitKeys: readonly KeyTraitKeys<TOptions>[] = []) => {
    const seqKey = {};
    const getSeq = () => getSequenceCounter(seqKey);
    const screen = createScreener('Key', modelFieldDefinitions);
    const build = async (inputData: Partial<Prisma.KeyCreateInput> = {}) => {
      const seq = getSeq();
      const requiredScalarData = autoGenerateKeyScalarsOrEnums({ seq });
      const resolveValue = normalizeResolver<KeyFactoryDefineInput, BuildDataOptions>(
        defaultDataResolver ?? {},
      );
      const defaultData = await traitKeys.reduce(async (queue, traitKey) => {
        const acc = await queue;
        const resolveTraitValue = normalizeResolver<
          Partial<KeyFactoryDefineInput>,
          BuildDataOptions
        >(traitsDefs[traitKey]?.data ?? {});
        const traitData = await resolveTraitValue({ seq });
        return {
          ...acc,
          ...traitData,
        };
      }, resolveValue({ seq }));
      const defaultAssociations = {
        user: isKeyuserFactory(defaultData.user)
          ? {
              create: await defaultData.user.build(),
            }
          : defaultData.user,
      };
      const data: Prisma.KeyCreateInput = {
        ...requiredScalarData,
        ...defaultData,
        ...defaultAssociations,
        ...inputData,
      };
      return data;
    };
    const buildList = (inputData: number | readonly Partial<Prisma.KeyCreateInput>[]) =>
      Promise.all(normalizeList(inputData).map((data) => build(data)));
    const pickForConnect = (inputData: Key) => ({
      id: inputData.id,
    });
    const create = async (inputData: Partial<Prisma.KeyCreateInput> = {}) => {
      const data = await build(inputData).then(screen);
      return await getClient<PrismaClient>().key.create({ data });
    };
    const createList = (inputData: number | readonly Partial<Prisma.KeyCreateInput>[]) =>
      Promise.all(normalizeList(inputData).map((data) => create(data)));
    const createForConnect = (inputData: Partial<Prisma.KeyCreateInput> = {}) =>
      create(inputData).then(pickForConnect);
    return {
      _factoryFor: 'Key' as const,
      build,
      buildList,
      buildCreateInput: build,
      pickForConnect,
      create,
      createList,
      createForConnect,
    };
  };
  const factory = getFactoryWithTraits();
  const useTraits = (name: KeyTraitKeys<TOptions>, ...names: readonly KeyTraitKeys<TOptions>[]) => {
    return getFactoryWithTraits([name, ...names]);
  };
  return {
    ...factory,
    use: useTraits,
  };
}

/**
 * Define factory for {@link Key} model.
 *
 * @param options
 * @returns factory {@link KeyFactoryInterface}
 */
export function defineKeyFactory<TOptions extends KeyFactoryDefineOptions>(
  options: TOptions,
): KeyFactoryInterface<TOptions> {
  return defineKeyFactoryInternal(options);
}

type TaskScalarOrEnumFields = {
  id: string;
  contest_id: string;
  task_table_index: string;
  task_id: string;
  title: string;
};

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

function autoGenerateTaskScalarsOrEnums({ seq }: { readonly seq: number }): TaskScalarOrEnumFields {
  return {
    id: getScalarFieldValueGenerator().String({
      modelName: 'Task',
      fieldName: 'id',
      isId: true,
      isUnique: false,
      seq,
    }),
    contest_id: getScalarFieldValueGenerator().String({
      modelName: 'Task',
      fieldName: 'contest_id',
      isId: false,
      isUnique: false,
      seq,
    }),
    task_table_index: getScalarFieldValueGenerator().String({
      modelName: 'Task',
      fieldName: 'task_table_index',
      isId: false,
      isUnique: false,
      seq,
    }),
    task_id: getScalarFieldValueGenerator().String({
      modelName: 'Task',
      fieldName: 'task_id',
      isId: false,
      isUnique: true,
      seq,
    }),
    title: getScalarFieldValueGenerator().String({
      modelName: 'Task',
      fieldName: 'title',
      isId: false,
      isUnique: false,
      seq,
    }),
  };
}

function defineTaskFactoryInternal<TOptions extends TaskFactoryDefineOptions>({
  defaultData: defaultDataResolver,
  traits: traitsDefs = {},
}: TOptions): TaskFactoryInterface<TOptions> {
  const getFactoryWithTraits = (traitKeys: readonly TaskTraitKeys<TOptions>[] = []) => {
    const seqKey = {};
    const getSeq = () => getSequenceCounter(seqKey);
    const screen = createScreener('Task', modelFieldDefinitions);
    const build = async (inputData: Partial<Prisma.TaskCreateInput> = {}) => {
      const seq = getSeq();
      const requiredScalarData = autoGenerateTaskScalarsOrEnums({ seq });
      const resolveValue = normalizeResolver<TaskFactoryDefineInput, BuildDataOptions>(
        defaultDataResolver ?? {},
      );
      const defaultData = await traitKeys.reduce(async (queue, traitKey) => {
        const acc = await queue;
        const resolveTraitValue = normalizeResolver<
          Partial<TaskFactoryDefineInput>,
          BuildDataOptions
        >(traitsDefs[traitKey]?.data ?? {});
        const traitData = await resolveTraitValue({ seq });
        return {
          ...acc,
          ...traitData,
        };
      }, resolveValue({ seq }));
      const defaultAssociations = {};
      const data: Prisma.TaskCreateInput = {
        ...requiredScalarData,
        ...defaultData,
        ...defaultAssociations,
        ...inputData,
      };
      return data;
    };
    const buildList = (inputData: number | readonly Partial<Prisma.TaskCreateInput>[]) =>
      Promise.all(normalizeList(inputData).map((data) => build(data)));
    const pickForConnect = (inputData: Task) => ({
      id: inputData.id,
    });
    const create = async (inputData: Partial<Prisma.TaskCreateInput> = {}) => {
      const data = await build(inputData).then(screen);
      return await getClient<PrismaClient>().task.create({ data });
    };
    const createList = (inputData: number | readonly Partial<Prisma.TaskCreateInput>[]) =>
      Promise.all(normalizeList(inputData).map((data) => create(data)));
    const createForConnect = (inputData: Partial<Prisma.TaskCreateInput> = {}) =>
      create(inputData).then(pickForConnect);
    return {
      _factoryFor: 'Task' as const,
      build,
      buildList,
      buildCreateInput: build,
      pickForConnect,
      create,
      createList,
      createForConnect,
    };
  };
  const factory = getFactoryWithTraits();
  const useTraits = (
    name: TaskTraitKeys<TOptions>,
    ...names: readonly TaskTraitKeys<TOptions>[]
  ) => {
    return getFactoryWithTraits([name, ...names]);
  };
  return {
    ...factory,
    use: useTraits,
  };
}

/**
 * Define factory for {@link Task} model.
 *
 * @param options
 * @returns factory {@link TaskFactoryInterface}
 */
export function defineTaskFactory<TOptions extends TaskFactoryDefineOptions>(
  options?: TOptions,
): TaskFactoryInterface<TOptions> {
  return defineTaskFactoryInternal(options ?? {});
}

type TagScalarOrEnumFields = {
  id: string;
  is_official: boolean;
  name: string;
};

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

function autoGenerateTagScalarsOrEnums({ seq }: { readonly seq: number }): TagScalarOrEnumFields {
  return {
    id: getScalarFieldValueGenerator().String({
      modelName: 'Tag',
      fieldName: 'id',
      isId: true,
      isUnique: false,
      seq,
    }),
    is_official: getScalarFieldValueGenerator().Boolean({
      modelName: 'Tag',
      fieldName: 'is_official',
      isId: false,
      isUnique: false,
      seq,
    }),
    name: getScalarFieldValueGenerator().String({
      modelName: 'Tag',
      fieldName: 'name',
      isId: false,
      isUnique: true,
      seq,
    }),
  };
}

function defineTagFactoryInternal<TOptions extends TagFactoryDefineOptions>({
  defaultData: defaultDataResolver,
  traits: traitsDefs = {},
}: TOptions): TagFactoryInterface<TOptions> {
  const getFactoryWithTraits = (traitKeys: readonly TagTraitKeys<TOptions>[] = []) => {
    const seqKey = {};
    const getSeq = () => getSequenceCounter(seqKey);
    const screen = createScreener('Tag', modelFieldDefinitions);
    const build = async (inputData: Partial<Prisma.TagCreateInput> = {}) => {
      const seq = getSeq();
      const requiredScalarData = autoGenerateTagScalarsOrEnums({ seq });
      const resolveValue = normalizeResolver<TagFactoryDefineInput, BuildDataOptions>(
        defaultDataResolver ?? {},
      );
      const defaultData = await traitKeys.reduce(async (queue, traitKey) => {
        const acc = await queue;
        const resolveTraitValue = normalizeResolver<
          Partial<TagFactoryDefineInput>,
          BuildDataOptions
        >(traitsDefs[traitKey]?.data ?? {});
        const traitData = await resolveTraitValue({ seq });
        return {
          ...acc,
          ...traitData,
        };
      }, resolveValue({ seq }));
      const defaultAssociations = {};
      const data: Prisma.TagCreateInput = {
        ...requiredScalarData,
        ...defaultData,
        ...defaultAssociations,
        ...inputData,
      };
      return data;
    };
    const buildList = (inputData: number | readonly Partial<Prisma.TagCreateInput>[]) =>
      Promise.all(normalizeList(inputData).map((data) => build(data)));
    const pickForConnect = (inputData: Tag) => ({
      id: inputData.id,
    });
    const create = async (inputData: Partial<Prisma.TagCreateInput> = {}) => {
      const data = await build(inputData).then(screen);
      return await getClient<PrismaClient>().tag.create({ data });
    };
    const createList = (inputData: number | readonly Partial<Prisma.TagCreateInput>[]) =>
      Promise.all(normalizeList(inputData).map((data) => create(data)));
    const createForConnect = (inputData: Partial<Prisma.TagCreateInput> = {}) =>
      create(inputData).then(pickForConnect);
    return {
      _factoryFor: 'Tag' as const,
      build,
      buildList,
      buildCreateInput: build,
      pickForConnect,
      create,
      createList,
      createForConnect,
    };
  };
  const factory = getFactoryWithTraits();
  const useTraits = (name: TagTraitKeys<TOptions>, ...names: readonly TagTraitKeys<TOptions>[]) => {
    return getFactoryWithTraits([name, ...names]);
  };
  return {
    ...factory,
    use: useTraits,
  };
}

/**
 * Define factory for {@link Tag} model.
 *
 * @param options
 * @returns factory {@link TagFactoryInterface}
 */
export function defineTagFactory<TOptions extends TagFactoryDefineOptions>(
  options?: TOptions,
): TagFactoryInterface<TOptions> {
  return defineTagFactoryInternal(options ?? {});
}

type TaskTagScalarOrEnumFields = {
  id: string;
  priority: number;
};

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

function isTaskTagtaskFactory(
  x: TaskTagtaskFactory | Prisma.TaskCreateNestedOneWithoutTagsInput | undefined,
): x is TaskTagtaskFactory {
  return (x as any)?._factoryFor === 'Task';
}

function isTaskTagtagFactory(
  x: TaskTagtagFactory | Prisma.TagCreateNestedOneWithoutTasksInput | undefined,
): x is TaskTagtagFactory {
  return (x as any)?._factoryFor === 'Tag';
}

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

function autoGenerateTaskTagScalarsOrEnums({
  seq,
}: {
  readonly seq: number;
}): TaskTagScalarOrEnumFields {
  return {
    id: getScalarFieldValueGenerator().String({
      modelName: 'TaskTag',
      fieldName: 'id',
      isId: false,
      isUnique: false,
      seq,
    }),
    priority: getScalarFieldValueGenerator().Int({
      modelName: 'TaskTag',
      fieldName: 'priority',
      isId: false,
      isUnique: false,
      seq,
    }),
  };
}

function defineTaskTagFactoryInternal<TOptions extends TaskTagFactoryDefineOptions>({
  defaultData: defaultDataResolver,
  traits: traitsDefs = {},
}: TOptions): TaskTagFactoryInterface<TOptions> {
  const getFactoryWithTraits = (traitKeys: readonly TaskTagTraitKeys<TOptions>[] = []) => {
    const seqKey = {};
    const getSeq = () => getSequenceCounter(seqKey);
    const screen = createScreener('TaskTag', modelFieldDefinitions);
    const build = async (inputData: Partial<Prisma.TaskTagCreateInput> = {}) => {
      const seq = getSeq();
      const requiredScalarData = autoGenerateTaskTagScalarsOrEnums({ seq });
      const resolveValue = normalizeResolver<TaskTagFactoryDefineInput, BuildDataOptions>(
        defaultDataResolver ?? {},
      );
      const defaultData = await traitKeys.reduce(async (queue, traitKey) => {
        const acc = await queue;
        const resolveTraitValue = normalizeResolver<
          Partial<TaskTagFactoryDefineInput>,
          BuildDataOptions
        >(traitsDefs[traitKey]?.data ?? {});
        const traitData = await resolveTraitValue({ seq });
        return {
          ...acc,
          ...traitData,
        };
      }, resolveValue({ seq }));
      const defaultAssociations = {
        task: isTaskTagtaskFactory(defaultData.task)
          ? {
              create: await defaultData.task.build(),
            }
          : defaultData.task,
        tag: isTaskTagtagFactory(defaultData.tag)
          ? {
              create: await defaultData.tag.build(),
            }
          : defaultData.tag,
      };
      const data: Prisma.TaskTagCreateInput = {
        ...requiredScalarData,
        ...defaultData,
        ...defaultAssociations,
        ...inputData,
      };
      return data;
    };
    const buildList = (inputData: number | readonly Partial<Prisma.TaskTagCreateInput>[]) =>
      Promise.all(normalizeList(inputData).map((data) => build(data)));
    const pickForConnect = (inputData: TaskTag) => ({
      task_id: inputData.task_id,
      tag_id: inputData.tag_id,
    });
    const create = async (inputData: Partial<Prisma.TaskTagCreateInput> = {}) => {
      const data = await build(inputData).then(screen);
      return await getClient<PrismaClient>().taskTag.create({ data });
    };
    const createList = (inputData: number | readonly Partial<Prisma.TaskTagCreateInput>[]) =>
      Promise.all(normalizeList(inputData).map((data) => create(data)));
    const createForConnect = (inputData: Partial<Prisma.TaskTagCreateInput> = {}) =>
      create(inputData).then(pickForConnect);
    return {
      _factoryFor: 'TaskTag' as const,
      build,
      buildList,
      buildCreateInput: build,
      pickForConnect,
      create,
      createList,
      createForConnect,
    };
  };
  const factory = getFactoryWithTraits();
  const useTraits = (
    name: TaskTagTraitKeys<TOptions>,
    ...names: readonly TaskTagTraitKeys<TOptions>[]
  ) => {
    return getFactoryWithTraits([name, ...names]);
  };
  return {
    ...factory,
    use: useTraits,
  };
}

/**
 * Define factory for {@link TaskTag} model.
 *
 * @param options
 * @returns factory {@link TaskTagFactoryInterface}
 */
export function defineTaskTagFactory<TOptions extends TaskTagFactoryDefineOptions>(
  options?: TOptions,
): TaskTagFactoryInterface<TOptions> {
  return defineTaskTagFactoryInternal(options ?? {});
}

type TaskAnswerScalarOrEnumFields = {
  id: string;
};

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

function isTaskAnswertaskFactory(
  x: TaskAnswertaskFactory | Prisma.TaskCreateNestedOneWithoutTask_answersInput | undefined,
): x is TaskAnswertaskFactory {
  return (x as any)?._factoryFor === 'Task';
}

function isTaskAnsweruserFactory(
  x: TaskAnsweruserFactory | Prisma.UserCreateNestedOneWithoutTaskAnswerInput | undefined,
): x is TaskAnsweruserFactory {
  return (x as any)?._factoryFor === 'User';
}

function isTaskAnswerstatusFactory(
  x:
    | TaskAnswerstatusFactory
    | Prisma.SubmissionStatusCreateNestedOneWithoutTask_answerInput
    | undefined,
): x is TaskAnswerstatusFactory {
  return (x as any)?._factoryFor === 'SubmissionStatus';
}

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

function autoGenerateTaskAnswerScalarsOrEnums({
  seq,
}: {
  readonly seq: number;
}): TaskAnswerScalarOrEnumFields {
  return {
    id: getScalarFieldValueGenerator().String({
      modelName: 'TaskAnswer',
      fieldName: 'id',
      isId: false,
      isUnique: true,
      seq,
    }),
  };
}

function defineTaskAnswerFactoryInternal<TOptions extends TaskAnswerFactoryDefineOptions>({
  defaultData: defaultDataResolver,
  traits: traitsDefs = {},
}: TOptions): TaskAnswerFactoryInterface<TOptions> {
  const getFactoryWithTraits = (traitKeys: readonly TaskAnswerTraitKeys<TOptions>[] = []) => {
    const seqKey = {};
    const getSeq = () => getSequenceCounter(seqKey);
    const screen = createScreener('TaskAnswer', modelFieldDefinitions);
    const build = async (inputData: Partial<Prisma.TaskAnswerCreateInput> = {}) => {
      const seq = getSeq();
      const requiredScalarData = autoGenerateTaskAnswerScalarsOrEnums({ seq });
      const resolveValue = normalizeResolver<TaskAnswerFactoryDefineInput, BuildDataOptions>(
        defaultDataResolver ?? {},
      );
      const defaultData = await traitKeys.reduce(async (queue, traitKey) => {
        const acc = await queue;
        const resolveTraitValue = normalizeResolver<
          Partial<TaskAnswerFactoryDefineInput>,
          BuildDataOptions
        >(traitsDefs[traitKey]?.data ?? {});
        const traitData = await resolveTraitValue({ seq });
        return {
          ...acc,
          ...traitData,
        };
      }, resolveValue({ seq }));
      const defaultAssociations = {
        task: isTaskAnswertaskFactory(defaultData.task)
          ? {
              create: await defaultData.task.build(),
            }
          : defaultData.task,
        user: isTaskAnsweruserFactory(defaultData.user)
          ? {
              create: await defaultData.user.build(),
            }
          : defaultData.user,
        status: isTaskAnswerstatusFactory(defaultData.status)
          ? {
              create: await defaultData.status.build(),
            }
          : defaultData.status,
      };
      const data: Prisma.TaskAnswerCreateInput = {
        ...requiredScalarData,
        ...defaultData,
        ...defaultAssociations,
        ...inputData,
      };
      return data;
    };
    const buildList = (inputData: number | readonly Partial<Prisma.TaskAnswerCreateInput>[]) =>
      Promise.all(normalizeList(inputData).map((data) => build(data)));
    const pickForConnect = (inputData: TaskAnswer) => ({
      task_id: inputData.task_id,
      user_id: inputData.user_id,
    });
    const create = async (inputData: Partial<Prisma.TaskAnswerCreateInput> = {}) => {
      const data = await build(inputData).then(screen);
      return await getClient<PrismaClient>().taskAnswer.create({ data });
    };
    const createList = (inputData: number | readonly Partial<Prisma.TaskAnswerCreateInput>[]) =>
      Promise.all(normalizeList(inputData).map((data) => create(data)));
    const createForConnect = (inputData: Partial<Prisma.TaskAnswerCreateInput> = {}) =>
      create(inputData).then(pickForConnect);
    return {
      _factoryFor: 'TaskAnswer' as const,
      build,
      buildList,
      buildCreateInput: build,
      pickForConnect,
      create,
      createList,
      createForConnect,
    };
  };
  const factory = getFactoryWithTraits();
  const useTraits = (
    name: TaskAnswerTraitKeys<TOptions>,
    ...names: readonly TaskAnswerTraitKeys<TOptions>[]
  ) => {
    return getFactoryWithTraits([name, ...names]);
  };
  return {
    ...factory,
    use: useTraits,
  };
}

/**
 * Define factory for {@link TaskAnswer} model.
 *
 * @param options
 * @returns factory {@link TaskAnswerFactoryInterface}
 */
export function defineTaskAnswerFactory<TOptions extends TaskAnswerFactoryDefineOptions>(
  options?: TOptions,
): TaskAnswerFactoryInterface<TOptions> {
  return defineTaskAnswerFactoryInternal(options ?? {});
}

type SubmissionStatusScalarOrEnumFields = {
  id: string;
  status_name: string;
  label_name: string;
  image_path: string;
  button_color: string;
};

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

function autoGenerateSubmissionStatusScalarsOrEnums({
  seq,
}: {
  readonly seq: number;
}): SubmissionStatusScalarOrEnumFields {
  return {
    id: getScalarFieldValueGenerator().String({
      modelName: 'SubmissionStatus',
      fieldName: 'id',
      isId: true,
      isUnique: false,
      seq,
    }),
    status_name: getScalarFieldValueGenerator().String({
      modelName: 'SubmissionStatus',
      fieldName: 'status_name',
      isId: false,
      isUnique: true,
      seq,
    }),
    label_name: getScalarFieldValueGenerator().String({
      modelName: 'SubmissionStatus',
      fieldName: 'label_name',
      isId: false,
      isUnique: false,
      seq,
    }),
    image_path: getScalarFieldValueGenerator().String({
      modelName: 'SubmissionStatus',
      fieldName: 'image_path',
      isId: false,
      isUnique: false,
      seq,
    }),
    button_color: getScalarFieldValueGenerator().String({
      modelName: 'SubmissionStatus',
      fieldName: 'button_color',
      isId: false,
      isUnique: false,
      seq,
    }),
  };
}

function defineSubmissionStatusFactoryInternal<
  TOptions extends SubmissionStatusFactoryDefineOptions,
>({
  defaultData: defaultDataResolver,
  traits: traitsDefs = {},
}: TOptions): SubmissionStatusFactoryInterface<TOptions> {
  const getFactoryWithTraits = (traitKeys: readonly SubmissionStatusTraitKeys<TOptions>[] = []) => {
    const seqKey = {};
    const getSeq = () => getSequenceCounter(seqKey);
    const screen = createScreener('SubmissionStatus', modelFieldDefinitions);
    const build = async (inputData: Partial<Prisma.SubmissionStatusCreateInput> = {}) => {
      const seq = getSeq();
      const requiredScalarData = autoGenerateSubmissionStatusScalarsOrEnums({ seq });
      const resolveValue = normalizeResolver<SubmissionStatusFactoryDefineInput, BuildDataOptions>(
        defaultDataResolver ?? {},
      );
      const defaultData = await traitKeys.reduce(async (queue, traitKey) => {
        const acc = await queue;
        const resolveTraitValue = normalizeResolver<
          Partial<SubmissionStatusFactoryDefineInput>,
          BuildDataOptions
        >(traitsDefs[traitKey]?.data ?? {});
        const traitData = await resolveTraitValue({ seq });
        return {
          ...acc,
          ...traitData,
        };
      }, resolveValue({ seq }));
      const defaultAssociations = {};
      const data: Prisma.SubmissionStatusCreateInput = {
        ...requiredScalarData,
        ...defaultData,
        ...defaultAssociations,
        ...inputData,
      };
      return data;
    };
    const buildList = (
      inputData: number | readonly Partial<Prisma.SubmissionStatusCreateInput>[],
    ) => Promise.all(normalizeList(inputData).map((data) => build(data)));
    const pickForConnect = (inputData: SubmissionStatus) => ({
      id: inputData.id,
    });
    const create = async (inputData: Partial<Prisma.SubmissionStatusCreateInput> = {}) => {
      const data = await build(inputData).then(screen);
      return await getClient<PrismaClient>().submissionStatus.create({ data });
    };
    const createList = (
      inputData: number | readonly Partial<Prisma.SubmissionStatusCreateInput>[],
    ) => Promise.all(normalizeList(inputData).map((data) => create(data)));
    const createForConnect = (inputData: Partial<Prisma.SubmissionStatusCreateInput> = {}) =>
      create(inputData).then(pickForConnect);
    return {
      _factoryFor: 'SubmissionStatus' as const,
      build,
      buildList,
      buildCreateInput: build,
      pickForConnect,
      create,
      createList,
      createForConnect,
    };
  };
  const factory = getFactoryWithTraits();
  const useTraits = (
    name: SubmissionStatusTraitKeys<TOptions>,
    ...names: readonly SubmissionStatusTraitKeys<TOptions>[]
  ) => {
    return getFactoryWithTraits([name, ...names]);
  };
  return {
    ...factory,
    use: useTraits,
  };
}

/**
 * Define factory for {@link SubmissionStatus} model.
 *
 * @param options
 * @returns factory {@link SubmissionStatusFactoryInterface}
 */
export function defineSubmissionStatusFactory<
  TOptions extends SubmissionStatusFactoryDefineOptions,
>(options?: TOptions): SubmissionStatusFactoryInterface<TOptions> {
  return defineSubmissionStatusFactoryInternal(options ?? {});
}
