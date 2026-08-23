import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { calculateProfileCompletion } from "@/lib/users";
import { FadeIn } from "@/components/FadeIn";
import { Button } from "@/components/Button";

export default async function ProfileCompletePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");

  const completion = calculateProfileCompletion(user);

  const sections = [
    {
      title: "Basic details",
      completed: !!user.name && user.name.trim().length > 0,
      icon: "✓",
      link: "/profile/edit/basic",
    },
    {
      title: "Interests",
      completed: Array.isArray(user.interests) && user.interests.length > 0,
      icon: "❤️",
      link: "/profile/edit/interests",
      label: "Add interests",
    },
    {
      title: "Activities",
      completed: Array.isArray(user.activities) && user.activities.length > 0,
      icon: "⚡",
      link: "/profile/edit/activities",
      label: "Add activities",
    },
    {
      title: "Languages",
      completed: Array.isArray(user.languages) && user.languages.length > 0,
      icon: "🗣️",
      link: "/profile/edit/languages",
      label: "Add languages",
    },
    {
      title: "Social style",
      completed: !!(
        user.socialStyle?.groupSize ||
        user.socialStyle?.planning ||
        user.socialStyle?.pace
      ),
      icon: "👥",
      link: "/profile/edit/social-style",
      label: "Set preferences",
    },
    {
      title: "Goals",
      completed: Array.isArray(user.lookingFor) && user.lookingFor.length > 0,
      icon: "🔎",
      link: "/profile/edit/goals",
      label: "Set goals",
    },
  ];

  const completedCount = sections.filter((s) => s.completed).length;

  return (
    <div className="w-full min-h-screen bg-background pb-20 lg:pb-8">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-10 py-8">
        <FadeIn>
          <div className="mb-8">
            <h1 className="text-3xl font-semibold tracking-tight">Complete your profile</h1>
            <p className="text-muted mt-2">
              The more you share, the better we can match you with like-minded people.
            </p>
          </div>

          {/* Progress */}
          <div className="mb-8 p-6 border-2 border-foreground rounded-md">
            <div className="flex items-center gap-4">
              <div className="flex-shrink-0">
                <div className="flex items-center justify-center h-20 w-20 rounded-full border-4 border-primary">
                  <div className="text-center">
                    <div className="text-2xl font-bold">{completion}%</div>
                    <div className="text-xs text-muted mt-0.5">complete</div>
                  </div>
                </div>
              </div>
              <div>
                <p className="font-semibold">
                  {completedCount} of {sections.length} sections complete
                </p>
                <p className="text-sm text-muted mt-1">
                  {completion === 100
                    ? "✓ Your profile is complete!"
                    : "Keep going! Every section helps improve your matches."}
                </p>
              </div>
            </div>
          </div>

          {/* Sections checklist */}
          <div className="space-y-2">
            {sections.map((section) => (
              <Link
                key={section.link}
                href={section.link}
                className="flex items-center justify-between p-4 border-2 border-foreground rounded-md hover:bg-surface transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <span className="text-lg">
                    {section.completed ? "✓" : "○"}
                  </span>
                  <div>
                    <div className="font-medium">{section.title}</div>
                  </div>
                </div>
                <span className="text-sm text-muted group-hover:text-foreground transition-colors">
                  {section.completed ? "Done" : section.label || "Complete"}
                </span>
              </Link>
            ))}
          </div>

          {/* Back button */}
          <div className="mt-8">
            <Link href="/profile">
              <Button variant="secondary">Back to profile</Button>
            </Link>
          </div>
        </FadeIn>
      </div>
    </div>
  );
}
