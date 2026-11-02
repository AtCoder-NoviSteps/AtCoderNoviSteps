// https://zod.dev/?id=basic-usage
// https://developer.mozilla.org/ja/docs/Web/JavaScript/Guide/Regular_expressions/Character_classes
// https://regex101.com/
// https://qiita.com/mpyw/items/886218e7b418dfed254b
import { z } from 'zod';

import { TaskGrade } from '#lib/types/task.js';
import { WorkBookType } from '#features/workbooks/types/workbook.js';
import { SolutionCategory } from '#features/workbooks/types/workbook_placement.js';

import { isValidUrl, isValidUrlSlug } from '#lib/utils/url.js';

const workBookTaskSchema = z.object({
  workBookId: z.number().positive().optional(),
  taskId: z.string(),
  priority: z.number().positive(),
  comment: z.string().min(0, { error: '' }).max(50, { error: '50文字になるまで削除してください' }), // FIXME: 上限は暫定値。
});

export const workBookSchema = z.object({
  authorId: z.string(),
  title: z
    .string()
    .min(3, { error: '3文字以上入力してください' })
    .max(200, { error: '200文字になるまで削除してください' }),
  description: z
    .string()
    .min(0, { error: '' })
    .max(300, { error: '300文字になるまで削除してください' }),
  editorialUrl: z
    .string()
    .min(0, { error: '' })
    .max(300, { error: '300文字になるまで削除してください' })
    .refine(isValidUrl, { error: 'URLを再入力してください' }), // カリキュラムのトピック解説用のURL。HACK: 「ユーザ作成」の場合も利用できるようにするかは要検討。
  isPublished: z.boolean(),
  isOfficial: z.boolean(),
  isReplenished: z.boolean(), // カリキュラムの【補充】を識別するために使用
  workBookType: z.enum(WorkBookType),
  urlSlug: z
    .string()
    .nullable()
    .optional()
    .refine(
      (value) => {
        // Allow empty string, null, or undefined
        if (value === '' || value === null || value === undefined) {
          return true;
        }
        return value.length <= 30;
      },
      { error: '30文字以下になるまで削除してください' },
    )
    .transform((value) =>
      value === '' || value === null || value === undefined ? undefined : value.toLowerCase(),
    )
    .refine((value) => value === undefined || isValidUrlSlug(value), {
      error: '半角英小文字、半角数字、ハイフンのみ使用できます（数字のみは不可）',
    }),
  workBookTasks: z
    .array(workBookTaskSchema)
    .min(1, { error: '1問以上登録してください' })
    .max(200, { error: '200問以下になるまで削除してください' }),
});

export const workBookPlacementSchema = z
  .object({
    id: z.number().int().positive(),
    priority: z.number().int().positive(),
    taskGrade: z.enum(TaskGrade).nullable(),
    solutionCategory: z.enum(SolutionCategory).nullable(),
  })
  // Note: XOR constraint: dual enforcement via Zod (early validation) and a CHECK in migration.sql (last line of defence).
  // Prisma lacks @@check, so the SQL constraint is maintained manually. Keep both in sync.
  .refine(
    (value) =>
      (value.taskGrade !== null && value.solutionCategory === null) ||
      (value.taskGrade === null && value.solutionCategory !== null),
    { error: 'taskGrade と solutionCategory は片方のみ設定できます' },
  );

export const updatePlacementsSchema = z.object({
  updates: z.array(workBookPlacementSchema),
});
