'use client';

import { useState } from 'react';

import {
  Badge,
  Button,
  Card,
  CardBody,
  CardFooter,
  CardHeader,
  ConfirmDialog,
  EmptyState,
  Field,
  Input,
  Select,
  Skeleton,
  SkeletonTable,
  TBody,
  TD,
  TH,
  THead,
  TR,
  Table,
  TableCaption,
  Textarea,
  Toaster,
} from '@/components/ui';
import { formatMoney } from '@/lib/money';
import { studentCodePlaceholder } from '@/lib/student-id';
import { toast } from '@/stores/toast-store';

/**
 * Phase 0 verification page: every primitive on one screen, so drift between them is
 * visible in one glance. Delete once the real screens exist.
 */
export default function KitchenSinkPage() {
  const [confirmOpen, setConfirmOpen] = useState(false);

  return (
    <div className="mx-auto flex max-w-[1440px] flex-col gap-8 p-8">
      <header>
        <h1 className="text-xl">Primitives</h1>
        <p className="text-xs text-muted">
          Phase 0 scratch page — tokens, type scale, and every component in{' '}
          <code className="font-mono">components/ui</code>.
        </p>
      </header>

      <Section title="Colour">
        <div className="flex flex-wrap gap-2">
          {(
            [
              ['ink', 'bg-ink'],
              ['paper', 'bg-paper'],
              ['surface', 'bg-surface'],
              ['rule', 'bg-rule'],
              ['muted', 'bg-muted'],
              ['enrolled', 'bg-enrolled'],
              ['deferred', 'bg-deferred'],
              ['withdrawn', 'bg-withdrawn'],
              ['completed', 'bg-completed'],
              ['alert', 'bg-alert'],
            ] as const
          ).map(([name, className]) => (
            <div key={name} className="w-24">
              <div className={`h-10 rounded-control border border-rule ${className}`} />
              <p className="mt-1 font-mono text-xs text-muted">{name}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Type">
        <div className="space-y-1">
          <p className="text-2xl font-mono">28 · IBM Plex Mono · {formatMoney(845000)}</p>
          <h2 className="text-xl">20 · Inter Tight · Rafi Hasan</h2>
          <p className="text-lg">16 · Inter · student body copy</p>
          <p className="text-base">14 · Inter · staff body copy</p>
          <p className="text-sm font-mono">13 · IBM Plex Mono · SMS-2026-0001</p>
          <p className="text-xs text-muted uppercase">12 · Inter · label</p>
        </div>
      </Section>

      <Section title="Buttons">
        <div className="flex flex-wrap items-center gap-2">
          <Button>Add student</Button>
          <Button variant="secondary">Edit</Button>
          <Button variant="ghost">Cancel</Button>
          <Button variant="danger">Withhold result</Button>
          <Button variant="link">View all</Button>
          <Button disabled>Disabled</Button>
          <Button pending pendingLabel="Saving…">
            Save
          </Button>
          <Button size="sm" variant="secondary">
            Small
          </Button>
        </div>
      </Section>

      <Section title="Badges">
        <div className="flex flex-wrap gap-2">
          <Badge tone="enrolled" dot>
            Enrolled
          </Badge>
          <Badge tone="deferred" dot>
            Deferred
          </Badge>
          <Badge tone="withdrawn" dot>
            Withdrawn
          </Badge>
          <Badge tone="completed" dot>
            Completed
          </Badge>
          <Badge tone="alert">62 days overdue</Badge>
          <Badge>Draft</Badge>
        </div>
      </Section>

      <Section title="Form controls">
        <div className="grid max-w-[560px] gap-4">
          <Field label="Full name" htmlFor="name" required>
            <Input id="name" placeholder="Aisha Rahman" />
          </Field>
          <Field
            label="Student code"
            htmlFor="code"
            hint="Generated on save."
          >
            <Input id="code" mono disabled value={studentCodePlaceholder(2026)} readOnly />
          </Field>
          <Field label="Programme" htmlFor="programme">
            <Select id="programme" defaultValue="CSE">
              <option value="CSE">Computer Science (CSE) — {formatMoney(10000)}</option>
              <option value="BBA">Business Administration (BBA) — {formatMoney(5000)}</option>
            </Select>
          </Field>
          <Field label="Email" htmlFor="email" error="That email is already registered.">
            <Input id="email" invalid defaultValue="aisha@example.edu" />
          </Field>
          <Field label="Reason" htmlFor="reason" hint="Recorded in the student's history.">
            <Textarea id="reason" placeholder="Optional" />
          </Field>
        </div>
      </Section>

      <Section title="Table">
        <TableCaption>4 students · 1 overdue</TableCaption>
        <Table>
          <THead>
            <TR>
              <TH mono>Code</TH>
              <TH>Name</TH>
              <TH>Programme</TH>
              <TH>Status</TH>
              <TH numeric>Balance</TH>
            </TR>
          </THead>
          <TBody>
            <TR clickable>
              <TD mono>SMS-2025-0001</TD>
              <TD>Aisha Rahman</TD>
              <TD>CSE</TD>
              <TD>
                <Badge tone="enrolled" dot>
                  Enrolled
                </Badge>
              </TD>
              <TD mono numeric>
                {formatMoney(0)}
              </TD>
            </TR>
            <TR clickable flagged>
              <TD mono>SMS-2025-0004</TD>
              <TD>Rafi Hasan</TD>
              <TD>CSE</TD>
              <TD>
                <Badge tone="enrolled" dot>
                  Enrolled
                </Badge>
              </TD>
              <TD mono numeric>
                {formatMoney(10000)}
                <span className="block text-xs text-alert">62 days overdue</span>
              </TD>
            </TR>
            <TR clickable>
              <TD mono>SMS-2025-0009</TD>
              <TD>Sadia Islam</TD>
              <TD>BBA</TD>
              <TD>
                <Badge tone="deferred" dot>
                  Deferred
                </Badge>
              </TD>
              <TD mono numeric>
                {formatMoney(2500)}
              </TD>
            </TR>
            <TR clickable dimmed>
              <TD mono>SMS-2025-0012</TD>
              <TD>Imtiaz Karim</TD>
              <TD>CSE</TD>
              <TD>
                <Badge tone="withdrawn" dot>
                  Withdrawn
                </Badge>
              </TD>
              <TD mono numeric>
                {formatMoney(0)}
              </TD>
            </TR>
          </TBody>
        </Table>
      </Section>

      <Section title="Card">
        <Card className="max-w-[420px]">
          <CardHeader title="Fee" action={<Badge tone="alert">Overdue</Badge>} />
          <CardBody className="space-y-1 font-mono text-sm">
            <p className="flex justify-between">
              <span>Tuition 2025/26</span> <span>{formatMoney(10000)}</span>
            </p>
            <p className="flex justify-between text-muted">
              <span>Paid</span> <span>{formatMoney(0)}</span>
            </p>
          </CardBody>
          <CardFooter>Due 11 February 2026</CardFooter>
        </Card>
      </Section>

      <Section title="States">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-card border border-rule bg-paper">
            <SkeletonTable columns={['w-28', 'w-40', 'w-12', 'w-20', 'w-16']} />
          </div>
          <div className="space-y-4">
            <EmptyState
              title="No students yet."
              description="Add your first student to get started."
              action={<Button size="sm">Add student</Button>}
            />
            <EmptyState
              tone="alert"
              title="Couldn't load students."
              description="The request failed. Check the connection and try again."
              action={
                <Button size="sm" variant="secondary">
                  Retry
                </Button>
              }
            />
            <Skeleton className="h-4 w-48" />
          </div>
        </div>
      </Section>

      <Section title="Dialog and toast">
        <div className="flex flex-wrap gap-2">
          <Button variant="danger" onClick={() => setConfirmOpen(true)}>
            Publish result
          </Button>
          <Button
            variant="secondary"
            onClick={() => toast.success('Result published.', 'Aisha Rahman · Midterm Report')}
          >
            Success toast
          </Button>
          <Button
            variant="secondary"
            onClick={() =>
              toast.error('Payment not recorded.', 'Reference PAY-0012 already exists.')
            }
          >
            Error toast
          </Button>
        </div>

        <ConfirmDialog
          open={confirmOpen}
          onClose={() => setConfirmOpen(false)}
          onConfirm={() => {
            setConfirmOpen(false);
            toast.success('Result published.');
          }}
          title="Publish this result?"
          description="The student will see the grade and classification immediately."
          confirmLabel="Publish"
          confirmVariant="danger"
        >
          <p className="rounded-control border border-alert/30 bg-alert/5 px-3 py-2 text-xs text-alert">
            Rafi Hasan has {formatMoney(10000)} outstanding, 62 days overdue.
          </p>
        </ConfirmDialog>
      </Section>

      <Toaster />
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <h2 className="border-b border-rule pb-1 text-xs font-medium tracking-wide text-muted uppercase">
        {title}
      </h2>
      {children}
    </section>
  );
}
