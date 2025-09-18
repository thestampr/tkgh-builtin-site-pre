import { describe, it, expect } from 'vitest';
import { formatPrice } from './formatting';

describe('formatPrice', () => {
  it('formats number to THB currency', () => {
    expect(formatPrice(2599, 'th-TH')).toMatch(/2,599/);
  });
  it('blank for null/undefined', () => {
    expect(formatPrice(undefined as any, 'en')).toBe('');
  });
});
