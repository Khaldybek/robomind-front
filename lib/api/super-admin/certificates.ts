import {
  apiSuperAdminFetch,
  parseJsonSafe,
  throwIfNotOk,
} from "@/lib/api/super-admin/client";
import { SUPER_ADMIN_ROUTES } from "@/lib/api/super-admin/routes";

/** `GET /admin/certificates` — фильтры в query (см. бэкенд) */
export async function fetchAdminCertificates(
  query?: Record<string, string | number | boolean | undefined>,
): Promise<unknown> {
  const u = new URLSearchParams();
  if (query) {
    Object.entries(query).forEach(([k, v]) => {
      if (v === undefined || v === null || v === "") return;
      u.set(k, String(v));
    });
  }
  const qs = u.toString();
  const path = `${SUPER_ADMIN_ROUTES.CERTIFICATES}${qs ? `?${qs}` : ""}`;
  const res = await apiSuperAdminFetch(path);
  await throwIfNotOk(res);
  return parseJsonSafe(res);
}

/** `POST /admin/certificates` */
export async function createAdminCertificate(
  body: Record<string, unknown>,
): Promise<unknown> {
  const res = await apiSuperAdminFetch(SUPER_ADMIN_ROUTES.CERTIFICATES, {
    method: "POST",
    body: JSON.stringify(body),
  });
  await throwIfNotOk(res);
  return parseJsonSafe(res);
}

/** `GET /admin/certificates/:id` */
export async function getAdminCertificate(id: string): Promise<unknown> {
  const res = await apiSuperAdminFetch(SUPER_ADMIN_ROUTES.CERTIFICATE(id));
  await throwIfNotOk(res);
  return parseJsonSafe(res);
}

/** `DELETE /admin/certificates/:id` */
export async function deleteAdminCertificate(id: string): Promise<void> {
  const res = await apiSuperAdminFetch(SUPER_ADMIN_ROUTES.CERTIFICATE(id), {
    method: "DELETE",
  });
  await throwIfNotOk(res);
}
