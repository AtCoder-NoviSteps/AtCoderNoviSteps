import { describe, test, expect, beforeEach, vi } from 'vitest';

import { Prisma } from '@prisma/client';

import { TaskGrade } from '$lib/types/task';
import { updateTask } from '$lib/services/tasks';

vi.mock('$lib/server/database', () => ({
  default: {
    task: {
      update: vi.fn(),
    },
  },
}));

import db from '$lib/server/database';

describe('updateTask', () => {
  const mockDb = db as unknown as { task: { update: ReturnType<typeof vi.fn> } };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('successful case', () => {
    test('returns undefined when task is updated successfully', async () => {
      mockDb.task.update.mockResolvedValue({
        id: '1',
        task_id: 'abc450_d',
        grade: TaskGrade.Q1,
      });

      const result = await updateTask('abc450_d', TaskGrade.Q2);

      expect(result).toBeUndefined();
      expect(mockDb.task.update).toHaveBeenCalledWith({
        where: { task_id: 'abc450_d' },
        data: { grade: TaskGrade.Q2 },
      });
    });
  });

  describe('error cases', () => {
    test('returns null when task is not found (P2025)', async () => {
      const error = new Prisma.PrismaClientKnownRequestError(
        'An operation failed because it depends on one or more records that were required but not found. Record to update not found.',
        { code: 'P2025', clientVersion: '5.0.0' },
      );

      mockDb.task.update.mockRejectedValue(error);

      const result = await updateTask('nonexistent_task', TaskGrade.Q1);

      expect(result).toBeNull();
    });

    test('re-throws non-P2025 errors', async () => {
      const error = new Error('Database connection error');
      mockDb.task.update.mockRejectedValue(error);

      await expect(updateTask('abc450_d', TaskGrade.Q1)).rejects.toThrow(
        'Database connection error',
      );
    });
  });
});
