"use client";

import { useEffect, useRef, useState } from "react";

type Suggestion = { id: number; name: string; lat: string; lon: string };

export function LocationInput({
  defaultValue = "",
  defaultLat = null,
  defaultLon = null,
}: {
  defaultValue?: string;
  defaultLat?: number | null;
  defaultLon?: number | null;
}) {
  const [value, setValue] = useState(defaultValue);
  const [coords, setCoords] = useState<{ lat: string; lon: string } | null>(
    defaultLat != null && defaultLon != null ? { lat: String(defaultLat), lon: String(defaultLon) } : null,
  );
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [highlighted, setHighlighted] = useState(-1);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const skipNextFetch = useRef(false);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (skipNextFetch.current) {
      skipNextFetch.current = false;
      return;
    }

    debounceRef.current = setTimeout(async () => {
      const trimmed = value.trim();
      if (trimmed.length < 3) {
        setSuggestions([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const res = await fetch(`/api/geocode?q=${encodeURIComponent(trimmed)}`);
        const data = await res.json();
        setSuggestions(data.results ?? []);
        setOpen(true);
        setHighlighted(-1);
      } catch {
        setSuggestions([]);
      } finally {
        setLoading(false);
      }
    }, 350);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [value]);

  function select(s: Suggestion) {
    skipNextFetch.current = true;
    setValue(s.name);
    setCoords({ lat: s.lat, lon: s.lon });
    setSuggestions([]);
    setOpen(false);
  }

  return (
    <div className="relative">
      <input type="hidden" name="latitude" value={coords?.lat ?? ""} />
      <input type="hidden" name="longitude" value={coords?.lon ?? ""} />
      <input
        type="text"
        name="location"
        required
        autoComplete="off"
        value={value}
        onChange={(e) => {
          setCoords(null);
          setValue(e.target.value);
        }}
        onFocus={() => suggestions.length > 0 && setOpen(true)}
        onKeyDown={(e) => {
          if (!open || suggestions.length === 0) return;
          if (e.key === "ArrowDown") {
            e.preventDefault();
            setHighlighted((h) => Math.min(h + 1, suggestions.length - 1));
          } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setHighlighted((h) => Math.max(h - 1, 0));
          } else if (e.key === "Enter" && highlighted >= 0) {
            e.preventDefault();
            select(suggestions[highlighted]);
          } else if (e.key === "Escape") {
            setOpen(false);
          }
        }}
        placeholder="Start typing an address: restaurant, cafe, park…"
        className="w-full border-2 border-foreground bg-surface rounded-md px-4 py-2.5 outline-none"
      />
      {loading && (
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted">…</span>
      )}
      {open && suggestions.length > 0 && (
        <ul className="absolute z-30 mt-1 w-full bg-surface border-2 border-foreground rounded-md shadow-[3px_3px_0_0_var(--foreground)] max-h-64 overflow-auto">
          {suggestions.map((s, i) => (
            <li key={s.id}>
              <button
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  select(s);
                }}
                className={`w-full text-left px-4 py-2.5 text-sm border-b border-border last:border-b-0 ${
                  i === highlighted ? "bg-surface-muted" : ""
                }`}
              >
                {s.name}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
