---
description: Testing rules and patterns
globs:
  - '**/*.test.ts'
  - '**/*.spec.ts'
  - 'tests/**'
  - 'src/test/**'
---

# Testing

## Test Types

| Type        | Tool       | Location                | Run Command             |
| ----------- | ---------- | ----------------------- | ----------------------- |
| Unit        | Vitest     | `src/test/**/*.test.ts` | `pnpm test:unit`        |
| Integration | Vitest     | `src/test/`             | `pnpm test:unit`        |
| E2E         | Playwright | `tests/*.test.ts`       | `pnpm test:integration` |

## Unit Tests

- Place tests in `src/test/` mirroring `src/lib/` structure
- Use `@quramy/prisma-fabbrica` for test data factories
- Mock external APIs with Nock

## E2E Tests

- Place in `tests/` directory
- Use Playwright test utilities
- Test user flows, not implementation details

## Patterns

```typescript
import { describe, test, expect, vi } from 'vitest';

describe('functionName', () => {
  test('expects to do something', () => {
    // Arrange
    // Act
    // Assert
  });
});
```

## Coverage

- Run `pnpm coverage` for coverage report
- Target: 80% lines, 70% branches

## HTTP Mocking

- Use Nock for mocking external HTTP calls
- See `src/test/lib/clients/` for examples
