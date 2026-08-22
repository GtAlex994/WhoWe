import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { MotionConfig } from "motion/react";
import { Geist, Geist_Mono, Fraunces } from "next/font/google";
import "./globals.css";
import { getCurrentUser } from "@/lib/session";
import { getUnreadEventIds } from "@/lib/chat";
import { Dock } from "@/components/Dock";
import { ConditionalHeader } from "@/components/ConditionalHeader";

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
  const hasUnreadChats = user ? (await getUnreadEventIds(user.id)).size > 0 : false;

  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${fraunces.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <MotionConfig reducedMotion="user">
          <ConditionalHeader>
            <div className="w-full px-4 sm:px-6 lg:px-10 py-3 flex items-center gap-3">
              <Link href="/" className="shrink-0">
                <Image src="/WhoWe.png" alt="WhoWe" width={120} height={40} priority />
              </Link>
              <span className="hidden sm:inline text-sm text-muted">It starts with who, it becomes we.</span>
            </div>
          </ConditionalHeader>
          <main className="flex-1 relative w-full pb-24">{children}</main>
          <Dock signedIn={!!user} hasUnreadChats={hasUnreadChats} />
        </MotionConfig>
      </body>
    </html>
  );
}
