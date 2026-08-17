import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { Geist, Geist_Mono, Fraunces } from "next/font/google";
import "./globals.css";
import { getCurrentUser } from "@/lib/session";
import { NavLink } from "@/components/NavLink";
import { Button } from "@/components/Button";
import { MobileDock } from "@/components/MobileDock";
import { AutoHideHeader } from "@/components/AutoHideHeader";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  axes: ["opsz", "SOFT", "WONK"],
});

export const metadata: Metadata = {
  title: "WhoWe: meet up, together",
  description: "Organize small local events and meet people who want to join in.",
  icons: {
    icon: "/favicon.png",
  },
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const user = await getCurrentUser();

  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${fraunces.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <AutoHideHeader>
          <div className="w-full px-4 sm:px-6 lg:px-10 py-3 flex items-center justify-between gap-4">
            <Link href="/" className="shrink-0">
              <Image src="/WhoWe.png" alt="WhoWe" width={120} height={40} priority />
            </Link>
            <nav className="hidden lg:flex items-center gap-5">
              <NavLink href="/">Events</NavLink>
              {user && <NavLink href="/my-events">My events</NavLink>}
              {user && <NavLink href="/chats">Chats</NavLink>}
              {user && (
                <Link href="/events/new">
                  <Button variant="primary" className="px-4 py-2 text-sm">
                    Create event
                  </Button>
                </Link>
              )}
              {user ? (
                <Link href="/profile" className="text-sm text-muted hover:text-foreground">
                  {user.name}
                </Link>
              ) : (
                <NavLink href="/sign-in">Sign in</NavLink>
              )}
            </nav>

            <div className="flex lg:hidden items-center gap-3 text-sm">
              {user ? (
                <Link href="/profile" className="text-muted hover:text-foreground">
                  {user.name}
                </Link>
              ) : (
                <Link href="/sign-in" className="text-primary font-medium">
                  Sign in
                </Link>
              )}
            </div>
          </div>
        </AutoHideHeader>
        <main className="flex-1 relative w-full pb-20 lg:pb-0">{children}</main>
        <footer className="hidden lg:block border-t-2 border-foreground mt-16">
          <div className="w-full px-4 sm:px-6 lg:px-10 py-6 text-sm text-muted flex items-center justify-between">
            <span>WhoWe: it starts with who, it becomes we.</span>
          </div>
        </footer>
        <MobileDock signedIn={!!user} />
      </body>
    </html>
  );
}
