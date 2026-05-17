# AOJ fixture を raw API 形式に修正

## 概要

`record_requests.ts` が変換済みデータ（`ContestsForImport`）を fixture に保存していたため、
nock で raw API 形式を期待する `clients.test.ts` が 11/15 失敗している。
`record_requests.ts` を raw API レスポンスを直接保存する形に書き換え、
nock → client 変換 → アサート の流れを正しく成立させる。

## Task 1: `record_requests.ts` を rewrite

**ファイル**: `src/lib/clients/fixtures/record_requests.ts`

### 削除

- `clients` 配列（`TasksApiClient` ベースの設計）
- `saveContests`, `saveTasks`, `validateContestSiteApi`, `bindChallenge`
- `startRecordRequests`, `stopRecordRequests`（nock recorder 不要）

### 変更後の保存ロジック

`HttpRequestClient.fetchApiWithConfig<RawType>()` で raw API を直接取得して保存する。

```
AOJ courses:
  GET /courses               → AOJCourseAPI (そのまま)       → aizu_online_judge/courses/contests.json
  GET /problems?size=10000   → AOJTaskAPIs (100 件サンプル) → aizu_online_judge/courses/tasks.json

AOJ challenges (4 種):
  GET /challenges/cl/PCK/PRELIM   → AOJChallengeContestAPI → challenges/pck_prelim/contests.json
  GET /challenges/cl/PCK/FINAL    → AOJChallengeContestAPI → challenges/pck_final/contests.json
  GET /challenges/cl/JAG/PRELIM   → AOJChallengeContestAPI → challenges/jag_prelim/contests.json
  GET /challenges/cl/JAG/REGIONAL → AOJChallengeContestAPI → challenges/jag_regional/contests.json
  ※ tasks.json は生成しない（tasks は contests レスポンスに埋め込み済み）
  ※ contests 配列を 100 件サンプル、largeCl ラッパーは保持:
      { ...raw, contests: getRandomElementsFromArray(raw.contests, 100) }
```

AtCoder は `AtCoderProblemsApiClient` をそのまま使用
（raw API = `ContestsForImport` 形式であり変換なし）。

`getRandomElementsFromArray`, `toJson`, `ensureDirectoryExists` は残す。

### 追加インポート

```typescript
import type {
  AOJCourseAPI,
  AOJTaskAPIs,
  AOJChallengeContestAPI,
} from '$lib/clients/aizu_online_judge/types';
```

## Task 2: `AojChallengesApiClient` にコメントを追加

**ファイル**: `src/lib/clients/aizu_online_judge/clients.ts`

challenges が1エンドポイントで contests と tasks 両方を返す（`days[].problems` 埋め込み）ことは
非自明なので、クラス定義の直前にコメントを追加する。→ **実装済み**

## Task 3: `clients.test.ts` の未使用パスを削除

**ファイル**: `src/lib/clients/aizu_online_judge/clients.test.ts`

`FIXTURE_PATHS` の challenge 各エントリから未参照の `tasks` キーを削除する。

```typescript
// 変更前
pckPrelim: { contests: '...', tasks: '...' }

// 変更後
pckPrelim: { contests: '...' }
```

対象: `pckPrelim`, `pckFinal`, `jagPrelim`, `jagRegional`

## Task 3: fixture 再生成

```bash
pnpm dlx vite-node ./src/lib/clients/fixtures/record_requests.ts
```

生成される raw fixture:

- `courses/contests.json` → `{ filter: string, courses: Course[] }`
- `courses/tasks.json` → `AOJTaskAPI[]`
- `challenges/*/contests.json` → `{ largeCl, contests: ChallengeContest[] }`

## Task 4: テスト検証

```bash
pnpm test:unit
```

全テストがグリーンになることを確認。
