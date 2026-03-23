"use client";
import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import Image from "next/image";
import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function UserMenu() {
  const { data: session, status } = useSession();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  if (status === "loading") {
    return (
      <div className="h-7 w-7 rounded-full bg-muted/60 animate-pulse" />
    );
  }

  if (!session) {
    return (
      <Link href="/login">
        <Button
          variant="outline"
          size="sm"
          className="h-7 px-3 text-xs font-medium border-saffron/40 text-saffron hover:bg-saffron/10 hover:border-saffron"
        >
          Sign In
        </Button>
      </Link>
    );
  }

  const user = session.user;
  const initials = user?.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .slice(0, 2)
        .join("")
        .toUpperCase()
    : "?";

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((p) => !p)}
        aria-label="Open user menu"
        aria-expanded={open}
        className="flex items-center gap-2 rounded-lg px-1.5 py-1 transition-colors hover:bg-surface-hover"
      >
        {user?.image ? (
          <Image
            src={user.image}
            alt={user.name ?? "User avatar"}
            width={28}
            height={28}
            className="rounded-full ring-1 ring-border"
          />
        ) : (
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-saffron/20 text-xs font-bold text-saffron ring-1 ring-saffron/30">
            {initials}
          </div>
        )}
        <span className="hidden sm:block text-xs font-medium text-foreground max-w-[100px] truncate">
          {user?.name?.split(" ")[0] ?? "User"}
        </span>
      </button>

      {open && (
        <div
          className={cn(
            "absolute right-0 top-full mt-1 w-48 rounded-xl border border-border/60 bg-surface py-1 shadow-xl shadow-black/30 z-50",
            "animate-in fade-in slide-in-from-top-2 duration-150"
          )}
        >
          {/* User info header */}
          <div className="px-3 py-2 border-b border-border/40">
            <p className="text-xs font-semibold text-foreground truncate">
              {user?.name ?? "Signed in"}
            </p>
            <p className="text-[11px] text-muted-foreground truncate">
              {user?.email}
            </p>
          </div>

          <nav className="py-1">
            <Link
              href="/app/profile"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2 px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground hover:bg-surface-hover transition-colors"
            >
              <span>👤</span> Profile
            </Link>
            <Link
              href="/app/settings"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2 px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground hover:bg-surface-hover transition-colors"
            >
              <span>⚙️</span> Settings
            </Link>
          </nav>

          <div className="border-t border-border/40 pt-1">
            <button
              onClick={() => {
                setOpen(false);
                signOut({ callbackUrl: "/" });
              }}
              className="flex w-full items-center gap-2 px-3 py-1.5 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors"
            >
              <span>🚪</span> Sign Out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
