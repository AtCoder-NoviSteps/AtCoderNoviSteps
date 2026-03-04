import prisma from '$lib/server/database';

import { type Task, type TaskGrade } from '$lib/types/task';
import {
  SolutionCategory,
  type WorkBookPlacement,
  type WorkBookPlacements,
  type WorkbooksList,
} from '$features/workbooks/types/workbook';

import { calcWorkBookGradeModes } from '$features/workbooks/utils/workbooks';

// TODO: Extract types as other file as workbook placement.
type PlacementInput = Pick<WorkBookPlacement, 'id' | 'priority' | 'taskGrade' | 'solutionCategory'>;

// TODO: Use WorkBookTaskBase as workBookTasks
type WorkBookWithTasks = {
  id: number;
  workBookTasks: { taskId: string; priority: number; comment: string }[];
};

type PlacementCreate = {
  workBookId: number;
  taskGrade: TaskGrade | null;
  solutionCategory: (typeof SolutionCategory)[keyof typeof SolutionCategory] | null;
  priority: number;
};

export async function getWorkBookPlacements(
  workBookType: 'CURRICULUM' | 'SOLUTION',
): Promise<WorkBookPlacements> {
  return prisma.workBookPlacement.findMany({
    where: { workBook: { workBookType } },
    orderBy: { priority: 'asc' },
  });
}

export async function upsertWorkBookPlacements(updatedPlacements: PlacementInput[]): Promise<void> {
  if (updatedPlacements.length === 0) {
    return;
  }

  await prisma.$transaction(
    updatedPlacements.map((updatedPlacement) =>
      prisma.workBookPlacement.update({
        where: { id: updatedPlacement.id },
        data: {
          priority: updatedPlacement.priority,
          taskGrade: updatedPlacement.taskGrade ?? null,
          solutionCategory: updatedPlacement.solutionCategory ?? null,
        },
      }),
    ),
  );
}

export function initializeSolutionPlacements(workbooks: { id: number }[]): PlacementCreate[] {
  return workbooks.map((workBook, i) => ({
    workBookId: workBook.id,
    taskGrade: null,
    solutionCategory: SolutionCategory.PENDING,
    priority: i + 1,
  }));
}

// TODO: Extract sub methods to understand easier.
export function initializeCurriculumPlacements(
  workbooks: WorkBookWithTasks[],
  tasksByTaskId: Map<string, Task>,
): PlacementCreate[] {
  const gradeModes = calcWorkBookGradeModes(workbooks as WorkbooksList, tasksByTaskId);

  // Note: Group by grade and sort by workbook.id in ascending order.
  // This is to ensure that the priority is assigned based on the grade, and within the same grade, it is assigned based on the workbook ID in ascending order.
  // This way, if there are multiple workbooks with the same grade, they will be ordered by their ID, which is a stable and deterministic way to assign priorities.
  const byGrade = new Map<TaskGrade, number[]>();

  for (const workbook of workbooks) {
    const grade = gradeModes.get(workbook.id)!;

    if (!byGrade.has(grade)) {
      byGrade.set(grade, []);
    }

    byGrade.get(grade)!.push(workbook.id);
  }

  for (const ids of byGrade.values()) {
    ids.sort((a, b) => a - b);
  }

  const result: PlacementCreate[] = [];

  for (const workbook of workbooks) {
    const grade = gradeModes.get(workbook.id)!;
    const ids = byGrade.get(grade)!;
    const priority = ids.indexOf(workbook.id) + 1;

    result.push({ workBookId: workbook.id, taskGrade: grade, solutionCategory: null, priority });
  }

  return result;
}
