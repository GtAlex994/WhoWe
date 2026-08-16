"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "motion/react";
import { Home, ShieldCheck, Plus, UserRound, LogIn, Settings } from "lucide-react";

function DockLink({
  href,
  label,
  icon: Icon,
}: {
  href: string;
  label: string;
  icon: typeof Home;
}) {
  const pathname = usePathname();
  const active = pathname === href;

  return (
    <Link
      href={href}
      className="flex flex-1 flex-col items-center justify-center gap-0.5 py-2 relative"
    >
      <Icon
        size={22}
        strokeWidth={active ? 2.5 : 2}
        className={active ? "text-primary" : "text-muted"}
      />
      <span className={`text-[10px] font-medium ${active ? "text-primary" : "text-muted"}`}>
        {label}
      </span>
    </Link>
  );
}

const HIDDEN_ON = ["/sign-in", "/onboarding"];

export function MobileDock({ signedIn }: { signedIn: boolean }) {
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
      <DockLink href="/safety" label="Safety" icon={ShieldCheck} />

      <div className="flex flex-1 items-center justify-center">
        <Link href="/events/new" aria-label="Create event" className="-mt-6">
          <motion.span
            whileTap={{ scale: 0.92 }}
            className="flex items-center justify-center h-14 w-14 rounded-full bg-primary text-primary-foreground border-2 border-foreground shadow-[3px_3px_0_0_var(--foreground)]"
          >
            <Plus size={26} strokeWidth={2.5} />
          </motion.span>
        </Link>
      </div>

      {signedIn ? (
        <DockLink href="/profile" label="Profile" icon={UserRound} />
      ) : (
        <DockLink href="/sign-in" label="Sign in" icon={LogIn} />
      )}
      {signedIn && <DockLink href="/settings" label="Settings" icon={Settings} />}
    </nav>
  );
}
