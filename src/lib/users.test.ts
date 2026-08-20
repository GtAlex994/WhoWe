import { describe, it, expect } from "vitest";
import {
  applyLocationPrecision,
  isValidMaxDistance,
  toPublicProfile,
  toUserDTO,
  MIN_MAX_DISTANCE_KM,
  MAX_MAX_DISTANCE_KM,
  type UserDTO,
} from "./users";

function makeUser(overrides: Partial<UserDTO> = {}): UserDTO {
  return {
    ...toUserDTO("uid-1", {
      name: "Testy Tester",
      username: "testytester",
      userId: "1234567",
      avatar: { style: "avataaars", seed: "abc" },
      bio: "Hello there",
      interests: ["Hiking", "Coffee"],
      activities: ["Board Games"],
      languages: [{ language: "English", proficiency: "Fluent" }],
      locationLabel: "Fitzroy, City of Yarra, Victoria, Australia",
      locationPrecision: "city",
      dislikes: ["Nightlife"],
      socialStyle: { groupSize: "4–6 people", planning: "Spontaneous", pace: ["Relaxed"], personality: "Introvert" },
      lookingFor: ["Make new friends"],
      matchingPreferences: { ageRange: null, maxDistance: 75, groupSize: null, preferredLanguages: [], eventTypes: [] },
      dateOfBirth: "1990-01-01",
      locationLat: -37.8,
      locationLng: 144.98,
      hostRatingSum: 20,
      hostRatingCount: 4,
      eventsAttended: 3,
      eventsHosted: 1,
      createdAt: { toDate: () => new Date("2026-01-01") },
    }),
    ...overrides,
  };
}

describe("applyLocationPrecision", () => {
  it("returns null when there is no location label", () => {
    expect(applyLocationPrecision(null, "city")).toBeNull();
  });

  it("keeps only the first (most specific) segment for 'city' precision", () => {
    expect(applyLocationPrecision("Adelaide, South Australia, Australia", "city")).toBe("Adelaide");
    expect(applyLocationPrecision("Fitzroy, City of Yarra, Victoria, Australia", "city")).toBe("Fitzroy");
  });

  it("keeps the first two segments for 'suburb-and-city' precision", () => {
    expect(applyLocationPrecision("Fitzroy, City of Yarra, Victoria, Australia", "suburb-and-city")).toBe(
      "Fitzroy, City of Yarra",
    );
  });

  it("defaults to the more private 'city' behavior when precision is null", () => {
    expect(applyLocationPrecision("Adelaide, South Australia, Australia", null)).toBe("Adelaide");
  });

  it("falls back to the raw label if splitting produces nothing usable", () => {
    expect(applyLocationPrecision("Adelaide", "city")).toBe("Adelaide");
  });
});

describe("isValidMaxDistance", () => {
  it("accepts values within the slider's range", () => {
    expect(isValidMaxDistance(MIN_MAX_DISTANCE_KM)).toBe(true);
    expect(isValidMaxDistance(MAX_MAX_DISTANCE_KM)).toBe(true);
    expect(isValidMaxDistance(75)).toBe(true);
  });

  it("rejects values outside the range", () => {
    expect(isValidMaxDistance(MIN_MAX_DISTANCE_KM - 1)).toBe(false);
    expect(isValidMaxDistance(MAX_MAX_DISTANCE_KM + 1)).toBe(false);
    expect(isValidMaxDistance(0)).toBe(false);
    expect(isValidMaxDistance(-5)).toBe(false);
  });

  it("rejects non-finite or non-numeric input", () => {
    expect(isValidMaxDistance(NaN)).toBe(false);
    expect(isValidMaxDistance(Infinity)).toBe(false);
    expect(isValidMaxDistance("50")).toBe(false);
    expect(isValidMaxDistance(null)).toBe(false);
    expect(isValidMaxDistance(undefined)).toBe(false);
  });
});

describe("toPublicProfile", () => {
  it("applies the owner's chosen location precision, never the raw stored label", () => {
    const user = makeUser({ locationPrecision: "city" });
    expect(toPublicProfile(user).locationLabel).toBe("Fitzroy");

    const suburbAndCity = makeUser({ locationPrecision: "suburb-and-city" });
    expect(toPublicProfile(suburbAndCity).locationLabel).toBe("Fitzroy, City of Yarra");
  });

  it("never exposes exact coordinates, private name, or matching-only fields", () => {
    const profile = toPublicProfile(makeUser());
    const serialized = JSON.stringify(profile);

    expect(profile).not.toHaveProperty("name");
    expect(profile).not.toHaveProperty("locationLat");
    expect(profile).not.toHaveProperty("locationLng");
    expect(profile).not.toHaveProperty("dislikes");
    expect(profile).not.toHaveProperty("socialStyle");
    expect(profile).not.toHaveProperty("lookingFor");
    expect(profile).not.toHaveProperty("matchingPreferences");
    expect(profile).not.toHaveProperty("dateOfBirth");
    expect(profile).not.toHaveProperty("email");

    // Belt-and-suspenders: none of the private values leak through anywhere
    // in the serialized output, even nested under an unexpected key.
    expect(serialized).not.toContain("Nightlife");
    expect(serialized).not.toContain("1990-01-01");
    expect(serialized).not.toContain("-37.8");
    expect(serialized).not.toContain("144.98");
    expect(serialized).not.toContain("Testy Tester");
  });

  it("still exposes the intended public fields", () => {
    const profile = toPublicProfile(makeUser());
    expect(profile.username).toBe("testytester");
    expect(profile.bio).toBe("Hello there");
    expect(profile.interests).toEqual(["Hiking", "Coffee"]);
    expect(profile.activities).toEqual(["Board Games"]);
    expect(profile.languages).toEqual([{ language: "English", proficiency: "Fluent" }]);
    expect(profile.eventsAttended).toBe(3);
    expect(profile.eventsHosted).toBe(1);
    expect(profile.hostRatingAvg).toBe(5);
  });
});
