"use client";

import { useEffect, useState } from "react";
import {
  fetchDeviceViolations,
  type DeviceViolationRow,
} from "@/lib/api/school-admin/notifications";
import { AdminDeviceViolationsView } from "@/components/admin/device-violations-view";
import { isApiConfigured } from "@/lib/env";

export default function SchoolAdminDeviceViolationsPage() {
  const [items, setItems] = useState<DeviceViolationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isApiConfigured()) {
      setLoading(false);
      return;
    }
    fetchDeviceViolations()
      .then(setItems)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <AdminDeviceViolationsView
      variant="school"
      items={items}
      loading={loading}
      error={error}
    />
  );
}
