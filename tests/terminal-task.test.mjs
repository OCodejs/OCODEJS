import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';

const cli = new URL('../bin/ocode-task.mjs', import.meta.url);
function invoke(cwd, ...args) {
  return spawnSync(process.execPath, [cli.pathname, ...args], { cwd, encoding: 'utf8' });
}
async function withWorkspace(fn) {
  const cwd = await mkdtemp(join(tmpdir(), 'ocode-task-'));
  try { await fn(cwd); } finally { await rm(cwd, { recursive: true, force: true }); }
}

test('adds, lists, starts, completes, and removes tasks', async () => {
  await withWorkspace(async cwd => {
    const added = invoke(cwd, 'add', 'Ship Terminal Tasks', '--priority', 'high', '--due', '2026-12-01');
    assert.equal(added.status, 0, added.stderr);
    const store = JSON.parse(await readFile(join(cwd, '.ocode/tasks.json'), 'utf8'));
    assert.equal(store.version, 1);
    assert.equal(store.tasks.length, 1);
    const id = store.tasks[0].id;
    assert.equal(store.tasks[0].priority, 'high');
    assert.equal(invoke(cwd, 'list', '--status', 'todo').status, 0);
    assert.equal(invoke(cwd, 'start', id.slice(0, 8)).status, 0);
    assert.equal(invoke(cwd, 'done', id).status, 0);
    const completed = JSON.parse(invoke(cwd, 'list', '--status', 'done', '--json').stdout);
    assert.equal(completed.length, 1);
    assert.equal(completed[0].status, 'done');
    assert.equal(invoke(cwd, 'remove', id).status, 0);
    assert.match(invoke(cwd, 'list').stdout, /No tasks yet/);
  });
});

test('rejects invalid priority and malformed due date', async () => {
  await withWorkspace(async cwd => {
    assert.notEqual(invoke(cwd, 'add', 'Bad priority', '--priority', 'urgent').status, 0);
    assert.notEqual(invoke(cwd, 'add', 'Bad date', '--due', 'not-a-date').status, 0);
    assert.notEqual(invoke(cwd, 'add', 'Impossible date', '--due', '2026-02-31').status, 0);
    assert.match(invoke(cwd, 'add').stderr, /title is required/);
  });
});

test('does not execute shell metacharacters in task titles', async () => {
  await withWorkspace(async cwd => {
    const result = invoke(cwd, 'add', '$(touch SHOULD_NOT_EXIST); safe title');
    assert.equal(result.status, 0, result.stderr);
    const store = JSON.parse(await readFile(join(cwd, '.ocode/tasks.json'), 'utf8'));
    assert.equal(store.tasks[0].title, '$(touch SHOULD_NOT_EXIST); safe title');
    await assert.rejects(readFile(join(cwd, 'SHOULD_NOT_EXIST')));
  });
});
