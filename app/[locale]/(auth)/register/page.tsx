import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { AuthBrandLogo } from "@/components/auth/auth-brand-logo";
import { RegisterForm } from "@/components/auth/register-form";

export default async function RegisterPage() {
  const tp = await getTranslations("AuthPages");

  return (
    <div className="ds-main min-h-screen py-12">
      <div className="ds-container mb-8 flex flex-col items-center gap-4 text-center">
        <AuthBrandLogo />
        <Link href="/" className="ds-text-caption text-ds-gray-text hover:text-ds-primary">
          {tp("backHome")}
        </Link>
      </div>
      <RegisterForm />
    </div>
  );
}
