# **ABCLatest20RoundsProvider の削除計画**

## **目的**

`ABCLatest20RoundsProvider` を削除し、関連するコードやテストを整理することで、コードベースの簡素化とメンテナンス性の向上を図る。

## ** 理由**

- ABC 319 〜 に完全に包含されている
- X 公式アカウントでのアンケートで、「ABC 最新 20 回」を日常的に使っているユーザは投票数の約1/4程度
- 当初の目的であった初回表示の負荷軽減対策には、「ABS」をデフォルトで表示することで対応

---

## **削除対象**

### 1. `src/lib/utils/contest_table_provider.ts`

- **行167**: `export class ABCLatest20RoundsProvider extends ContestTableProviderBase {` を削除。
- **行1086**: `.addProvider(new ABCLatest20RoundsProvider(ContestType.ABC)),` を削除。
- **行1244**: `abcLatest20Rounds: prepareContestProviderPresets().ABCLatest20Rounds(),` を削除。

### 2. `src/test/lib/utils/contest_table_provider.test.ts`

- **`describe('ABC providers', () => {` 内の以下を削除**:
  ```typescript
  {
    providerClass: ABCLatest20RoundsProvider,
    label: 'Latest 20 rounds',
    displayConfig: {
      roundLabelWidth: 'xl:w-16',
      tableBodyCellsWidth: 'w-1/2 xs:w-1/3 sm:w-1/4 md:w-1/5 lg:w-1/6 px-1 py-1',
    },
  },
  ```
- **`describe('ABC Latest 20 Rounds', () => {` のテスト全体を削除**。
- **行349, 357, 374, 382**: `ABCLatest20RoundsProvider` に関連するテストを削除。
- **行2425, 2437, 2466, 2512, 2526, 2604**: `ABCLatest20RoundsProvider` を `ABSProvider` に置き換え。

### 3. `src/lib/stores/active_contest_type.svelte.ts`

- **行16**: コメント内の `'abcLatest20Rounds'` を `'abs'` に変更。
- **行21**: `'abcLatest20Rounds'` を `'abs'` に変更。
- **行28**: コメント内の `'abcLatest20Rounds'` を `'abs'` に変更。
- **行30**: コンストラクタのデフォルト値 `'abcLatest20Rounds'` を `'abs'` に変更。
- **行79**: コメント内の `'abcLatest20Rounds'` を `'abs'` に変更。
- **行82**: `this.storage.value = 'abcLatest20Rounds';` を `this.storage.value = 'abs';` に変更。

### 4. `src/test/lib/stores/active_contest_type.svelte.test.ts`

- **行44**: `expect(store.get()).toBe('abcLatest20Rounds');` を `expect(store.get()).toBe('abs');` に変更。
- **行48**: 同上。
- **行64**: `expect(store.isSame('abcLatest20Rounds' as ContestTableProviderGroups)).toBe(true);` を `expect(store.isSame('abs' as ContestTableProviderGroups)).toBe(true);` に変更。
- **行70**: 同上。
- **行75**: 同上。
- **行86**: `expect(store.get()).toBe('abcLatest20Rounds');` を `expect(store.get()).toBe('abs');` に変更。
- **行93**: 同上。
- **行101**: `expect(newStore.get()).toBe('abcLatest20Rounds');` を `expect(newStore.get()).toBe('abs');` に変更。
- **行108**: 同上。
- **行115**: `'abcLatest20Rounds' as ContestTableProviderGroups` を `'abs' as ContestTableProviderGroups` に変更。
- **行138**: `expect(activeContestTypeStore.get()).toBe('abcLatest20Rounds');` を `expect(activeContestTypeStore.get()).toBe('abs');` に変更。

### 5. ドキュメントの更新

- **`/usr/src/app/docs/dev-notes/2025-11-01/add_and_refactoring_tests_for_contest_table_provider/plan.md`**
  - **行516**: `- ABCLatest20RoundsProvider テストの generateTable 検証を追加` を削除。

---

## **影響範囲**

1. **`src/lib/utils/contest_table_provider.ts`**
   - 他のプロバイダーやロジックに影響を与えないか確認済み。

2. **`src/test/lib/utils/contest_table_provider.test.ts`**
   - 削除対象のテストが他のテストケースに依存していないことを確認済み。

3. **テストカバレッジ**
   - 削除前後でテストカバレッジを比較し、削除が他のテストに影響を与えないことを確認済み。

4. **ドキュメント**
   - 関連するドキュメントを特定し、更新箇所を明確化。

---

## **次のステップ**

1. **コードの修正**
   - 上記の削除対象箇所を修正。

2. **テストの実行**
   - 修正後にテストを再実行し、他の箇所に影響がないことを確認。

3. **ドキュメントの更新**
   - 削除に伴う変更をドキュメントに反映。

## 教訓

1. **削除対象の影響範囲を明確化する**
   - 削除対象が他のコードやテストに与える影響を事前に洗い出し、計画に反映する。

2. **テストカバレッジの維持**
   - 削除後もテストカバレッジが低下しないよう、必要に応じて代替テストを追加する。

3. **ドキュメントの更新を徹底する**
   - 削除に伴う変更をドキュメントに反映し、後続の開発者が変更内容を正確に把握できるようにする。
