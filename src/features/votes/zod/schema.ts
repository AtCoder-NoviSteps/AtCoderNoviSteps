import { z } from 'zod';
import { TaskGrade } from '@prisma/client';

export const voteAbsoluteGradeSchema = z.object({
  taskId: z.string().trim().min(1),
  grade: z.enum(TaskGrade).exclude([TaskGrade.PENDING]),
});

export type VoteAbsoluteGradeInput = z.infer<typeof voteAbsoluteGradeSchema>;
