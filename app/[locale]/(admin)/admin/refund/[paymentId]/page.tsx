import AdminPaymentDetailPage from "@/components/admin/AdminPaymentDetailPage";

export default async function AdminPaymentDetailRoutePage({
  params,
}: {
  params: Promise<{ paymentId: string }>;
}) {
  const { paymentId } = await params;

  return <AdminPaymentDetailPage paymentId={paymentId} />;
}
