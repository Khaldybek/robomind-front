"use client";

import { useEffect } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { useRouter } from "@/i18n/navigation";
import { AuthBrandLogo } from "@/components/auth/auth-brand-logo";
import { LoginForm } from "@/components/auth/login-form";
import { getAccessToken } from "@/lib/auth/tokens";

export default function LoginPage() {
  const tp = useTranslations("AuthPages");
  const router = useRouter();

  useEffect(() => {
    if (getAccessToken()) {
      router.replace("/dashboard");
    }
  }, [router]);

  return (
    <div className="auth-kid-page relative min-h-screen overflow-hidden py-12">
      {/* Background orbs */}
      <div
        className="pointer-events-none absolute right-[-5%] top-[-5%] h-72 w-72 rounded-full opacity-60 blur-3xl"
        style={{ background: "radial-gradient(circle, rgba(255,46,31,0.15) 0%, transparent 70%)" }}
        aria-hidden
      />
      <div
        className="pointer-events-none absolute bottom-0 left-[-5%] h-60 w-60 rounded-full opacity-50 blur-3xl"
        style={{ background: "radial-gradient(circle, rgba(59,130,246,0.15) 0%, transparent 70%)" }}
        aria-hidden
      />
      <div className="ds-container relative z-[1] mb-8 flex flex-col items-center gap-4 text-center">
        <AuthBrandLogo />
        <Link href="/" className="ds-text-caption text-ds-gray-text hover:text-ds-primary">
          {tp("backHome")}
        </Link>
      </div>
      <LoginForm />
      <p className="ds-container relative z-[1] mt-6 text-center">
        <Link href="/register" className="ds-text-body text-ds-primary hover:underline">
          {tp("registerCta")}
        </Link>
      </p>
    </div>
  );
}
