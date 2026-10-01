import { notFound } from "next/navigation";
import Navigator from "@/components/Navigator";
const steps = [
  "cn-search",
  "applicability",
  "product-map",
  "readiness",
  "evidence",
  "application",
  "privacy",
  "legal",
];
export const dynamicParams = false;
export const dynamic = "force-dynamic";
export function generateStaticParams() {
  return steps.map((step) => ({ step }));
}
export default async function Page({
  params,
}: {
  params: Promise<{ step: string }>;
}) {
  const { step } = await params;
  if (!steps.includes(step)) notFound();
  return (
    <Navigator
      step={step}
      privacy={{
        retention: process.env.NAVIGATOR_PRIVACY_RETENTION || "",
        processors: process.env.NAVIGATOR_PRIVACY_PROCESSORS || "",
        contact: process.env.NAVIGATOR_PRIVACY_CONTACT || "",
      }}
    />
  );
}
