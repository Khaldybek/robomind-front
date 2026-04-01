import type { ReactNode } from "react";
import { SuperAdminGuard } from "@/components/super-admin/super-admin-guard";
import { SuperAdminShell } from "@/components/super-admin/super-admin-shell";

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <SuperAdminGuard>
      <SuperAdminShell>{children}</SuperAdminShell>
    </SuperAdminGuard>
  );
}
