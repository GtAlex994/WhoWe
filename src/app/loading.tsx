export default function Loading() {
  return (
    <div className="min-h-[50vh] flex items-center justify-center p-4">
      <div
        className="h-8 w-8 rounded-full border-2 border-foreground border-t-transparent animate-spin"
        role="status"
        aria-label="Loading"
      />
    </div>
  );
}
