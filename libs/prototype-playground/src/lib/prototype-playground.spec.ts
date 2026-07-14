import { describe, it, expect } from 'vitest';
import { PROTOTYPE_PLAYGROUND } from '../index';

describe('prototype-playground', () => {
  it('exports the PROTOTYPE_PLAYGROUND constant', () => {
    expect(PROTOTYPE_PLAYGROUND).toBe('prototype-playground');
  });
});
