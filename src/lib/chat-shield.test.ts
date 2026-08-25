import { describe, it, expect } from "vitest";
import { scanMessage } from "./chat-shield";

describe("scanMessage", () => {
  it("allows ordinary conversation through untouched", () => {
    const result = scanMessage("Hey! Looking forward to Saturday, should be a fun run.");
    expect(result.severity).toBe("none");
    expect(result.matches).toEqual([]);
  });

  it("blocks a phone number at medium severity", () => {
    const result = scanMessage("call me on 0412 345 678 later");
    expect(result.severity).toBe("medium");
    expect(result.matches.map((m) => m.category)).toContain("phone-number");
  });

  it("blocks an email address at medium severity", () => {
    const result = scanMessage("reach me at jordan.smith@example.com anytime");
    expect(result.severity).toBe("medium");
    expect(result.matches.map((m) => m.category)).toContain("email");
  });

  it("blocks an obfuscated email at medium severity", () => {
    const result = scanMessage("it's jordan at gmail dot com");
    expect(result.severity).toBe("medium");
    expect(result.matches.map((m) => m.category)).toContain("email");
  });

  it("blocks a social handle at medium severity", () => {
    const result = scanMessage("follow me @jordan.does.things");
    expect(result.severity).toBe("medium");
    expect(result.matches.map((m) => m.category)).toContain("social-handle");
  });

  it("blocks an explicit off-platform invite phrase at medium severity", () => {
    const result = scanMessage("let's move to whatsapp instead");
    expect(result.severity).toBe("medium");
    expect(result.matches.map((m) => m.category)).toContain("off-platform-invite");
  });

  it("blocks a street address at medium severity", () => {
    const result = scanMessage("I'm at 42 Smith Street if you want to swing by");
    expect(result.severity).toBe("medium");
    expect(result.matches.map((m) => m.category)).toContain("address");
  });

  it("only warns (low) on a bare link, not a hard block", () => {
    const result = scanMessage("check this out https://example.com/event-photos");
    expect(result.severity).toBe("low");
    expect(result.matches.map((m) => m.category)).toContain("link");
  });

  it("only warns (low) on a bare platform mention with no handle or invite", () => {
    const result = scanMessage("I saw a cool recipe on instagram yesterday");
    expect(result.severity).toBe("low");
    expect(result.matches.map((m) => m.category)).toContain("platform-mention");
  });

  it("escalates to high severity on an unambiguous threat phrase", () => {
    const result = scanMessage("show up or you'll regret this, I know where you live");
    expect(result.severity).toBe("high");
  });

  it("does not false-positive on short numbers like times or prices", () => {
    const result = scanMessage("let's meet at 7:30, tickets are $25");
    expect(result.severity).toBe("none");
  });

  it("takes the highest severity when multiple signals are present", () => {
    const result = scanMessage("here's my number 0412 345 678, check my insta too");
    expect(result.severity).toBe("medium");
  });
});
