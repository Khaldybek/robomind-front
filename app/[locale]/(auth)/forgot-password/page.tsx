import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";

export default async function ForgotPasswordPage() {
  const tp = await getTranslations("AuthPages");

  return (
    <>
      <div className="mx-auto mb-8 max-w-md text-center">
        <Link
          href="/login"
          className="ds-text-caption text-ds-black/70 transition hover:text-ds-primary"
        >
          {tp("backToLogin")}
        </Link>
      </div>
      <ForgotPasswordForm />
    </>
  );
}
