import { describe, expect, it } from 'vitest';
import { addDays, israelDate, israelLocalToIso, isoToIsraelLocal } from '../src/admin/israelTime';

describe('israel time helpers', () => {
  it('uses the Israeli calendar day, not UTC', () => {
    // 22:30 UTC בחורף = 00:30 בישראל ביום שלמחרת
    expect(israelDate(new Date('2026-11-08T22:30:00Z'))).toBe('2026-11-09');
    expect(israelDate(new Date('2026-11-08T21:30:00Z'))).toBe('2026-11-08');
    // בקיץ (+03:00)
    expect(israelDate(new Date('2026-07-01T21:30:00Z'))).toBe('2026-07-02');
  });

  it('converts Israel local input to UTC in winter and summer', () => {
    expect(israelLocalToIso('2026-11-10T00:00')).toBe('2026-11-09T22:00:00.000Z');
    expect(israelLocalToIso('2026-07-10T00:00')).toBe('2026-07-09T21:00:00.000Z');
    expect(israelLocalToIso('')).toBeNull();
  });

  it('round-trips', () => {
    for (const iso of ['2026-11-09T22:00:00.000Z', '2026-07-09T21:00:00.000Z', '2026-03-27T10:15:00.000Z']) {
      expect(israelLocalToIso(isoToIsraelLocal(iso))).toBe(iso);
    }
  });

  it('adds days across month boundaries', () => {
    expect(addDays('2026-11-01', -6)).toBe('2026-10-26');
  });
});
