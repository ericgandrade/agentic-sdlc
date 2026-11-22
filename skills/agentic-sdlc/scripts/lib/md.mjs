// Markdown helpers for agentic-sdlc scripts (Node >= 18, no dependencies).
// Covers the subset the method's artifacts use: ATX headings, GFM pipe tables,
// fenced code blocks, YAML-like frontmatter and key: value blocks.

import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { InputError } from './cli.mjs';

const FENCE = /^\s{0,3}(`{3,}|~{3,})(.*)$/;
const HEADING = /^\s{0,3}(#{1,6})\s+(.*?)\s*#*\s*$/;

export function normalize(md) {
  return String(md).replace(/\r\n?/g, '\n');
}

export function readMarkdownFile(path) {
  try {
    return normalize(readFileSync(path, 'utf8'));
  } catch (e) {
    throw new InputError(`cannot read ${path}: ${e.code || e.message}`);
  }
}

// Returns, per line, whether it sits inside a fenced code block (fence lines included).
function fenceMask(lines) {
  const mask = new Array(lines.length).fill(false);
  let open = null;
  for (let i = 0; i < lines.length; i++) {
    const m = lines[i].match(FENCE);
    if (open) {
      mask[i] = true;
      if (m && m[1][0] === open[0] && m[1].length >= open.length && m[2].trim() === '') open = null;
    } else if (m) {
      mask[i] = true;
      open = m[1];
    }
  }
  return mask;
}

// Splits a document into sections. Each section: { level, title, line (0-based), start, end, body }.
// start/end are line indexes of the section content (end exclusive); a section ends at the next
// heading of the same or a higher level.
export function parseSections(md) {
  const lines = normalize(md).split('\n');
  const mask = fenceMask(lines);
  const heads = [];
  for (let i = 0; i < lines.length; i++) {
    if (mask[i]) continue;
    const m = lines[i].match(HEADING);
    if (m) heads.push({ level: m[1].length, title: m[2].trim(), line: i });
  }
  return heads.map((h, idx) => {
    let end = lines.length;
    for (let j = idx + 1; j < heads.length; j++) {
      if (heads[j].level <= h.level) { end = heads[j].line; break; }
    }
    const body = lines.slice(h.line + 1, end).join('\n');
    return { ...h, start: h.line + 1, end, body };
  });
}

function titleMatches(title, wanted) {
  if (wanted instanceof RegExp) return wanted.test(title);
  return title.toLowerCase() === String(wanted).toLowerCase();
}

// First section whose title matches (case-insensitive string or RegExp); null when absent.
export function findSection(md, title, { level } = {}) {
  return parseSections(md).find((s) => titleMatches(s.title, title) && (level == null || s.level === level)) || null;
}

// Body of the first matching section; throws InputError when absent.
export function getSection(md, title, opts) {
  const s = findSection(md, title, opts);
  if (!s) throw new InputError(`section not found: ${title}`);
  return s.body;
}

// Removes every section whose title matches (heading line + body) from the document.
export function stripSection(md, title) {
  const lines = normalize(md).split('\n');
  const drop = new Array(lines.length).fill(false);
  for (const s of parseSections(md)) {
    if (!titleMatches(s.title, title)) continue;
    for (let i = s.line; i < s.end; i++) drop[i] = true;
  }
  return lines.filter((_, i) => !drop[i]).join('\n');
}

// Splits one table row into cells, honouring escaped pipes and pipes inside backtick spans.
export function splitRow(line) {
  let s = line.trim();
  if (s.startsWith('|')) s = s.slice(1);
  const cells = [];
  let cur = '';
  let tick = 0;
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (c === '\\' && s[i + 1] === '|') { cur += '|'; i++; continue; }
    if (c === '`') {
      let n = 1;
      while (s[i + n] === '`') n++;
      if (tick === 0) tick = n; else if (tick === n) tick = 0;
      cur += '`'.repeat(n);
      i += n - 1;
      continue;
    }
    if (c === '|' && tick === 0) { cells.push(cur.trim()); cur = ''; continue; }
    cur += c;
  }
  if (cur.trim() !== '' || !line.trim().endsWith('|')) cells.push(cur.trim());
  return cells;
}

const DELIM = /^\s*\|?\s*:?-{1,}:?\s*(\|\s*:?-{1,}:?\s*)*\|?\s*$/;

// Returns every GFM table: { header: [...], rows: [[...]], line } (line = 0-based header line).
export function parseTables(md) {
  const lines = normalize(md).split('\n');
  const mask = fenceMask(lines);
  const tables = [];
  for (let i = 0; i + 1 < lines.length; i++) {
    if (mask[i] || !lines[i].includes('|') || !DELIM.test(lines[i + 1])) continue;
    const header = splitRow(lines[i]);
    const rows = [];
    let j = i + 2;
    while (j < lines.length && !mask[j] && lines[j].includes('|') && lines[j].trim() !== '') {
      rows.push(splitRow(lines[j]));
      j++;
    }
    tables.push({ header, rows, line: i });
    i = j - 1;
  }
  return tables;
}

// Maps table rows to objects keyed by header text; missing cells become ''.
export function tableToObjects(table) {
  return table.rows.map((r) => Object.fromEntries(table.header.map((h, k) => [h, r[k] ?? ''])));
}

// Fenced blocks: { info, content, line }. Filter by info string (exact first word) when given.
export function extractFencedBlocks(md, { info } = {}) {
  const lines = normalize(md).split('\n');
  const blocks = [];
  for (let i = 0; i < lines.length; i++) {
    const m = lines[i].match(FENCE);
    if (!m) continue;
    const fence = m[1];
    const tag = m[2].trim().split(/\s+/)[0] || '';
    const body = [];
    let j = i + 1;
    for (; j < lines.length; j++) {
      const c = lines[j].match(FENCE);
      if (c && c[1][0] === fence[0] && c[1].length >= fence.length && c[2].trim() === '') break;
      body.push(lines[j]);
    }
    if (info == null || tag === info) blocks.push({ info: tag, content: body.join('\n'), line: i });
    i = j;
  }
  return blocks;
}

// Parses "key: value" lines (blank lines and lines starting with # are skipped).
export function parseKeyValueBlock(text) {
  const out = {};
  for (const raw of normalize(text).split('\n')) {
    const line = raw.trim();
    if (!line || line.startsWith('#')) continue;
    const idx = line.indexOf(':');
    if (idx <= 0) throw new InputError(`not a key: value line: ${line}`);
    out[line.slice(0, idx).trim()] = line.slice(idx + 1).trim();
  }
  return out;
}

// Flat frontmatter between leading "---" lines: { data, body }. data is {} when absent.
export function parseFrontmatter(md) {
  const text = normalize(md);
  const m = text.match(/^---\n([\s\S]*?)\n---\n?/);
  if (!m) return { data: {}, body: text };
  const data = {};
  for (const line of m[1].split('\n')) {
    const idx = line.indexOf(':');
    if (idx <= 0 || /^\s/.test(line)) continue;
    let v = line.slice(idx + 1).trim();
    if (/^(['"]).*\1$/.test(v)) v = v.slice(1, -1);
    data[line.slice(0, idx).trim()] = v;
  }
  return { data, body: text.slice(m[0].length) };
}

// Counts words outside frontmatter and fenced code blocks.
export function countWords(md) {
  const { body } = parseFrontmatter(md);
  const lines = body.split('\n');
  const mask = fenceMask(lines);
  const text = lines.filter((_, i) => !mask[i]).join(' ');
  const words = text.split(/\s+/).filter((w) => /[\p{L}\p{N}]/u.test(w));
  return words.length;
}

// Approval hash: first `length` hex chars of SHA-256 over the document with the excluded
// sections removed, line endings normalized to LF and trailing newlines trimmed.
export function contentHash(md, { exclude = ['Approvals'], length = 12 } = {}) {
  let text = normalize(md);
  for (const title of exclude) text = stripSection(text, title);
  text = text.replace(/\n+$/, '');
  return createHash('sha256').update(text, 'utf8').digest('hex').slice(0, length);
}
