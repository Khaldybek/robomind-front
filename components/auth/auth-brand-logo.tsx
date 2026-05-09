"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

/** Логотип бренда (alt из HomePage.navBrand) над формами входа / регистрации */
export function AuthBrandLogo({
  className,
  size = "default",
}: {
  className?: string;
  /** Компактный размер для шапки auth. */
  size?: "default" | "header" | "authNav";
}) {
  const t = useTranslations("HomePage");
  const imgClass =
    size === "authNav"
      ? "h-12 w-auto max-w-[min(88vw,18rem)] object-contain object-left sm:h-[3.35rem] sm:max-w-[20rem] md:h-14 md:max-w-[22rem] lg:h-[3.75rem] lg:max-w-[24rem]"
      : size === "header"
        ? "h-9 w-auto max-w-[200px] object-contain object-left sm:h-11 sm:max-w-[240px]"
        : "h-[5.5rem] w-auto max-w-[min(30rem,92vw)] object-contain object-center sm:h-[7rem]";

  return (
    <Link
      href="/"
      className={`inline-flex shrink-0 items-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400/80 focus-visible:ring-offset-2 focus-visible:ring-offset-white/50 rounded-xl ${className ?? ""}`}
    >
      <Image
        src="/logo.png"
        alt={t("navBrand")}
        width={440}
        height={116}
        className={imgClass}
        priority
      />
    </Link>
  );
}
