import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/session";
import { getChatMessages, isEventAttendee } from "@/lib/chat";

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: eventId } = await params;

  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  const allowed = await isEventAttendee(eventId, user.id);
  if (!allowed) {
    return NextResponse.json({ error: "Not an attendee" }, { status: 403 });
  }

  const messages = await getChatMessages(eventId, user.id);
  return NextResponse.json({ messages });
}
