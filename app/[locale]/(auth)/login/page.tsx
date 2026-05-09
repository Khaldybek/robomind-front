"use client";

import { useEffect } from "react";
import { useRouter } from "@/i18n/navigation";
import { LoginForm } from "@/components/auth/login-form";
import { getAccessToken } from "@/lib/auth/tokens";

export default function LoginPage() {
  const router = useRouter();

  useEffect(() => {
    if (getAccessToken()) {
      router.replace("/dashboard");
    }
  }, [router]);

  return <LoginForm />;
}
