import type { SolutionCategory as SolutionCategoryOrigin } from '@prisma/client';
import type { TaskGrade } from '$lib/types/task';

// Categories for solution placement.
export const SolutionCategory: { [key in SolutionCategoryOrigin]: key } = {
  PENDING: 'PENDING',
  SEARCH_SIMULATION: 'SEARCH_SIMULATION',
  DYNAMIC_PROGRAMMING: 'DYNAMIC_PROGRAMMING',
  DATA_STRUCTURE: 'DATA_STRUCTURE',
  GRAPH: 'GRAPH',
  TREE: 'TREE',
  NUMBER_THEORY: 'NUMBER_THEORY',
  ALGEBRA: 'ALGEBRA',
  COMBINATORICS: 'COMBINATORICS',
  GAME: 'GAME',
  STRING: 'STRING',
  GEOMETRY: 'GEOMETRY',
  OPTIMIZATION: 'OPTIMIZATION',
  OTHERS: 'OTHERS',
  ANALYSIS: 'ANALYSIS',
} as const;

export type SolutionCategory = SolutionCategoryOrigin;

// Admin only: Used for ordering of workbooks (curriculums and solution)
export type WorkBookPlacement = {
  id: number;
  workBookId: number;
  taskGrade: TaskGrade | null;
  solutionCategory: SolutionCategory | null;
  priority: number;
};

export type WorkBookPlacements = WorkBookPlacement[];

// Japanese labels for solution categories (used in admin UI)
export const SOLUTION_LABELS: Record<string, string> = {
  PENDING: '未分類',
  SEARCH_SIMULATION: '探索・シミュレーション・実装',
  DYNAMIC_PROGRAMMING: '動的計画法',
  DATA_STRUCTURE: 'データ構造',
  GRAPH: 'グラフ',
  TREE: '木',
  NUMBER_THEORY: '数学（整数論）',
  ALGEBRA: '数学（代数）',
  COMBINATORICS: '数え上げ・確率・期待値',
  GAME: 'ゲーム',
  STRING: '文字列',
  GEOMETRY: '幾何',
  OPTIMIZATION: '最適化',
  OTHERS: 'その他',
  ANALYSIS: '考察テクニック',
};

// Shape of workbooks returned from the load function for use in KanbanBoard
export type WorkbookWithPlacement = {
  id: number;
  title: string;
  isPublished: boolean;
  workBookType: string;
  placement: WorkBookPlacement | null;
};
