import type { ReactNode } from "react";
import { SchoolAdminGuard } from "@/components/school-admin/admin-guard";
import { SchoolAdminShell } from "@/components/school-admin/admin-shell";

export default function SchoolAdminPanelLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <SchoolAdminGuard>
      <SchoolAdminShell>{children}</SchoolAdminShell>
    </SchoolAdminGuard>
  );
}
