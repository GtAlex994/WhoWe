import { db } from "@/lib/firebase-admin";
import { distanceKm } from "@/lib/geo";

type Candidate = { id: string; locationLat: number | null; locationLng: number | null };

async function fetchRandomBatch(pivot: number, size: number): Promise<Candidate[]> {
  const forward = await db
    .collection("users")
    .where("randomKey", ">=", pivot)
    .orderBy("randomKey", "asc")
    .limit(size)
    .get();

  let docs = forward.docs;
  if (docs.length < size) {
    // Wrap around to the start of the randomKey range if the forward query came up short.
    const wrap = await db
      .collection("users")
      .where("randomKey", "<", pivot)
      .orderBy("randomKey", "asc")
      .limit(size - docs.length)
      .get();
    docs = [...docs, ...wrap.docs];
  }

  return docs.map((d) => ({
    id: d.id,
    locationLat: d.data().locationLat ?? null,
    locationLng: d.data().locationLng ?? null,
  }));
}

/**
 * Picks up to `count` random candidate user IDs for a Wild event invite,
 * favoring ones near (eventLat, eventLng) when they have a location set.
 * Firestore has no native random-order query, so this samples via a random
 * pivot on a `randomKey` field every user doc carries, then ranks that
 * random sample by distance — random pool, location-aware pick within it.
 */
export async function pickWildCandidates(
  eventLat: number,
  eventLng: number,
  excludeIds: Set<string>,
  count: number,
): Promise<string[]> {
  if (count <= 0) return [];

  const pivot = Math.random();
  // Over-fetch to absorb exclusions (creator + already-invited/joined/declined).
  const batch = await fetchRandomBatch(pivot, count + excludeIds.size + 10);

  const ranked = batch
    .filter((c) => !excludeIds.has(c.id))
    .map((c) => ({
      id: c.id,
      distance:
        c.locationLat != null && c.locationLng != null
          ? distanceKm({ lat: eventLat, lng: eventLng }, { lat: c.locationLat, lng: c.locationLng })
          : Infinity,
    }))
    .sort((a, b) => a.distance - b.distance);

  return ranked.slice(0, count).map((c) => c.id);
}
