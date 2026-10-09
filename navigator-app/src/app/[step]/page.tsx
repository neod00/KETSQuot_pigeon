import { notFound, redirect } from "next/navigation";
import Navigator from "@/components/Navigator";
import UserGuide from "@/components/UserGuide";
const steps = [
  "cn-search",
  "applicability",
  "product-map",
  "readiness",
  "evidence",
  "application",
  "privacy",
  "legal",
  "guide",
];
export const dynamicParams = false;
export const dynamic = "force-dynamic";
export function generateStaticParams() {
  return steps.map((step) => ({ step }));
}
export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ step: string }>;
  searchParams: Promise<{ from?: string | string[]; view?: string | string[] }>;
}) {
  const { step } = await params;
  if (!steps.includes(step)) notFound();
  if (step === 'evidence') redirect('/readiness?view=results#required-materials');
  if (step === 'guide') {
    const { from } = await searchParams;
    return <UserGuide from={typeof from === 'string' ? from : undefined} />;
  }
  const view = step === 'readiness' ? (await searchParams).view : undefined;
  return (
    <Navigator
      step={step}
      readinessView={view === 'results' || view === 'questions' ? view : undefined}
      privacy={{
        retention: process.env.NAVIGATOR_PRIVACY_RETENTION || "",
        contact: process.env.NAVIGATOR_PRIVACY_CONTACT || "",
      }}
    />
  );
}
