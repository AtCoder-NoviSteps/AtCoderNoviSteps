import { describe, test, expect } from 'vitest';

import { ContestType } from '$lib/types/contest';
import type { TaskResults } from '$lib/types/task';

import { ACLPracticeProvider, ACLBeginnerProvider, ACLProvider } from './acl_providers';
import {
  taskResultsForACLPracticeProvider,
  taskResultsForACLBeginnerProvider,
  taskResultsForACLProvider,
  taskResultsForContestTableProvider,
} from '$features/tasks/fixtures/contest-table/contest_table_provider';

describe('ACLPracticeProvider', () => {
  test('expects to filter tasks with contest_id "practice2"', () => {
    const provider = new ACLPracticeProvider(ContestType.ACL_PRACTICE);
    const mixed = [
      { contest_id: 'practice2', task_id: 'practice2_a', task_table_index: 'A' },
      { contest_id: 'practice2', task_id: 'practice2_l', task_table_index: 'L' },
      { contest_id: 'dp', task_id: 'dp_a', task_table_index: 'A' },
      { contest_id: 'abc123', task_id: 'abc123_a', task_table_index: 'A' },
    ] as TaskResults;

    const filtered = provider.filter(mixed);

    expect(filtered).toHaveLength(2);
    expect(filtered.every((task) => task.contest_id === 'practice2')).toBe(true);
  });

  test('expects to filter only ACL_PRACTICE-type contests', () => {
    const provider = new ACLPracticeProvider(ContestType.ACL_PRACTICE);
    const mixed = [
      { contest_id: 'practice2', task_id: 'practice2_a', task_table_index: 'A' },
      { contest_id: 'dp', task_id: 'dp_a', task_table_index: 'A' },
      { contest_id: 'abc378', task_id: 'abc378_a', task_table_index: 'A' },
    ] as TaskResults;

    const filtered = provider.filter(mixed);

    expect(filtered).toHaveLength(1);
    expect(filtered[0].contest_id).toBe('practice2');
  });

  test('expects to return correct metadata', () => {
    const provider = new ACLPracticeProvider(ContestType.ACL_PRACTICE);
    const metadata = provider.getMetadata();

    expect(metadata.title).toBe('AtCoder Library Practice Contest');
    expect(metadata.abbreviationName).toBe('aclPractice');
  });

  test('expects to return correct display config with ACL Practice-specific settings', () => {
    const provider = new ACLPracticeProvider(ContestType.ACL_PRACTICE);
    const config = provider.getDisplayConfig();

    expect(config.isShownHeader).toBe(false);
    expect(config.isShownRoundLabel).toBe(false);
    expect(config.isShownTaskIndex).toBe(true);
    expect(config.tableBodyCellsWidth).toBe(
      'w-1/2 xs:w-1/3 sm:w-1/4 md:w-1/5 lg:w-1/6 2xl:w-1/7 px-1 py-2',
    );
    expect(config.roundLabelWidth).toBe('');
  });

  test('expects to return empty string for contest round label', () => {
    const provider = new ACLPracticeProvider(ContestType.ACL_PRACTICE);

    expect(provider.getContestRoundLabel('practice2')).toBe('');
  });

  test('expects test data to have 12 tasks with correct properties', () => {
    expect(taskResultsForACLPracticeProvider).toHaveLength(12);
    expect(taskResultsForACLPracticeProvider.every((task) => task.contest_id === 'practice2')).toBe(
      true,
    );

    const expectedIndices = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'];
    const actualIndices = taskResultsForACLPracticeProvider.map((task) => task.task_table_index);

    expect(actualIndices).toEqual(expectedIndices);
  });

  test('expects to filter test data correctly', () => {
    const provider = new ACLPracticeProvider(ContestType.ACL_PRACTICE);
    const allTasks: TaskResults = [
      ...taskResultsForACLPracticeProvider,
      ...taskResultsForContestTableProvider,
    ];

    const filtered = provider.filter(allTasks);

    expect(filtered).toHaveLength(12);
    expect(filtered).toEqual(taskResultsForACLPracticeProvider);
  });

  test('expects to handle empty task results', () => {
    const provider = new ACLPracticeProvider(ContestType.ACL_PRACTICE);
    const filtered = provider.filter([] as TaskResults);

    expect(filtered).toEqual([] as TaskResults);
  });
});

describe('ACLBeginnerProvider', () => {
  test('filters tasks by contest_id (abl)', () => {
    const provider = new ACLBeginnerProvider(ContestType.ABC_LIKE);
    const filtered = provider.filter(taskResultsForACLBeginnerProvider);

    expect(filtered).toBeDefined();
    expect(filtered?.length).toBe(3);
    expect(filtered?.every((task) => task.contest_id === 'abl')).toBe(true);
  });

  test('returns correct metadata', () => {
    const provider = new ACLBeginnerProvider(ContestType.ABC_LIKE);
    const metadata = provider.getMetadata();

    expect(metadata.title).toBe('ACL Beginner Contest');
    expect(metadata.abbreviationName).toBe('ABL');
  });

  test('returns correct display config', () => {
    const provider = new ACLBeginnerProvider(ContestType.ABC_LIKE);
    const config = provider.getDisplayConfig();

    expect(config.isShownHeader).toBe(false);
    expect(config.isShownRoundLabel).toBe(false);
    expect(config.isShownTaskIndex).toBe(true);
    expect(config.tableBodyCellsWidth).toBe('w-1/2 xs:w-1/3 sm:w-1/4 md:w-1/5 lg:w-1/6 px-1 py-2');
  });

  test('getContestRoundLabel returns empty string', () => {
    const provider = new ACLBeginnerProvider(ContestType.ABC_LIKE);
    const label = provider.getContestRoundLabel('abl_a');

    expect(label).toBe('');
  });

  test('generates correct table structure', () => {
    const provider = new ACLBeginnerProvider(ContestType.ABC_LIKE);
    const filtered = provider.filter(taskResultsForACLBeginnerProvider);
    const table = provider.generateTable(filtered!);

    expect(table).toBeDefined();
    expect(table).not.toBeNull();
  });

  test('does not include tasks with different contest_id', () => {
    const provider = new ACLBeginnerProvider(ContestType.ABC_LIKE);
    const allTasks = [...taskResultsForACLBeginnerProvider, ...taskResultsForACLProvider];
    const filtered = provider.filter(allTasks);

    expect(filtered?.every((task) => task.contest_id === 'abl')).toBe(true);
  });
});

describe('ACLProvider', () => {
  test('filters tasks by contest_id (acl1)', () => {
    const provider = new ACLProvider(ContestType.ARC_LIKE);
    const filtered = provider.filter(taskResultsForACLProvider);

    expect(filtered).toBeDefined();
    expect(filtered?.length).toBe(6);
    expect(filtered?.every((t) => t.contest_id === 'acl1')).toBe(true);
  });

  test('returns correct metadata', () => {
    const provider = new ACLProvider(ContestType.ARC_LIKE);
    const metadata = provider.getMetadata();

    expect(metadata.title).toBe('ACL Contest 1');
    expect(metadata.abbreviationName).toBe('ACL');
  });

  test('returns correct display config', () => {
    const provider = new ACLProvider(ContestType.ARC_LIKE);
    const config = provider.getDisplayConfig();

    expect(config.isShownHeader).toBe(false);
    expect(config.isShownRoundLabel).toBe(false);
    expect(config.isShownTaskIndex).toBe(true);
    expect(config.tableBodyCellsWidth).toBe('w-1/2 xs:w-1/3 sm:w-1/4 md:w-1/5 lg:w-1/6 px-1 py-2');
  });

  test('getContestRoundLabel returns empty string', () => {
    const provider = new ACLProvider(ContestType.ARC_LIKE);
    const label = provider.getContestRoundLabel('acl1_a');

    expect(label).toBe('');
  });

  test('generates correct table structure', () => {
    const provider = new ACLProvider(ContestType.ARC_LIKE);
    const filtered = provider.filter(taskResultsForACLProvider);
    const table = provider.generateTable(filtered!);

    expect(table).toBeDefined();
    expect(table).not.toBeNull();
  });

  test('does not include tasks with different contest_id', () => {
    const provider = new ACLProvider(ContestType.ARC_LIKE);
    const allTasks = [...taskResultsForACLBeginnerProvider, ...taskResultsForACLProvider];
    const filtered = provider.filter(allTasks);

    expect(filtered?.every((task) => task.contest_id === 'acl1')).toBe(true);
  });
});
