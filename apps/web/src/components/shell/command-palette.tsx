'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Search } from 'lucide-react';
import { cx } from '@/components/ui/primitives';

export interface Command {
  id: string;
  label: string;
  group: string;
  run: () => void;
}

export function CommandPalette({
  open,
  onClose,
  commands,
}: {
  open: boolean;
  onClose: () => void;
  commands: Command[];
}) {
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return commands;
    return commands.filter((c) => c.label.toLowerCase().includes(q));
  }, [commands, query]);

  useEffect(() => {
    if (open) {
      setQuery('');
      setSelected(0);
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [open]);

  useEffect(() => setSelected(0), [query]);

  if (!open) return null;

  const run = (command: Command) => {
    onClose();
    command.run();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 pt-[18vh]"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Command palette"
    >
      <div
        className="w-full max-w-lg overflow-hidden rounded-modal border border-border bg-surface-raised shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2 border-b border-border px-4">
          <Search className="h-4 w-4 text-muted" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Escape') onClose();
              if (e.key === 'ArrowDown') {
                e.preventDefault();
                setSelected((s) => Math.min(s + 1, filtered.length - 1));
              }
              if (e.key === 'ArrowUp') {
                e.preventDefault();
                setSelected((s) => Math.max(s - 1, 0));
              }
              if (e.key === 'Enter' && filtered[selected]) run(filtered[selected]);
            }}
            placeholder="Type a command or search…"
            className="h-12 flex-1 bg-transparent text-sm outline-none placeholder:text-muted"
          />
        </div>
        <ul className="max-h-80 overflow-y-auto p-2">
          {filtered.length === 0 && (
            <li className="px-3 py-6 text-center text-sm text-muted">No results</li>
          )}
          {filtered.map((command, i) => (
            <li key={command.id}>
              <button
                onClick={() => run(command)}
                onMouseEnter={() => setSelected(i)}
                className={cx(
                  'flex w-full items-center justify-between rounded-control px-3 py-2 text-left text-sm',
                  i === selected ? 'bg-accent text-foreground' : 'text-foreground',
                )}
              >
                {command.label}
                <span className="text-[12px] text-muted">{command.group}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
