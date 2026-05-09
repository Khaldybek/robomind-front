import type { ReactNode } from "react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { hasLocale } from "next-intl";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import { AuthExperienceShell } from "@/components/auth/auth-experience-shell";

export default async function AuthLayout({
  children,
  params,
}: Readonly<{
  children: ReactNode;
  params: Promise<{ locale: string }>;
}>) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }
  setRequestLocale(locale);

  const tHome = await getTranslations("HomePage");
  const motifLabels: [string, string, string, string, string] = [
    tHome("motifCode"),
    tHome("motifLogic"),
    tHome("motifLaunch"),
    tHome("motifBuild"),
    tHome("motifCircuit"),
  ];
  const trustChips = (tHome.raw("trustLines") as string[]).slice(0, 4);

  return (
    <div className="landing-kid-page relative min-h-screen overflow-x-hidden">
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.12]"
        aria-hidden
        style={{
          backgroundImage: `radial-gradient(circle at 20% 20%, rgb(255 255 255 / 0.9) 0, transparent 42%),
            radial-gradient(circle at 88% 12%, rgb(255 255 255 / 0.55) 0, transparent 38%)`,
        }}
      />
      <AuthExperienceShell motifLabels={motifLabels} trustChips={trustChips}>
        {children}
      </AuthExperienceShell>
    </div>
  );
}
