import { WorkBookType, type WorkBook, type WorkBookTasksBase } from '../src/lib/types/workbook';

function createWorkBookBase(overrides: Partial<WorkBook> = {}): WorkBook {
  return {
    id: 100000,
    authorId: '1',
    title: '実装力を鍛える問題集',
    description: '',
    editorialUrl: '',
    isPublished: false,
    isOfficial: false,
    isReplenished: false,
    workBookType: WorkBookType.CREATED_BY_USER,
    urlSlug: '',
    workBookTasks: createWorkBookTasks(),
    ...overrides,
  };
}

function createWorkBookTasks(): WorkBookTasksBase {
  return [{ taskId: 'abc322_d', priority: 1, comment: '' }];
}

export const workbooks = [
  createWorkBookBase({
    title: '',
    isPublished: true,
    isOfficial: true,
    workBookType: WorkBookType.CURRICULUM,
  }),
];
