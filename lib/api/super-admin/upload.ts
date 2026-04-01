import {
  apiSuperAdminFetch,
  parseJsonSafe,
  throwIfNotOk,
} from "@/lib/api/super-admin/client";
import { SUPER_ADMIN_ROUTES } from "@/lib/api/super-admin/routes";

/** `POST /admin/upload/image` — multipart, поле `file` по умолчанию */
export async function uploadSuperImage(
  file: File,
  fieldName = "file",
): Promise<unknown> {
  const fd = new FormData();
  fd.append(fieldName, file);
  const res = await apiSuperAdminFetch(SUPER_ADMIN_ROUTES.UPLOAD_IMAGE, {
    method: "POST",
    body: fd,
  });
  await throwIfNotOk(res);
  return parseJsonSafe(res);
}

export async function uploadSuperVideo(
  file: File,
  fieldName = "file",
): Promise<{ key?: string; url?: string } | unknown> {
  const fd = new FormData();
  fd.append(fieldName, file);
  const res = await apiSuperAdminFetch(SUPER_ADMIN_ROUTES.UPLOAD_VIDEO, {
    method: "POST",
    body: fd,
  });
  await throwIfNotOk(res);
  return parseJsonSafe(res);
}

export async function uploadSuperFile(
  file: File,
  fieldName = "file",
): Promise<unknown> {
  const fd = new FormData();
  fd.append(fieldName, file);
  const res = await apiSuperAdminFetch(SUPER_ADMIN_ROUTES.UPLOAD_FILE, {
    method: "POST",
    body: fd,
  });
  await throwIfNotOk(res);
  return parseJsonSafe(res);
}
