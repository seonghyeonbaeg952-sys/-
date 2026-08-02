import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.dirname(fileURLToPath(import.meta.url));

function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = '';
  let quoted = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const next = text[index + 1];

    if (quoted) {
      if (char === '"' && next === '"') {
        field += '"';
        index += 1;
      } else if (char === '"') {
        quoted = false;
      } else {
        field += char;
      }
    } else if (char === '"') {
      quoted = true;
    } else if (char === ',') {
      row.push(field);
      field = '';
    } else if (char === '\n') {
      row.push(field.replace(/\r$/, ''));
      rows.push(row);
      row = [];
      field = '';
    } else {
      field += char;
    }
  }

  if (field.length > 0 || row.length > 0) {
    row.push(field.replace(/\r$/, ''));
    rows.push(row);
  }

  const [headers, ...data] = rows;
  return data
    .filter((values) => values.some((value) => value.length > 0))
    .map((values) => Object.fromEntries(headers.map((header, index) => [header.replace(/^\uFEFF/, ''), values[index] ?? ''])));
}

function readCsv(name) {
  return parseCsv(fs.readFileSync(path.join(root, name), 'utf8').replace(/^\uFEFF/, ''));
}

function normalizeUrl(url) {
  return String(url ?? '').trim().replace(/\/$/, '').toLowerCase();
}

function hostOf(url) {
  try {
    return new URL(url).host;
  } catch {
    return '';
  }
}

const rows = [];

for (const row of readCsv('sources-a.csv')) {
  rows.push({
    priority: 1,
    source_file: 'sources-a.csv',
    source: row.source,
    domain: row.domain,
    url: row.url,
    title: row.title,
    published_or_status: row.verification,
    observable_evidence: row.evidence,
    pattern: row.observable_pattern,
    adopt_or_reject: row.decision,
    rationale: row.reason,
    access_or_verification: row.verification,
  });
}

for (const row of readCsv('sources-b.csv')) {
  rows.push({
    priority: 2,
    source_file: 'sources-b.csv',
    source: row.domain,
    domain: row.domain,
    url: row.url,
    title: row.page_title,
    published_or_status: row.http_status,
    observable_evidence: row.page_description_or_headings,
    pattern: row.observed_pattern,
    adopt_or_reject: '검토',
    rationale: row.adopt_or_exclude_reason,
    access_or_verification: row.access_limitation,
  });
}

for (const row of readCsv('sources-c.csv')) {
  rows.push({
    priority: 3,
    source_file: 'sources-c.csv',
    source: row.source,
    domain: hostOf(row.url),
    url: row.url,
    title: row.title,
    published_or_status: row.published,
    observable_evidence: row.observed_evidence,
    pattern: row.pattern,
    adopt_or_reject: row.adopt_or_reject,
    rationale: row.adopt_or_reject,
    access_or_verification: 'Codrops WordPress API excerpt verified',
  });
}

const byUrl = new Map();
for (const row of rows.sort((left, right) => left.priority - right.priority)) {
  const key = normalizeUrl(row.url);
  if (!key) continue;
  if (!byUrl.has(key)) {
    byUrl.set(key, { ...row, duplicate_records_merged: 1 });
  } else {
    byUrl.get(key).duplicate_records_merged += 1;
  }
}

const deduped = [...byUrl.values()].sort((left, right) => {
  const domainOrder = left.domain.localeCompare(right.domain);
  return domainOrder || left.url.localeCompare(right.url);
});

const columns = [
  'evidence_id',
  'source_file',
  'source',
  'domain',
  'url',
  'title',
  'published_or_status',
  'observable_evidence',
  'pattern',
  'adopt_or_reject',
  'rationale',
  'access_or_verification',
  'duplicate_records_merged',
];

function quote(value) {
  return `"${String(value ?? '').replaceAll('"', '""')}"`;
}

const csvRows = [columns.map(quote).join(',')];
deduped.forEach((row, index) => {
  const numbered = { ...row, evidence_id: index + 1 };
  csvRows.push(columns.map((column) => quote(numbered[column])).join(','));
});

fs.writeFileSync(path.join(root, 'evidence-ledger-400-plus.csv'), `\uFEFF${csvRows.join('\r\n')}\r\n`, 'utf8');

const domainCounts = Object.fromEntries(
  Object.entries(
    deduped.reduce((accumulator, row) => {
      accumulator[row.domain] = (accumulator[row.domain] ?? 0) + 1;
      return accumulator;
    }, {}),
  ).sort((left, right) => right[1] - left[1]),
);

const rejected = deduped.filter((row) => /^\s*(배제|exclude|reject)/i.test(row.adopt_or_reject)).length;

console.log(JSON.stringify({
  raw_rows: rows.length,
  unique_urls: deduped.length,
  duplicates_merged: rows.length - deduped.length,
  adopted_or_supporting: deduped.length - rejected,
  rejected,
  domains: domainCounts,
  output: path.join(root, 'evidence-ledger-400-plus.csv'),
}, null, 2));
