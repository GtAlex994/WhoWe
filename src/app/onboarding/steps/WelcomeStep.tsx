const BENEFITS = [
  "Discover plans that fit your interests.",
  "Meet people looking for the same kinds of connections.",
  "Control what others can see about you.",
];

export function WelcomeStep() {
  return (
    <div className="space-y-6">
      <p className="text-muted">
        Tell us a little about yourself so we can recommend nearby plans and help you meet people with shared interests.
      </p>
      <ul className="space-y-3">
        {BENEFITS.map((benefit) => (
          <li key={benefit} className="flex items-start gap-2 text-sm">
            <span aria-hidden="true">✓</span>
            <span>{benefit}</span>
          </li>
        ))}
      </ul>
      <p className="text-xs text-muted">About 3 minutes</p>
    </div>
  );
}
