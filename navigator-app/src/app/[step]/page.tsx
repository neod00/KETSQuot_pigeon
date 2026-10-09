import { notFound } from "next/navigation";
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
  searchParams: Promise<{ from?: string | string[] }>;
}) {
  const { step } = await params;
  if (!steps.includes(step)) notFound();
  if (step === 'guide') {
    const { from } = await searchParams;
    return <UserGuide from={typeof from === 'string' ? from : undefined} />;
  }
  return (
    <Navigator
      step={step}
      privacy={{
        retention: process.env.NAVIGATOR_PRIVACY_RETENTION || "",
        contact: process.env.NAVIGATOR_PRIVACY_CONTACT || "",
      }}
    />
  );
}
