import { parse } from 'date-fns';
import type { ParsedReport, ParsedSignal, SignalClassification } from '@/lib/types';

const SECTION_HEADERS = [
  'Overview',
  'Signal mix',
  'Detailed Signal Findings',
  'Recommended Outreach List',
  'Notes & Observations'
];

function normalizeLine(line: string) {
  return line.replace(/\u2022/g, '•').trim();
}

function parseDateFromTitle(title: string): string | null {
  const parts = title.split('—');
  const rawDate = parts[1]?.trim();
  if (!rawDate) return null;
  const formats = ['MMMM d, yyyy', 'MMM d yyyy', 'MMM d, yyyy'];
  for (const fmt of formats) {
    const parsed = parse(rawDate, fmt, new Date());
    if (!Number.isNaN(parsed.getTime())) return parsed.toISOString().slice(0, 10);
  }
  return null;
}

function findSection(lines: string[], header: string) {
  const idx = lines.findIndex((line) => line === header);
  if (idx < 0) return [] as string[];
  let end = lines.length;
  for (const h of SECTION_HEADERS) {
    if (h === header) continue;
    const headerIdx = lines.findIndex((line, i) => i > idx && line === h);
    if (headerIdx > -1) end = Math.min(end, headerIdx);
  }
  return lines.slice(idx + 1, end).filter(Boolean);
}

function parseBoolean(value: string): boolean {
  return /^yes|true/i.test(value.trim());
}

function parseSignalBlock(block: string[]): ParsedSignal {
  const first = block[0];
  const match = first.match(/^(.*?) \(Owned by: (.*?)\) — (.*)$/);
  const data: ParsedSignal = {
    companyName: match?.[1]?.trim() ?? '',
    sponsorName: match?.[2]?.trim() ?? '',
    headline: match?.[3]?.trim() ?? first,
    signalDetected: false,
    classification: 'Structural Trigger',
    primaryTriggerCategory: '',
    confidenceScore: 1,
    meritsOutreach: false,
    evidenceBullets: [],
    sourceRefs: []
  };

  let evidenceMode = false;
  for (const rawLine of block.slice(1)) {
    const line = rawLine.replace(/^•\s*/, '').trim();
    if (/^Evidence from source/i.test(line)) {
      evidenceMode = true;
      continue;
    }
    if (/^[A-Za-z ]+:/.test(line)) evidenceMode = false;

    if (evidenceMode) {
      if (!line) continue;
      data.evidenceBullets.push(line);
      const refs = Array.from(line.matchAll(/\[(\d+)\]/g)).map((m) => Number(m[1]));
      data.sourceRefs.push(...refs);
      continue;
    }

    const [field, ...rest] = line.split(':');
    const value = rest.join(':').trim();
    switch (field.toLowerCase()) {
      case 'signal detected':
        data.signalDetected = parseBoolean(value);
        break;
      case 'signal classification':
        data.classification = (value as SignalClassification) || 'Structural Trigger';
        break;
      case 'primary trigger category':
        data.primaryTriggerCategory = value;
        break;
      case 'secondary triggers':
        data.secondaryTriggers = value;
        break;
      case 'potential for enterprise transformation':
        data.potentialForTransformation = value;
        break;
      case 'confidence score':
        data.confidenceScore = Math.max(1, Math.min(5, Number(value) || 1));
        break;
      case 'merits outreach':
        data.meritsOutreach = parseBoolean(value);
        break;
      case 'outreach reasoning':
        data.outreachReasoning = value;
        break;
      default:
    }
  }

  data.sourceRefs = [...new Set(data.sourceRefs)];
  return data;
}

function parseSources(lines: string[]) {
  const sources: ParsedReport['sources'] = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!line.startsWith('[')) continue;
    const refMatches = Array.from(line.matchAll(/\[(\d+)\]/g)).map((m) => Number(m[1]));
    const title = line.replace(/(\[\d+\]\s*)+/g, '').trim();
    const next = lines[i + 1] ?? '';
    const url = /^https?:\/\//.test(next) ? next : '';
    const domain = url ? new URL(url).hostname.replace(/^www\./, '') : '';
    for (const refNumber of refMatches) {
      sources.push({ refNumber, title, url, domain });
    }
  }
  return sources;
}

export function parseDailyReport(rawText: string): ParsedReport {
  const lines = rawText
    .split('\n')
    .map(normalizeLine)
    .filter((line) => line.length > 0);

  const title = lines[0] || 'Daily Transformation Trigger Summary';
  const warnings: string[] = [];
  const reportDate = parseDateFromTitle(title) ?? new Date().toISOString().slice(0, 10);
  if (!parseDateFromTitle(title)) warnings.push('Could not confidently parse report date from title.');

  const overviewBullets = findSection(lines, 'Overview').map((line) => line.replace(/^•\s*/, '').trim());

  const signalMixLines = findSection(lines, 'Signal mix').slice(1);
  const signalMix = signalMixLines.map((row) => {
    const parts = row.split(/\s{2,}|\t/).filter(Boolean);
    const count = Number(parts.at(-1)) || 0;
    const triggerType = parts.slice(0, -1).join(' ').trim() || row;
    return { triggerType, count };
  });

  const detailed = findSection(lines, 'Detailed Signal Findings');
  const sourceStart = detailed.findIndex((line) => /^\[\d+\]/.test(line));
  const signalLines = sourceStart > -1 ? detailed.slice(0, sourceStart) : detailed;
  const sourceLines = sourceStart > -1 ? detailed.slice(sourceStart) : [];

  const signalBlocks: string[][] = [];
  let current: string[] = [];
  for (const line of signalLines) {
    if (/\(Owned by: .*\) — /.test(line) && current.length) {
      signalBlocks.push(current);
      current = [line];
    } else {
      current.push(line);
    }
  }
  if (current.length) signalBlocks.push(current);

  const signals = signalBlocks.map(parseSignalBlock).filter((s) => s.companyName || s.headline);
  if (!signals.length) warnings.push('No signals parsed from Detailed Signal Findings.');

  const sources = parseSources(sourceLines);

  const recommendedRaw = findSection(lines, 'Recommended Outreach List');
  const recommendedOutreach = recommendedRaw.slice(1).map((line) => {
    const cells = line.split(/\s{2,}|\t/).filter(Boolean);
    return {
      companyName: cells[0] ?? '',
      sponsorName: cells[1] ?? '',
      triggerType: cells[2] ?? '',
      confidenceScore: Number(cells[3]) || 0
    };
  });

  const notesAndObservations = findSection(lines, 'Notes & Observations').map((line) => line.replace(/^•\s*/, ''));

  return {
    title,
    reportDate,
    overviewBullets,
    signalMix,
    signals,
    recommendedOutreach,
    notesAndObservations,
    sources,
    warnings
  };
}
