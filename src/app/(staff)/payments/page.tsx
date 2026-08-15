import { PageHeader } from '@/components/shared/page-header';
import { PaymentLedgerScreen } from '@/features/fees/components/payment-ledger-screen';

export default function PaymentsPage() {
  return (
    <>
      <PageHeader
        title="Payments"
        description="Every payment recorded, newest first. Reversals stay on the ledger beside the entry they correct."
      />
      <PaymentLedgerScreen />
    </>
  );
}
