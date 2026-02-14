import { describe, test, expect } from 'vitest';

import { ContestType } from '$lib/types/contest';

import {
  JOIFirstQualRoundProvider,
  JOISecondQualRound2020OnwardsProvider,
  JOIQualRoundFrom2006To2019Provider,
  JOISemiFinalRoundProvider,
} from './joi_providers';

describe('JOIFirstQualRoundProvider', () => {
  test('expects to filter tasks to include only JOI contests', () => {
    const provider = new JOIFirstQualRoundProvider(ContestType.JOI);
    const mockJOITasks = [
      { contest_id: 'joi2024yo1a', task_id: 'joi2024yo1a_a' },
      { contest_id: 'joi2024yo1b', task_id: 'joi2024yo1b_a' },
      { contest_id: 'joi2024yo1c', task_id: 'joi2024yo1c_a' },
      { contest_id: 'joi2023yo1a', task_id: 'joi2023yo1a_a' },
      { contest_id: 'joi2024yo2', task_id: 'joi2024yo2_a' },
      { contest_id: 'abc123', task_id: 'abc123_a' },
    ];

    const filtered = provider.filter(mockJOITasks as any);

    expect(filtered?.every((task) => task.contest_id.startsWith('joi'))).toBe(true);
    expect(filtered?.length).toBe(4);
    expect(filtered?.every((task) => task.contest_id.match(/joi\d{4}yo1[abc]/))).toBe(true);
  });

  test('expects to filter contests by year correctly', () => {
    const provider = new JOIFirstQualRoundProvider(ContestType.JOI);
    const mockJOITasks = [
      { contest_id: 'joi2024yo1a', task_id: 'joi2024yo1a_a' },
      { contest_id: 'joi2024yo1b', task_id: 'joi2024yo1b_a' },
      { contest_id: 'joi2024yo1c', task_id: 'joi2024yo1c_a' },
      { contest_id: 'joi2023yo1a', task_id: 'joi2023yo1a_a' },
      { contest_id: 'joi2023yo1b', task_id: 'joi2023yo1b_b' },
      { contest_id: 'joi2022yo1a', task_id: 'joi2022yo1a_c' },
    ];

    const filtered = provider.filter(mockJOITasks as any);

    expect(filtered?.length).toBe(6);
    expect(filtered?.filter((task) => task.contest_id.includes('2024')).length).toBe(3);
    expect(filtered?.filter((task) => task.contest_id.includes('2023')).length).toBe(2);
    expect(filtered?.filter((task) => task.contest_id.includes('2022')).length).toBe(1);
  });

  test('expects to get correct metadata', () => {
    const provider = new JOIFirstQualRoundProvider(ContestType.JOI);
    const metadata = provider.getMetadata();

    expect(metadata.title).toBe('JOI 一次予選');
    expect(metadata.abbreviationName).toBe('joiFirstQualRound');
  });

  test('expects to get correct display configuration', () => {
    const provider = new JOIFirstQualRoundProvider(ContestType.JOI);
    const displayConfig = provider.getDisplayConfig();

    expect(displayConfig.isShownHeader).toBe(true);
    expect(displayConfig.isShownRoundLabel).toBe(true);
    expect(displayConfig.roundLabelWidth).toBe('xl:w-28');
    expect(displayConfig.tableBodyCellsWidth).toBe('w-1/2 md:w-1/3 lg:w-1/4 px-1 py-1');
    expect(displayConfig.isShownTaskIndex).toBe(false);
  });

  test('expects to format contest round label correctly', () => {
    const provider = new JOIFirstQualRoundProvider(ContestType.JOI);

    expect(provider.getContestRoundLabel('joi2024yo1a')).toBe('2024 第 1 回');
    expect(provider.getContestRoundLabel('joi2024yo1b')).toBe('2024 第 2 回');
    expect(provider.getContestRoundLabel('joi2024yo1c')).toBe('2024 第 3 回');
    expect(provider.getContestRoundLabel('joi2023yo1a')).toBe('2023 第 1 回');
    expect(provider.getContestRoundLabel('joi2023yo1b')).toBe('2023 第 2 回');
    expect(provider.getContestRoundLabel('joi2023yo1c')).toBe('2023 第 3 回');
  });

  test('expects to handle invalid contest IDs gracefully', () => {
    const provider = new JOIFirstQualRoundProvider(ContestType.JOI);

    expect(provider.getContestRoundLabel('invalid-id')).toBe('INVALID-ID'); // See: getContestNameLabel() in src/lib/utils/contest.ts
    expect(provider.getContestRoundLabel('joi2024yo1d')).toBe('2024d'); // 'd' doesn't match valid round (a|b|c)
  });

  test('expects to generate correct table structure', () => {
    const provider = new JOIFirstQualRoundProvider(ContestType.JOI);
    const mockJOITasks = [
      { contest_id: 'joi2024yo1a', task_id: 'joi2024yo1a_a', task_table_index: 'A' },
      { contest_id: 'joi2024yo1a', task_id: 'joi2024yo1a_b', task_table_index: 'B' },
      { contest_id: 'joi2024yo1b', task_id: 'joi2024yo1b_a', task_table_index: 'A' },
      { contest_id: 'joi2024yo1c', task_id: 'joi2024yo1c_c', task_table_index: 'C' },
    ];

    const table = provider.generateTable(mockJOITasks as any);

    expect(table).toHaveProperty('joi2024yo1a');
    expect(table).toHaveProperty('joi2024yo1b');
    expect(table).toHaveProperty('joi2024yo1c');
    expect(table.joi2024yo1a).toHaveProperty('A');
    expect(table.joi2024yo1a).toHaveProperty('B');
    expect(table.joi2024yo1b).toHaveProperty('A');
    expect(table.joi2024yo1c).toHaveProperty('C');
  });

  test('expects to get contest round IDs correctly', () => {
    const provider = new JOIFirstQualRoundProvider(ContestType.JOI);
    const mockJOITasks = [
      { contest_id: 'joi2024yo1a', task_id: 'joi2024yo1a_a' },
      { contest_id: 'joi2024yo1b', task_id: 'joi2024yo1b_a' },
      { contest_id: 'joi2024yo1c', task_id: 'joi2024yo1c_a' },
      { contest_id: 'joi2023yo1a', task_id: 'joi2023yo1a_a' },
      { contest_id: 'joi2023yo1b', task_id: 'joi2023yo1b_a' },
      { contest_id: 'joi2023yo1c', task_id: 'joi2023yo1c_a' },
    ];

    const roundIds = provider.getContestRoundIds(mockJOITasks as any);

    expect(roundIds).toContain('joi2024yo1a');
    expect(roundIds).toContain('joi2024yo1b');
    expect(roundIds).toContain('joi2024yo1c');
    expect(roundIds).toContain('joi2023yo1a');
    expect(roundIds).toContain('joi2023yo1b');
    expect(roundIds).toContain('joi2023yo1c');
  });
});

describe('JOISecondQualRound2020OnwardsProvider', () => {
  test('expects to filter tasks to include only joi{YYYY}yo2 contests', () => {
    const provider = new JOISecondQualRound2020OnwardsProvider(ContestType.JOI);
    const mockJOITasks = [
      { contest_id: 'joi2024yo2', task_id: 'joi2024yo2_a' },
      { contest_id: 'joi2023yo2', task_id: 'joi2023yo2_b' },
      { contest_id: 'joi2022yo2', task_id: 'joi2022yo2_c' },
      { contest_id: 'joi2024yo1a', task_id: 'joi2024yo1a_a' },
      { contest_id: 'joi2024ho', task_id: 'joi2024ho_a' },
      { contest_id: 'joi2024yo', task_id: 'joi2024yo_a' },
      { contest_id: 'abc123', task_id: 'abc123_a' },
    ];

    const filtered = provider.filter(mockJOITasks as any);

    expect(filtered?.every((task) => task.contest_id.startsWith('joi'))).toBe(true);
    expect(filtered?.length).toBe(3);
    expect(filtered?.every((task) => task.contest_id.match(/joi\d{4}yo2/))).toBe(true);
  });

  test('expects to filter contests by year correctly', () => {
    const provider = new JOISecondQualRound2020OnwardsProvider(ContestType.JOI);
    const mockJOITasks = [
      { contest_id: 'joi2024yo2', task_id: 'joi2024yo2_a' },
      { contest_id: 'joi2024yo2', task_id: 'joi2024yo2_b' },
      { contest_id: 'joi2023yo2', task_id: 'joi2023yo2_a' },
      { contest_id: 'joi2022yo2', task_id: 'joi2022yo2_a' },
    ];

    const filtered = provider.filter(mockJOITasks as any);

    expect(filtered?.length).toBe(4);
    expect(filtered?.filter((task) => task.contest_id.includes('2024')).length).toBe(2);
    expect(filtered?.filter((task) => task.contest_id.includes('2023')).length).toBe(1);
    expect(filtered?.filter((task) => task.contest_id.includes('2022')).length).toBe(1);
  });

  test('expects to get correct metadata', () => {
    const provider = new JOISecondQualRound2020OnwardsProvider(ContestType.JOI);
    const metadata = provider.getMetadata();

    expect(metadata.title).toBe('JOI 二次予選');
    expect(metadata.abbreviationName).toBe('joiSecondQualRound2020Onwards');
  });

  test('expects to get correct display configuration', () => {
    const provider = new JOISecondQualRound2020OnwardsProvider(ContestType.JOI);
    const displayConfig = provider.getDisplayConfig();

    expect(displayConfig.isShownHeader).toBe(true);
    expect(displayConfig.isShownRoundLabel).toBe(true);
    expect(displayConfig.isShownTaskIndex).toBe(false);
    expect(displayConfig.roundLabelWidth).toBe('xl:w-28');
    expect(displayConfig.tableBodyCellsWidth).toBe(
      'w-1/2 xs:w-1/3 sm:w-1/4 md:w-1/5 lg:w-1/6 px-1 py-1',
    );
  });

  test('expects to get contest round label', () => {
    const provider = new JOISecondQualRound2020OnwardsProvider(ContestType.JOI);

    expect(provider.getContestRoundLabel('joi2024yo2')).toBe('2024');
    expect(provider.getContestRoundLabel('joi2023yo2')).toBe('2023');
  });

  test('expects to handle empty task results', () => {
    const provider = new JOISecondQualRound2020OnwardsProvider(ContestType.JOI);
    const filtered = provider.filter([] as any);

    expect(filtered).toEqual([]);
  });
});

describe('JOIQualRoundFrom2006To2019Provider', () => {
  test('expects to filter tasks to include only joi{YYYY}yo contests (without yo1/yo2)', () => {
    const provider = new JOIQualRoundFrom2006To2019Provider(ContestType.JOI);
    const mockJOITasks = [
      { contest_id: 'joi2019yo', task_id: 'joi2019yo_a' },
      { contest_id: 'joi2018yo', task_id: 'joi2018yo_b' },
      { contest_id: 'joi2017yo', task_id: 'joi2017yo_c' },
      { contest_id: 'joi2024yo1a', task_id: 'joi2024yo1a_a' },
      { contest_id: 'joi2024yo2', task_id: 'joi2024yo2_a' },
      { contest_id: 'joi2024ho', task_id: 'joi2024ho_a' },
      { contest_id: 'abc123', task_id: 'abc123_a' },
    ];

    const filtered = provider.filter(mockJOITasks as any);

    expect(filtered?.every((task) => task.contest_id.startsWith('joi'))).toBe(true);
    expect(filtered?.length).toBe(3);
    expect(filtered?.every((task) => task.contest_id.match(/^joi\d{4}yo$/))).toBe(true);
  });

  test('expects to exclude yo1/yo2 variants', () => {
    const provider = new JOIQualRoundFrom2006To2019Provider(ContestType.JOI);
    const mockJOITasks = [
      { contest_id: 'joi2019yo', task_id: 'joi2019yo_a' },
      { contest_id: 'joi2024yo1a', task_id: 'joi2024yo1a_a' },
      { contest_id: 'joi2024yo2', task_id: 'joi2024yo2_a' },
    ];

    const filtered = provider.filter(mockJOITasks as any);

    expect(filtered?.length).toBe(1);
    expect(filtered?.[0].contest_id).toBe('joi2019yo');
  });

  test('expects to get correct metadata', () => {
    const provider = new JOIQualRoundFrom2006To2019Provider(ContestType.JOI);
    const metadata = provider.getMetadata();

    expect(metadata.title).toBe('JOI 予選（旧形式）');
    expect(metadata.abbreviationName).toBe('joiQualRoundFrom2006To2019');
  });

  test('expects to get correct display configuration', () => {
    const provider = new JOIQualRoundFrom2006To2019Provider(ContestType.JOI);
    const displayConfig = provider.getDisplayConfig();

    expect(displayConfig.isShownHeader).toBe(true);
    expect(displayConfig.isShownRoundLabel).toBe(true);
    expect(displayConfig.isShownTaskIndex).toBe(false);
    expect(displayConfig.roundLabelWidth).toBe('xl:w-28');
    expect(displayConfig.tableBodyCellsWidth).toBe(
      'w-1/2 xs:w-1/3 sm:w-1/4 md:w-1/5 lg:w-1/6 px-1 py-1',
    );
  });

  test('expects to get contest round label', () => {
    const provider = new JOIQualRoundFrom2006To2019Provider(ContestType.JOI);

    expect(provider.getContestRoundLabel('joi2019yo')).toBe('2019');
    expect(provider.getContestRoundLabel('joi2018yo')).toBe('2018');
  });

  test('expects to handle empty task results', () => {
    const provider = new JOIQualRoundFrom2006To2019Provider(ContestType.JOI);
    const filtered = provider.filter([] as any);

    expect(filtered).toEqual([]);
  });
});

describe('JOISemiFinalRoundProvider', () => {
  test('expects to filter tasks to include only joi{YYYY}ho contests', () => {
    const provider = new JOISemiFinalRoundProvider(ContestType.JOI);
    const mockJOITasks = [
      { contest_id: 'joi2024ho', task_id: 'joi2024ho_a' },
      { contest_id: 'joi2023ho', task_id: 'joi2023ho_b' },
      { contest_id: 'joi2022ho', task_id: 'joi2022ho_c' },
      { contest_id: 'joi2024yo1a', task_id: 'joi2024yo1a_a' },
      { contest_id: 'joi2024yo2', task_id: 'joi2024yo2_a' },
      { contest_id: 'joi2024yo', task_id: 'joi2024yo_a' },
      { contest_id: 'abc123', task_id: 'abc123_a' },
    ];

    const filtered = provider.filter(mockJOITasks as any);

    expect(filtered?.every((task) => task.contest_id.startsWith('joi'))).toBe(true);
    expect(filtered?.length).toBe(3);
    expect(filtered?.every((task) => task.contest_id.match(/joi\d{4}ho/))).toBe(true);
  });

  test('expects to filter contests by year correctly', () => {
    const provider = new JOISemiFinalRoundProvider(ContestType.JOI);
    const mockJOITasks = [
      { contest_id: 'joi2024ho', task_id: 'joi2024ho_a' },
      { contest_id: 'joi2024ho', task_id: 'joi2024ho_b' },
      { contest_id: 'joi2023ho', task_id: 'joi2023ho_a' },
      { contest_id: 'joi2022ho', task_id: 'joi2022ho_a' },
    ];

    const filtered = provider.filter(mockJOITasks as any);

    expect(filtered?.length).toBe(4);
    expect(filtered?.filter((task) => task.contest_id.includes('2024')).length).toBe(2);
    expect(filtered?.filter((task) => task.contest_id.includes('2023')).length).toBe(1);
    expect(filtered?.filter((task) => task.contest_id.includes('2022')).length).toBe(1);
  });

  test('expects to get correct metadata', () => {
    const provider = new JOISemiFinalRoundProvider(ContestType.JOI);
    const metadata = provider.getMetadata();

    expect(metadata.title).toBe('JOI 本選');
    expect(metadata.abbreviationName).toBe('joiSemiFinalRound');
  });

  test('expects to get correct display configuration', () => {
    const provider = new JOISemiFinalRoundProvider(ContestType.JOI);
    const displayConfig = provider.getDisplayConfig();

    expect(displayConfig.isShownHeader).toBe(true);
    expect(displayConfig.isShownRoundLabel).toBe(true);
    expect(displayConfig.isShownTaskIndex).toBe(false);
    expect(displayConfig.roundLabelWidth).toBe('xl:w-28');
    expect(displayConfig.tableBodyCellsWidth).toBe('w-1/2 xs:w-1/3 sm:w-1/4 md:w-1/5 px-1 py-1');
  });

  test('expects to get contest round label', () => {
    const provider = new JOISemiFinalRoundProvider(ContestType.JOI);

    expect(provider.getContestRoundLabel('joi2024ho')).toBe('2024');
    expect(provider.getContestRoundLabel('joi2023ho')).toBe('2023');
  });

  test('expects to handle empty task results', () => {
    const provider = new JOISemiFinalRoundProvider(ContestType.JOI);
    const filtered = provider.filter([] as any);

    expect(filtered).toEqual([]);
  });
});
