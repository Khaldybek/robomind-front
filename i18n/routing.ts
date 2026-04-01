import { defineRouting } from "next-intl/routing";

/** `kk` — негізгі тіл (қазақша), `ru` — орыс тілі. URL: `/kk/...`, `/ru/...` */
export const routing = defineRouting({
  locales: ["kk", "ru"],
  defaultLocale: "kk",
  localePrefix: "always",
});
