#!/usr/bin/env node
import { randomUUID } from 'node:crypto';
import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { pathToFileURL } from 'node:url';

const STORE = join('.ocode', 'tasks.json');
const STATUSES = new Set(['todo', 'in-progress', 'done']);
const PRIORITIES = new Set(['low', 'medium', 'high']);

function help() {
  console.log(`OCode.js Terminal Tasks

Usage:
  ocode-task add <title> [--priority low|medium|high] [--due YYYY-MM-DD]
  ocode-task list [--status todo|in-progress|done|all] [--json]
  ocode-task start <id>
  ocode-task done <id>
  ocode-task remove <id>
  ocode-task help

Tasks are stored locally in .ocode/tasks.json. No shell commands are executed.`);
}

function parseOptions(args) {
  const positional = [];
  const options = {};
  for (let i = 0; i < args.length; i += 1) {
    const token = args[i];
    if (!token.startsWith('--')) {
      positional.push(token);
      continue;
    }
    const key = token.slice(2);
    if (!['priority', 'due', 'status', 'json'].includes(key)) throw new Error(`Unknown option: ${token}`);
    if (key === 'json') {
      options.json = true;
      continue;
    }
    const value = args[i + 1];
    if (!value || value.startsWith('--')) throw new Error(`Missing value for ${token}`);
    options[key] = value;
    i += 1;
  }
  return { positional, options };
}

async function readTasks(cwd) {
  const file = join(cwd, STORE);
  try {
    const parsed = JSON.parse(await readFile(file, 'utf8'));
    if (!parsed || parsed.version !== 1 || !Array.isArray(parsed.tasks)) throw new Error('invalid task store');
    return parsed.tasks;
  } catch (error) {
    if (error.code === 'ENOENT') return [];
    throw new Error(`Cannot read ${STORE}: ${error.message}`);
  }
}

async function writeTasks(cwd, tasks) {
  const file = join(cwd, STORE);
  await mkdir(dirname(file), { recursive: true });
  const temporary = `${file}.${process.pid}.tmp`;
  await writeFile(temporary, `${JSON.stringify({ version: 1, tasks }, null, 2)}\n`, { encoding: 'utf8', mode: 0o600 });
  await rename(temporary, file);
}

function printTasks(tasks) {
  if (tasks.length === 0) {
    console.log('No tasks yet. Add one with: ocode-task add "Your task"');
    return;
  }
  const symbols = { todo: '○', 'in-progress': '◐', done: '✓' };
  for (const task of tasks) {
    const due = task.due ? ` · due ${task.due}` : '';
    console.log(`${symbols[task.status]} ${task.id.slice(0, 8)}  [${task.priority}] ${task.title}${due}`);
  }
}

export async function run(argv = process.argv.slice(2), cwd = process.cwd()) {
  const [command = 'help', ...rest] = argv;
  if (command === 'help' || command === '--help' || command === '-h') {
    help();
    return 0;
  }
  const { positional, options } = parseOptions(rest);
  const tasks = await readTasks(cwd);
  if (command === 'add') {
    const title = positional.join(' ').trim();
    if (!title) throw new Error('A task title is required.');
    const priority = options.priority ?? 'medium';
    if (!PRIORITIES.has(priority)) throw new Error('Priority must be low, medium, or high.');
    const due = options.due;
    if (due && (!/^\\d{4}-\\d{2}-\\d{2}$/.test(due) || Number.isNaN(Date.parse(`${due}T00:00:00Z`)) || new Date(`${due}T00:00:00Z`).toISOString().slice(0, 10) !== due)) {
      throw new Error('Due date must use YYYY-MM-DD.');
    }
    const task = { id: randomUUID(), title, status: 'todo', priority, createdAt: new Date().toISOString(), ...(due ? { due } : {}) };
    tasks.push(task);
    await writeTasks(cwd, tasks);
    console.log(`Added ${task.id.slice(0, 8)}: ${task.title}`);
    return 0;
  }
  if (command === 'list') {
    const status = options.status ?? 'all';
    if (status !== 'all' && !STATUSES.has(status)) throw new Error('Status must be todo, in-progress, done, or all.');
    const filtered = status === 'all' ? tasks : tasks.filter(task => task.status === status);
    if (options.json) console.log(JSON.stringify(filtered, null, 2));
    else printTasks(filtered);
    return 0;
  }
  if (['start', 'done', 'remove'].includes(command)) {
    const id = positional[0];
    if (!id) throw new Error(`A task ID is required: ocode-task ${command} <id>`);
    const matches = tasks.filter(task => task.id === id || task.id.startsWith(id));
    if (matches.length !== 1) throw new Error(matches.length ? `Task ID is ambiguous: ${id}` : `Task not found: ${id}`);
    const task = matches[0];
    if (command === 'remove') {
      tasks.splice(tasks.indexOf(task), 1);
      await writeTasks(cwd, tasks);
      console.log(`Removed ${task.id.slice(0, 8)}: ${task.title}`);
      return 0;
    }
    task.status = command === 'start' ? 'in-progress' : 'done';
    task.updatedAt = new Date().toISOString();
    await writeTasks(cwd, tasks);
    console.log(`Updated ${task.id.slice(0, 8)}: ${task.status}`);
    return 0;
  }
  throw new Error(`Unknown command: ${command}. Run "ocode-task help" for usage.`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  run().then(code => { process.exitCode = code; }).catch(error => {
    console.error(`Error: ${error.message}`);
    process.exitCode = 1;
  });
}
