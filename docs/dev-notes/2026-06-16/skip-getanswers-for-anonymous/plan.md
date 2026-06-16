# getAnswers(undefined) 全行スキャン除去

## 背景と結論

匿名ユーザーが `/problems` を開くと、[problems/+page.server.ts:57](src/routes/problems/+page.server.ts#L57) が
`getTaskResults(session?.user.userId)` に `undefined` を渡す。内部の
[createTaskResults](src/lib/services/task_results.ts#L218) が **`isLoggedIn` 判定の前に**
`getAnswers(undefined)` を無条件で呼ぶ（line 219 が line 220 より先）。

`getAnswers` は [answers.ts:9-21](src/lib/services/answers.ts#L9) で
`where: { user_id: undefined }` を Prisma に渡す。Prisma は `undefined` を WHERE 句から
除外するため、フィルタが無視され **`taskAnswer` テーブルを全件 SELECT** する。
`isLoggedIn = userId !== undefined` ガードが結果の使用を防ぐためデータ漏洩はないが、
不要な全行スキャンが毎回発生し、Vercel Function Duration を押し上げる。

Phase 3 の CDN キャッシュにより匿名ヒット時は関数自体が起動しないが、キャッシュミス時
（初回・TTL 失効後）には発生し続ける。これを根絶する。

同じアンチパターンが [getTaskResultsOnlyResultExists](src/lib/services/task_results.ts#L137)
（line 137 で無条件 `getAnswers(userId)`）にも存在する。現状は workbooks load が匿名で
早期 return するため実害ゼロだが、ガードが外れた瞬間に同じ全行スキャンが再発する潜在バグ
なので、今回まとめて防御的に修正する。

参考: [getTaskResultsByTaskId](src/lib/services/task_results.ts#L182) は既に
`userId ? ... : []` で正しくガード済み（修正不要・パターンの手本）。

## 設計の根拠（確定済み）

1. ガード位置: **`createTaskResults` 内**（`getAnswers` 自体の契約は変えない。
   既存 `getAnswersWithSelectedTaskIds` の「呼び出し側でガード」パターンと一貫）
2. スコープ: `getTaskResultsOnlyResultExists` も**防御的に修正**
3. 型: `userId` を **`string | undefined` に正直化**（現状 `userId !== undefined` 判定と
   `userId: string` 型が矛盾している＝型が嘘をついている）

### 却下した代替案

- `getAnswers` 内ガード → 低レベル CRUD が undefined を黙って受理し他バグを隠す懸念
- 呼び出し側（+page.server.ts）早期 return → problems は匿名でも一覧描画するため表示影響の
  確認が必要で、対象経路を網羅できない

## フェーズ

単一レイヤー（services）・小規模のため 1 フェーズ。

### Phase 1: createTaskResults / getTaskResultsOnlyResultExists の匿名ガード

#### 変更対象: [src/lib/services/task_results.ts](src/lib/services/task_results.ts)

**`createTaskResults`（line 218-226）** — `getAnswers` 呼び出しを `isLoggedIn` でガード:

```typescript
async function createTaskResults(tasks: Tasks, userId: string | undefined): Promise<TaskResults> {
  const isLoggedIn = userId !== undefined;
  // Skip the DB round-trip for anonymous users: getAnswers(undefined) drops the
  // WHERE filter and full-scans taskAnswer.
  const answers = isLoggedIn ? await answer_crud.getAnswers(userId) : new Map();

  return tasks.map((task: Task) => {
    const answer = isLoggedIn ? answers.get(task.task_id) : null;
    return mergeTaskAndAnswer(task, userId, answer);
  });
}
```

**`getTaskResults`（line 35）** — 型を正直化（`userId: string` → `userId: string | undefined`）。
本体ロジックは不変。

**`getTaskResultsOnlyResultExists`（line 129-161）** — line 137 を同様にガード:

```typescript
const tasks = await getTasks();
const answers = userId !== undefined ? await answer_crud.getAnswers(userId) : new Map();
```

注: 型は `userId: string | undefined` に広げる。`with_map` 分岐や `tasksHasAnswer`
フィルタは空 Map でそのまま正しく「該当なし」に評価されるため、後続ロジックは不変。

#### 呼び出し側の型確認（変更最小）

- [problems/+page.server.ts:57](src/routes/problems/+page.server.ts#L57),
  [:46](src/routes/problems/+page.server.ts#L46) — 既に `session?.user.userId`
  （`string | undefined`）を渡しており、型を広げる方向なので**変更不要**。
- [workbooks/+page.server.ts:92](src/routes/workbooks/+page.server.ts#L92) — `loggedInUser.id`
  （`string`）を渡す。広げた型に対し代入互換なので**変更不要**。
- `mergeTaskAndAnswer` / `createDefaultTaskResult` の `userId` 引数も `string | undefined` を
  受けられるか確認。`pnpm check` で検出する。

## テスト（TDD: 先に書く）

ファイル: [src/test/lib/services/task_results.test.ts](src/test/lib/services/task_results.test.ts)

`getAnswers` は既に `vi.mock('$lib/services/answers', ...)`（line 321）でモック済み。
spy 参照のため `import { getAnswers } from '$lib/services/answers'` を追加し、`beforeEach` で
モックをリセットする。

追加するケース:

1. `describe('getTaskResults')` 配下、`describe('when anonymous (userId is undefined)')`:
   - `test('does not call getAnswers')` → `getTaskResults(undefined)` 後に
     `expect(getAnswers).not.toHaveBeenCalled()`
   - `test('returns default (未挑戦) results for all tasks')` → 全 `taskResult.is_ac === false`,
     `status_name === 'ns'`（既存「no answers」ケースのアサーション流用）
2. `getTaskResultsOnlyResultExists` のテストが既存にあれば同様に
   `test('does not call getAnswers when userId is undefined')` を追加。無ければ最小の
   describe を新設し、`getTasks` モックありで `getTaskResultsOnlyResultExists(undefined, false)`
   が空配列を返し `getAnswers` 未呼び出しであることをアサート。

既存の `getTaskResults('user_123')` 系テスト（ログイン時）はガード追加後も
`isLoggedIn === true` 経路を通るため不変で PASS する想定。

## 検証

```bash
pnpm test:unit   # 追加テスト含め task_results 関連が PASS
pnpm check       # 型の正直化（string | undefined）で型エラーが出ないこと
pnpm lint
```

手動確認（任意）: ローカル DB に対し匿名で `/problems` をロードし、Prisma クエリログに
`taskAnswer` の `findMany`（WHERE なし全件）が出ないことを確認。

## 完了後

このバグは [sveltekit-caching/plan.md](docs/dev-notes/2026-06-13/sveltekit-caching/plan.md#L95)
の Phase 3 残タスク。修正完了後、同 plan の該当チェックボックスを `[x]` に更新する。
小規模バグ修正のため refactor cycle / session-close は対象外（AGENTS.md のホットフィックス扱い）。
