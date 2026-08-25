"use client";

import { useState, useTransition } from "react";
import { updateNotifyTrustedContact } from "@/app/actions";

type Props = {
  eventId: string;
  initialOnCheckIn: boolean;
  initialOnMissedCheckOut: boolean;
};

export function TrustedContactNotifyToggle({ eventId, initialOnCheckIn, initialOnMissedCheckOut }: Props) {
  const [onCheckIn, setOnCheckIn] = useState(initialOnCheckIn);
  const [onMissedCheckOut, setOnMissedCheckOut] = useState(initialOnMissedCheckOut);
  const [, startTransition] = useTransition();

  function save(next: { onCheckIn: boolean; onMissedCheckOut: boolean }) {
    startTransition(() => {
      updateNotifyTrustedContact(eventId, next.onCheckIn, next.onMissedCheckOut).catch(() => {
        // Revert optimistic toggle on failure.
        setOnCheckIn(initialOnCheckIn);
        setOnMissedCheckOut(initialOnMissedCheckOut);
      });
    });
  }

  return (
    <div className="border-2 border-foreground rounded-md p-4">
      <p className="text-sm font-medium">Trusted contact notifications</p>
      <p className="text-xs text-muted mt-1 mb-2">For this event only. They&apos;re never shown who else is attending.</p>
      <label className="flex items-center gap-2 text-sm cursor-pointer">
        <input
          type="checkbox"
          checked={onCheckIn}
          onChange={(e) => {
            setOnCheckIn(e.target.checked);
            save({ onCheckIn: e.target.checked, onMissedCheckOut });
          }}
        />
        Notify when I check in
      </label>
      <label className="flex items-center gap-2 text-sm cursor-pointer mt-1.5">
        <input
          type="checkbox"
          checked={onMissedCheckOut}
          onChange={(e) => {
            setOnMissedCheckOut(e.target.checked);
            save({ onCheckIn, onMissedCheckOut: e.target.checked });
          }}
        />
        Notify if I miss check-out and don&apos;t respond
      </label>
    </div>
  );
}
