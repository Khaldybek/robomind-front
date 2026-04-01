"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { LocaleSwitcher } from "@/components/locale-switcher";

function MenuIcon({ open }: { open: boolean }) {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      aria-hidden
    >
      {open ? (
        <>
          <path d="M18 6L6 18M6 6l12 12" />
        </>
      ) : (
        <>
          <path d="M4 6h16M4 12h16M4 18h16" />
        </>
      )}
    </svg>
  );
}

export function SuperAdminShell({ children }: { children: ReactNode }) {
  const t = useTranslations("SuperAdminShell");
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const nav = useMemo(
    () =>
      [
        { href: "/super-admin/dashboard", label: t("navOverview") },
        { href: "/super-admin/geo", label: t("navGeo") },
        { href: "/super-admin/school-admins", label: t("navSchoolAdmins") },
        { href: "/super-admin/users", label: t("navUsers") },
        { href: "/super-admin/courses", label: t("navCourses") },
        { href: "/super-admin/ai", label: t("navAi") },
        { href: "/super-admin/uploads", label: t("navUploads") },
        { href: "/super-admin/notifications", label: t("navNotifications") },
        { href: "/super-admin/device-violations", label: t("navDevices") },
      ] as const,
    [t],
  );

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!mobileOpen) return;
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobileOpen(false);
    };
    window.addEventListener("keydown", onEsc);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onEsc);
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  const isActive = (href: string) =>
    pathname === href || pathname?.startsWith(href + "/");

  const navLinks = (
    <>
      {nav.map(({ href, label }) => (
        <Link
          key={href}
          href={href}
          className={`block rounded-lg px-3 py-2.5 ds-text-body transition-colors ${
            isActive(href)
              ? "bg-white/[0.12] font-medium text-ds-primary"
              : "text-white/90 hover:bg-white/[0.08] hover:text-white"
          }`}
        >
          {label}
        </Link>
      ))}
    </>
  );

  return (
    <div
      className="min-h-dvh min-h-screen w-full"
      style={{ background: "var(--ds-gradient-page)" }}
    >
      {/* Мобильная шапка */}
      <header className="fixed left-0 right-0 top-0 z-30 flex h-14 items-center justify-between border-b border-white/10 bg-[#262626] px-4 lg:hidden">
        <span className="truncate ds-text-subtitle text-ds-white">
          {t("mobileBrand")}
        </span>
        <button
          type="button"
          className="flex h-10 w-10 items-center justify-center rounded-lg text-white hover:bg-white/10"
          aria-expanded={mobileOpen}
          aria-label={mobileOpen ? t("menuClose") : t("menuOpen")}
          onClick={() => setMobileOpen((o) => !o)}
        >
          <MenuIcon open={mobileOpen} />
        </button>
      </header>

      {/* Затемнение под выезжающим меню */}
      {mobileOpen ? (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-black/45 lg:hidden"
          aria-label={t("closeOverlay")}
          onClick={() => setMobileOpen(false)}
        />
      ) : null}

      {/* Левый сайдбар: на lg всегда fixed у края; на мобиле — выезжающая панель */}
      <aside
        className={`ds-header-dark fixed bottom-0 left-0 top-0 z-50 flex h-dvh w-[min(280px,88vw)] flex-col overflow-hidden border-b-0 border-r border-white/15 shadow-xl transition-transform duration-200 ease-out lg:z-20 lg:w-[260px] lg:min-w-[260px] lg:translate-x-0 lg:shadow-none ${
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        <div className="hidden border-b border-white/10 px-5 py-5 lg:block">
          <p className="ds-text-subtitle text-ds-white">Robomind</p>
          <p className="mt-0.5 ds-text-caption text-white/60">
            {t("desktopSubtitle")}
          </p>
        </div>
        <div className="flex h-14 items-center border-b border-white/10 px-4 lg:hidden">
          <p className="ds-text-subtitle text-ds-white">{t("mobileMenuTitle")}</p>
        </div>

        <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto p-3">
          <div className="mb-2 px-1">
            <LocaleSwitcher tone="onDark" />
          </div>
          {navLinks}
        </nav>

        <div className="border-t border-white/10 p-3">
          <Link
            href="/super-admin/login?logout=1"
            className="block rounded-lg px-3 py-2.5 ds-text-body text-white/70 transition-colors hover:bg-white/[0.08] hover:text-ds-primary"
          >
            {t("logout")}
          </Link>
        </div>
      </aside>

      {/* Контент: отступ слева под фиксированный сайдбар (lg) */}
      <main className="min-h-dvh min-w-0 pt-14 lg:ml-[260px] lg:pt-0">
        <div className="ds-container max-w-none py-6 lg:py-8">{children}</div>
      </main>
    </div>
  );
}
