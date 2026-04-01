/** Подпись ученика в нарушениях устройств — без тройного email во «ФИО». */
export function violationStudentDisplay(student: {
  email?: string;
  firstName?: string;
  lastName?: string;
}): { primary: string; secondary?: string } {
  const email = (student.email ?? "").trim();
  const fn = (student.firstName ?? "").trim();
  const ln = (student.lastName ?? "").trim();
  const parts = [ln, fn].filter((p) => p.length > 0);
  if (parts.length === 0) {
    return { primary: email || "—", secondary: undefined };
  }
  const allSame = parts.every((p) => p === parts[0]);
  if (allSame && email && parts[0] === email) {
    return { primary: email, secondary: undefined };
  }
  if (fn && ln && fn === ln && fn === email) {
    return { primary: email, secondary: undefined };
  }
  const full = parts.join(" ");
  return {
    primary: full,
    secondary: email && email !== full ? email : undefined,
  };
}

export type ParsedUa = {
  browser: "edge" | "chrome" | "firefox" | "safari" | "unknown";
  version: string;
  os: "windows" | "mac" | "android" | "linux" | "ios" | "unknown";
};

const BROWSER_TKEY: Record<ParsedUa["browser"], string> = {
  edge: "uaEdge",
  chrome: "uaChrome",
  firefox: "uaFirefox",
  safari: "uaSafari",
  unknown: "uaUnknown",
};

const OS_TKEY: Record<ParsedUa["os"], string> = {
  windows: "osWindows",
  mac: "osMac",
  android: "osAndroid",
  linux: "osLinux",
  ios: "osIos",
  unknown: "osUnknown",
};

export function parseUserAgentParts(ua: string | undefined): ParsedUa | null {
  if (!ua?.trim()) return null;
  const u = ua.trim();

  let browser: ParsedUa["browser"] = "unknown";
  let version = "";

  if (/Edg\/(\d+)/.test(u)) {
    const m = u.match(/Edg\/(\d+)/);
    browser = "edge";
    version = m?.[1] ?? "";
  } else if (/Chrome\/(\d+)/.test(u) && !/Edg\//.test(u)) {
    const m = u.match(/Chrome\/(\d+)/);
    browser = "chrome";
    version = m?.[1] ?? "";
  } else if (/Firefox\/(\d+)/.test(u)) {
    const m = u.match(/Firefox\/(\d+)/);
    browser = "firefox";
    version = m?.[1] ?? "";
  } else if (/Safari\//.test(u) && !/Chrome\//.test(u)) {
    const m = u.match(/Version\/(\d+)/);
    browser = "safari";
    version = m?.[1] ?? "";
  }

  let os: ParsedUa["os"] = "unknown";
  if (/Windows NT 10/.test(u)) os = "windows";
  else if (/Mac OS X/.test(u)) os = "mac";
  else if (/Android/.test(u)) os = "android";
  else if (/iPhone|iPad|iOS/.test(u)) os = "ios";
  else if (/Linux/.test(u)) os = "linux";

  if (browser === "unknown" && os === "unknown") return null;

  return { browser, version, os };
}

/**
 * Короткая строка «браузер + ОС» с подстановкой через next-intl (`AdminDeviceViolations`).
 */
export function formatLocalizedUaSummary(
  ua: string | undefined,
  t: (key: string) => string,
): string {
  const p = parseUserAgentParts(ua);
  if (!p) return "";
  const parts: string[] = [];
  const b = t(BROWSER_TKEY[p.browser]);
  if (p.browser !== "unknown" && p.version) {
    parts.push(`${b} ${p.version}`);
  } else {
    parts.push(b);
  }
  if (p.os !== "unknown") {
    const oLabel = t(OS_TKEY[p.os]);
    if (oLabel.trim()) parts.push(oLabel);
  }
  return parts.join(" · ");
}

export function formatViolationWhen(
  iso: string | undefined,
  locale: string,
): string {
  if (!iso?.trim()) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  try {
    return new Intl.DateTimeFormat(locale, {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(d);
  } catch {
    return iso;
  }
}
