"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { blockUser, reportUser } from "@/app/moderation-actions";
import { Button } from "@/components/Button";
import { SingleChoice } from "@/components/SingleChoice";
import { REPORT_CATEGORIES } from "@/lib/moderation-constants";

type ProfileActionsProps = {
  targetUsername: string;
};

export function ProfileActions({ targetUsername }: ProfileActionsProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [reportOpen, setReportOpen] = useState(false);
  const [category, setCategory] = useState<string | null>(null);
  const [context, setContext] = useState("");
  const [reportSubmitted, setReportSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const closeReport = () => {
    setReportOpen(false);
    setReportSubmitted(false);
    setCategory(null);
    setContext("");
    setError(null);
  };

  const handleBlock = () => {
    setError(null);
    startTransition(async () => {
      try {
        const formData = new FormData();
        formData.set("targetUsername", targetUsername);
        await blockUser(formData);
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong");
      }
    });
  };

  const handleReportSubmit = () => {
    if (!category) {
      setError("Choose a reason for the report.");
      return;
    }
    setError(null);
    startTransition(async () => {
      try {
        const formData = new FormData();
        formData.set("targetUsername", targetUsername);
        formData.set("category", category);
        formData.set("context", context);
        await reportUser(formData);
        setReportSubmitted(true);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong");
      }
    });
  };

  return (
    <div className="flex items-center gap-3">
      <Button type="button" variant="secondary" className="text-sm px-3 py-1.5" onClick={() => setReportOpen(true)}>
        Report
      </Button>
      <Button type="button" variant="danger" className="text-sm px-3 py-1.5" onClick={handleBlock} disabled={isPending}>
        Block
      </Button>

      {reportOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <button type="button" aria-label="Close report dialog" onClick={closeReport} className="absolute inset-0 bg-black/40" />
          <div className="relative w-full max-w-sm bg-background border-2 border-foreground rounded-lg shadow-[4px_4px_0_0_var(--foreground)] p-5">
            {reportSubmitted ? (
              <>
                <h2 className="font-display font-semibold text-lg mb-2">Report submitted</h2>
                <p className="text-sm text-muted mb-4">Thanks — our team will review this.</p>
                <Button type="button" variant="secondary" className="w-full" onClick={closeReport}>
                  Close
                </Button>
              </>
            ) : (
              <>
                <h2 className="font-display font-semibold text-lg mb-3">Report this member</h2>
                <SingleChoice
                  label="Reason"
                  hint="Choose the option that best fits."
                  options={REPORT_CATEGORIES}
                  value={category}
                  onChange={setCategory}
                  required
                />
                <label htmlFor="report-context" className="text-sm font-medium block mt-4 mb-2">
                  Additional details <span className="font-normal text-muted">(optional)</span>
                </label>
                <textarea
                  id="report-context"
                  value={context}
                  onChange={(e) => setContext(e.target.value.slice(0, 1000))}
                  maxLength={1000}
                  rows={3}
                  className="w-full border-2 border-foreground bg-surface rounded-md px-4 py-2.5 outline-none text-sm resize-none"
                  placeholder="Anything that would help us understand what happened."
                />
                {error && <p className="text-sm text-[#8c2f2f] mt-2">{error}</p>}
                <div className="flex gap-3 mt-4">
                  <Button type="button" variant="primary" className="flex-1 text-sm" onClick={handleReportSubmit} disabled={isPending}>
                    {isPending ? "Submitting..." : "Submit report"}
                  </Button>
                  <Button type="button" variant="secondary" className="text-sm" onClick={closeReport}>
                    Cancel
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {error && !reportOpen && <p className="text-sm text-[#8c2f2f]">{error}</p>}
    </div>
  );
}
