import type { ReactNode } from "react";
import { setRequestLocale } from "next-intl/server";
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

  return (
    <div className="student-auth-page relative min-h-screen overflow-x-hidden">
      <div
        className="pointer-events-none absolute inset-0 z-0 opacity-[0.72]"
        aria-hidden
        style={{
          backgroundImage: `radial-gradient(ellipse 85% 72% at 10% 14%, rgba(138, 137, 227, 0.58) 0%, transparent 52%),
            radial-gradient(ellipse 82% 68% at 90% 10%, rgba(127, 185, 242, 0.58) 0%, transparent 50%),
            radial-gradient(ellipse 100% 48% at 50% 100%, rgba(255, 255, 255, 0.42) 0%, transparent 58%)`,
        }}
      />
      <div className="relative z-[1]">
        <AuthExperienceShell>{children}</AuthExperienceShell>
      </div>
    </div>
  );
}
