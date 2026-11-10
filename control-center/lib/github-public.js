const REPOSITORY = 'OCodejs/OCodejs';
const API_ROOT = 'https://api.github.com';
const REQUEST_HEADERS = Object.freeze({
  Accept: 'application/vnd.github+json',
  'X-GitHub-Api-Version': '2022-11-28',
});

export class GitHubPublicApiError extends Error {
  constructor(code, message, status = null) {
    super(message);
    this.name = 'GitHubPublicApiError';
    this.code = code;
    this.status = status;
  }
}

async function getJson(fetcher, url) {
  let response;
  try {
    response = await fetcher(url, {
      method: 'GET',
      headers: REQUEST_HEADERS,
      credentials: 'omit',
      cache: 'no-store',
      signal: AbortSignal.timeout(8_000),
    });
  } catch {
    throw new GitHubPublicApiError('network_error', 'Không truy cập được GitHub Public API.');
  }

  if (!response.ok) {
    const remaining = response.headers?.get?.('x-ratelimit-remaining');
    const retryAfter = response.headers?.get?.('retry-after');
    const isRateLimited = response.status === 429
      || (response.status === 403 && (remaining === '0' || Boolean(retryAfter)));
    const code = isRateLimited
      ? 'rate_limited'
      : response.status === 403
        ? 'forbidden'
        : response.status === 404
          ? 'not_found'
          : 'http_error';
    throw new GitHubPublicApiError(code, `GitHub Public API trả về HTTP ${response.status}.`, response.status);
  }

  try {
    return await response.json();
  } catch {
    throw new GitHubPublicApiError('invalid_response', 'GitHub Public API trả về dữ liệu không hợp lệ.');
  }
}

function safeGitHubUrl(value, fallback) {
  try {
    const parsed = new URL(value);
    if (parsed.protocol === 'https:' && parsed.hostname === 'github.com') return parsed.href;
  } catch {
    // Use a fixed public repository URL when the API field is absent or malformed.
  }
  return fallback;
}

function normalizeRun(run) {
  const status = typeof run.status === 'string' ? run.status : 'unknown';
  const conclusion = typeof run.conclusion === 'string' ? run.conclusion : null;
  return {
    name: typeof run.name === 'string' && run.name ? run.name : 'GitHub Actions workflow',
    branch: typeof run.head_branch === 'string' ? run.head_branch : '—',
    status,
    conclusion,
    event: typeof run.event === 'string' ? run.event : '—',
    updatedAt: typeof run.updated_at === 'string' ? run.updated_at : null,
    url: safeGitHubUrl(run.html_url, `https://github.com/${REPOSITORY}/actions`),
  };
}

export async function fetchGitHubPublicStatus(fetcher = globalThis.fetch) {
  if (typeof fetcher !== 'function') {
    throw new GitHubPublicApiError('network_error', 'Fetch API không khả dụng trong trình duyệt này.');
  }

  const repository = await getJson(fetcher, `${API_ROOT}/repos/${REPOSITORY}`);
  if (repository.full_name?.toLowerCase() !== REPOSITORY.toLowerCase() || typeof repository.default_branch !== 'string') {
    throw new GitHubPublicApiError('invalid_response', 'Repository response không khớp với repo đã chọn.');
  }

  let workflows;
  try {
    const response = await getJson(fetcher, `${API_ROOT}/repos/${REPOSITORY}/actions/runs?per_page=5`);
    const runs = Array.isArray(response.workflow_runs) ? response.workflow_runs.slice(0, 5).map(normalizeRun) : null;
    workflows = runs
      ? { state: 'available', runs }
      : { state: 'unavailable', runs: [], reason: 'invalid_response' };
  } catch (error) {
    workflows = {
      state: 'unavailable',
      runs: [],
      reason: error instanceof GitHubPublicApiError ? error.code : 'unknown_error',
    };
  }

  return {
    state: 'connected',
    source: 'GitHub Public REST API',
    checkedAt: new Date().toISOString(),
    repository: {
      name: repository.full_name,
      description: typeof repository.description === 'string' ? repository.description : '',
      defaultBranch: repository.default_branch,
      stars: Number.isFinite(repository.stargazers_count) ? repository.stargazers_count : null,
      openIssues: Number.isFinite(repository.open_issues_count) ? repository.open_issues_count : null,
      updatedAt: typeof repository.updated_at === 'string' ? repository.updated_at : null,
      url: safeGitHubUrl(repository.html_url, `https://github.com/${REPOSITORY}`),
    },
    workflows,
  };
}
