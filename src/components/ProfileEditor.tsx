"use client";

import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { FadeIn } from "@/components/FadeIn";

interface ProfileEditorProps {
  title: string;
  description: string;
  children: React.ReactNode;
}

export function ProfileEditor({ title, description, children }: ProfileEditorProps) {
  return (
    <div className="w-full min-h-screen bg-background pb-20 lg:pb-8">
      {/* Header with back button */}
      <div className="border-b-2 border-foreground">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-10 py-6 flex items-center gap-4">
          <Link
            href="/profile"
            className="flex items-center gap-2 text-sm text-muted hover:text-foreground transition-colors"
            aria-label="Back to profile"
          >
            <ChevronLeft size={18} />
            Back
          </Link>
        </div>
      </div>

      {/* Main content */}
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-10 py-8">
        <FadeIn>
          <div className="mb-8">
            <h1 className="text-3xl font-semibold tracking-tight">{title}</h1>
            {description && <p className="text-muted mt-2">{description}</p>}
          </div>

          {children}
        </FadeIn>
      </div>
    </div>
  );
}
