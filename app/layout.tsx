import type { ReactNode } from "react";

/** Корневой layout: `<html>` задаётся в `app/[locale]/layout.tsx` (next-intl). */
export default function RootLayout({ children }: { children: ReactNode }) {
  return children;
}
