import test from 'node:test';
import assert from 'node:assert/strict';
import { fetchGitHubPublicStatus, GitHubPublicApiError } from '../control-center/lib/github-public.js';
import { formatMetric, getSourceState } from '../control-center/lib/state.js';

function response(status, payload, responseHeaders = {}) {
  return {
    ok: status >= 200 && status < 300,
    status,
    headers: { get: (name) => responseHeaders[name.toLowerCase()] ?? null },
    json: async () => payload,
  };
}

test('missing metrics render as unknown, while a measured zero remains zero', () => {
  assert.equal(formatMetric(null), '—');
  assert.equal(formatMetric(undefined), '—');
  assert.equal(formatMetric(Number.NaN), '—');
  assert.equal(formatMetric(0), '0');
});

test('telemetry state distinguishes not connected, no sample, fresh and stale', () => {
  const now = Date.parse('2026-11-10T00:01:00.000Z');
  assert.equal(getSourceState({ configured: false, now }), 'not_connected');
  assert.equal(getSourceState({ configured: true, latestSampleAt: null, now }), 'no_sample');
  assert.equal(getSourceState({ configured: true, latestSampleAt: '2026-11-10T00:00:50.000Z', now }), 'live');
  assert.equal(getSourceState({ configured: true, latestSampleAt: '2026-11-10T00:00:00.000Z', now }), 'stale');
  assert.equal(getSourceState({ configured: true, latestSampleAt: 'not-a-date', now }), 'unavailable');
});

test('GitHub public adapter reads only the selected repository and latest workflow runs', async () => {
  const requests = [];
  const fetcher = async (url, options) => {
    requests.push({ url, options });
    if (url.endsWith('/actions/runs?per_page=5')) {
      return response(200, { workflow_runs: [{ name: 'CI', status: 'completed', conclusion: 'success', head_branch: 'main', event: 'push', updated_at: '2026-11-10T00:00:00Z', html_url: 'https://github.com/OCodejs/OCodejs/actions/runs/1' }] });
    }
    return response(200, { full_name: 'OCodejs/OCodejs', description: 'Public repository', default_branch: 'main', stargazers_count: 12, open_issues_count: 3, updated_at: '2026-11-10T00:00:00Z', html_url: 'https://github.com/OCodejs/OCodejs' });
  };
  const result = await fetchGitHubPublicStatus(fetcher);
  assert.equal(result.state, 'connected');
  assert.equal(result.repository.defaultBranch, 'main');
  assert.equal(result.repository.stars, 12);
  assert.equal(result.workflows.runs[0].conclusion, 'success');
  assert.equal(requests.length, 2);
  assert.ok(requests.every(({ options }) => options.method === 'GET'));
  assert.ok(requests.every(({ options }) => options.credentials === 'omit'));
  assert.ok(requests.every(({ options }) => !Object.keys(options.headers).some((key) => key.toLowerCase() === 'authorization')));
  assert.ok(requests.every(({ url }) => url === 'https://api.github.com/repos/OCodejs/OCodejs' || url.startsWith('https://api.github.com/repos/OCodejs/OCodejs/')));
});

test('rate limits are reported as unavailable instead of manufacturing zero metrics', async () => {
  await assert.rejects(
    fetchGitHubPublicStatus(async () => response(403, {}, { 'x-ratelimit-remaining': '0' })),
    (error) => error instanceof GitHubPublicApiError && error.code === 'rate_limited',
  );
});

test('a forbidden GitHub response is not mislabeled as a rate limit', async () => {
  await assert.rejects(
    fetchGitHubPublicStatus(async () => response(403, {})),
    (error) => error instanceof GitHubPublicApiError && error.code === 'forbidden',
  );
});

test('workflow endpoint failure preserves verified repository metadata', async () => {
  const fetcher = async (url) => url.endsWith('/actions/runs?per_page=5')
    ? response(404, {})
    : response(200, { full_name: 'OCodejs/OCodejs', default_branch: 'main', stargazers_count: 0, open_issues_count: 0, html_url: 'https://github.com/OCodejs/OCodejs' });
  const result = await fetchGitHubPublicStatus(fetcher);
  assert.equal(result.state, 'connected');
  assert.equal(result.repository.stars, 0);
  assert.equal(result.workflows.state, 'unavailable');
  assert.equal(result.workflows.reason, 'not_found');
});
