"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useTranslations } from "next-intl";
import { usePathname } from "@/i18n/navigation";
import { X } from "lucide-react";
import { SchoolAdminMeProvider } from "@/components/school-admin/admin-me-context";
import { SchoolAdminSidebar } from "@/components/school-admin/admin-sidebar";
import { SchoolAdminTopbar } from "@/components/school-admin/admin-topbar";

export function SchoolAdminShell({ children }: { children: ReactNode }) {
  return (
    <SchoolAdminMeProvider>
      <SchoolAdminShellInner>{children}</SchoolAdminShellInner>
    </SchoolAdminMeProvider>
  );
}

function SchoolAdminShellInner({ children }: { children: ReactNode }) {
  const t = useTranslations("SchoolAdminShell");
  const pathname = usePathname();
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    setDrawerOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!drawerOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setDrawerOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [drawerOpen]);

  return (
    <div className="school-admin-page min-h-screen">
      <div className="lg:grid lg:min-h-screen lg:grid-cols-[280px_minmax(0,1fr)]">
        <div className="hidden lg:block">
          <div className="sa-sidebar-wrap sticky top-0 h-screen">
            <SchoolAdminSidebar />
          </div>
        </div>

        <div className="flex min-h-screen min-w-0 flex-col">
          <SchoolAdminTopbar onOpenSidebar={() => setDrawerOpen(true)} />
          <main className="flex-1 px-4 py-6 sm:px-6 lg:px-10 lg:py-8">
            {children}
          </main>
        </div>
      </div>

      {drawerOpen ? (
        <div className="fixed inset-0 z-40 flex lg:hidden" role="dialog" aria-modal="true">
          <button
            type="button"
            aria-label={t("closeSidebarAria")}
            className="absolute inset-0 bg-slate-900/55 backdrop-blur-sm"
            onClick={() => setDrawerOpen(false)}
          />
          <div className="sa-sidebar-wrap relative ml-0 flex h-full w-[88vw] max-w-[320px] flex-col bg-white shadow-2xl">
            <button
              type="button"
              onClick={() => setDrawerOpen(false)}
              aria-label={t("closeSidebarAria")}
              className="absolute right-3 top-3 inline-flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-700 transition hover:bg-slate-200"
            >
              <X className="h-4 w-4" aria-hidden />
            </button>
            <SchoolAdminSidebar onNavigate={() => setDrawerOpen(false)} />
          </div>
        </div>
      ) : null}
    </div>
  );
}
