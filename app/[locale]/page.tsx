import { Link } from "@/i18n/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { CourseCatalogSection } from "@/components/landing/course-catalog-section";
import { LandingHeader } from "@/components/landing/landing-header";
import { LandingHeroFullscreen } from "@/components/landing/landing-hero-fullscreen";
import { LandingHeroRobots } from "@/components/landing/landing-hero-robots";
import { LandingThemeMotifs } from "@/components/landing/landing-theme-motifs";

type FaqItem = { q: string; a: string };

export default async function Home({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("HomePage");

  const features = t.raw("features") as string[];
  const trustLines = t.raw("trustLines") as string[];
  const faq = t.raw("faq") as FaqItem[];

  return (
    <div className="landing-kid-page scroll-smooth relative min-h-screen overflow-hidden bg-pink-400">

      <LandingHeroFullscreen alt={t("heroImageAlt")}>
        <div className="ds-container flex min-h-[100dvh] flex-col px-4 sm:px-6">
          <div className="pt-5 sm:pt-6">
            <LandingHeader />
          </div>
          <div className="flex flex-1 flex-col justify-start pb-12 pt-6 sm:pb-16 sm:pt-10 lg:pt-14">
            <div className="max-w-3xl rounded-[28px] border border-white/45 bg-white/[0.18] p-6 shadow-[0_24px_80px_rgba(0,0,0,0.35)] backdrop-blur-2xl sm:p-8 lg:p-10">
              <p className="mb-3 inline-flex rounded-full border border-white/70 bg-white/50 px-4 py-1.5 text-xs font-medium uppercase tracking-[0.16em] text-ds-primary backdrop-blur-sm">
                {t("heroBadge")}
              </p>
              <h1
                id="hero-heading"
                className="text-balance font-medium leading-[1.04] text-ds-black [font-size:clamp(1rem,2vw,2.1rem)]"
              >
                {t("heroTitle")}
              </h1>
              <p className="mt-5 max-w-xl text-pretty text-sm leading-relaxed text-white [text-shadow:0_1px_2px_rgba(0,0,0,0.35)] lg:text-base">
                {t("heroLead")}
              </p>
              <div className="mt-7 flex flex-wrap gap-3">
                <Link href="/register" className="ui-btn ui-btn--1 !px-6">
                  {t("ctaRegister")}
                </Link>
                <Link
                  href="/login"
                  className="ui-btn ui-btn--6 !border-ds-black !bg-ds-black !px-6 !text-ds-white"
                >
                  {t("ctaLogin")}
                </Link>
              </div>
              <ul className="mt-8 grid gap-2 sm:grid-cols-2">
                {features.map((item, idx) => (
                  <li
                    key={item}
                    style={{ animationDelay: `${80 + idx * 70}ms` }}
                    className="st-card-in flex items-center gap-2 rounded-xl border border-white/60 bg-white/45 px-3 py-2 text-sm text-ds-black backdrop-blur-md"
                  >
                    <span className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-ds-primary text-xs font-bold text-white">
                      ✓
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
              <p className="mt-6 border-t border-white/40 pt-4 text-xs leading-snug text-white [text-shadow:0_1px_2px_rgba(0,0,0,0.35)] sm:text-sm">
                {t("heroCaption")}
              </p>
            </div>
          </div>
        </div>
      </LandingHeroFullscreen>

      <main className="ds-container relative z-[1] py-10 lg:py-16">
        <CourseCatalogSection />

        <section
          id="landing-visual"
          className="mt-12 scroll-mt-24 lg:mt-16"
          aria-labelledby="landing-visual-block-title"
        >
          <div className="mb-8 text-center">
            <h2
              id="landing-visual-block-title"
              className="ds-text-h2 text-ds-black"
            >
              {t("visualBlockTitle")}
            </h2>
            <p className="mx-auto mt-2 max-w-xl text-sm text-ds-gray-text">
              {t("visualBlockLead")}
            </p>
          </div>
          <div className="overflow-visible rounded-[30px] border border-white/90 bg-white/55 p-3 shadow-[0_22px_80px_-24px_rgba(91,124,255,0.18)] backdrop-blur-md sm:p-4 lg:p-5">
            <LandingHeroRobots bubbleText={t("heroBubble")} />
          </div>
          <div className="mt-10">
            <LandingThemeMotifs
              labels={[
                t("motifCode"),
                t("motifLogic"),
                t("motifLaunch"),
                t("motifBuild"),
                t("motifCircuit"),
              ]}
            />
          </div>
        </section>

        <section className="st-card-in mt-10 overflow-hidden rounded-[30px] border-2 border-blue-300 p-5 shadow-[0_16px_55px_-26px_rgba(0,0,0,0.18)] backdrop-blur-sm lg:p-8">
          <div className="st-marquee-track">
            {[...trustLines, ...trustLines].map((line, idx) => (
              <span
                key={`${line}-${idx}`}
                className="mr-8 inline-flex rounded-full border border-ds-gray-border/70 bg-red-500 px-4 py-2 text-sm ui-btn ui-btn--1"
              >
                {line}
              </span>
            ))}
          </div>
        </section>

        <section
          id="landing-faq"
          className="mt-12 scroll-mt-24 rounded-[36px] border border-white/75 bg-blue-300 p-6 shadow-[0_18px_70px_-30px_rgba(0,0,0,0.16)] backdrop-blur-sm lg:p-8"
        >
          <h2 className="ds-text-h2 text-ds-black">{t("faqTitle")}</h2>
          <div className="mt-4 space-y-3">
            {faq.map((item) => (
              <details
                key={item.q}
                className="rounded-xl border border-ds-gray-border/80 bg-white/85 px-4 py-3"
              >
                <summary className="cursor-pointer text-sm font-medium text-ds-black">
                  {item.q}
                </summary>
                <p className="mt-2 text-sm text-ds-gray-text">{item.a}</p>
              </details>
            ))}
          </div>
        </section>

        <section
          id="landing-start"
          className="mt-12 scroll-mt-24 rounded-[36px] border-2 border-blue-300 p-6 shadow-[0_18px_70px_-30px_rgba(0,0,0,0.16)] backdrop-blur-sm lg:p-8"
        >
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="ds-text-h2 text-ds-black">{t("ctaBottomTitle")}</h2>
              <p className="mt-2 text-sm text-ds-gray-text lg:text-base">
                {t("ctaBottomLead")}
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link href="/login" className="ui-btn ui-btn--1">
                {t("ctaStudent")}
              </Link>
              <Link href="/school-admin/login" className="ui-btn ui-btn--4">
                {t("ctaSchoolAdmin")}
              </Link>
              <Link
                href="/super-admin/login"
                className="ui-btn ui-btn--6"
              >
                {t("ctaSuperAdmin")}
              </Link>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
