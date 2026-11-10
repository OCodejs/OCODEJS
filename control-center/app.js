import { fetchGitHubPublicStatus, GitHubPublicApiError } from './lib/github-public.js';
import { formatMetric, isTimestampStale, resolveViewFromHash } from './lib/state.js';

const LABELS = {
  overview: 'Tổng quan',
  servers: 'Server Management',
  monitoring: 'Live Monitoring',
  databases: 'Database Monitoring',
  security: 'Security Monitoring',
  sandboxes: 'Sandbox Management',
  alerts: 'Alert Center',
  github: 'GitHub & CI/CD',
  deployments: 'Deployments',
  agents: 'AI Agents',
  settings: 'Kết nối & cài đặt',
};
const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];
let activeRequest = null;
let lastGitHubStatus = null;
let activeView = 'overview';

function showView() {
  const key = resolveViewFromHash(location.hash, activeView, Object.keys(LABELS));
  activeView = key;
  $$('[data-view]').forEach((view) => { view.hidden = view.dataset.view !== key; });
  $$('[data-view-link]').forEach((link) => {
    if (link.dataset.viewLink === key) link.setAttribute('aria-current', 'page');
    else link.removeAttribute('aria-current');
  });
  $('#breadcrumb').textContent = LABELS[key];
  $('#sidebar').classList.remove('open');
  $('#menu-button').setAttribute('aria-expanded', 'false');
  if (key === 'github' && lastGitHubStatus && isTimestampStale(lastGitHubStatus.checkedAt)) {
    setSourceState('stale', 'DỮ LIỆU CŨ');
  } else if (key === 'github' && !lastGitHubStatus && !activeRequest) {
    void refreshGitHub();
  }
}

function displayTimestamp(value) {
  if (!value) return '—';
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return '—';
  return new Intl.DateTimeFormat('vi-VN', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'UTC' }).format(date) + ' UTC';
}

function errorMessage(error) {
  if (error instanceof GitHubPublicApiError) {
    if (error.code === 'rate_limited') return 'GitHub API đang giới hạn yêu cầu; thử lại sau một lúc.';
    if (error.code === 'network_error') return 'Không kết nối được GitHub Public API. Kiểm tra mạng hoặc thử lại.';
    return 'Không đọc được dữ liệu GitHub công khai (' + error.code + ').';
  }
  return 'Không thể đọc dữ liệu GitHub lúc này.';
}

function setSourceState(state, label) {
  const badge = $('#github-view-state');
  badge.textContent = label;
  badge.dataset.state = state === 'connected' ? 'live' : state;
  $('#repo-state').textContent = label;
  $('#repo-state').className = 'state-text ' + (state === 'connected' ? '' : 'state-muted');
  $('#github-provider-status').textContent = label;
  $('#github-provider-status').closest('.provider-card').classList.toggle('provider-connected', state === 'connected');
  $('#overview-source-title').textContent = state === 'connected'
    ? 'GitHub Public API đã trả dữ liệu thật'
    : 'GitHub Public API chưa xác nhận dữ liệu';
  $('#overview-source-note').textContent = state === 'connected'
    ? 'Repository và workflow được đọc công khai; server, database và sandbox chưa kết nối.'
    : 'Chưa có kết quả GitHub mới; các chỉ số hạ tầng vẫn chưa có nguồn.';
  const overview = $('#overview-source-state');
  overview.textContent = label.toUpperCase();
  overview.dataset.state = state === 'connected' ? 'live' : state === 'loading' ? 'loading' : 'unavailable';
  $('#last-checked').textContent = state === 'loading'
    ? 'Đang kiểm tra GitHub…'
    : state === 'connected' && lastGitHubStatus
      ? 'GitHub checked ' + displayTimestamp(lastGitHubStatus.checkedAt)
      : 'Chưa xác nhận thời điểm đọc GitHub';
}

function renderUnavailable(message) {
  const panel = $('#github-panel');
  panel.replaceChildren();
  const title = document.createElement('h2');
  title.textContent = 'Dữ liệu GitHub chưa khả dụng';
  const detail = document.createElement('p');
  detail.textContent = message;
  panel.append(title, detail);
  const list = $('#workflow-list');
  list.replaceChildren();
  const empty = document.createElement('p');
  empty.className = 'empty-inline';
  empty.textContent = 'Chưa có workflow run được xác nhận.';
  list.append(empty);
  $('#repo-branch').textContent = '—';
  $('#repo-name').textContent = 'Chưa có repository response';
  $('#latest-ci').textContent = '—';
  $('#overview-source-title').textContent = 'Không xác nhận được nguồn GitHub';
}

function renderRepository(repository) {
  const panel = $('#github-panel');
  panel.replaceChildren();
  const heading = document.createElement('h2');
  const link = document.createElement('a');
  link.href = repository.url;
  link.target = '_blank';
  link.rel = 'noopener noreferrer';
  link.textContent = repository.name;
  heading.append(link);
  const description = document.createElement('p');
  description.textContent = repository.description || 'Không có mô tả công khai.';
  const metrics = document.createElement('div');
  metrics.className = 'github-metrics';
  const rows = [
    ['Default branch', repository.defaultBranch],
    ['Stars', formatMetric(repository.stars)],
    ['Open issues + PRs', formatMetric(repository.openIssues)],
    ['Updated', displayTimestamp(repository.updatedAt)],
  ];
  for (const [label, value] of rows) {
    const card = document.createElement('div');
    card.className = 'github-metric';
    const caption = document.createElement('small');
    caption.textContent = label;
    const metric = document.createElement('strong');
    metric.textContent = value ?? '—';
    card.append(caption, metric);
    metrics.append(card);
  }
  panel.append(heading, description, metrics);
  $('#repo-branch').textContent = repository.defaultBranch || '—';
  $('#repo-name').textContent = repository.name;
}

function runLabel(run) {
  if (run.status !== 'completed') return run.status === 'in_progress' || run.status === 'queued' ? 'In progress' : run.status;
  return run.conclusion || 'Completed';
}

function renderWorkflows(workflows) {
  const list = $('#workflow-list');
  list.replaceChildren();
  if (workflows.state !== 'available') {
    const message = document.createElement('p');
    message.className = 'empty-inline';
    message.textContent = workflows.reason === 'rate_limited'
      ? 'Workflow status chưa tải được do giới hạn GitHub API.'
      : 'GitHub chưa cung cấp workflow runs cho yêu cầu này.';
    list.append(message);
    $('#latest-ci').textContent = 'Chưa xác minh';
    return;
  }
  if (!workflows.runs.length) {
    const message = document.createElement('p');
    message.className = 'empty-inline';
    message.textContent = 'GitHub API chưa trả về workflow run nào.';
    list.append(message);
    $('#latest-ci').textContent = 'Chưa có run';
    return;
  }
  const latest = workflows.runs[0];
  $('#latest-ci').textContent = runLabel(latest);
  for (const run of workflows.runs) {
    const row = document.createElement('a');
    row.className = 'run-row';
    row.href = run.url;
    row.target = '_blank';
    row.rel = 'noopener noreferrer';
    const info = document.createElement('span');
    const name = document.createElement('strong');
    name.textContent = run.name;
    const details = document.createElement('small');
    details.textContent = `${run.branch} · ${run.event} · ${displayTimestamp(run.updatedAt)}`;
    info.append(name, details);
    const result = document.createElement('span');
    result.className = 'run-result';
    const value = runLabel(run).toLowerCase();
    if (value.includes('fail') || value.includes('cancel')) result.classList.add('failure');
    else if (value.includes('success')) result.classList.add('success');
    else if (value.includes('progress') || value.includes('queued')) result.classList.add('running');
    result.textContent = runLabel(run);
    row.append(info, result);
    list.append(row);
  }
}

async function refreshGitHub() {
  if (activeRequest) return activeRequest;
  const button = $('#refresh-button');
  button.disabled = true;
  button.textContent = 'Đang làm mới…';
  setSourceState('loading', 'ĐANG TẢI');
  activeRequest = (async () => {
    try {
      const result = await fetchGitHubPublicStatus();
      lastGitHubStatus = result;
      renderRepository(result.repository);
      renderWorkflows(result.workflows);
      setSourceState('connected', 'ĐÃ KẾT NỐI · READ-ONLY');
      $('#last-checked').textContent = 'GitHub checked ' + displayTimestamp(result.checkedAt);
    } catch (error) {
      lastGitHubStatus = null;
      renderUnavailable(errorMessage(error));
      setSourceState('unavailable', 'CHƯA KHẢ DỤNG');
      $('#last-checked').textContent = 'GitHub chưa kiểm tra được';
    } finally {
      button.disabled = false;
      button.textContent = 'Làm mới GitHub';
      activeRequest = null;
    }
  })();
  return activeRequest;
}

$('#menu-button').addEventListener('click', () => {
  const open = $('#sidebar').classList.toggle('open');
  $('#menu-button').setAttribute('aria-expanded', String(open));
});
document.addEventListener('keydown', (event) => {
  if (event.key !== 'Escape' || !$('#sidebar').classList.contains('open')) return;
  $('#sidebar').classList.remove('open');
  $('#menu-button').setAttribute('aria-expanded', 'false');
  $('#menu-button').focus();
});
window.addEventListener('hashchange', showView);
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState !== 'visible' || activeRequest) return;
  if (lastGitHubStatus && isTimestampStale(lastGitHubStatus.checkedAt)) {
    setSourceState('stale', 'DỮ LIỆU CŨ');
    void refreshGitHub();
  }
});
$('#refresh-button').addEventListener('click', () => { void refreshGitHub(); });
showView();
void refreshGitHub();
window.setInterval(() => {
  if (document.visibilityState !== 'visible' || activeRequest) return;
  if (lastGitHubStatus && isTimestampStale(lastGitHubStatus.checkedAt)) {
    setSourceState('stale', 'DỮ LIỆU CŨ');
  }
  void refreshGitHub();
}, 5 * 60 * 1000);
