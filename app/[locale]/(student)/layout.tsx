import type { ReactNode } from "react";
import { AuthGuard } from "@/components/student/auth-guard";
import { StudentShell } from "@/components/student/student-shell";

export default function StudentLayout({ children }: { children: ReactNode }) {
  return (
    <AuthGuard>
      <StudentShell>{children}</StudentShell>
    </AuthGuard>
  );
}
