export const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
export const today = () => new Date().toISOString().slice(0, 10);

// ─── TASK DEPENDENCIES ──────────────────────────────────────────
// A task is "blocked" when any task it depends on is not yet in the
// last (Done) column.
export function blockingTasks(task, tasks, columns) {
  const deps = task?.dependsOn || [];
  if (!deps.length || !columns?.length) return [];
  const lastCol = columns[columns.length - 1];
  return deps
    .map(id => tasks.find(t => t.id === id))
    .filter(d => d && d.status !== lastCol);
}

export function isTaskBlocked(task, tasks, columns) {
  return blockingTasks(task, tasks, columns).length > 0;
}

// Returns true if `fromId` (transitively) depends on `toId` — used to
// prevent creating circular dependencies.
export function dependsOnTransitively(fromId, toId, tasks) {
  const visited = new Set();
  const stack = [fromId];
  while (stack.length) {
    const cur = stack.pop();
    if (cur === toId) return true;
    if (visited.has(cur)) continue;
    visited.add(cur);
    const t = tasks.find(x => x.id === cur);
    (t?.dependsOn || []).forEach(d => stack.push(d));
  }
  return false;
}
