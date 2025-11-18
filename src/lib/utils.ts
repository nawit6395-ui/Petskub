import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const trimTrailingSlash = (value: string) => value.replace(/\/$/, "");

export const getAppBaseUrl = () => {
  const envUrl = import.meta.env.VITE_SITE_URL?.toString().trim();
  if (envUrl) {
    return trimTrailingSlash(envUrl);
  }

  if (typeof window !== "undefined" && window.location.origin) {
    return trimTrailingSlash(window.location.origin);
  }

  return "";
};

export const buildAppUrl = (path = "/") => {
  const base = getAppBaseUrl();
  const normalizedPath = path ? (path.startsWith("/") ? path : `/${path}`) : "";

  if (!base) {
    return normalizedPath || "/";
  }

  return `${base}${normalizedPath}`;
};
