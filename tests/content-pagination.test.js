'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readAllPublishedMcqs } = require('../lib/paginated-content');

function fakeDb(rows, failAt = -1) {
  return {from(table) {
    assert.equal(table, 'mcqs');
    return {select(cols) {
      assert.equal(cols, '*');
      return {order(col, opts) {
        assert.equal(col, 'id');
        assert.equal(opts.ascending, true);
        return {async range(start, end) {
          if (start === failAt) return { data: null, error: new Error('read failed') };
          return { data: rows.slice(start, end + 1), error: null };
        }};
      }};
    }};
  }};
}
test('reads 1046 published MCQs without 1000-row truncation', async () => {
  const rows = Array.from({ length: 1046 }, (_, i) => ({ id: i + 1 }));
  assert.deepEqual(await readAllPublishedMcqs(fakeDb(rows)), rows);
});
test('exact 1000-row boundary requires a follow-up empty page', async () => {
  const rows = Array.from({ length: 1000 }, (_, i) => ({ id: i + 1 }));
  assert.equal((await readAllPublishedMcqs(fakeDb(rows))).length, 1000);
});
test('fails closed when a later page errors', async () => {
  const rows = Array.from({ length: 1046 }, (_, i) => ({ id: i + 1 }));
  await assert.rejects(readAllPublishedMcqs(fakeDb(rows, 1000)));
});
test('fails closed on non-increasing identifiers', async () => {
  await assert.rejects(readAllPublishedMcqs(fakeDb([{ id: 1 }, { id: 1 }])));
});
test('rejects unsupported page sizes', async () => {
  await assert.rejects(readAllPublishedMcqs(fakeDb([]), 1001), /page size/);
});
