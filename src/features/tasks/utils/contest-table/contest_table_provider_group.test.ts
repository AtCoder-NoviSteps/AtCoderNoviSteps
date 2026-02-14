import { describe, test, expect } from 'vitest';

import { ContestType } from '$lib/types/contest';

import {
  ABSProvider,
  ContestTableProviderBase,
  ContestTableProviderGroup,
} from './contest_table_provider';
import { TESSOKU_SECTIONS } from '$features/tasks/types/contest-table/contest_table_provider';
import { EDPCProvider, TDPCProvider } from './dp_providers';
import {
  TessokuBookForExamplesProvider,
  TessokuBookForPracticalsProvider,
  TessokuBookForChallengesProvider,
} from './tessoku_book_providers';

describe('ContestTableProviderGroup', () => {
  test('expects to create a group with metadata correctly', () => {
    const group = new ContestTableProviderGroup('only metadata', {
      buttonLabel: '',
      ariaLabel: 'only metadata',
    });

    expect(group.getGroupName()).toBe('only metadata');
    expect(group.getMetadata()).toEqual({
      buttonLabel: '',
      ariaLabel: 'only metadata',
    });
    expect(group.getSize()).toBe(0);
  });

  test('expects to add a single provider correctly', () => {
    const group = new ContestTableProviderGroup('AtCoder Beginners Selection', {
      buttonLabel: 'ABS',
      ariaLabel: 'Filter AtCoder Beginners Selection',
    });
    const provider = new ABSProvider(ContestType.ABS);

    group.addProvider(provider);

    expect(group.getSize()).toBe(1);
    expect(group.getProvider(ContestType.ABS)).toBe(provider);
    expect(group.getProvider(ContestType.OTHERS)).toBeUndefined();
  });

  test('expects to add multiple providers correctly', () => {
    const group = new ContestTableProviderGroup('EDPC・TDPC', {
      buttonLabel: 'EDPC・TDPC',
      ariaLabel: 'EDPC and TDPC contests',
    });
    const edpcProvider = new EDPCProvider(ContestType.EDPC);
    const tdpcProvider = new TDPCProvider(ContestType.TDPC);

    group.addProviders(edpcProvider, tdpcProvider);

    expect(group.getSize()).toBe(2);
    expect(group.getProvider(ContestType.EDPC)).toBe(edpcProvider);
    expect(group.getProvider(ContestType.TDPC)).toBe(tdpcProvider);
  });

  test('expects to get all providers correctly', () => {
    const group = new ContestTableProviderGroup('Algorithm Training Pack', {
      buttonLabel: 'アルゴリズム練習パック',
      ariaLabel: 'Filter algorithm training contests',
    });
    const edpcProvider = new EDPCProvider(ContestType.EDPC);
    const tdpcProvider = new TDPCProvider(ContestType.TDPC);

    group.addProvider(edpcProvider);
    group.addProvider(tdpcProvider);

    const allProviders = group.getAllProviders();
    expect(allProviders).toHaveLength(2);
    expect(allProviders).toContain(edpcProvider);
    expect(allProviders).toContain(tdpcProvider);
  });

  test('expects to return method chaining correctly', () => {
    const group = new ContestTableProviderGroup('Collection for beginner', {
      buttonLabel: '初心者向けセット',
      ariaLabel: 'Filter contests for beginner',
    });
    const absProvider = new ABSProvider(ContestType.ABS);
    const edpcProvider = new EDPCProvider(ContestType.EDPC);

    const result = group.addProvider(absProvider).addProvider(edpcProvider);

    expect(result).toBe(group);
    expect(group.getSize()).toBe(2);
  });

  test('expects to get group statistics correctly', () => {
    const group = new ContestTableProviderGroup('Statistics for contest table', {
      buttonLabel: 'コンテストテーブルに関する統計情報',
      ariaLabel: 'Statistics for contest table',
    });
    const absProvider = new ABSProvider(ContestType.ABS);
    const edpcProvider = new EDPCProvider(ContestType.EDPC);

    group.addProvider(absProvider);
    group.addProvider(edpcProvider);

    const stats = group.getStats();

    expect(stats.groupName).toBe('Statistics for contest table');
    expect(stats.providerCount).toBe(2);
    expect(stats.providers).toHaveLength(2);
    expect(stats.providers[0]).toHaveProperty('providerKey');
    expect(stats.providers[0]).toHaveProperty('metadata');
    expect(stats.providers[0]).toHaveProperty('displayConfig');
  });

  describe('Provider key functionality', () => {
    test('expects createProviderKey to generate correct simple key', () => {
      const key = ContestTableProviderBase.createProviderKey(ContestType.ABC);
      expect(key).toBe('ABC');
      // Verify key type is ProviderKey (string-based)
      expect(typeof key).toBe('string');
    });

    test('expects createProviderKey to generate correct composite key with section', () => {
      const key = ContestTableProviderBase.createProviderKey(
        ContestType.TESSOKU_BOOK,
        TESSOKU_SECTIONS.EXAMPLES,
      );
      expect(key).toBe(`TESSOKU_BOOK::${TESSOKU_SECTIONS.EXAMPLES}`);
      // Verify key contains section separator
      expect(key).toContain('::');
    });

    test('expects TessokuBook providers to have correct keys', () => {
      const examplesProvider = new TessokuBookForExamplesProvider(ContestType.TESSOKU_BOOK);
      const practicalsProvider = new TessokuBookForPracticalsProvider(ContestType.TESSOKU_BOOK);
      const challengesProvider = new TessokuBookForChallengesProvider(ContestType.TESSOKU_BOOK);

      expect(examplesProvider.getProviderKey()).toBe(`TESSOKU_BOOK::${TESSOKU_SECTIONS.EXAMPLES}`);
      expect(practicalsProvider.getProviderKey()).toBe(
        `TESSOKU_BOOK::${TESSOKU_SECTIONS.PRACTICALS}`,
      );
      expect(challengesProvider.getProviderKey()).toBe(
        `TESSOKU_BOOK::${TESSOKU_SECTIONS.CHALLENGES}`,
      );
    });

    test('expects multiple TessokuBook providers to be stored separately in group', () => {
      const group = new ContestTableProviderGroup('Tessoku Book', {
        buttonLabel: '競技プログラミングの鉄則',
        ariaLabel: 'Filter Tessoku Book',
      });

      const examplesProvider = new TessokuBookForExamplesProvider(ContestType.TESSOKU_BOOK);
      const practicalsProvider = new TessokuBookForPracticalsProvider(ContestType.TESSOKU_BOOK);
      const challengesProvider = new TessokuBookForChallengesProvider(ContestType.TESSOKU_BOOK);

      group.addProviders(examplesProvider, practicalsProvider, challengesProvider);

      expect(group.getSize()).toBe(3);
      expect(group.getProvider(ContestType.TESSOKU_BOOK, TESSOKU_SECTIONS.EXAMPLES)).toBeInstanceOf(
        TessokuBookForExamplesProvider,
      );
      expect(
        group.getProvider(ContestType.TESSOKU_BOOK, TESSOKU_SECTIONS.PRACTICALS),
      ).toBeInstanceOf(TessokuBookForPracticalsProvider);
      expect(
        group.getProvider(ContestType.TESSOKU_BOOK, TESSOKU_SECTIONS.CHALLENGES),
      ).toBeInstanceOf(TessokuBookForChallengesProvider);
    });

    test('expects backward compatibility for getProvider without section', () => {
      const group = new ContestTableProviderGroup('AtCoder Beginners Selection', {
        buttonLabel: 'ABS',
        ariaLabel: 'Filter AtCoder Beginners Selection',
      });

      const absProvider = new ABSProvider(ContestType.ABS);
      group.addProvider(absProvider);

      // Get provider without section should work with simple key
      expect(group.getProvider(ContestType.ABS)).toBe(absProvider);
      expect(group.getProvider(ContestType.ABS, undefined)).toBe(absProvider);
    });

    test('expects getProvider with non-existent section to return undefined', () => {
      const group = new ContestTableProviderGroup('Tessoku Book', {
        buttonLabel: '競技プログラミングの鉄則',
        ariaLabel: 'Filter Tessoku Book',
      });

      const examplesProvider = new TessokuBookForExamplesProvider(ContestType.TESSOKU_BOOK);
      group.addProvider(examplesProvider);

      expect(group.getProvider(ContestType.TESSOKU_BOOK, TESSOKU_SECTIONS.EXAMPLES)).toBe(
        examplesProvider,
      );
      expect(
        group.getProvider(ContestType.TESSOKU_BOOK, TESSOKU_SECTIONS.PRACTICALS),
      ).toBeUndefined();
      expect(group.getProvider(ContestType.TESSOKU_BOOK, 'invalid')).toBeUndefined();
    });
  });
});
