import Link from 'next/link';

import { PageHeader } from '@/components/shared/page-header';
import { buttonClasses } from '@/components/ui';
import { AssessmentList } from '@/features/assessments';

export default function AssessmentsPage() {
  return (
    <>
      <PageHeader
        title="Assessments"
        description="Deadlines, submissions, and what still needs marking."
        action={
          <Link href="/assessments/new" className={buttonClasses('primary', 'md')}>
            + New assessment
          </Link>
        }
      />
      <AssessmentList />
    </>
  );
}
