"use client";
import { Toaster } from "@/components/ui/sonner";
export function AppProviders({ children }: { children: React.ReactNode }) {
  return <>{children}<Toaster position="bottom-right" theme="dark" /></>;
}
