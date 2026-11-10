import SamOutlookConnect from './SamOutlookConnect';
export default async function Page({ searchParams }: { searchParams: Promise<{ nonce?: string }> }) {
  const params = await searchParams;
  return <SamOutlookConnect nonce={params.nonce || ''} />;
}
