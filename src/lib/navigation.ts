import { useState, useEffect } from "react";

export function useRouter() {
  return {
    push: (href: string) => { window.location.href = href; },
    replace: (href: string) => { window.location.replace(href); },
    back: () => { window.history.back(); },
    prefetch: () => {},
    refresh: () => { window.location.reload(); },
  };
}

export function usePathname(): string {
  const [pathname, setPathname] = useState(
    typeof window !== "undefined" ? window.location.pathname : ""
  );

  useEffect(() => {
    const handler = () => setPathname(window.location.pathname);
    window.addEventListener("popstate", handler);
    return () => window.removeEventListener("popstate", handler);
  }, []);

  return pathname;
}

export function useSearchParams() {
  const [params, setParams] = useState(
    typeof window !== "undefined"
      ? new URLSearchParams(window.location.search)
      : new URLSearchParams()
  );

  useEffect(() => {
    const handler = () => setParams(new URLSearchParams(window.location.search));
    window.addEventListener("popstate", handler);
    return () => window.removeEventListener("popstate", handler);
  }, []);

  return [params] as const;
}

export function notFound(): never {
  throw new Response(null, { status: 404 });
}

export function redirect(href: string): never {
  if (typeof window !== "undefined") {
    window.location.href = href;
  }
  throw new Response(null, { status: 302, headers: { Location: href } });
}
