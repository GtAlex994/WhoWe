"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "motion/react";
import { Home, Plus, UserRound, LogIn, CalendarDays, MessageCircle } from "lucide-react";
import { useAutoHideOnScroll } from "@/hooks/useAutoHideOnScroll";
import { isNavHiddenRoute } from "@/lib/nav";

function DockLink({
  href,
  label,
  icon: Icon,
  showDot = false,
}: {
  href: string;
  label: string;
  icon: typeof Home;
  showDot?: boolean;
}) {
  const pathname = usePathname();
  const active = pathname === href;

  return (
    <Link href={href} className="flex flex-col items-center justify-center gap-0.5 px-3 sm:px-4 py-2 relative">
      <span className="relative">
        <Icon size={22} strokeWidth={active ? 2.5 : 2} className={active ? "text-primary" : "text-muted"} />
        {showDot && (
          <span
            aria-hidden="true"
            className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-primary border border-surface"
          />
        )}
      </span>
      <span className={`text-[10px] font-medium ${active ? "text-primary" : "text-muted"}`}>{label}</span>
    </Link>
  );
}

export function Dock({ signedIn, hasUnreadChats = false }: { signedIn: boolean; hasUnreadChats?: boolean }) {
  const pathname = usePathname();
  const hidden = useAutoHideOnScroll();

  if (isNavHiddenRoute(pathname)) {
    return null;
  }

  return (
    <div
      className={`fixed inset-x-4 z-40 flex justify-center transition-transform duration-300 ease-out ${
        hidden ? "translate-y-[calc(100%+2rem)]" : "translate-y-0"
      }`}
      style={{ bottom: "max(1rem, env(safe-area-inset-bottom))" }}
    >
      <nav className="flex items-stretch gap-1 px-2 max-w-full bg-surface border-2 border-foreground rounded-2xl shadow-[3px_3px_0_0_var(--foreground)]">
        <DockLink href="/" label="Events" icon={Home} />
        {signedIn && <DockLink href="/my-events" label="My events" icon={CalendarDays} />}

        <div className="relative flex items-center justify-center w-16 shrink-0">
          {signedIn ? (
            <Link
              href="/events/new"
              aria-label="Create event"
              className="absolute left-1/2 bottom-2 -translate-x-1/2"
            >
              <motion.span
                whileTap={{ scale: 0.92 }}
                className="flex items-center justify-center h-16 w-16 rounded-full bg-primary text-primary-foreground border-2 border-foreground shadow-[2px_2px_0_0_var(--foreground)]"
              >
                <Plus size={28} strokeWidth={2.5} />
              </motion.span>
            </Link>
          ) : (
            <Link
              href="/sign-in"
              aria-label="Sign in"
              className="absolute left-1/2 bottom-2 -translate-x-1/2"
            >
              <motion.span
                whileTap={{ scale: 0.92 }}
                className="flex items-center justify-center h-16 w-16 rounded-full bg-primary text-primary-foreground border-2 border-foreground shadow-[2px_2px_0_0_var(--foreground)]"
              >
                <LogIn size={28} strokeWidth={2.5} />
              </motion.span>
            </Link>
          )}
        </div>

        {signedIn && <DockLink href="/chats" label="Chats" icon={MessageCircle} showDot={hasUnreadChats} />}
        {signedIn ? (
          <DockLink href="/profile" label="Profile" icon={UserRound} />
        ) : (
          <DockLink href="/sign-in" label="Sign in" icon={LogIn} />
        )}
      </nav>
    </div>
  );
}
