import { Badge, type BadgeTone } from '@/components/ui';

import type { EnrolmentStatusValue } from '../schema';

/** One mapping, used everywhere a status appears, so the colours never drift apart. */
const TONES: Record<EnrolmentStatusValue, BadgeTone> = {
  ENROLLED: 'enrolled',
  DEFERRED: 'deferred',
  WITHDRAWN: 'withdrawn',
  COMPLETED: 'completed',
};

const LABELS: Record<EnrolmentStatusValue, string> = {
  ENROLLED: 'Enrolled',
  DEFERRED: 'Deferred',
  WITHDRAWN: 'Withdrawn',
  COMPLETED: 'Completed',
};

export function StatusBadge({ status }: { status: EnrolmentStatusValue }) {
  return (
    <Badge tone={TONES[status]} dot>
      {LABELS[status]}
    </Badge>
  );
}

export function statusLabel(status: EnrolmentStatusValue): string {
  return LABELS[status];
}
