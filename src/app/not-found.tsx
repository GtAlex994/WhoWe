import Link from "next/link";
import { Button } from "@/components/Button";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md text-center space-y-6">
        <h1 className="text-3xl font-semibold tracking-tight">Page not found</h1>
        <p className="text-muted">The page you&apos;re looking for doesn&apos;t exist or may have moved.</p>
        <Link href="/">
          <Button variant="primary" className="w-full">
            Go home
          </Button>
        </Link>
      </div>
    </div>
  );
}
