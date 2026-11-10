export function formatMetric(value, { maximumFractionDigits = 0 } = {}) {
  if (value === null || value === undefined || value === '') return '—';
  const number = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(number)) return '—';
  return new Intl.NumberFormat('vi-VN', { maximumFractionDigits }).format(number);
}

export function getSourceState({ configured = false, latestSampleAt = null, now = Date.now(), staleAfterMs = 60_000 } = {}) {
  if (!configured) return 'not_connected';
  if (latestSampleAt === null || latestSampleAt === undefined || latestSampleAt === '') return 'no_sample';
  const sampleTime = typeof latestSampleAt === 'number' ? latestSampleAt : Date.parse(latestSampleAt);
  if (!Number.isFinite(sampleTime)) return 'unavailable';
  return now - sampleTime < staleAfterMs ? 'live' : 'stale';
}

export const sourceStateLabels = Object.freeze({
  not_connected: 'Chưa kết nối',
  no_sample: 'Chưa có mẫu',
  live: 'Đang mới',
  stale: 'Dữ liệu cũ',
  unavailable: 'Không khả dụng',
});


export function resolveViewFromHash(hash, currentView = 'overview', allowedViews = []) {
  const requested = String(hash || '').replace(/^#/, '');
  if (!requested || requested === 'main-shell') {
    return allowedViews.includes(currentView) ? currentView : 'overview';
  }
  return allowedViews.includes(requested) ? requested : 'overview';
}

export function isTimestampStale(timestamp, { now = Date.now(), maxAgeMs = 5 * 60 * 1000 } = {}) {
  if (timestamp === null || timestamp === undefined || timestamp === '') return false;
  const parsed = typeof timestamp === 'number' ? timestamp : Date.parse(timestamp);
  if (!Number.isFinite(parsed)) return false;
  return now - parsed >= maxAgeMs;
}
