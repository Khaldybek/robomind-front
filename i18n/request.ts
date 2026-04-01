import { hasLocale } from "next-intl";
import { getRequestConfig } from "next-intl/server";
import { routing } from "./routing";

export default getRequestConfig(async ({ requestLocale }) => {
  let locale = await requestLocale;
  if (!locale || !hasLocale(routing.locales, locale)) {
    locale = routing.defaultLocale;
  }

  const messages =
    locale === "kk"
      ? (await import("../messages/bundle-kk")).default
      : (await import("../messages/bundle-ru")).default;

  return {
    locale,
    messages,
  };
});
