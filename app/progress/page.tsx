'use client';

import React, { useMemo, useState, useSyncExternalStore } from 'react';

type Subtask = {
  id: string;
  text: string;
  done: boolean;
  weight: number;
};

type Todo = {
  id: string;
  title: string;
  subtasks: Subtask[];
};

const STORAGE_KEY = 'progress-v1';

/** ---------- localStorage base helpers ---------- */

function saveTodos(todos: Todo[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
  } catch {
    // ignore quota/private-mode errors
  }
}

/**
 * localStorage doesn't notify the *same tab* when you call setItem(),
 * and the "storage" event fires only across other tabs/windows.
 * We'll use a tiny custom event to notify same-tab subscribers.
 */
const LOCAL_STORAGE_EVENT = 'progress-storage-changed';

/** ---------- cached external-store layer ---------- */

// Cached snapshots (stable references)
let cachedSnapshot: Todo[] = [];
let cachedRaw: string | null = null;

function readAndCache(): Todo[] {
  if (typeof window === 'undefined') return cachedSnapshot;

  const raw = localStorage.getItem(STORAGE_KEY);
  if (raw === cachedRaw) return cachedSnapshot;

  cachedRaw = raw;

  if (!raw) {
    cachedSnapshot = [];
    return cachedSnapshot;
  }

  try {
    const parsed = JSON.parse(raw);
    cachedSnapshot = Array.isArray(parsed) ? (parsed as Todo[]) : [];
  } catch {
    cachedSnapshot = [];
  }

  return cachedSnapshot;
}

function notifySameTab() {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new Event(LOCAL_STORAGE_EVENT));
}

function subscribe(onStoreChange: () => void) {
  if (typeof window === 'undefined') return () => {};

  const handler = () => onStoreChange();

  // Other tabs/windows
  window.addEventListener('storage', handler);
  // Same tab
  window.addEventListener(LOCAL_STORAGE_EVENT, handler);

  return () => {
    window.removeEventListener('storage', handler);
    window.removeEventListener(LOCAL_STORAGE_EVENT, handler);
  };
}

function getSnapshot(): Todo[] {
  // Cached => stable reference when unchanged
  return readAndCache();
}

const SERVER_SNAPSHOT: Todo[] = [];
function getServerSnapshot(): Todo[] {
  // Cached => stable reference
  return SERVER_SNAPSHOT;
}

function setAllTodos(next: Todo[]) {
  saveTodos(next);
  cachedSnapshot = next;
  cachedRaw = JSON.stringify(next);
  notifySameTab();
}

function updateTodos(updater: (prev: Todo[]) => Todo[]) {
  const prev = readAndCache();
  const next = updater(prev);
  setAllTodos(next);
}

function resetTodos() {
  if (typeof window === 'undefined') return;

  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }

  cachedSnapshot = [];
  cachedRaw = null;
  notifySameTab();
}

/** ---------- progress helpers ---------- */

function clampPct(n: number) {
  return Math.max(0, Math.min(100, n));
}

function safeWeight(w: number) {
  if (!Number.isFinite(w)) return 1;
  return Math.max(0, w);
}

function weightedPct(subtasks: Subtask[]) {
  const total = subtasks.reduce((acc, s) => acc + safeWeight(s.weight), 0);
  if (total <= 0) return 0;
  const done = subtasks.filter(s => s.done).reduce((acc, s) => acc + safeWeight(s.weight), 0);
  return Math.round((done / total) * 100);
}

function ProgressBar({ pct }: { pct: number }) {
  const safe = clampPct(pct);
  return (
    <div
      aria-label="progress bar"
      style={{
        height: 12,
        borderRadius: 999,
        background: 'rgba(0,0,0,0.10)',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          height: '100%',
          width: `${safe}%`,
          borderRadius: 999,
          background: 'black',
          transition: 'width 200ms ease',
        }}
      />
    </div>
  );
}

/** ---------- import/export ---------- */

function exportTodos(todos: Todo[]) {
  const json = JSON.stringify(todos, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = 'progress-backup.json';
  a.click();

  URL.revokeObjectURL(url);
}

function sanitizeImportedTodos(parsed: unknown): Todo[] | null {
  if (!Array.isArray(parsed)) return null;

  const arr = parsed as Array<Record<string, unknown>>;

  const cleaned: Todo[] = arr.map(t => {
    const subtasksRaw = (t.subtasks as unknown) ?? [];
    const subtasksArr = Array.isArray(subtasksRaw) ? (subtasksRaw as Array<Record<string, unknown>>) : [];

    const subtasks: Subtask[] = subtasksArr.map(s => ({
      id: typeof s.id === 'string' ? s.id : crypto.randomUUID(),
      text: typeof s.text === 'string' ? s.text : '',
      done: Boolean(s.done),
      weight: Number.isFinite(Number(s.weight)) ? Math.max(0, Number(s.weight)) : 1,
    }));

    return {
      id: typeof t.id === 'string' ? t.id : crypto.randomUUID(),
      title: typeof t.title === 'string' ? t.title : 'Untitled',
      subtasks,
    };
  });

  return cleaned;
}

function importTodosFromJsonText(text: string) {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    alert('Invalid JSON file.');
    return;
  }

  const cleaned = sanitizeImportedTodos(parsed);
  if (!cleaned) {
    alert('JSON must be an array of todos (same format as Export).');
    return;
  }

  setAllTodos(cleaned);
}

/** ---------- page ---------- */

export default function ProgressPage() {
  const todos = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const [newTodoTitle, setNewTodoTitle] = useState('');

  // Reset modal (type RESET)
  const [showResetDialog, setShowResetDialog] = useState(false);
  const [resetText, setResetText] = useState('');

  // Import state (just for button text)
  const [isImporting, setIsImporting] = useState(false);

  const overallPct = useMemo(() => {
    const all = todos.flatMap(t => t.subtasks);
    return weightedPct(all);
  }, [todos]);

  function addTodo(e: React.FormEvent) {
    e.preventDefault();
    const title = newTodoTitle.trim();
    if (!title) return;

    updateTodos(prev => [{ id: crypto.randomUUID(), title, subtasks: [] }, ...prev]);
    setNewTodoTitle('');
  }

  function removeTodo(todoId: string) {
    updateTodos(prev => prev.filter(t => t.id !== todoId));
  }

  function addSubtask(todoId: string, text: string, weight: number) {
    const trimmed = text.trim();
    if (!trimmed) return;

    const w = safeWeight(weight);

    updateTodos(prev =>
      prev.map(t =>
        t.id === todoId
          ? {
              ...t,
              subtasks: [{ id: crypto.randomUUID(), text: trimmed, done: false, weight: w }, ...t.subtasks],
            }
          : t
      )
    );
  }

  function toggleSubtask(todoId: string, subId: string) {
    updateTodos(prev =>
      prev.map(t =>
        t.id === todoId
          ? { ...t, subtasks: t.subtasks.map(s => (s.id === subId ? { ...s, done: !s.done } : s)) }
          : t
      )
    );
  }

  function removeSubtask(todoId: string, subId: string) {
    updateTodos(prev =>
      prev.map(t => (t.id === todoId ? { ...t, subtasks: t.subtasks.filter(s => s.id !== subId) } : t))
    );
  }

  function setSubtaskWeight(todoId: string, subId: string, weight: number) {
    const w = safeWeight(weight);
    updateTodos(prev =>
      prev.map(t =>
        t.id === todoId ? { ...t, subtasks: t.subtasks.map(s => (s.id === subId ? { ...s, weight: w } : s)) } : t
      )
    );
  }

  return (
    <main style={{ maxWidth: 820, margin: '40px auto', padding: '0 16px' }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 6 }}>
        <h1 style={{ fontSize: 32, margin: 0 }}>Progress</h1>

        {/* Hidden file input for Import */}
        <input
          type="file"
          accept="application/json"
          id="import-progress-json"
          style={{ display: 'none' }}
          onChange={async e => {
            const file = e.target.files?.[0];
            e.target.value = ''; // allow re-uploading same file
            if (!file) return;

            setIsImporting(true);
            try {
              const text = await file.text();
              importTodosFromJsonText(text);
            } finally {
              setIsImporting(false);
            }
          }}
        />

        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
          <button
            type="button"
            onClick={() => document.getElementById('import-progress-json')?.click()}
            disabled={isImporting}
            style={{
              padding: '8px 12px',
              borderRadius: 10,
              border: '1px solid rgba(0,0,0,0.2)',
              background: 'white',
              cursor: isImporting ? 'not-allowed' : 'pointer',
              opacity: isImporting ? 0.6 : 1,
            }}
            title="Import progress from JSON"
          >
            {isImporting ? 'Importing…' : 'Import'}
          </button>

          <button
            type="button"
            onClick={() => exportTodos(todos)}
            style={{
              padding: '8px 12px',
              borderRadius: 10,
              border: '1px solid rgba(0,0,0,0.2)',
              background: 'white',
              cursor: 'pointer',
            }}
            title="Export progress as JSON"
          >
            Export
          </button>

          <button
            type="button"
            onClick={() => {
              setResetText('');
              setShowResetDialog(true);
            }}
            style={{
              padding: '8px 12px',
              borderRadius: 10,
              border: '1px solid rgba(0,0,0,0.2)',
              background: 'white',
              cursor: 'pointer',
            }}
            title="Reset all progress"
          >
            Reset
          </button>
        </div>
      </div>

      <p style={{ opacity: 0.8, marginBottom: 14 }}>Overall (weighted): {overallPct}%</p>
      <div style={{ marginBottom: 26 }}>
        <ProgressBar pct={overallPct} />
      </div>

      {/* Add new todo */}
      <form onSubmit={addTodo} style={{ display: 'flex', gap: 8, marginBottom: 18 }}>
        <input
          value={newTodoTitle}
          onChange={e => setNewTodoTitle(e.target.value)}
          placeholder="New todo (project)…"
          style={{
            flex: 1,
            padding: '10px 12px',
            borderRadius: 10,
            border: '1px solid rgba(0,0,0,0.2)',
          }}
        />
        <button
          type="submit"
          style={{
            padding: '10px 14px',
            borderRadius: 10,
            border: '1px solid rgba(0,0,0,0.2)',
            background: 'white',
            cursor: 'pointer',
          }}
        >
          Add
        </button>
      </form>

      <div style={{ display: 'grid', gap: 14 }}>
        {todos.map(todo => (
          <TodoCard
            key={todo.id}
            todo={todo}
            onRemoveTodo={() => removeTodo(todo.id)}
            onAddSubtask={(text, weight) => addSubtask(todo.id, text, weight)}
            onToggleSubtask={subId => toggleSubtask(todo.id, subId)}
            onRemoveSubtask={subId => removeSubtask(todo.id, subId)}
            onSetSubtaskWeight={(subId, w) => setSubtaskWeight(todo.id, subId, w)}
          />
        ))}
      </div>

      <p style={{ marginTop: 18, opacity: 0.65 }}>
        Tip: progress is computed by <code>sum(done weights) / sum(all weights)</code>.
      </p>

      {/* RESET CONFIRM MODAL (type RESET) */}
      {showResetDialog && (
        <div
          role="dialog"
          aria-modal="true"
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
          onClick={() => setShowResetDialog(false)}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: 'white',
              borderRadius: 14,
              padding: 20,
              width: '100%',
              maxWidth: 420,
              boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
            }}
          >
            <h2 style={{ marginTop: 0 }}>Reset all progress?</h2>

            <p style={{ opacity: 0.8 }}>
              This will permanently delete <strong>all todos and subtasks</strong>.
              <br />
              Type <code>RESET</code> to confirm.
            </p>

            <input
              autoFocus
              value={resetText}
              onChange={e => setResetText(e.target.value)}
              placeholder="Type RESET"
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: 10,
                border: '1px solid rgba(0,0,0,0.3)',
                marginBottom: 14,
              }}
            />

            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => setShowResetDialog(false)}
                style={{
                  padding: '8px 12px',
                  borderRadius: 10,
                  border: '1px solid rgba(0,0,0,0.2)',
                  background: 'white',
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={resetText !== 'RESET'}
                onClick={() => {
                  resetTodos();
                  setShowResetDialog(false);
                }}
                style={{
                  padding: '8px 12px',
                  borderRadius: 10,
                  border: '1px solid rgba(0,0,0,0.2)',
                  background: resetText === 'RESET' ? 'black' : 'rgba(0,0,0,0.15)',
                  color: resetText === 'RESET' ? 'white' : 'black',
                  cursor: resetText === 'RESET' ? 'pointer' : 'not-allowed',
                }}
              >
                Reset everything
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

/** ---------- todo card ---------- */

function TodoCard({
  todo,
  onRemoveTodo,
  onAddSubtask,
  onToggleSubtask,
  onRemoveSubtask,
  onSetSubtaskWeight,
}: {
  todo: Todo;
  onRemoveTodo: () => void;
  onAddSubtask: (text: string, weight: number) => void;
  onToggleSubtask: (subId: string) => void;
  onRemoveSubtask: (subId: string) => void;
  onSetSubtaskWeight: (subId: string, weight: number) => void;
}) {
  const pct = weightedPct(todo.subtasks);

  const totalW = todo.subtasks.reduce((a, s) => a + safeWeight(s.weight), 0);
  const doneW = todo.subtasks.filter(s => s.done).reduce((a, s) => a + safeWeight(s.weight), 0);

  const [collapsed, setCollapsed] = useState(false);

  const [newSub, setNewSub] = useState('');
  const [newWeight, setNewWeight] = useState('1');

  function submitSub(e: React.FormEvent) {
    e.preventDefault();
    const w = Number(newWeight);
    onAddSubtask(newSub, Number.isFinite(w) ? w : 1);
    setNewSub('');
    setNewWeight('1');
  }

  return (
    <section
      style={{
        border: '1px solid rgba(0,0,0,0.12)',
        borderRadius: 14,
        padding: 14,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <button
          type="button"
          onClick={() => setCollapsed(c => !c)}
          style={{
            borderRadius: 10,
            border: '1px solid rgba(0,0,0,0.15)',
            background: 'white',
            padding: '6px 10px',
            cursor: 'pointer',
            minWidth: 40,
          }}
          aria-expanded={!collapsed}
          aria-label={collapsed ? `Expand ${todo.title}` : `Collapse ${todo.title}`}
          title={collapsed ? 'Expand' : 'Collapse'}
        >
          {collapsed ? '▸' : '▾'}
        </button>

        <h2 style={{ fontSize: 18, margin: 0, flex: 1 }}>{todo.title}</h2>

        <span style={{ opacity: 0.75, fontSize: 14 }}>
          {pct}% (done {doneW}/{totalW})
        </span>

        <button
          onClick={onRemoveTodo}
          style={{
            borderRadius: 10,
            border: '1px solid rgba(0,0,0,0.15)',
            background: 'white',
            padding: '6px 10px',
            cursor: 'pointer',
          }}
          aria-label={`Remove todo ${todo.title}`}
          title="Remove todo"
        >
          ✕
        </button>
      </div>

      <div style={{ marginTop: 10, marginBottom: 12 }}>
        <ProgressBar pct={pct} />
      </div>

      {!collapsed && (
        <>
          {/* Add subtask with weight */}
          <form onSubmit={submitSub} style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
            <input
              value={newSub}
              onChange={e => setNewSub(e.target.value)}
              placeholder="Add a subtask…"
              style={{
                flex: 1,
                padding: '9px 12px',
                borderRadius: 10,
                border: '1px solid rgba(0,0,0,0.2)',
              }}
            />

            <input
              value={newWeight}
              onChange={e => setNewWeight(e.target.value)}
              inputMode="decimal"
              placeholder="Weight"
              style={{
                width: 110,
                padding: '9px 10px',
                borderRadius: 10,
                border: '1px solid rgba(0,0,0,0.2)',
              }}
              aria-label="Subtask weight"
              title="Subtask weight"
            />

            <button
              type="submit"
              style={{
                padding: '9px 12px',
                borderRadius: 10,
                border: '1px solid rgba(0,0,0,0.2)',
                background: 'white',
                cursor: 'pointer',
              }}
            >
              Add
            </button>
          </form>

          {/* Subtasks */}
          {todo.subtasks.length === 0 ? (
            <p style={{ margin: 0, opacity: 0.65 }}>No subtasks yet.</p>
          ) : (
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: 8 }}>
              {todo.subtasks.map(s => (
                <li
                  key={s.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '10px 10px',
                    borderRadius: 12,
                    border: '1px solid rgba(0,0,0,0.10)',
                  }}
                >
                  <input type="checkbox" checked={s.done} onChange={() => onToggleSubtask(s.id)} />

                  <span
                    style={{
                      flex: 1,
                      textDecoration: s.done ? 'line-through' : 'none',
                      opacity: s.done ? 0.6 : 1,
                    }}
                  >
                    {s.text}
                  </span>

                  <input
                    value={String(s.weight)}
                    onChange={e => onSetSubtaskWeight(s.id, Number(e.target.value))}
                    inputMode="decimal"
                    style={{
                      width: 90,
                      padding: '6px 8px',
                      borderRadius: 10,
                      border: '1px solid rgba(0,0,0,0.2)',
                    }}
                    aria-label={`Weight for ${s.text}`}
                    title="Weight"
                  />

                  <button
                    onClick={() => onRemoveSubtask(s.id)}
                    style={{
                      borderRadius: 10,
                      border: '1px solid rgba(0,0,0,0.15)',
                      background: 'white',
                      padding: '6px 10px',
                      cursor: 'pointer',
                    }}
                    aria-label={`Remove subtask ${s.text}`}
                    title="Remove subtask"
                  >
                    ✕
                  </button>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </section>
  );
}
