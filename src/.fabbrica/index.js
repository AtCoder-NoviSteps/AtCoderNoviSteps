import { Prisma } from '@prisma/client';
import {
  getClient,
  createScreener,
  getScalarFieldValueGenerator,
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
const modelFieldDefinitions = [
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
function autoGenerateUserScalarsOrEnums({ seq }) {
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
function defineUserFactoryInternal({ defaultData: defaultDataResolver, traits: traitsDefs = {} }) {
  const getFactoryWithTraits = (traitKeys = []) => {
    const seqKey = {};
    const getSeq = () => getSequenceCounter(seqKey);
    const screen = createScreener('User', modelFieldDefinitions);
    const build = async (inputData = {}) => {
      const seq = getSeq();
      const requiredScalarData = autoGenerateUserScalarsOrEnums({ seq });
      const resolveValue = normalizeResolver(defaultDataResolver ?? {});
      const defaultData = await traitKeys.reduce(async (queue, traitKey) => {
        const acc = await queue;
        const resolveTraitValue = normalizeResolver(traitsDefs[traitKey]?.data ?? {});
        const traitData = await resolveTraitValue({ seq });
        return {
          ...acc,
          ...traitData,
        };
      }, resolveValue({ seq }));
      const defaultAssociations = {};
      const data = { ...requiredScalarData, ...defaultData, ...defaultAssociations, ...inputData };
      return data;
    };
    const buildList = (inputData) =>
      Promise.all(normalizeList(inputData).map((data) => build(data)));
    const pickForConnect = (inputData) => ({
      id: inputData.id,
    });
    const create = async (inputData = {}) => {
      const data = await build(inputData).then(screen);
      return await getClient().user.create({ data });
    };
    const createList = (inputData) =>
      Promise.all(normalizeList(inputData).map((data) => create(data)));
    const createForConnect = (inputData = {}) => create(inputData).then(pickForConnect);
    return {
      _factoryFor: 'User',
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
  const useTraits = (name, ...names) => {
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
export function defineUserFactory(options) {
  return defineUserFactoryInternal(options ?? {});
}
function isSessionuserFactory(x) {
  return x?._factoryFor === 'User';
}
function autoGenerateSessionScalarsOrEnums({ seq }) {
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
function defineSessionFactoryInternal({
  defaultData: defaultDataResolver,
  traits: traitsDefs = {},
}) {
  const getFactoryWithTraits = (traitKeys = []) => {
    const seqKey = {};
    const getSeq = () => getSequenceCounter(seqKey);
    const screen = createScreener('Session', modelFieldDefinitions);
    const build = async (inputData = {}) => {
      const seq = getSeq();
      const requiredScalarData = autoGenerateSessionScalarsOrEnums({ seq });
      const resolveValue = normalizeResolver(defaultDataResolver ?? {});
      const defaultData = await traitKeys.reduce(async (queue, traitKey) => {
        const acc = await queue;
        const resolveTraitValue = normalizeResolver(traitsDefs[traitKey]?.data ?? {});
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
      const data = { ...requiredScalarData, ...defaultData, ...defaultAssociations, ...inputData };
      return data;
    };
    const buildList = (inputData) =>
      Promise.all(normalizeList(inputData).map((data) => build(data)));
    const pickForConnect = (inputData) => ({
      id: inputData.id,
    });
    const create = async (inputData = {}) => {
      const data = await build(inputData).then(screen);
      return await getClient().session.create({ data });
    };
    const createList = (inputData) =>
      Promise.all(normalizeList(inputData).map((data) => create(data)));
    const createForConnect = (inputData = {}) => create(inputData).then(pickForConnect);
    return {
      _factoryFor: 'Session',
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
  const useTraits = (name, ...names) => {
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
export function defineSessionFactory(options) {
  return defineSessionFactoryInternal(options);
}
function isKeyuserFactory(x) {
  return x?._factoryFor === 'User';
}
function autoGenerateKeyScalarsOrEnums({ seq }) {
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
function defineKeyFactoryInternal({ defaultData: defaultDataResolver, traits: traitsDefs = {} }) {
  const getFactoryWithTraits = (traitKeys = []) => {
    const seqKey = {};
    const getSeq = () => getSequenceCounter(seqKey);
    const screen = createScreener('Key', modelFieldDefinitions);
    const build = async (inputData = {}) => {
      const seq = getSeq();
      const requiredScalarData = autoGenerateKeyScalarsOrEnums({ seq });
      const resolveValue = normalizeResolver(defaultDataResolver ?? {});
      const defaultData = await traitKeys.reduce(async (queue, traitKey) => {
        const acc = await queue;
        const resolveTraitValue = normalizeResolver(traitsDefs[traitKey]?.data ?? {});
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
      const data = { ...requiredScalarData, ...defaultData, ...defaultAssociations, ...inputData };
      return data;
    };
    const buildList = (inputData) =>
      Promise.all(normalizeList(inputData).map((data) => build(data)));
    const pickForConnect = (inputData) => ({
      id: inputData.id,
    });
    const create = async (inputData = {}) => {
      const data = await build(inputData).then(screen);
      return await getClient().key.create({ data });
    };
    const createList = (inputData) =>
      Promise.all(normalizeList(inputData).map((data) => create(data)));
    const createForConnect = (inputData = {}) => create(inputData).then(pickForConnect);
    return {
      _factoryFor: 'Key',
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
  const useTraits = (name, ...names) => {
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
export function defineKeyFactory(options) {
  return defineKeyFactoryInternal(options);
}
function autoGenerateTaskScalarsOrEnums({ seq }) {
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
function defineTaskFactoryInternal({ defaultData: defaultDataResolver, traits: traitsDefs = {} }) {
  const getFactoryWithTraits = (traitKeys = []) => {
    const seqKey = {};
    const getSeq = () => getSequenceCounter(seqKey);
    const screen = createScreener('Task', modelFieldDefinitions);
    const build = async (inputData = {}) => {
      const seq = getSeq();
      const requiredScalarData = autoGenerateTaskScalarsOrEnums({ seq });
      const resolveValue = normalizeResolver(defaultDataResolver ?? {});
      const defaultData = await traitKeys.reduce(async (queue, traitKey) => {
        const acc = await queue;
        const resolveTraitValue = normalizeResolver(traitsDefs[traitKey]?.data ?? {});
        const traitData = await resolveTraitValue({ seq });
        return {
          ...acc,
          ...traitData,
        };
      }, resolveValue({ seq }));
      const defaultAssociations = {};
      const data = { ...requiredScalarData, ...defaultData, ...defaultAssociations, ...inputData };
      return data;
    };
    const buildList = (inputData) =>
      Promise.all(normalizeList(inputData).map((data) => build(data)));
    const pickForConnect = (inputData) => ({
      id: inputData.id,
    });
    const create = async (inputData = {}) => {
      const data = await build(inputData).then(screen);
      return await getClient().task.create({ data });
    };
    const createList = (inputData) =>
      Promise.all(normalizeList(inputData).map((data) => create(data)));
    const createForConnect = (inputData = {}) => create(inputData).then(pickForConnect);
    return {
      _factoryFor: 'Task',
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
  const useTraits = (name, ...names) => {
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
export function defineTaskFactory(options) {
  return defineTaskFactoryInternal(options ?? {});
}
function autoGenerateTagScalarsOrEnums({ seq }) {
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
function defineTagFactoryInternal({ defaultData: defaultDataResolver, traits: traitsDefs = {} }) {
  const getFactoryWithTraits = (traitKeys = []) => {
    const seqKey = {};
    const getSeq = () => getSequenceCounter(seqKey);
    const screen = createScreener('Tag', modelFieldDefinitions);
    const build = async (inputData = {}) => {
      const seq = getSeq();
      const requiredScalarData = autoGenerateTagScalarsOrEnums({ seq });
      const resolveValue = normalizeResolver(defaultDataResolver ?? {});
      const defaultData = await traitKeys.reduce(async (queue, traitKey) => {
        const acc = await queue;
        const resolveTraitValue = normalizeResolver(traitsDefs[traitKey]?.data ?? {});
        const traitData = await resolveTraitValue({ seq });
        return {
          ...acc,
          ...traitData,
        };
      }, resolveValue({ seq }));
      const defaultAssociations = {};
      const data = { ...requiredScalarData, ...defaultData, ...defaultAssociations, ...inputData };
      return data;
    };
    const buildList = (inputData) =>
      Promise.all(normalizeList(inputData).map((data) => build(data)));
    const pickForConnect = (inputData) => ({
      id: inputData.id,
    });
    const create = async (inputData = {}) => {
      const data = await build(inputData).then(screen);
      return await getClient().tag.create({ data });
    };
    const createList = (inputData) =>
      Promise.all(normalizeList(inputData).map((data) => create(data)));
    const createForConnect = (inputData = {}) => create(inputData).then(pickForConnect);
    return {
      _factoryFor: 'Tag',
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
  const useTraits = (name, ...names) => {
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
export function defineTagFactory(options) {
  return defineTagFactoryInternal(options ?? {});
}
function isTaskTagtaskFactory(x) {
  return x?._factoryFor === 'Task';
}
function isTaskTagtagFactory(x) {
  return x?._factoryFor === 'Tag';
}
function autoGenerateTaskTagScalarsOrEnums({ seq }) {
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
function defineTaskTagFactoryInternal({
  defaultData: defaultDataResolver,
  traits: traitsDefs = {},
}) {
  const getFactoryWithTraits = (traitKeys = []) => {
    const seqKey = {};
    const getSeq = () => getSequenceCounter(seqKey);
    const screen = createScreener('TaskTag', modelFieldDefinitions);
    const build = async (inputData = {}) => {
      const seq = getSeq();
      const requiredScalarData = autoGenerateTaskTagScalarsOrEnums({ seq });
      const resolveValue = normalizeResolver(defaultDataResolver ?? {});
      const defaultData = await traitKeys.reduce(async (queue, traitKey) => {
        const acc = await queue;
        const resolveTraitValue = normalizeResolver(traitsDefs[traitKey]?.data ?? {});
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
      const data = { ...requiredScalarData, ...defaultData, ...defaultAssociations, ...inputData };
      return data;
    };
    const buildList = (inputData) =>
      Promise.all(normalizeList(inputData).map((data) => build(data)));
    const pickForConnect = (inputData) => ({
      task_id: inputData.task_id,
      tag_id: inputData.tag_id,
    });
    const create = async (inputData = {}) => {
      const data = await build(inputData).then(screen);
      return await getClient().taskTag.create({ data });
    };
    const createList = (inputData) =>
      Promise.all(normalizeList(inputData).map((data) => create(data)));
    const createForConnect = (inputData = {}) => create(inputData).then(pickForConnect);
    return {
      _factoryFor: 'TaskTag',
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
  const useTraits = (name, ...names) => {
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
export function defineTaskTagFactory(options) {
  return defineTaskTagFactoryInternal(options ?? {});
}
function isTaskAnswertaskFactory(x) {
  return x?._factoryFor === 'Task';
}
function isTaskAnsweruserFactory(x) {
  return x?._factoryFor === 'User';
}
function isTaskAnswerstatusFactory(x) {
  return x?._factoryFor === 'SubmissionStatus';
}
function autoGenerateTaskAnswerScalarsOrEnums({ seq }) {
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
function defineTaskAnswerFactoryInternal({
  defaultData: defaultDataResolver,
  traits: traitsDefs = {},
}) {
  const getFactoryWithTraits = (traitKeys = []) => {
    const seqKey = {};
    const getSeq = () => getSequenceCounter(seqKey);
    const screen = createScreener('TaskAnswer', modelFieldDefinitions);
    const build = async (inputData = {}) => {
      const seq = getSeq();
      const requiredScalarData = autoGenerateTaskAnswerScalarsOrEnums({ seq });
      const resolveValue = normalizeResolver(defaultDataResolver ?? {});
      const defaultData = await traitKeys.reduce(async (queue, traitKey) => {
        const acc = await queue;
        const resolveTraitValue = normalizeResolver(traitsDefs[traitKey]?.data ?? {});
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
      const data = { ...requiredScalarData, ...defaultData, ...defaultAssociations, ...inputData };
      return data;
    };
    const buildList = (inputData) =>
      Promise.all(normalizeList(inputData).map((data) => build(data)));
    const pickForConnect = (inputData) => ({
      task_id: inputData.task_id,
      user_id: inputData.user_id,
    });
    const create = async (inputData = {}) => {
      const data = await build(inputData).then(screen);
      return await getClient().taskAnswer.create({ data });
    };
    const createList = (inputData) =>
      Promise.all(normalizeList(inputData).map((data) => create(data)));
    const createForConnect = (inputData = {}) => create(inputData).then(pickForConnect);
    return {
      _factoryFor: 'TaskAnswer',
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
  const useTraits = (name, ...names) => {
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
export function defineTaskAnswerFactory(options) {
  return defineTaskAnswerFactoryInternal(options ?? {});
}
function autoGenerateSubmissionStatusScalarsOrEnums({ seq }) {
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
function defineSubmissionStatusFactoryInternal({
  defaultData: defaultDataResolver,
  traits: traitsDefs = {},
}) {
  const getFactoryWithTraits = (traitKeys = []) => {
    const seqKey = {};
    const getSeq = () => getSequenceCounter(seqKey);
    const screen = createScreener('SubmissionStatus', modelFieldDefinitions);
    const build = async (inputData = {}) => {
      const seq = getSeq();
      const requiredScalarData = autoGenerateSubmissionStatusScalarsOrEnums({ seq });
      const resolveValue = normalizeResolver(defaultDataResolver ?? {});
      const defaultData = await traitKeys.reduce(async (queue, traitKey) => {
        const acc = await queue;
        const resolveTraitValue = normalizeResolver(traitsDefs[traitKey]?.data ?? {});
        const traitData = await resolveTraitValue({ seq });
        return {
          ...acc,
          ...traitData,
        };
      }, resolveValue({ seq }));
      const defaultAssociations = {};
      const data = { ...requiredScalarData, ...defaultData, ...defaultAssociations, ...inputData };
      return data;
    };
    const buildList = (inputData) =>
      Promise.all(normalizeList(inputData).map((data) => build(data)));
    const pickForConnect = (inputData) => ({
      id: inputData.id,
    });
    const create = async (inputData = {}) => {
      const data = await build(inputData).then(screen);
      return await getClient().submissionStatus.create({ data });
    };
    const createList = (inputData) =>
      Promise.all(normalizeList(inputData).map((data) => create(data)));
    const createForConnect = (inputData = {}) => create(inputData).then(pickForConnect);
    return {
      _factoryFor: 'SubmissionStatus',
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
  const useTraits = (name, ...names) => {
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
export function defineSubmissionStatusFactory(options) {
  return defineSubmissionStatusFactoryInternal(options ?? {});
}
