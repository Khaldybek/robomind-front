"use client";

import { useMemo, type ReactNode } from "react";
import { useTranslations } from "next-intl";
import { Link, usePathname, useRouter } from "@/i18n/navigation";
import { LogOut } from "lucide-react";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { apiAuthLogoutAll } from "@/lib/api/auth-api";
import {
  clearSchoolAdminTokens,
  getSchoolAdminAccessToken,
} from "@/lib/auth/school-admin-tokens";
import {
  IconBell,
  IconBookOpen,
  IconHome,
  IconSmartphone,
  IconUsers,
} from "@/components/school-admin/school-admin-icons";

type NavItem = {
  href: string;
  label: string;
  icon: ReactNode;
};

export function SchoolAdminSidebar({
  onNavigate,
}: {
  /** Закрыть мобильный drawer после клика по пункту. */
  onNavigate?: () => void;
}) {
  const t = useTranslations("SchoolAdminShell");
  const pathname = usePathname();
  const router = useRouter();

  const nav: NavItem[] = useMemo(
    () => [
      {
        href: "/school-admin/dashboard",
        label: t("navOverview"),
        icon: <IconHome className="h-5 w-5" />,
      },
      {
        href: "/school-admin/users",
        label: t("navStudents"),
        icon: <IconUsers className="h-5 w-5" />,
      },
      {
        href: "/school-admin/courses",
        label: t("navCourses"),
        icon: <IconBookOpen className="h-5 w-5" />,
      },
      {
        href: "/school-admin/notifications",
        label: t("navNotifications"),
        icon: <IconBell className="h-5 w-5" />,
      },
      {
        href: "/school-admin/device-violations",
        label: t("navDevices"),
        icon: <IconSmartphone className="h-5 w-5" />,
      },
    ],
    [t],
  );

  function handleLogout() {
    void (async () => {
      const at = getSchoolAdminAccessToken();
      if (at) {
        try {
          await apiAuthLogoutAll(at);
        } catch {
          /* ignore */
        }
      }
      clearSchoolAdminTokens();
      router.push("/school-admin/login");
    })();
  }

  return (
    <aside className="sa-sidebar flex h-full flex-col">
      <div className="px-5 pb-5 pt-6 lg:px-6">
        <Link
          href="/school-admin/dashboard"
          onClick={onNavigate}
          className="flex flex-col items-start gap-1 outline-none focus-visible:ring-2 focus-visible:ring-sky-300 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
        >
          <span className="sa-brand-mark inline-flex items-center gap-1 text-xl font-extrabold tracking-tight">
            <span className="text-slate-900">ROBO</span>
            <span className="text-sky-600">SCHOOL</span>
          </span>
          <span className="text-xs text-slate-500">{t("subtitle")}</span>
        </Link>
      </div>

      <nav
        aria-label={t("navAria")}
        className="flex-1 overflow-y-auto px-3 pb-6 lg:px-4"
      >
        <ul className="flex flex-col gap-1">
          {nav.map(({ href, label, icon }) => {
            const active =
              pathname === href || pathname?.startsWith(href + "/");
            return (
              <li key={href}>
                <Link
                  href={href}
                  onClick={onNavigate}
                  aria-current={active ? "page" : undefined}
                  className={`group flex items-center gap-3 rounded-2xl px-3.5 py-2.5 text-sm font-semibold transition-colors ${
                    active
                      ? "bg-sky-100/90 text-sky-900 ring-1 ring-sky-200/80 shadow-sm"
                      : "text-slate-600 hover:bg-slate-100/80 hover:text-slate-900"
                  }`}
                >
                  <span
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl transition-colors ${
                      active
                        ? "bg-white text-sky-700 shadow-sm ring-1 ring-sky-200/70"
                        : "bg-slate-100 text-slate-500 group-hover:bg-white group-hover:text-slate-900"
                    }`}
                  >
                    {icon}
                  </span>
                  <span className="truncate">{label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="mt-auto flex flex-col gap-3 border-t border-slate-200/80 px-4 py-5 lg:px-5">
        <LocaleSwitcher className="!gap-2" />
        <button
          type="button"
          onClick={handleLogout}
          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-sky-500 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-sky-500/25 transition hover:bg-sky-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-600"
        >
          <LogOut className="h-4 w-4 shrink-0" aria-hidden />
          {t("logout")}
        </button>
      </div>
    </aside>
  );
}
