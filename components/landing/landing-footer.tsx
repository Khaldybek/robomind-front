import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { LANDING_NAV_LINKS } from "@/components/landing/landing-nav";

export async function LandingFooter() {
  const t = await getTranslations("HomePage");
  const year = new Date().getFullYear();

  return (
    <footer
      className="relative z-[1] mt-12 border-t border-white/60 bg-white/55 py-10 backdrop-blur-md lg:mt-16"
      role="contentinfo"
    >
      <div className="ds-container grid gap-10 sm:grid-cols-2 lg:grid-cols-4 lg:gap-8">
        <div className="sm:col-span-2 lg:col-span-2">
          <p className="ds-text-subtitle font-semibold text-ds-black">
            {t("navBrand")}
          </p>
          <p className="mt-2 max-w-md text-sm leading-relaxed text-ds-gray-text">
            {t("footerTagline")}
          </p>
        </div>
        <nav
          className="flex flex-col gap-2.5"
          aria-label={t("footerNavAria")}
        >
          {LANDING_NAV_LINKS.map(({ href, msgKey }) => (
            <a
              key={href}
              href={href}
              className="text-sm font-medium text-ds-black/90 underline-offset-2 transition-colors hover:text-ds-primary hover:underline"
            >
              {t(msgKey)}
            </a>
          ))}
        </nav>
        <div className="flex flex-col gap-2.5">
          <Link
            href="/login"
            className="text-sm font-medium text-ds-black/90 underline-offset-2 transition-colors hover:text-ds-primary hover:underline"
          >
            {t("footerLinkLogin")}
          </Link>
          <Link
            href="/register"
            className="text-sm font-medium text-ds-black/90 underline-offset-2 transition-colors hover:text-ds-primary hover:underline"
          >
            {t("footerLinkRegister")}
          </Link>
        </div>
      </div>
      <div className="ds-container mt-10 border-t border-ds-gray-border/60 pt-6 text-center text-xs text-ds-gray-text sm:text-left">
        {t("footerCopyright", { year })}
      </div>
    </footer>
  );
}
