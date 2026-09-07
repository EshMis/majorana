import { notFound } from "next/navigation";
import { isPublicDemoEnabled } from "../../lib/public-demo";
import { getPublicLocale } from "../../lib/public-locale-server";
import { DemoWorkspace } from "./demo-workspace";

export const metadata = { title: "Leona Quantum public preview" };

export default async function DemoPage({ searchParams }: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  if (!isPublicDemoEnabled()) notFound();
  const [locale, query] = await Promise.all([getPublicLocale(), searchParams]);
  return <DemoWorkspace locale={locale} view={query.view === "library" ? "library" : "run"} />;
}
