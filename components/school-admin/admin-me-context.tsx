"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  fetchMySchool,
  fetchSchoolAdminMe,
  type MySchoolResponse,
  type SchoolAdminMe,
} from "@/lib/api/school-admin/my-school";
import { fetchSchoolStats } from "@/lib/api/school-admin/school-stats";
import { fetchAdminNotifications } from "@/lib/api/school-admin/notifications";
import { isApiConfigured } from "@/lib/env";

export type SchoolAdminMeCtx = {
  me: SchoolAdminMe | null;
  school: MySchoolResponse | null;
  unreadCount: number;
  refreshUnread: () => Promise<void>;
  refreshAll: () => Promise<void>;
};

const Ctx = createContext<SchoolAdminMeCtx | null>(null);

export function useSchoolAdminMe(): SchoolAdminMeCtx {
  const ctx = useContext(Ctx);
  if (ctx == null) {
    return {
      me: null,
      school: null,
      unreadCount: 0,
      refreshUnread: async () => {},
      refreshAll: async () => {},
    };
  }
  return ctx;
}

export function SchoolAdminMeProvider({ children }: { children: ReactNode }) {
  const [me, setMe] = useState<SchoolAdminMe | null>(null);
  const [school, setSchool] = useState<MySchoolResponse | null>(null);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const inflightUnread = useRef<Promise<void> | null>(null);

  const refreshUnread = useCallback(async () => {
    if (!isApiConfigured()) return;
    if (inflightUnread.current) return inflightUnread.current;
    const p = (async () => {
      try {
        const stats = await fetchSchoolStats();
        setUnreadCount(stats.unreadNotificationsForCurrentAdmin);
      } catch {
        try {
          const list = await fetchAdminNotifications(true);
          setUnreadCount(list.length);
        } catch {
          /* ignore */
        }
      } finally {
        inflightUnread.current = null;
      }
    })();
    inflightUnread.current = p;
    return p;
  }, []);

  const refreshAll = useCallback(async () => {
    if (!isApiConfigured()) return;
    await Promise.all([
      fetchSchoolAdminMe()
        .then(setMe)
        .catch(() => setMe(null)),
      fetchMySchool()
        .then(setSchool)
        .catch(() => setSchool(null)),
      refreshUnread(),
    ]);
  }, [refreshUnread]);

  useEffect(() => {
    void refreshAll();
  }, [refreshAll]);

  const value = useMemo<SchoolAdminMeCtx>(
    () => ({ me, school, unreadCount, refreshUnread, refreshAll }),
    [me, school, unreadCount, refreshUnread, refreshAll],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
