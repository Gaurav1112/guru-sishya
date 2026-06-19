import { useState, useEffect } from "react";

export function useRouter() {
  return {
    push: (url: string) => { window.location.href = url; },
    replace: (url: string) => { window.location.replace(url); },
    back: () => { window.history.back(); },
    refresh: () => { window.location.reload(); },
    prefetch: (_url: string) => {},
  };
}

export function useSearchParams() {
  const [params, setParams] = useState(
    () => typeof window !== "undefined" ? new URLSearchParams(window.location.search) : new URLSearchParams()
  );
  useEffect(() => {
    const handler = () => setParams(new URLSearchParams(window.location.search));
    window.addEventListener("popstate", handler);
    return () => window.removeEventListener("popstate", handler);
  }, []);
  return params;
}

export function usePathname(): string {
  const [pathname, setPathname] = useState(
    () => typeof window !== "undefined" ? window.location.pathname : ""
  );
  useEffect(() => {
    const handler = () => setPathname(window.location.pathname);
    window.addEventListener("popstate", handler);
    return () => window.removeEventListener("popstate", handler);
  }, []);
  return pathname;
}
