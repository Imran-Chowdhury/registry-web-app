/**
 * The client-safe public surface of the fees feature. Services live in `./server`,
 * because they are `server-only` and this module is reachable from client components.
 */

export { computeFeeSummary } from './fee-math';

export {
  paymentFormSchema,
  recordPaymentSchema,
  reversePaymentSchema,
  type PaymentFormValues,
  type RecordPaymentInput,
  type ReversePaymentInput,
} from './schema';

export type {
  FeeDetail,
  FeeSummary,
  LedgerEntry,
  PaymentEntry,
  PaymentStatusValue,
  StudentArrears,
} from './types';

export { feeKeys } from './api/keys';
export {
  usePaymentLedger,
  useRecordPayment,
  useReversePayment,
  useStudentFees,
} from './hooks/use-fees';

export { FeePanel } from './components/fee-panel';
export { StudentFeeSummary } from './components/student-fee-summary';
