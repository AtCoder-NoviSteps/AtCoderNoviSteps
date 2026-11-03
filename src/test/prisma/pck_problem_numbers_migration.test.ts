import { afterEach, describe, expect, test } from 'vitest';
import { DatabaseSync } from 'node:sqlite';
import { randomUUID } from 'node:crypto';
import { readFileSync } from 'node:fs';

const migration = readFileSync(
  'prisma/migrations/20261103173000_normalize_pck_problem_numbers/migration.sql',
  'utf8',
);
const databases: DatabaseSync[] = [];

// Exercise the portable UPSERT against an isolated database without touching development data.
function createDatabase(): DatabaseSync {
  const database = new DatabaseSync(':memory:');
  database.function('gen_random_uuid', () => randomUUID());
  database.exec(`
    CREATE TABLE task (
      id TEXT PRIMARY KEY,
      contest_type TEXT NOT NULL,
      contest_id TEXT NOT NULL,
      task_id TEXT UNIQUE NOT NULL,
      task_table_index TEXT NOT NULL,
      title TEXT NOT NULL,
      grade TEXT NOT NULL DEFAULT 'PENDING',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
    CREATE TABLE answer (task_id TEXT REFERENCES task(id), status TEXT);
  `);
  databases.push(database);
  return database;
}

afterEach(() => {
  for (const database of databases.splice(0)) {
    database.close();
  }
});

describe('PCK problem number migration', () => {
  test('adds all PCK tasks to an empty database without requiring a reseed', () => {
    const database = createDatabase();
    database.exec(migration);

    expect(database.prepare('SELECT count(*) AS count FROM task').get()?.count).toBe(581);
    expect(
      database.prepare("SELECT task_table_index, title FROM task WHERE task_id = '4086'").get(),
    ).toMatchObject({ task_table_index: '3', title: 'Chessboard Distance' });
    expect(
      database.prepare("SELECT task_table_index FROM task WHERE task_id = '0098'").get(),
    ).toMatchObject({ task_table_index: '29' });
  });

  test('preserves existing ids, grades, titles, and answers when updating an index', () => {
    const database = createDatabase();
    database.exec(`
      INSERT INTO task VALUES ('existing', 'AOJ_PCK', 'PCKPrelim2026', '4086', '4086', 'Existing title', 'Q7', '2020-01-01', '2020-01-01');
      INSERT INTO answer VALUES ('existing', 'AC');
    `);
    database.exec(migration);

    expect(
      database
        .prepare("SELECT id, task_table_index, grade, title FROM task WHERE task_id = '4086'")
        .get(),
    ).toMatchObject({
      id: 'existing',
      task_table_index: '3',
      grade: 'Q7',
      title: 'Existing title',
    });
    expect(database.prepare('SELECT task_id, status FROM answer').all()).toEqual([
      expect.objectContaining({ task_id: 'existing', status: 'AC' }),
    ]);
  });

  test('does not overwrite a conflicting task from another contest or contest type', () => {
    const database = createDatabase();
    database.exec(`
      INSERT INTO task VALUES ('other-type', 'AOJ_COURSES', 'ITP1', '4084', 'A', 'Other type', 'Q11', '2020-01-01', '2020-01-01');
      INSERT INTO task VALUES ('other-contest', 'AOJ_PCK', 'PCKPrelim2025', '4085', 'B', 'Other contest', 'Q10', '2020-01-01', '2020-01-01');
    `);
    const before = database
      .prepare("SELECT * FROM task WHERE task_id IN ('4084', '4085') ORDER BY task_id")
      .all();
    database.exec(migration);

    expect(
      database
        .prepare("SELECT * FROM task WHERE task_id IN ('4084', '4085') ORDER BY task_id")
        .all(),
    ).toEqual(before);
  });

  test('leaves all rows unchanged when run a second time', () => {
    const database = createDatabase();
    database.exec(migration);
    const before = database.prepare('SELECT * FROM task ORDER BY task_id').all();
    database.exec(migration);

    expect(database.prepare('SELECT * FROM task ORDER BY task_id').all()).toEqual(before);
  });
});
