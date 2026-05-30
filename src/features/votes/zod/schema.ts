import { z } from 'zod';
import { TaskGrade } from '@prisma/client';

export const voteAbsoluteGradeSchema = z.object({
  taskId: z.string().trim().min(1),
  grade: z
    .nativeEnum(TaskGrade)
    .refine((val) => val !== TaskGrade.PENDING, { message: 'Cannot vote for PENDING grade' }),
});

export type VoteAbsoluteGradeInput = z.infer<typeof voteAbsoluteGradeSchema>;
