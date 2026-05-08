"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Bell, Menu, Search, User } from "lucide-react";
import { Link, useRouter } from "@/i18n/navigation";
import { useSchoolAdminMe } from "@/components/school-admin/admin-me-context";
import { resolvePublicFileUrl } from "@/lib/env";

function userDisplayName(
  me: { firstName: string; lastName: string; email: string } | null,
): string {
  if (!me) return "";
  const fn = me.firstName?.trim() ?? "";
  const ln = me.lastName?.trim() ?? "";
  const combined = [ln, fn].filter(Boolean).join(" ").trim();
  return combined || me.email || "";
}

export function SchoolAdminTopbar({
  onOpenSidebar,
}: {
  onOpenSidebar?: () => void;
}) {
  const t = useTranslations("SchoolAdminShell");
  const router = useRouter();
  const { me, unreadCount } = useSchoolAdminMe();
  const [search, setSearch] = useState("");

  const name = userDisplayName(me);
  const avatar = me?.avatarUrl
    ? resolvePublicFileUrl(me.avatarUrl) ?? me.avatarUrl
    : null;

  function submitSearch(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const q = search.trim();
    if (!q) return;
    router.push(`/school-admin/users?search=${encodeURIComponent(q)}`);
  }

  return (
    <header className="sa-topbar sticky top-0 z-20 border-b border-white/60 bg-white/80 px-4 py-3 backdrop-blur-xl sm:px-6 lg:px-8">
      <div className="flex w-full items-center gap-3 sm:gap-4">
        {onOpenSidebar ? (
          <button
            type="button"
            onClick={onOpenSidebar}
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200/80 bg-white text-slate-700 shadow-sm transition hover:border-sky-300 hover:text-sky-700 lg:hidden"
            aria-label={t("openSidebarAria")}
          >
            <Menu className="h-5 w-5" aria-hidden />
          </button>
        ) : null}

        <form
          onSubmit={submitSearch}
          role="search"
          className="flex min-w-0 flex-1 items-center"
        >
          <label
            htmlFor="sa-topbar-search"
            className="relative flex w-full max-w-2xl items-center"
          >
            <span className="sr-only">{t("searchLabel")}</span>
            <Search
              className="pointer-events-none absolute left-3 h-4 w-4 text-slate-400"
              aria-hidden
            />
            <input
              id="sa-topbar-search"
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t("searchPlaceholder")}
              className="block w-full rounded-2xl border border-slate-200/90 bg-white py-2.5 pl-10 pr-4 text-sm text-slate-900 placeholder:text-slate-400 shadow-[0_1px_0_rgba(15,23,42,0.04)] transition focus:border-sky-300 focus:outline-none focus:ring-2 focus:ring-sky-200"
            />
          </label>
        </form>

        <Link
          href="/school-admin/notifications"
          aria-label={t("notificationsAria")}
          className="relative inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200/90 bg-white text-slate-600 shadow-sm transition hover:border-sky-300 hover:text-sky-700"
        >
          <Bell className="h-[18px] w-[18px]" strokeWidth={1.75} aria-hidden />
          {unreadCount > 0 ? (
            <span className="absolute -right-1 -top-1 inline-flex min-w-[1.1rem] items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold leading-none text-white shadow-sm ring-2 ring-white">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          ) : null}
        </Link>

        <div
          className="flex shrink-0 items-center gap-3 pl-1"
          aria-label={t("userMenuAria")}
        >
          <span className="hidden text-right text-sm font-semibold text-slate-800 sm:block">
            {name || "—"}
          </span>
          <span className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-sky-100 text-sky-700 ring-1 ring-sky-200/80">
            {avatar ? (
              // eslint-disable-next-line @next/next/no-img-element -- динамический URL
              <img
                src={avatar}
                alt=""
                className="h-full w-full object-cover"
              />
            ) : (
              <User className="h-5 w-5" strokeWidth={1.75} aria-hidden />
            )}
          </span>
        </div>
      </div>
    </header>
  );
}
