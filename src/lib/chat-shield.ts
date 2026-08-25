// Pre-send screening for chat messages — flags shared contact info,
// off-platform invitations, and a short list of unambiguous high-risk
// phrases before a message is written to Firestore.
//
// This is regex/keyword heuristics, not a machine-learned classifier. It
// will miss creative evasions (spelled-out digits, deliberate misspellings)
// and can false-positive on innocuous messages (e.g. "check out this cafe on
// instagram"). Severity is calibrated around that: weak signals (a bare link,
// a platform name with no handle) only warn and can be sent anyway; clear
// contact info blocks outright; the high-risk phrase list is deliberately
// short and only catches unmistakable cases — real sexual-harassment or
// threat detection needs human review, not a bigger keyword list.

export type ShieldSeverity = "none" | "low" | "medium" | "high";

export type ShieldMatch = {
  category: string;
  reason: string;
};

export type ShieldResult = {
  severity: ShieldSeverity;
  matches: ShieldMatch[];
};

function digitsOnly(s: string): string {
  return s.replace(/\D/g, "");
}

function hasPhoneNumber(text: string): boolean {
  const candidates = text.match(/(?<![\w])(\+?\d[\d\s().-]{6,}\d)(?![\w])/g) ?? [];
  return candidates.some((c) => digitsOnly(c).length >= 8);
}

function hasEmail(text: string): boolean {
  if (/[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i.test(text)) return true;
  // Lightly obfuscated form: "name at gmail dot com".
  return /\b[a-z0-9._%-]+\s*\(?\s*at\s*\)?\s*[a-z0-9-]+\s*\(?\s*dot\s*\)?\s*(com|net|org|co|io|gmail|outlook|yahoo)\b/i.test(
    text,
  );
}

function hasUrl(text: string): boolean {
  if (/\b(https?:\/\/|www\.)\S+/i.test(text)) return true;
  return /\b[a-z0-9-]+\.(com|net|org|io|co|me|app)\/\S+/i.test(text);
}

const SOCIAL_PLATFORMS = [
  "instagram",
  "insta",
  "snapchat",
  "snap",
  "whatsapp",
  "telegram",
  "tiktok",
  "kik",
  "discord",
  "facebook",
  "messenger",
  "signal",
];

function hasHandle(text: string): boolean {
  return /(?:^|\s)@[a-z0-9._]{2,30}\b/i.test(text);
}

function mentionsSocialPlatform(text: string): boolean {
  const lower = text.toLowerCase();
  return SOCIAL_PLATFORMS.some((w) => new RegExp(`\\b${w}\\b`).test(lower));
}

const INVITE_PHRASES = [
  "text me",
  "call me",
  "message me on",
  "dm me",
  "add me on",
  "find me on",
  "hit me up",
  "let's move to",
  "lets move to",
  "off this app",
  "off the app",
  "outside the app",
  "outside whowe",
  "my number is",
  "here's my number",
  "heres my number",
  "here's my email",
  "heres my email",
  "my snap is",
  "my insta is",
  "my whatsapp is",
];

function hasInvitePhrase(text: string): boolean {
  const lower = text.toLowerCase();
  return INVITE_PHRASES.some((p) => lower.includes(p));
}

const STREET_SUFFIXES = [
  "street",
  "st",
  "avenue",
  "ave",
  "road",
  "rd",
  "boulevard",
  "blvd",
  "drive",
  "dr",
  "lane",
  "ln",
  "court",
  "ct",
  "way",
  "place",
  "pl",
];

function hasStreetAddress(text: string): boolean {
  const suffixGroup = STREET_SUFFIXES.join("|");
  return new RegExp(`\\b\\d{1,5}\\s+[a-z][a-z\\s]{0,25}\\b(${suffixGroup})\\b`, "i").test(text);
}

// Deliberately short and conservative — a coarse net for unmistakable
// phrases, not a general sexual-harassment/threat classifier.
const HIGH_RISK_PHRASES = [
  "send nudes",
  "send pics of yourself",
  "send a pic of yourself naked",
  "i know where you live",
  "i'll find you",
  "ill find you",
  "you'll regret this",
  "youll regret this",
  "i will hurt you",
  "or i'll hurt",
  "or ill hurt",
  "watch your back",
];

function hasHighRiskPhrase(text: string): boolean {
  const lower = text.toLowerCase();
  return HIGH_RISK_PHRASES.some((p) => lower.includes(p));
}

const MEDIUM_CATEGORIES = new Set(["phone-number", "email", "social-handle", "off-platform-invite", "address"]);
const LOW_CATEGORIES = new Set(["link", "platform-mention"]);

export function scanMessage(text: string): ShieldResult {
  const matches: ShieldMatch[] = [];

  if (hasHighRiskPhrase(text)) {
    matches.push({
      category: "high-risk-language",
      reason: "This looks like it may involve a threat or sexual solicitation.",
    });
  }
  if (hasPhoneNumber(text)) {
    matches.push({ category: "phone-number", reason: "This looks like it contains a phone number." });
  }
  if (hasEmail(text)) {
    matches.push({ category: "email", reason: "This looks like it contains an email address." });
  }
  if (hasHandle(text)) {
    matches.push({ category: "social-handle", reason: "This looks like it contains a social media handle." });
  }
  if (hasInvitePhrase(text)) {
    matches.push({
      category: "off-platform-invite",
      reason: "This looks like an invitation to continue somewhere off WhoWe.",
    });
  }
  if (hasStreetAddress(text)) {
    matches.push({ category: "address", reason: "This looks like it contains a street address." });
  }
  if (hasUrl(text)) {
    matches.push({ category: "link", reason: "This looks like it contains a link." });
  }
  if (
    mentionsSocialPlatform(text) &&
    !matches.some((m) => m.category === "social-handle" || m.category === "off-platform-invite")
  ) {
    matches.push({ category: "platform-mention", reason: "This mentions another platform." });
  }

  const severity: ShieldSeverity = matches.some((m) => m.category === "high-risk-language")
    ? "high"
    : matches.some((m) => MEDIUM_CATEGORIES.has(m.category))
      ? "medium"
      : matches.some((m) => LOW_CATEGORIES.has(m.category))
        ? "low"
        : "none";

  return { severity, matches };
}
