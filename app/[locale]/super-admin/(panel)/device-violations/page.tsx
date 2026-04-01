"use client";

import { useEffect, useState } from "react";
import {
  fetchSuperDeviceViolations,
  type DeviceViolationRow,
} from "@/lib/api/super-admin/notifications";
import { AdminDeviceViolationsView } from "@/components/admin/device-violations-view";
import { isApiConfigured } from "@/lib/env";

export default function SuperAdminDeviceViolationsPage() {
  const [items, setItems] = useState<DeviceViolationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isApiConfigured()) {
      setLoading(false);
      return;
    }
    fetchSuperDeviceViolations()
      .then(setItems)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <AdminDeviceViolationsView
      variant="super"
      items={items}
      loading={loading}
      error={error}
    />
  );
}
