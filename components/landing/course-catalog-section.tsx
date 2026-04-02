import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { LandingAnimatedBoard } from "@/components/landing/landing-animated-board";
import { fetchPublicCoursesCatalog } from "@/lib/api/public-courses";
import type { CourseSummary } from "@/lib/api/types";
import { resolveCourseThumbnailUrl } from "@/lib/course-display";

const BOARD_THEMES = ["circuit", "mechanics", "launch"] as const;

type DemoCard = {
  title: string;
  description: string;
  image: string;
  alt: string;
};

function courseTitle(c: CourseSummary): string {
  return String(c.title ?? c.name ?? "Курс");
}

function CourseCardImage({
  course,
  fallbackSrc,
  fallbackAlt,
  theme,
}: {
  course: Pick<CourseSummary, "id" | "title" | "name" | "thumbnailUrl"> &
    Record<string, unknown>;
  fallbackSrc: string;
  fallbackAlt: string;
  theme?: "circuit" | "mechanics" | "launch";
}) {
  const title = courseTitle(course);
  const src = resolveCourseThumbnailUrl(course as CourseSummary);
  const isLandingPlaceholder =
    fallbackSrc === "/student/hero-robot.svg" ||
    fallbackSrc === "/student/learning-flow.svg";

  if (src) {
    return (
      <div className="relative aspect-[16/10] w-full overflow-hidden bg-ds-gray-light">
        {/* eslint-disable-next-line @next/next/no-img-element -- динамический URL с API (обложка курса) */}
        <img
          src={src}
          alt={title}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/25 to-transparent" />
      </div>
    );
  }

  if (isLandingPlaceholder) {
    return (
      <LandingAnimatedBoard alt={fallbackAlt} variant="card" theme={theme} />
    );
  }

  return (
    <div className="relative aspect-[16/10] w-full overflow-hidden bg-ds-gray-light">
      <Image
        src={fallbackSrc}
        alt={fallbackAlt}
        fill
        className="object-cover object-center opacity-95 transition-transform duration-500 group-hover:scale-[1.03]"
        sizes="(max-width: 768px) 100vw, 33vw"
      />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
    </div>
  );
}

export async function CourseCatalogSection() {
  const t = await getTranslations("CourseCatalog");
  const demo = t.raw("demo") as DemoCard[];

  const fromApi = await fetchPublicCoursesCatalog();
  const useApi = fromApi.length > 0;
  const courses = useApi ? fromApi.slice(0, 6) : null;

  return (
    <section id="landing-courses" className="mt-12 scroll-mt-24 lg:mt-16">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="ds-text-caption font-medium uppercase tracking-wider text-ds-primary">
            {t("badge")}
          </p>
          <h2 className="mt-1 ds-text-h2 text-ds-black">
            {useApi ? t("titleApi") : t("titleDemo")}
          </h2>
          <p className="mt-2 max-w-2xl ds-text-body text-ds-gray-text">
            {useApi ? t("leadApi") : t("leadDemo")}
          </p>
        </div>
        <Link href="/register" className="ui-btn ui-btn--4 shrink-0 !px-5">
          {t("cta")}
        </Link>
      </div>

      <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {useApi && courses
          ? courses.map((c, idx) => {
              const id = String(c.id);
              const title = courseTitle(c);
              const theme = BOARD_THEMES[idx % BOARD_THEMES.length];
              return (
                <li key={id}>
                  <Link
                    href="/register"
                    className="group block overflow-hidden rounded-ds-card border border-ds-gray-border bg-ds-white shadow-sm transition-shadow hover:shadow-md"
                  >
                    <CourseCardImage
                      course={c}
                      fallbackSrc="/student/hero-robot.svg"
                      fallbackAlt={t("coverAlt", { title })}
                      theme={theme}
                    />
                    <div className="p-4">
                      <p className="ds-text-subtitle text-ds-black">{title}</p>
                      {c.description ? (
                        <p className="ds-text-caption mt-2 line-clamp-2 text-ds-gray-text">
                          {String(c.description)}
                        </p>
                      ) : null}
                      <span className="mt-3 inline-block ds-text-caption font-medium text-ds-primary group-hover:underline">
                        {t("learnMore")}
                      </span>
                    </div>
                  </Link>
                </li>
              );
            })
          : demo.map((item, idx) => (
              <li key={item.title} className="border-blue-300">
                <Link
                  href="/register"
                  className="group block overflow-hidden rounded-ds-card border-2 border-blue-300 bg-ds-white shadow-sm transition-shadow hover:shadow-md"
                >
                  <CourseCardImage
                    course={
                      { id: "demo", title: item.title } as CourseSummary
                    }
                    fallbackSrc={item.image}
                    fallbackAlt={item.alt}
                    theme={BOARD_THEMES[idx % BOARD_THEMES.length]}
                  />
                  <div className="p-4">
                    <p className="ds-text-subtitle text-ds-black">{item.title}</p>
                    <p className="ds-text-caption mt-2 text-ds-gray-text">
                      {item.description}
                    </p>
                    <span className="mt-3 inline-block ds-text-caption font-medium text-ds-primary group-hover:underline">
                      {t("start")}
                    </span>
                  </div>
                </Link>
              </li>
            ))}
      </ul>
    </section>
  );
}
