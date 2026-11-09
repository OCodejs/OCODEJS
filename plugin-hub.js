export function filterPlugins(plugins, { query = "", category = "all", installed = new Set(), sort = "featured" } = {}) {
  const needle = String(query).trim().toLowerCase();
  const result = plugins.filter((plugin) => {
    const matchesCategory = category === "all" || category === "installed" || plugin.type === category;
    const matchesInstalled = category !== "installed" || installed.has(plugin.id);
    const searchable = [plugin.name, plugin.type, plugin.tagline, plugin.description, ...(plugin.tags ?? [])].join(" ").toLowerCase();
    return matchesCategory && matchesInstalled && (!needle || searchable.includes(needle));
  });

  if (sort === "name") result.sort((a, b) => a.name.localeCompare(b.name));
  if (sort === "type") result.sort((a, b) => a.type.localeCompare(b.type) || a.name.localeCompare(b.name));
  return result;
}

export function readInstalled(storage, key, validIds = []) {
  try {
    if (!storage) throw new Error("Browser storage is unavailable.");
    const parsed = JSON.parse(storage.getItem(key) || "[]");
    if (!Array.isArray(parsed)) throw new Error("Saved plugin selection is invalid.");
    const allowed = new Set(validIds);
    return { installed: new Set(parsed.filter((id) => typeof id === "string" && allowed.has(id))), ok: true, error: null };
  } catch (error) {
    return { installed: new Set(), ok: false, error };
  }
}

export function writeInstalled(storage, key, ids) {
  try {
    if (!storage) throw new Error("Browser storage is unavailable.");
    storage.setItem(key, JSON.stringify([...ids]));
    return { ok: true, error: null };
  } catch (error) {
    return { ok: false, error };
  }
}

export function toggleSelection(current, id) {
  const next = new Set(current);
  if (next.has(id)) next.delete(id);
  else next.add(id);
  return next;
}
