'use client';

import { useActionState } from 'react';

import { Badge, Button, EmptyState } from '@/components/ui';
import { formatDateTime, formatDelayLong, relativeToNow } from '@/lib/dates';
import { formatBytes } from '@/lib/file-size';
import { cn } from '@/lib/utils';

import type { StudentAssessmentCard } from '../types';

type UploadState = { status: 'idle' | 'success' | 'error'; message?: string };
type UploadAction = (state: UploadState, formData: FormData) => Promise<UploadState>;

const ACCEPTED_LABEL = 'PDF or DOCX';
const MAX_LABEL = '10 MB';

/**
 * Four distinct states per DESIGN.md §5.2 — open/not submitted, open/submitted,
 * closed/late, closed/missing. A student should be able to tell which one they are in
 * without reading the whole card.
 */
export function StudentAssessmentList({
  assessments,
  uploadAction,
}: {
  assessments: StudentAssessmentCard[];
  /** Passed down from the server component so the action stays out of the client graph. */
  uploadAction: UploadAction;
}) {
  if (assessments.length === 0) {
    return (
      <EmptyState
        title="No assessments on your programme yet."
        description="They will appear here as soon as your modules have coursework set."
      />
    );
  }

  return (
    <div className="space-y-4">
      {assessments.map((assessment) => (
        <AssessmentCard
          key={assessment.id}
          assessment={assessment}
          uploadAction={uploadAction}
        />
      ))}
    </div>
  );
}

function AssessmentCard({
  assessment,
  uploadAction,
}: {
  assessment: StudentAssessmentCard;
  uploadAction: UploadAction;
}) {
  const [state, formAction, pending] = useActionState<UploadState, FormData>(
    uploadAction,
    { status: 'idle' },
  );

  const latest = assessment.latest;
  const late = latest?.isLate ?? false;

  return (
    <article
      className={cn(
        'rounded-card border bg-paper px-4 py-4',
        late ? 'border-alert' : assessment.isClosed ? 'border-rule' : 'border-ink',
        assessment.isClosed && !latest && 'opacity-70',
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-medium">{assessment.title}</h2>
          <p className="mt-0.5 font-mono text-xs text-muted">
            {assessment.moduleCode} · {assessment.moduleName}
          </p>
        </div>
        {latest ? (
          late ? (
            <Badge tone="alert">Submitted late</Badge>
          ) : (
            <Badge tone="enrolled" dot>
              Submitted
            </Badge>
          )
        ) : assessment.isClosed ? (
          <Badge tone="alert">Not submitted</Badge>
        ) : (
          <Badge tone="neutral">Not yet submitted</Badge>
        )}
      </div>

      <p className="mt-3 font-mono text-xs">
        Due {formatDateTime(assessment.deadline)}
        <span className="ml-2 font-sans text-muted">
          {assessment.isClosed ? 'closed ' : ''}
          {relativeToNow(assessment.deadline)}
        </span>
      </p>

      {latest && (
        <div className="mt-3 rounded-control border border-rule bg-surface px-3 py-2 text-xs">
          <a
            href={`/api/submissions/${latest.id}/file`}
            className="font-mono underline underline-offset-2"
          >
            {latest.fileName}
          </a>
          <span className="ml-2 font-mono text-muted">
            {formatBytes(latest.fileSize)}
          </span>
          <p className="mt-1 text-muted">
            Attempt {latest.attempt} of {assessment.attemptCount} · submitted{' '}
            {formatDateTime(latest.submittedAt)}
          </p>
          {late && (
            <p className="mt-1 text-alert">
              Submitted {formatDelayLong(assessment.deadline, latest.submittedAt)} after
              the deadline.
            </p>
          )}
        </div>
      )}

      {assessment.canSubmit ? (
        <form action={formAction} className="mt-4 space-y-2">
          <input type="hidden" name="assessmentId" value={assessment.id} />

          {/* Accepted types and the cap are stated up front, not discovered on failure. */}
          <label
            htmlFor={`file-${assessment.id}`}
            className="block text-xs font-medium"
          >
            {latest ? 'Replace submission' : 'Upload your work'}
            <span className="ml-1 font-normal text-muted">
              — {ACCEPTED_LABEL}, up to {MAX_LABEL}
            </span>
          </label>

          <input
            id={`file-${assessment.id}`}
            type="file"
            name="file"
            accept=".pdf,.docx"
            required
            className="block w-full rounded-control border border-rule bg-paper px-3 py-2 text-xs file:mr-3 file:rounded-control file:border-0 file:bg-ink file:px-3 file:py-1 file:text-paper"
          />

          {latest && !assessment.isClosed && (
            <p className="text-xs text-muted">
              You can replace this until {formatDateTime(assessment.deadline)}.
            </p>
          )}

          <Button type="submit" size="sm" pending={pending} pendingLabel="Uploading…">
            {latest ? 'Replace submission' : 'Submit work'}
          </Button>

          {state.status === 'error' && (
            <p className="text-xs text-alert">{state.message}</p>
          )}
          {state.status === 'success' && (
            <p className="text-xs text-enrolled">{state.message}</p>
          )}
        </form>
      ) : (
        assessment.blockedReason && (
          <p className="mt-4 rounded-control border border-rule bg-surface px-3 py-2 text-xs text-muted">
            {assessment.blockedReason}
          </p>
        )
      )}
    </article>
  );
}
