'use client';

import { useState } from 'react';

import { Input } from '@/components/ui';

import { classify } from '../classification';
import { gradeSchema } from '../schema';

/**
 * Inline grade entry: type a number, blur or press Enter, it saves. Marking twenty
 * students should be twenty keystroke sequences, not twenty dialogs — so there is no
 * edit mode, no save button, and no modal in this path.
 *
 * Local state is the draft being typed, not server data: it exists only between
 * keystroke and commit, and the committed value comes back through the query.
 */
export function GradeInput({
  grade,
  disabled,
  disabledReason,
  onCommit,
}: {
  grade: number | null;
  disabled?: boolean;
  disabledReason?: string;
  onCommit: (grade: number) => void;
}) {
  const committed = grade === null ? '' : String(grade);
  const [draft, setDraft] = useState(committed);
  const [error, setError] = useState<string | null>(null);
  const [seen, setSeen] = useState(committed);

  // Follows the server when the value changes underneath — a bulk action, or a rolled
  // back optimistic update. Adjusted during render rather than in an effect: an effect
  // here would render the stale number first and correct it a frame later.
  if (committed !== seen) {
    setSeen(committed);
    setDraft(committed);
    setError(null);
  }

  function commit() {
    const trimmed = draft.trim();

    if (trimmed === '') {
      // Clearing the box is a cancel, not a request to erase the mark. Removing a grade
      // is a deliberate act, and there is no screen for it.
      setDraft(committed);
      setError(null);
      return;
    }

    const parsed = gradeSchema.safeParse(trimmed);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Enter a grade from 0 to 100.');
      return;
    }

    setError(null);
    if (parsed.data !== grade) onCommit(parsed.data);
  }

  const classification = error ? null : classify(draft === '' ? null : Number(draft));

  return (
    <div className="inline-flex flex-col items-center gap-0.5">
      <Input
        mono
        value={draft}
        disabled={disabled}
        invalid={Boolean(error)}
        inputMode="numeric"
        aria-label="Grade out of 100"
        title={disabled ? disabledReason : undefined}
        className="h-8 w-14 px-1 text-center"
        onChange={(event) => setDraft(event.target.value)}
        onBlur={commit}
        onKeyDown={(event) => {
          if (event.key === 'Enter') event.currentTarget.blur();
          if (event.key === 'Escape') {
            setDraft(committed);
            setError(null);
          }
        }}
      />
      {error ? (
        <span className="text-xs text-alert">{error}</span>
      ) : (
        <span className="text-xs text-muted">{classification ?? '—'}</span>
      )}
    </div>
  );
}
