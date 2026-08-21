"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "motion/react";
import { Home, Plus, UserRound, LogIn, CalendarDays, MessageCircle } from "lucide-react";

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
    <Link
      href={href}
      className="flex flex-1 flex-col items-center justify-center gap-0.5 py-2 relative"
    >
      <span className="relative">
        <Icon
          size={22}
          strokeWidth={active ? 2.5 : 2}
          className={active ? "text-primary" : "text-muted"}
        />
        {showDot && <span aria-hidden="true" className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-primary border border-surface" />}
      </span>
      <span className={`text-[10px] font-medium ${active ? "text-primary" : "text-muted"}`}>
        {label}
      </span>
    </Link>
  );
}

const HIDDEN_ON = ["/sign-in", "/onboarding"];

export function MobileDock({ signedIn, hasUnreadChats = false }: { signedIn: boolean; hasUnreadChats?: boolean }) {
  const pathname = usePathname();
  if (HIDDEN_ON.some((path) => pathname === path || pathname.startsWith(`${path}/`))) {
    return null;
  }

  return (
    <nav
      className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-surface border-t-2 border-foreground flex items-stretch"
      style={{ paddingBottom: "clamp(0px, env(safe-area-inset-bottom), 24px)" }}
    >
      <DockLink href="/" label="Events" icon={Home} />
      {signedIn && <DockLink href="/my-events" label="My events" icon={CalendarDays} />}

      <div className="flex flex-1 items-center justify-center">
        {signedIn ? (
          <Link href="/events/new" aria-label="Create event" className="-mt-6">
            <motion.span
              whileTap={{ scale: 0.92 }}
              className="flex items-center justify-center h-14 w-14 rounded-full bg-primary text-primary-foreground border-2 border-foreground shadow-[3px_3px_0_0_var(--foreground)]"
            >
              <Plus size={26} strokeWidth={2.5} />
            </motion.span>
          </Link>
        ) : (
          <Link href="/sign-in" aria-label="Sign in" className="-mt-6">
            <motion.span
              whileTap={{ scale: 0.92 }}
              className="flex items-center justify-center h-14 w-14 rounded-full bg-primary text-primary-foreground border-2 border-foreground shadow-[3px_3px_0_0_var(--foreground)]"
            >
              <LogIn size={26} strokeWidth={2.5} />
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
  );
}
