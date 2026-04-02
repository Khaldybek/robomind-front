"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

/** Логотип бренда (alt из HomePage.navBrand) над формами входа / регистрации */
export function AuthBrandLogo() {
  const t = useTranslations("HomePage");

  return (
    <Link
      href="/"
      className="inline-flex focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ds-primary focus-visible:ring-offset-2 rounded-lg"
    >
      <Image
        src="/logo.png"
        alt={t("navBrand")}
        width={440}
        height={116}
        className="h-[5.5rem] w-auto max-w-[min(30rem,92vw)] object-contain object-center sm:h-[7rem]"
        priority
      />
    </Link>
  );
}
