import { describe, test, expect, beforeEach, vi } from 'vitest';

import { getTag } from '$lib/services/tags';

vi.mock('$lib/server/database', () => ({
  default: {
    tag: {
      findUnique: vi.fn(),
    },
  },
}));

import db from '$lib/server/database';

describe('getTag', () => {
  const mockDb = db as unknown as { tag: { findUnique: ReturnType<typeof vi.fn> } };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('successful case', () => {
    test('returns tag when tag exists', async () => {
      const tag = { id: '1', name: 'DP', is_official: true, is_published: true };
      mockDb.tag.findUnique.mockResolvedValue(tag);

      const result = await getTag('1');

      expect(result).toEqual(tag);
      expect(mockDb.tag.findUnique).toHaveBeenCalledWith({ where: { id: '1' } });
    });
  });

  describe('error cases', () => {
    test('returns null when tag does not exist', async () => {
      mockDb.tag.findUnique.mockResolvedValue(null);

      const result = await getTag('nonexistent');

      expect(result).toBeNull();
      expect(mockDb.tag.findUnique).toHaveBeenCalledWith({ where: { id: 'nonexistent' } });
    });
  });
});
