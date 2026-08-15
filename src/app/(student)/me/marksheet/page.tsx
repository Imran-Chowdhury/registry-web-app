import { EmptyState } from '@/components/ui';

export default function StudentMarksheetPage() {
  return (
    <>
      <h1 className="mb-8 text-xl">Marksheet</h1>
      <EmptyState
        title="Your published results appear here."
        description="Results arrive in Phase 5. Work that is marked but withheld is listed separately, with the reason."
      />
    </>
  );
}
