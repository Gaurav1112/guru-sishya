"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Home, BookOpen, BrainCircuit, Mic, User } from "lucide-react";
import { cn } from "@/lib/utils";

const tabs = [
  { href: "/app/dashboard", label: "Home", icon: Home },
  { href: "/app/topics", label: "Topics", icon: BookOpen },
  { href: "/app/questions", label: "Practice", icon: BrainCircuit },
  { href: "/app/interview", label: "Interview", icon: Mic },
  { href: "/app/profile", label: "Profile", icon: User },
] as const;

/** Fixed bottom tab bar for mobile. Hides on scroll-down, shows on scroll-up. */
export function MobileTabBar() {
  const pathname = usePathname();
  const [visible, setVisible] = useState(true);
  const lastScrollY = useRef(0);

  useEffect(() => {
    function handleScroll() {
      const currentY = window.scrollY;
      // Show when scrolling up or near top, hide when scrolling down
      if (currentY < 10) {
        setVisible(true);
      } else if (currentY < lastScrollY.current) {
        setVisible(true);
      } else if (currentY > lastScrollY.current + 5) {
        setVisible(false);
      }
      lastScrollY.current = currentY;
    }

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <nav
      aria-label="Mobile navigation"
      className={cn(
        "fixed bottom-0 left-0 right-0 z-50 border-t border-border/50 bg-background/95 backdrop-blur-sm md:hidden",
        "transition-transform duration-300 ease-in-out",
        visible ? "translate-y-0" : "translate-y-full"
      )}
    >
      <div className="flex items-stretch justify-around">
        {tabs.map((tab) => {
          const isActive =
            pathname === tab.href ||
            pathname.startsWith(tab.href + "/");
          const Icon = tab.icon;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                "flex flex-1 flex-col items-center justify-center gap-0.5 py-2 min-h-[48px] transition-colors",
                isActive
                  ? "text-saffron"
                  : "text-muted-foreground active:text-foreground"
              )}
            >
              <Icon
                className={cn("size-5", isActive && "stroke-[2.5]")}
                aria-hidden="true"
              />
              <span className="text-[11px] font-medium leading-none">
                {tab.label}
              </span>
              {isActive && (
                <span className="absolute top-0 h-0.5 w-8 rounded-b bg-saffron" />
              )}
            </Link>
          );
        })}
      </div>
      {/* Safe area inset for iOS notch devices */}
      <div className="h-[env(safe-area-inset-bottom)]" />
    </nav>
  );
}
