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
          backgroundImage: `radial-gradient(ellipse 90% 78% at 6% 12%, rgba(186, 170, 245, 0.68) 0%, transparent 54%),
            radial-gradient(ellipse 72% 58% at 22% 42%, rgba(176, 165, 238, 0.28) 0%, transparent 52%),
            radial-gradient(ellipse 82% 68% at 90% 10%, rgba(127, 185, 242, 0.52) 0%, transparent 50%),
            radial-gradient(ellipse 120% 56% at 50% 100%, rgba(255, 255, 255, 0.78) 0%, rgba(255, 255, 255, 0.35) 42%, transparent 68%)`,
        }}
      />
      <div className="relative z-[1]">
        <AuthExperienceShell>{children}</AuthExperienceShell>
      </div>
    </div>
  );
}
