import { notFound, redirect } from "next/navigation";
import { getEvent } from "@/lib/events";
import { getCurrentUser } from "@/lib/session";
import { FadeIn } from "@/components/FadeIn";
import { EditEventForm } from "@/components/EditEventForm";
import { BackButton } from "@/components/BackButton";

export default async function EditEventPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const event = await getEvent(id);
  if (!event) notFound();

  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");
  if (user.id !== event.creatorId) redirect(`/events/${id}`);
  if (event.isWild) redirect(`/events/${id}`);
  if (event.cancelledAt) redirect(`/events/${id}`);

  return (
    <div className="w-full max-w-xl mx-auto px-4 sm:px-6 lg:px-10 py-10 flex flex-col gap-6">
      <FadeIn>
        <BackButton />
      </FadeIn>
      <FadeIn>
        <h1 className="text-4xl font-semibold tracking-tight">Edit event</h1>
        <p className="text-muted mt-1.5">Update the details for this event.</p>
      </FadeIn>

      <FadeIn delay={0.08}>
        <EditEventForm event={event} />
      </FadeIn>
    </div>
  );
}
