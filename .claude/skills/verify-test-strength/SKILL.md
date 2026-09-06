---
name: verify-test-strength
description: Prove what a test file actually detects by mutating the production source. Use when a test file's value is in doubt — after writing tests for existing behavior, before deleting or compressing tests, or when reviewing a large test file that may be tautological.
argument-hint: '[test-file-path]'
---

Measure the detection power of the tests for: $ARGUMENTS

1. **Baseline** — run the target test file; record the pass count
2. **Mutate** — apply the mutants in [instructions.md](instructions.md) one at a time, restoring after each; record which test names fail
3. **Report** — a mutant × detecting-test matrix; name the missing tests and the deletion candidates
