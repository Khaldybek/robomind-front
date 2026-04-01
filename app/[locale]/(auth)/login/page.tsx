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
    <div className="ds-main min-h-screen py-12">
      <div className="ds-container mb-8 flex flex-col items-center gap-4 text-center">
        <AuthBrandLogo />
        <Link href="/" className="ds-text-caption text-ds-gray-text hover:text-ds-primary">
          {tp("backHome")}
        </Link>
      </div>
      <LoginForm />
      <p className="ds-container mt-6 text-center">
        <Link href="/register" className="ds-text-body text-ds-primary hover:underline">
          {tp("registerCta")}
        </Link>
      </p>
    </div>
  );
}
