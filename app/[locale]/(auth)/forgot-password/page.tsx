import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";

export default async function ForgotPasswordPage() {
  const tp = await getTranslations("AuthPages");

  return (
    <div className="ds-main min-h-screen py-12">
      <div className="ds-container mb-8 text-center">
        <Link
          href="/login"
          className="ds-text-caption text-ds-gray-text hover:text-ds-primary"
        >
          {tp("backToLogin")}
        </Link>
      </div>
      <ForgotPasswordForm />
    </div>
  );
}
