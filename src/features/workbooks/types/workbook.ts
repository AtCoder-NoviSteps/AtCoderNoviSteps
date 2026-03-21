import type { WorkBookType as WorkBookTypeOrigin } from '@prisma/client';
import type { Roles } from '$lib/types/user';
import type { TaskGrade, TaskResults } from '$lib/types/task';

export type WorkBookBase = {
  title: string;
  description: string;
  editorialUrl: string; // カリキュラムのトピック解説用のURL。HACK: 「ユーザ作成」の場合も利用できるようにするかは要検討。
  isPublished: boolean;
  isOfficial: boolean;
  isReplenished: boolean; // カリキュラムの【補充】を識別するために使用
  workBookType: WorkBookType;
  urlSlug?: string | null; // 問題集（カリキュラムと解法別）をURLで識別するためのオプション。a-z、0-9、(-)ハイフンのみ使用可能。例: bfs、dfs、dp、union-find、2-sat。
  workBookTasks: WorkBookTaskBase[];
};

export interface WorkBook extends WorkBookBase {
  id: number;
  authorId: string;
}

export type WorkBooks = WorkBook[];

export interface WorkbookWithAuthorName extends WorkBookBase {
  authorName: string;
}

export type WorkbooksWithAuthorNames = WorkbookWithAuthorName[];

export interface WorkbookList extends WorkBookBase {
  id: number;
  authorId: string;
  authorName: string;
}

export type WorkbooksList = WorkbookList[];

// Alias used as the return type of getWorkBooksWithAuthors().
export type WorkbooksWithAuthors = WorkbooksList;

// HACK: enumを使うときは毎回書いているので、もっと簡略化できないか?
export const WorkBookType: { [key in WorkBookTypeOrigin]: key } = {
  CREATED_BY_USER: 'CREATED_BY_USER', // (デフォルト) ユーザ作成: サービスの利用者がさまざまなコンセプトで作成
  CURRICULUM: 'CURRICULUM', // カリキュラム: 例題の解法を理解すれば、その本質部分を真似することで解ける類題
  SOLUTION: 'SOLUTION', // 解法別: 使い方をマスターしたいアルゴリズム・データ構造・考え方・実装方針 (総称して解法と表記) をさまざまなパターンで考察しながら練習できる
  TEXTBOOK: 'TEXTBOOK', //  (Deprecated) 旧 教科書: 表記を「カリキュラム」に変更したため廃止予定
  GENRE: 'GENRE', // (Deprecated) ジャンル別: 考察なしで問題文から読み取れる内容に基づいてまとめている。ネタバレなし
  THEME: 'THEME', // (Deprecated) テーマ別: さまざまな解法 (解法別より狭義) を横断し得るものをまとめている
  OTHERS: 'OTHERS', // (Deprecated) その他
} as const;

// Re-exporting the original type with the original name.
export type WorkBookType = WorkBookTypeOrigin;

// Imported by table components — avoids repeating the same Props definition in three places.
export type WorkbookTableProps = {
  workbooks: WorkbooksList;
  gradeModesEachWorkbook: Map<number, TaskGrade>;
  userId: string;
  role: Roles;
  taskResults: Map<number, TaskResults>;
};

/** Imported by SolutionTable and CreatedByUserTable — excludes gradeModesEachWorkbook which is unused in those tabs. */
export type SolutionTableProps = Omit<WorkbookTableProps, 'gradeModesEachWorkbook'>;

export type WorkBookTaskBase = {
  taskId: string;
  priority: number;
  comment: string;
};

export type WorkBookTasksBase = WorkBookTaskBase[];

export interface WorkBookTask extends WorkBookTaskBase {
  workBookId: number;
}

export type WorkBookTasks = WorkBookTask[];

export interface WorkBookTaskCreate extends WorkBookTaskBase {
  contestId: string;
  title: string;
}

export type WorkBookTasksCreate = WorkBookTaskCreate[];

export type WorkBookTaskEdit = WorkBookTaskCreate;

export type WorkBookTasksEdit = WorkBookTaskEdit[];

/** Valid values for the `?tab=` URL parameter on the /workbooks page. */
export const WorkBookTab = {
  CURRICULUM: 'curriculum',
  SOLUTION: 'solution',
  CREATED_BY_USER: 'created_by_user',
} as const;

export type WorkBookTab = (typeof WorkBookTab)[keyof typeof WorkBookTab];

/** Default tab when the URL parameter is absent. */
export const DEFAULT_WORKBOOK_TAB: WorkBookTab = WorkBookTab.CURRICULUM;
