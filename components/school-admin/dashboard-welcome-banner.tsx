"use client";

import { useTranslations } from "next-intl";
import { useSchoolAdminMe } from "@/components/school-admin/admin-me-context";

function adminFirstName(
  me: { firstName: string; lastName: string } | null,
): string {
  if (!me) return "";
  return (me.firstName ?? "").trim();
}

function schoolLine(
  school:
    | {
        school: { name: string; number: number | null };
        city: { name: string } | null;
      }
    | null,
): string {
  if (!school) return "";
  const num =
    school.school.number != null ? ` №${school.school.number}` : "";
  const head = `${school.school.name}${num}`.trim();
  if (school.city?.name) return `${head} · ${school.city.name}`;
  return head;
}

export function SchoolAdminWelcomeBanner() {
  const t = useTranslations("SchoolAdminDashboard");
  const { me, school } = useSchoolAdminMe();
  const firstName = adminFirstName(me);
  const headline = firstName
    ? t("welcomeWithName", { name: firstName })
    : t("welcomeFallback");

  const subline = schoolLine(school);

  return (
    <section className="sa-welcome-banner mb-8">
      <div className="relative z-[1] max-w-2xl">
        <h1 className="text-balance text-2xl font-bold leading-tight tracking-tight sm:text-[1.875rem] lg:text-[2.125rem]">
          {headline}
        </h1>
        {subline ? (
          <p className="mt-3 text-sm font-medium text-white/85 sm:text-base">
            {subline}
          </p>
        ) : null}
        <p className="mt-3 max-w-xl text-pretty text-sm leading-relaxed text-white/85 sm:text-[15px]">
          {t("lead")}
        </p>
      </div>
      <BannerIllustration />
    </section>
  );
}

function BannerIllustration() {
  return (
    <svg
      className="sa-welcome-illustration"
      viewBox="0 0 260 260"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
      focusable="false"
    >
      <defs>
        <linearGradient id="sa-leaf" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#a78bfa" />
          <stop offset="100%" stopColor="#7c3aed" />
        </linearGradient>
        <linearGradient id="sa-laptop" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#1e293b" />
          <stop offset="100%" stopColor="#0f172a" />
        </linearGradient>
      </defs>
      <g opacity="0.9">
        <path
          d="M210 60c10-30 35-30 40-15-15 5-25 15-40 25v-10z"
          fill="url(#sa-leaf)"
          opacity="0.55"
        />
        <path
          d="M180 70c20-25 50-15 50 5-20 0-35 10-50 25V70z"
          fill="url(#sa-leaf)"
          opacity="0.6"
        />
        <path
          d="M170 110c25-30 60-25 65-5-25 0-40 10-65 25v-20z"
          fill="url(#sa-leaf)"
          opacity="0.6"
        />
      </g>
      <g>
        <ellipse
          cx="130"
          cy="232"
          rx="80"
          ry="8"
          fill="rgba(15,23,42,0.18)"
        />
        <rect
          x="80"
          y="172"
          width="110"
          height="55"
          rx="6"
          fill="url(#sa-laptop)"
        />
        <rect
          x="74"
          y="220"
          width="122"
          height="9"
          rx="3"
          fill="#0f172a"
        />
        <rect
          x="86"
          y="178"
          width="98"
          height="42"
          rx="3"
          fill="#e2e8f0"
        />
        <circle cx="135" cy="118" r="22" fill="#fde68a" />
        <path
          d="M115 120c0-12 10-22 22-22s22 10 22 22v6h-44v-6z"
          fill="#1f2937"
        />
        <path
          d="M105 175c2-20 15-32 30-32s28 12 30 32H105z"
          fill="#fff"
        />
        <path
          d="M120 175c-2-12 5-22 15-22s17 10 15 22h-30z"
          fill="#0f172a"
          opacity="0.18"
        />
        <circle cx="128" cy="120" r="2" fill="#1f2937" />
        <circle cx="142" cy="120" r="2" fill="#1f2937" />
        <path
          d="M129 130c2 2 6 2 8 0"
          stroke="#1f2937"
          strokeWidth="1.6"
          strokeLinecap="round"
        />
      </g>
    </svg>
  );
}
