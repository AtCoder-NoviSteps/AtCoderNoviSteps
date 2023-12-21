'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
exports.defineSubmissionStatusFactory =
  exports.defineTaskAnswerFactory =
  exports.defineTaskTagFactory =
  exports.defineTagFactory =
  exports.defineTaskFactory =
  exports.defineKeyFactory =
  exports.defineSessionFactory =
  exports.defineUserFactory =
  exports.resetScalarFieldValueGenerator =
  exports.registerScalarFieldValueGenerator =
  exports.resetSequence =
  exports.initialize =
    void 0;
const client_1 = require('@prisma/client');
const internal_1 = require('@quramy/prisma-fabbrica/lib/internal');
var internal_2 = require('@quramy/prisma-fabbrica/lib/internal');
Object.defineProperty(exports, 'initialize', {
  enumerable: true,
  get: function () {
    return internal_2.initialize;
  },
});
Object.defineProperty(exports, 'resetSequence', {
  enumerable: true,
  get: function () {
    return internal_2.resetSequence;
  },
});
Object.defineProperty(exports, 'registerScalarFieldValueGenerator', {
  enumerable: true,
  get: function () {
    return internal_2.registerScalarFieldValueGenerator;
  },
});
Object.defineProperty(exports, 'resetScalarFieldValueGenerator', {
  enumerable: true,
  get: function () {
    return internal_2.resetScalarFieldValueGenerator;
  },
});
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
    id: (0, internal_1.getScalarFieldValueGenerator)().String({
      modelName: 'User',
      fieldName: 'id',
      isId: true,
      isUnique: false,
      seq,
    }),
    username: (0, internal_1.getScalarFieldValueGenerator)().String({
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
    const getSeq = () => (0, internal_1.getSequenceCounter)(seqKey);
    const screen = (0, internal_1.createScreener)('User', modelFieldDefinitions);
    const build = async (inputData = {}) => {
      const seq = getSeq();
      const requiredScalarData = autoGenerateUserScalarsOrEnums({ seq });
      const resolveValue = (0, internal_1.normalizeResolver)(defaultDataResolver ?? {});
      const defaultData = await traitKeys.reduce(async (queue, traitKey) => {
        const acc = await queue;
        const resolveTraitValue = (0, internal_1.normalizeResolver)(
          traitsDefs[traitKey]?.data ?? {},
        );
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
      Promise.all((0, internal_1.normalizeList)(inputData).map((data) => build(data)));
    const pickForConnect = (inputData) => ({
      id: inputData.id,
    });
    const create = async (inputData = {}) => {
      const data = await build(inputData).then(screen);
      return await (0, internal_1.getClient)().user.create({ data });
    };
    const createList = (inputData) =>
      Promise.all((0, internal_1.normalizeList)(inputData).map((data) => create(data)));
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
function defineUserFactory(options) {
  return defineUserFactoryInternal(options ?? {});
}
exports.defineUserFactory = defineUserFactory;
function isSessionuserFactory(x) {
  return x?._factoryFor === 'User';
}
function autoGenerateSessionScalarsOrEnums({ seq }) {
  return {
    id: (0, internal_1.getScalarFieldValueGenerator)().String({
      modelName: 'Session',
      fieldName: 'id',
      isId: true,
      isUnique: false,
      seq,
    }),
    active_expires: (0, internal_1.getScalarFieldValueGenerator)().BigInt({
      modelName: 'Session',
      fieldName: 'active_expires',
      isId: false,
      isUnique: false,
      seq,
    }),
    idle_expires: (0, internal_1.getScalarFieldValueGenerator)().BigInt({
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
    const getSeq = () => (0, internal_1.getSequenceCounter)(seqKey);
    const screen = (0, internal_1.createScreener)('Session', modelFieldDefinitions);
    const build = async (inputData = {}) => {
      const seq = getSeq();
      const requiredScalarData = autoGenerateSessionScalarsOrEnums({ seq });
      const resolveValue = (0, internal_1.normalizeResolver)(defaultDataResolver ?? {});
      const defaultData = await traitKeys.reduce(async (queue, traitKey) => {
        const acc = await queue;
        const resolveTraitValue = (0, internal_1.normalizeResolver)(
          traitsDefs[traitKey]?.data ?? {},
        );
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
      Promise.all((0, internal_1.normalizeList)(inputData).map((data) => build(data)));
    const pickForConnect = (inputData) => ({
      id: inputData.id,
    });
    const create = async (inputData = {}) => {
      const data = await build(inputData).then(screen);
      return await (0, internal_1.getClient)().session.create({ data });
    };
    const createList = (inputData) =>
      Promise.all((0, internal_1.normalizeList)(inputData).map((data) => create(data)));
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
function defineSessionFactory(options) {
  return defineSessionFactoryInternal(options);
}
exports.defineSessionFactory = defineSessionFactory;
function isKeyuserFactory(x) {
  return x?._factoryFor === 'User';
}
function autoGenerateKeyScalarsOrEnums({ seq }) {
  return {
    id: (0, internal_1.getScalarFieldValueGenerator)().String({
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
    const getSeq = () => (0, internal_1.getSequenceCounter)(seqKey);
    const screen = (0, internal_1.createScreener)('Key', modelFieldDefinitions);
    const build = async (inputData = {}) => {
      const seq = getSeq();
      const requiredScalarData = autoGenerateKeyScalarsOrEnums({ seq });
      const resolveValue = (0, internal_1.normalizeResolver)(defaultDataResolver ?? {});
      const defaultData = await traitKeys.reduce(async (queue, traitKey) => {
        const acc = await queue;
        const resolveTraitValue = (0, internal_1.normalizeResolver)(
          traitsDefs[traitKey]?.data ?? {},
        );
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
      Promise.all((0, internal_1.normalizeList)(inputData).map((data) => build(data)));
    const pickForConnect = (inputData) => ({
      id: inputData.id,
    });
    const create = async (inputData = {}) => {
      const data = await build(inputData).then(screen);
      return await (0, internal_1.getClient)().key.create({ data });
    };
    const createList = (inputData) =>
      Promise.all((0, internal_1.normalizeList)(inputData).map((data) => create(data)));
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
function defineKeyFactory(options) {
  return defineKeyFactoryInternal(options);
}
exports.defineKeyFactory = defineKeyFactory;
function autoGenerateTaskScalarsOrEnums({ seq }) {
  return {
    id: (0, internal_1.getScalarFieldValueGenerator)().String({
      modelName: 'Task',
      fieldName: 'id',
      isId: true,
      isUnique: false,
      seq,
    }),
    contest_id: (0, internal_1.getScalarFieldValueGenerator)().String({
      modelName: 'Task',
      fieldName: 'contest_id',
      isId: false,
      isUnique: false,
      seq,
    }),
    task_table_index: (0, internal_1.getScalarFieldValueGenerator)().String({
      modelName: 'Task',
      fieldName: 'task_table_index',
      isId: false,
      isUnique: false,
      seq,
    }),
    task_id: (0, internal_1.getScalarFieldValueGenerator)().String({
      modelName: 'Task',
      fieldName: 'task_id',
      isId: false,
      isUnique: true,
      seq,
    }),
    title: (0, internal_1.getScalarFieldValueGenerator)().String({
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
    const getSeq = () => (0, internal_1.getSequenceCounter)(seqKey);
    const screen = (0, internal_1.createScreener)('Task', modelFieldDefinitions);
    const build = async (inputData = {}) => {
      const seq = getSeq();
      const requiredScalarData = autoGenerateTaskScalarsOrEnums({ seq });
      const resolveValue = (0, internal_1.normalizeResolver)(defaultDataResolver ?? {});
      const defaultData = await traitKeys.reduce(async (queue, traitKey) => {
        const acc = await queue;
        const resolveTraitValue = (0, internal_1.normalizeResolver)(
          traitsDefs[traitKey]?.data ?? {},
        );
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
      Promise.all((0, internal_1.normalizeList)(inputData).map((data) => build(data)));
    const pickForConnect = (inputData) => ({
      id: inputData.id,
    });
    const create = async (inputData = {}) => {
      const data = await build(inputData).then(screen);
      return await (0, internal_1.getClient)().task.create({ data });
    };
    const createList = (inputData) =>
      Promise.all((0, internal_1.normalizeList)(inputData).map((data) => create(data)));
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
function defineTaskFactory(options) {
  return defineTaskFactoryInternal(options ?? {});
}
exports.defineTaskFactory = defineTaskFactory;
function autoGenerateTagScalarsOrEnums({ seq }) {
  return {
    id: (0, internal_1.getScalarFieldValueGenerator)().String({
      modelName: 'Tag',
      fieldName: 'id',
      isId: true,
      isUnique: false,
      seq,
    }),
    is_official: (0, internal_1.getScalarFieldValueGenerator)().Boolean({
      modelName: 'Tag',
      fieldName: 'is_official',
      isId: false,
      isUnique: false,
      seq,
    }),
    name: (0, internal_1.getScalarFieldValueGenerator)().String({
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
    const getSeq = () => (0, internal_1.getSequenceCounter)(seqKey);
    const screen = (0, internal_1.createScreener)('Tag', modelFieldDefinitions);
    const build = async (inputData = {}) => {
      const seq = getSeq();
      const requiredScalarData = autoGenerateTagScalarsOrEnums({ seq });
      const resolveValue = (0, internal_1.normalizeResolver)(defaultDataResolver ?? {});
      const defaultData = await traitKeys.reduce(async (queue, traitKey) => {
        const acc = await queue;
        const resolveTraitValue = (0, internal_1.normalizeResolver)(
          traitsDefs[traitKey]?.data ?? {},
        );
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
      Promise.all((0, internal_1.normalizeList)(inputData).map((data) => build(data)));
    const pickForConnect = (inputData) => ({
      id: inputData.id,
    });
    const create = async (inputData = {}) => {
      const data = await build(inputData).then(screen);
      return await (0, internal_1.getClient)().tag.create({ data });
    };
    const createList = (inputData) =>
      Promise.all((0, internal_1.normalizeList)(inputData).map((data) => create(data)));
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
function defineTagFactory(options) {
  return defineTagFactoryInternal(options ?? {});
}
exports.defineTagFactory = defineTagFactory;
function isTaskTagtaskFactory(x) {
  return x?._factoryFor === 'Task';
}
function isTaskTagtagFactory(x) {
  return x?._factoryFor === 'Tag';
}
function autoGenerateTaskTagScalarsOrEnums({ seq }) {
  return {
    id: (0, internal_1.getScalarFieldValueGenerator)().String({
      modelName: 'TaskTag',
      fieldName: 'id',
      isId: false,
      isUnique: false,
      seq,
    }),
    priority: (0, internal_1.getScalarFieldValueGenerator)().Int({
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
    const getSeq = () => (0, internal_1.getSequenceCounter)(seqKey);
    const screen = (0, internal_1.createScreener)('TaskTag', modelFieldDefinitions);
    const build = async (inputData = {}) => {
      const seq = getSeq();
      const requiredScalarData = autoGenerateTaskTagScalarsOrEnums({ seq });
      const resolveValue = (0, internal_1.normalizeResolver)(defaultDataResolver ?? {});
      const defaultData = await traitKeys.reduce(async (queue, traitKey) => {
        const acc = await queue;
        const resolveTraitValue = (0, internal_1.normalizeResolver)(
          traitsDefs[traitKey]?.data ?? {},
        );
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
      Promise.all((0, internal_1.normalizeList)(inputData).map((data) => build(data)));
    const pickForConnect = (inputData) => ({
      task_id: inputData.task_id,
      tag_id: inputData.tag_id,
    });
    const create = async (inputData = {}) => {
      const data = await build(inputData).then(screen);
      return await (0, internal_1.getClient)().taskTag.create({ data });
    };
    const createList = (inputData) =>
      Promise.all((0, internal_1.normalizeList)(inputData).map((data) => create(data)));
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
function defineTaskTagFactory(options) {
  return defineTaskTagFactoryInternal(options ?? {});
}
exports.defineTaskTagFactory = defineTaskTagFactory;
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
    id: (0, internal_1.getScalarFieldValueGenerator)().String({
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
    const getSeq = () => (0, internal_1.getSequenceCounter)(seqKey);
    const screen = (0, internal_1.createScreener)('TaskAnswer', modelFieldDefinitions);
    const build = async (inputData = {}) => {
      const seq = getSeq();
      const requiredScalarData = autoGenerateTaskAnswerScalarsOrEnums({ seq });
      const resolveValue = (0, internal_1.normalizeResolver)(defaultDataResolver ?? {});
      const defaultData = await traitKeys.reduce(async (queue, traitKey) => {
        const acc = await queue;
        const resolveTraitValue = (0, internal_1.normalizeResolver)(
          traitsDefs[traitKey]?.data ?? {},
        );
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
      Promise.all((0, internal_1.normalizeList)(inputData).map((data) => build(data)));
    const pickForConnect = (inputData) => ({
      task_id: inputData.task_id,
      user_id: inputData.user_id,
    });
    const create = async (inputData = {}) => {
      const data = await build(inputData).then(screen);
      return await (0, internal_1.getClient)().taskAnswer.create({ data });
    };
    const createList = (inputData) =>
      Promise.all((0, internal_1.normalizeList)(inputData).map((data) => create(data)));
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
function defineTaskAnswerFactory(options) {
  return defineTaskAnswerFactoryInternal(options ?? {});
}
exports.defineTaskAnswerFactory = defineTaskAnswerFactory;
function autoGenerateSubmissionStatusScalarsOrEnums({ seq }) {
  return {
    id: (0, internal_1.getScalarFieldValueGenerator)().String({
      modelName: 'SubmissionStatus',
      fieldName: 'id',
      isId: true,
      isUnique: false,
      seq,
    }),
    status_name: (0, internal_1.getScalarFieldValueGenerator)().String({
      modelName: 'SubmissionStatus',
      fieldName: 'status_name',
      isId: false,
      isUnique: true,
      seq,
    }),
    label_name: (0, internal_1.getScalarFieldValueGenerator)().String({
      modelName: 'SubmissionStatus',
      fieldName: 'label_name',
      isId: false,
      isUnique: false,
      seq,
    }),
    image_path: (0, internal_1.getScalarFieldValueGenerator)().String({
      modelName: 'SubmissionStatus',
      fieldName: 'image_path',
      isId: false,
      isUnique: false,
      seq,
    }),
    button_color: (0, internal_1.getScalarFieldValueGenerator)().String({
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
    const getSeq = () => (0, internal_1.getSequenceCounter)(seqKey);
    const screen = (0, internal_1.createScreener)('SubmissionStatus', modelFieldDefinitions);
    const build = async (inputData = {}) => {
      const seq = getSeq();
      const requiredScalarData = autoGenerateSubmissionStatusScalarsOrEnums({ seq });
      const resolveValue = (0, internal_1.normalizeResolver)(defaultDataResolver ?? {});
      const defaultData = await traitKeys.reduce(async (queue, traitKey) => {
        const acc = await queue;
        const resolveTraitValue = (0, internal_1.normalizeResolver)(
          traitsDefs[traitKey]?.data ?? {},
        );
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
      Promise.all((0, internal_1.normalizeList)(inputData).map((data) => build(data)));
    const pickForConnect = (inputData) => ({
      id: inputData.id,
    });
    const create = async (inputData = {}) => {
      const data = await build(inputData).then(screen);
      return await (0, internal_1.getClient)().submissionStatus.create({ data });
    };
    const createList = (inputData) =>
      Promise.all((0, internal_1.normalizeList)(inputData).map((data) => create(data)));
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
function defineSubmissionStatusFactory(options) {
  return defineSubmissionStatusFactoryInternal(options ?? {});
}
exports.defineSubmissionStatusFactory = defineSubmissionStatusFactory;
