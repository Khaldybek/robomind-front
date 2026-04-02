import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { AuthBrandLogo } from "@/components/auth/auth-brand-logo";
import { RegisterForm } from "@/components/auth/register-form";

export default async function RegisterPage() {
  const tp = await getTranslations("AuthPages");

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
        style={{ background: "radial-gradient(circle, rgba(16,185,129,0.15) 0%, transparent 70%)" }}
        aria-hidden
      />
      <div className="ds-container relative z-[1] mb-8 flex flex-col items-center gap-4 text-center">
        <AuthBrandLogo />
        <Link href="/" className="ds-text-caption text-ds-gray-text hover:text-ds-primary">
          {tp("backHome")}
        </Link>
      </div>
      <RegisterForm />
    </div>
  );
}
