type ColorInitialsAvatarProps = {
  initials: string;
  color: string;
  className?: string;
};

export function ColorInitialsAvatar({ initials, color, className = "" }: ColorInitialsAvatarProps) {
  return (
    <div
      role="img"
      aria-label={`Avatar with initials ${initials}`}
      style={{ backgroundColor: color }}
      className={`rounded-full border-2 border-foreground flex items-center justify-center font-display font-semibold text-white ${className}`}
    >
      {initials}
    </div>
  );
}
