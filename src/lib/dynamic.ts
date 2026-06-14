import { lazy } from "react";
import type { ComponentType } from "react";

interface DynamicOptions {
  loading?: ComponentType;
  ssr?: boolean;
}

// Shim for next/dynamic → React.lazy
// The `loading` and `ssr` options are silently ignored (not needed in Astro/React context).
export default function dynamic<T extends ComponentType<unknown>>(
  importFn: () => Promise<{ default: T } | T>,
  _options?: DynamicOptions
): T {
  return lazy(async () => {
    const mod = await importFn();
    if ("default" in mod) return mod as { default: T };
    return { default: mod as T };
  }) as unknown as T;
}
