import Link from "next/link";
import Image from "next/image";

export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b-2 border-foreground bg-background/95">
        <div className="w-full px-4 sm:px-6 lg:px-10 py-3">
          <Link href="/" className="shrink-0">
            <Image src="/WhoWe.png" alt="WhoWe" width={120} height={40} priority />
          </Link>
        </div>
      </header>
      <main className="flex-1">{children}</main>
    </div>
  );
}
