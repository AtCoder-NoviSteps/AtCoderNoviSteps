# Mutation-Based Test Verification

Mutate the production source, never the test. A test's worth is what it detects, not how many cases it enumerates.

## Mutants

Apply 3–4, one at a time, restoring before the next.

| Mutant                               | Detects                               |
| ------------------------------------ | ------------------------------------- |
| Remove one entry from a lookup table | Registry exhaustiveness               |
| Swap two values that encode an order | The ordering contract                 |
| Make the function return a constant  | That the function is exercised at all |
| Invert one guard clause              | Boundary handling                     |

**Mutants must preserve the original type.** A `0.5` mutant for an integer field is caught by a type check (`Number.isInteger`), not by the assertion being measured — a false positive about the test's strength.

## Procedure

```bash
cp <source> /tmp/source.bak                      # 1. save
perl -0777 -pi -e 's/<pattern>/<mutant>/' <source>  # 2. mutate
pnpm exec vitest run <test-file> --reporter=verbose  # 3. run
cp /tmp/source.bak <source> && git diff <source>     # 4. restore, then verify
```

Repeat per mutant. Step 4 is not optional — an unrestored mutant silently poisons every later measurement.

## Reading results

Read stdout from `--reporter=default` / `--reporter=verbose`. **Never read a cached JSON report** (`.vitest/json/output.json`) — under a CLI wrapper it may not be rewritten, leaving a stale file from a previous run that reports the mutant as undetected.

## Interpreting

- **A mutant nothing catches** — a missing test. Write it.
- **A test catching nothing that other tests miss** — a deletion candidate. Confirm by re-running the full mutant set without it.
- **N tests failing on one mutant** — not N times the value. Parameterized cases over one fixture usually report the same fact N times; the count is a proxy, not evidence.

Record the matrix in the commit message or `plan.md` when it justifies removing tests — it is the evidence `.claude/rules/testing.md` requires for a deliberate test-count drop.
