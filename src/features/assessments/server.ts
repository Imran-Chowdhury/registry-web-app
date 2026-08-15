import 'server-only';

/** The server-side surface of the assessments feature. Never imported by client code. */
export { assessmentService } from './server/assessment.service';
export { submissionService } from './server/submission.service';
export { uploadSubmission, type UploadState } from './server/submission.actions';
