import '@testing-library/jest-dom';
import { getTasks } from './services/problemsApiService';
import { test } from 'vitest';

test('call problems api', () => {
  getTasks();
});
