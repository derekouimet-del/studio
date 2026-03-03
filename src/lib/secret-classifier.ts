export type Severity = "info" | "low" | "medium" | "high" | "critical";

export type Finding = {
  type: string; // e.g. "WordPress Nonce", "JWT", "AWS Access Key"
  severity: Severity;
  confidence: number; // 0..1
  redactedValue: string; // ALWAYS safe to display
  reason: string; // why it matched
  source?: string; // e.g. script id, url, line hint
  evidence?: string; // small context snippet (optional)
  category: "expected_token" | "credential" | "secret" | "key" | "unknown";
  tags: string[];
};

type Rule = {
  id: string;
  type: string;
  category: Finding["category"];
  severity: Severity;
  confidence: number;
  pattern: RegExp;
  predicate?: (m: RegExpExecArray, ctx: ClassifyContext) => boolean;
  redact?: (raw: string) => string;
  reason: string;
  tags?: string[];
};

export type ClassifyContext = {
  url?: string;
  sourceId?: string; // script id, header name, etc.
  surroundingText?: string; // small nearby chunk if you have it
};

const DEFAULT_REDACT = (raw: string) => redactMiddle(raw, 4, 4);

export function redactMiddle(s: string, left = 4, right = 4) {
  if (!s) return s;
  if (s.length <= left + right + 3) return `${s.slice(0, 2)}…${s.slice(-2)}`;
  return `${s.slice(0, left)}…${s.slice(-right)}`;
}

// -------------------- RULES -------------------- //
// Order matters: put "expected token" / nonce rules BEFORE generic token rules.
const rules: Rule[] = [
  {
    id: "wp-nonce-common",
    type: "WordPress Nonce",
    category: "expected_token",
    severity: "low",
    confidence: 0.9,
    pattern: /\b(?:wpnonce|wp[-]?nonce|et_frontend_nonce|(?:monarch|divi)[A-Za-z0-9_]nonce|nonce)\b\s*[:=]\s*["']([A-Za-z0-9]{10,})["']/i,
    reason: "Looks like a WordPress CSRF nonce token exposed in frontend JS (expected behavior).",
    tags: ["wordpress", "csrf", "nonce", "frontend"],
    redact: (raw) => redactMiddle(raw, 3, 3),
  },
  {
    id: "jwt",
    type: "JWT",
    category: "credential",
    severity: "high",
    confidence: 0.85,
    pattern: /\b(eyJ[a-zA-Z0-9_-]{10,}\.[a-zA-Z0-9_-]{10,}\.[a-zA-Z0-9_-]{10,})\b/,
    reason: "JSON Web Token detected (may grant access if valid).",
    tags: ["auth", "jwt", "bearer"],
    redact: (raw) => `${raw.slice(0, 12)}…${raw.slice(-12)}`,
  },
  {
    id: "aws-access-key",
    type: "AWS Access Key ID",
    category: "key",
    severity: "critical",
    confidence: 0.95,
    pattern: /\b((?:AKIA|ASIA|AIDA|AROA)[0-9A-Z]{16})\b/,
    reason: "AWS access key id format detected.",
    tags: ["aws", "cloud", "key"],
    redact: (raw) => `${raw.slice(0, 4)}…${raw.slice(-4)}`,
  },
  {
    id: "aws-secret",
    type: "AWS Secret Access Key",
    category: "secret",
    severity: "critical",
    confidence: 0.8,
    pattern: /\b([A-Za-z0-9/+=]{40})\b/,
    predicate: (m, ctx) => /aws|secret|access[-]?key|aws_secret_access_key/i.test(ctx.surroundingText ?? ""),
    reason: "40-char base64-ish string near AWS secret keywords (possible AWS secret).",
    tags: ["aws", "secret"],
    redact: (raw) => redactMiddle(raw, 6, 4),
  },
  {
    id: "google-api-key",
    type: "Google API Key",
    category: "key",
    severity: "high",
    confidence: 0.9,
    pattern: /\b(AIza[0-9A-Za-z-_]{35})\b/,
    reason: "Google API key pattern detected.",
    tags: ["google", "api", "key"],
    redact: (raw) => `${raw.slice(0, 6)}…${raw.slice(-4)}`,
  },
  {
    id: "slack-token",
    type: "Slack Token",
    category: "credential",
    severity: "critical",
    confidence: 0.9,
    pattern: /\b(xox[baprs]-[0-9A-Za-z-]{10,})\b/,
    reason: "Slack token format detected.",
    tags: ["slack", "token"],
    redact: (raw) => `${raw.slice(0, 8)}…${raw.slice(-6)}`,
  },
  {
    id: "private-key",
    type: "Private Key",
    category: "secret",
    severity: "critical",
    confidence: 0.99,
    pattern: /-----BEGIN (?:RSA|EC|OPENSSH|DSA|PRIVATE) KEY-----[\s\S]+?-----END (?:RSA|EC|OPENSSH|DSA|PRIVATE) KEY-----/m,
    reason: "Private key block detected.",
    tags: ["private-key", "pem"],
    redact: () => "-----BEGIN … KEY-----…-----END … KEY-----",
  },
  {
    id: "bearer-token",
    type: "Bearer Token",
    category: "credential",
    severity: "high",
    confidence: 0.75,
    pattern: /\bBearer\s+([A-Za-z0-9._-]{20,})\b/,
    reason: "Bearer auth token detected.",
    tags: ["auth", "bearer"],
    redact: (raw) => redactMiddle(raw, 8, 6),
  },
];

// -------------------- CLASSIFIER --------------------

export function classifyText(text: string, ctx: ClassifyContext = {}): Finding[] {
  const findings: Finding[] = [];
  const baseCtx: ClassifyContext = {
    ...ctx,
    surroundingText: ctx.surroundingText ?? text.slice(0, 5000),
  };

  for (const rule of rules) {
    // Ensure we are using a global regex to find multiple matches
    const pattern = new RegExp(rule.pattern.source, rule.pattern.flags + (rule.pattern.flags.includes('g') ? '' : 'g'));
    
    let m: RegExpExecArray | null;
    while ((m = pattern.exec(text))) {
      if (rule.predicate && !rule.predicate(m, baseCtx)) continue;
      const raw = (m[1] ?? m[0]) as string;
      findings.push(makeFinding(rule, raw, baseCtx));
    }
  }

  return dedupeFindings(findings);
}

function makeFinding(rule: Rule, raw: string, ctx: ClassifyContext): Finding {
  const redactedValue = (rule.redact ?? DEFAULT_REDACT)(raw);
  return {
    type: rule.type,
    category: rule.category,
    severity: rule.severity,
    confidence: rule.confidence,
    redactedValue,
    reason: rule.reason,
    source: ctx.sourceId ?? ctx.url,
    evidence: ctx.surroundingText ? ctx.surroundingText.slice(0, 200) : undefined,
    tags: rule.tags ?? [],
  };
}

function dedupeFindings(findings: Finding[]): Finding[] {
  const seen = new Map<string, Finding>();

  for (const f of findings) {
    const key = `${f.type}|${f.redactedValue}|${f.source ?? ""}`;
    const existing = seen.get(key);

    if (!existing || f.confidence > existing.confidence) {
      seen.set(key, f);
    }
  }

  return Array.from(seen.values());
}
