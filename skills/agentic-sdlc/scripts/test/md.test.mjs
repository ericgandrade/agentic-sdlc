import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  parseSections, findSection, getSection, stripSection, splitRow, parseTables, tableToObjects,
  extractFencedBlocks, parseKeyValueBlock, parseFrontmatter, countWords, contentHash, readMarkdownFile,
} from '../lib/md.mjs';
import { InputError } from '../lib/cli.mjs';
import { makeDir, cleanup } from './helpers.mjs';

after(cleanup);

const SPEC = [
  '# Spec: CSV export',
  '',
  '## Acceptance criteria',
  '',
  '| ID | Given / When / Then | Test |',
  '|---|---|---|',
  '| AC-1 | Given filtered rows \\| When export | `a|b` |',
  '| AC-2 | Given 50k rows | none |',
  '',
  '### Notes',
  'text',
  '',
  '```markdown',
  '## Not a heading',
  '| x | y |',
  '|---|---|',
  '```',
  '',
  '## Approvals',
  '',
  '| Sign-off | Rev | Hash |',
  '|---|---|---|',
  '| Specify | 1 | abc |',
  '',
  '## Revisions',
  'none',
  '',
].join('\n');

test('parseSections ignores headings inside fences and nests by level', () => {
  const s = parseSections(SPEC);
  assert.deepEqual(s.map((x) => x.title), ['Spec: CSV export', 'Acceptance criteria', 'Notes', 'Approvals', 'Revisions']);
  const ac = s[1];
  assert.match(ac.body, /### Notes/);
  assert.doesNotMatch(ac.body, /## Approvals/);
  assert.equal(s[0].end, SPEC.split('\n').length);
});

test('findSection / getSection match case-insensitively and by RegExp', () => {
  assert.equal(findSection(SPEC, 'approvals').level, 2);
  assert.equal(findSection(SPEC, /^Rev/).title, 'Revisions');
  assert.equal(findSection(SPEC, 'Missing'), null);
  assert.throws(() => getSection(SPEC, 'Missing'), InputError);
});

test('splitRow honours escaped pipes and backtick spans', () => {
  assert.deepEqual(splitRow('| AC-1 | a \\| b | `x|y` |'), ['AC-1', 'a | b', '`x|y`']);
  assert.deepEqual(splitRow('a | b'), ['a', 'b']);
});

test('parseTables finds tables outside fences only', () => {
  const t = parseTables(SPEC);
  assert.equal(t.length, 2);
  const rows = tableToObjects(t[0]);
  assert.equal(rows.length, 2);
  assert.equal(rows[0].ID, 'AC-1');
  assert.equal(rows[0].Test, '`a|b`');
  assert.equal(rows[1]['Given / When / Then'], 'Given 50k rows');
});

test('extractFencedBlocks filters by info string; parseKeyValueBlock reads sdlc-dod', () => {
  const md = 'x\n```sdlc-dod\nlint: npm run lint\n# comment\ncoverage_min: 80\ntypecheck: n/a — plain JS\n```\n```js\n1\n```\n';
  const blocks = extractFencedBlocks(md, { info: 'sdlc-dod' });
  assert.equal(blocks.length, 1);
  assert.deepEqual(parseKeyValueBlock(blocks[0].content), {
    lint: 'npm run lint', coverage_min: '80', typecheck: 'n/a — plain JS',
  });
  assert.equal(extractFencedBlocks(md).length, 2);
  assert.throws(() => parseKeyValueBlock('no colon here'), InputError);
});

test('parseFrontmatter and countWords skip frontmatter and code', () => {
  const md = '---\nname: x\ndescription: "a b"\n---\n# Title\none two three\n```\nskip these words\n```\n';
  assert.deepEqual(parseFrontmatter(md).data, { name: 'x', description: 'a b' });
  assert.equal(countWords(md), 4);
  assert.deepEqual(parseFrontmatter('# none').data, {});
});

test('contentHash excludes the Approvals section and ignores CRLF', () => {
  const h = contentHash(SPEC);
  assert.match(h, /^[0-9a-f]{12}$/);
  const approved = SPEC.replace('| Specify | 1 | abc |', '| Specify | 1 | abc |\n| Design | 1 | def |');
  assert.equal(contentHash(approved), h, 'edits inside Approvals keep the hash');
  assert.equal(contentHash(SPEC.replace(/\n/g, '\r\n')), h, 'CRLF does not change the hash');
  assert.notEqual(contentHash(SPEC.replace('50k', '60k')), h, 'body edits change the hash');
  assert.doesNotMatch(stripSection(SPEC, 'Approvals'), /abc/);
  assert.match(stripSection(SPEC, 'Approvals'), /## Revisions/);
});

test('readMarkdownFile throws InputError (exit 2) for a missing file', () => {
  const dir = makeDir('md');
  const p = join(dir, 'md-read.md');
  writeFileSync(p, 'a\r\nb');
  assert.equal(readMarkdownFile(p), 'a\nb');
  assert.throws(() => readMarkdownFile(join(dir, 'absent.md')), (e) => e instanceof InputError && e.exitCode === 2);
});
