import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { parseDailyReport } from '@/lib/parser/report-parser';

const fixture = readFileSync('tests/sample-report.fixture.txt', 'utf-8');

describe('parseDailyReport', () => {
  it('parses title, date, and signal blocks', () => {
    const parsed = parseDailyReport(fixture);
    expect(parsed.reportDate).toBe('2026-02-19');
    expect(parsed.signals.length).toBe(1);
    expect(parsed.signals[0].companyName).toBe('Travelpro Products');
    expect(parsed.signals[0].sourceRefs).toEqual([1, 2, 3, 4, 5]);
  });

  it('parses sources and signal mix', () => {
    const parsed = parseDailyReport(fixture);
    expect(parsed.signalMix[0].triggerType).toBe('Leadership Change');
    expect(parsed.signalMix[0].count).toBe(2);
    expect(parsed.sources.length).toBe(4);
    expect(parsed.sources[0].url).toContain('prnewswire.com');
  });
});
