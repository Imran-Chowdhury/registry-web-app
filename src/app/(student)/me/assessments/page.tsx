import { StudentAssessmentList } from '@/features/assessments';
import { submissionService, uploadSubmission } from '@/features/assessments/server';
import { getViewer } from '@/lib/viewer';

export default async function StudentAssessmentsPage() {
  const viewer = await getViewer();
  // Scoped to the cookie-derived viewer; the service refuses anything else.
  const assessments = await submissionService.listForSelf(viewer);

  return (
    <>
      <h1 className="mb-8 text-xl">Assessments</h1>
      {/*
        The Server Action is handed down as a prop rather than imported by the client
        component, which keeps its server-only import graph out of the browser bundle.
      */}
      <StudentAssessmentList
        assessments={assessments}
        uploadAction={uploadSubmission}
      />
    </>
  );
}
