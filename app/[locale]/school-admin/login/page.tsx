import { Suspense } from "react";
import { SchoolAdminMarketingLayout } from "@/components/school-admin/school-admin-ambient";
import { SchoolAdminLoginHero } from "@/components/school-admin/school-admin-login-hero";
import { SchoolAdminLoginForm } from "@/components/school-admin/login-form";

export default function SchoolAdminLoginPage() {
  return (
    <SchoolAdminMarketingLayout>
      <div className="ds-container flex min-h-screen flex-col justify-center py-10 lg:min-h-0 lg:py-16">
        <div className="grid items-stretch gap-8 lg:grid-cols-2 lg:gap-12 xl:gap-16">
          <SchoolAdminLoginHero />
          <div className="flex flex-col justify-center">
            <Suspense
              fallback={
                <p className="ds-text-body text-center text-ds-gray-text lg:text-left">
                  Загрузка…
                </p>
              }
            >
              <SchoolAdminLoginForm />
            </Suspense>
          </div>
        </div>
      </div>
    </SchoolAdminMarketingLayout>
  );
}
