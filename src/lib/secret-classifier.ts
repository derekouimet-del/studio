'use client';

export type Severity = "info" | "low" | "medium" | "high" | "critical";

export type Finding = {
  type: string; // e.g. "WordPress Nonce", "JWT", "AWS Access Key"
  severity: Severity;
  confidence: number; // 0..1
  value: string; // The full discovered value
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
  reason: string;
  tags?: string[];
};

export type ClassifyContext = {
  url?: string;
  sourceId?: string; // script id, header name, etc.
  surroundingText?: string; // small nearby chunk if you have it
};

// -------------------- RULES -------------------- //
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
  },
  {
    id: "aws-access-key",
    type: "AWS Access Key ID",
    category: "key",
    severity: "high", // Base severity, upgraded to critical if secret is nearby
    confidence: 0.95,
    pattern: /\b((?:AKIA|ASIA|AGPA|AIDA|AROA)[0-9A-Z]{16})\b/,
    reason: "AWS access key id format detected.",
    tags: ["aws", "cloud", "key"],
  },
  {
    id: "aws-secret",
    type: "AWS Secret Access Key",
    category: "secret",
    severity: "info", // Default to info, upgraded to critical in classifyText if paired
    confidence: 0.8,
    pattern: /\b([A-Za-z0-9/+=]{40})\b/,
    predicate: (m, ctx) => {
        // Broad check for AWS keywords to reduce random noise when no ID is present
        return /aws|secret|access[-]?key|aws_secret_access_key/i.test(ctx.surroundingText ?? "");
    },
    reason: "Possible AWS secret format detected. Upgraded to CRITICAL if a matching Access Key ID is found.",
    tags: ["aws", "secret"],
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
  },
];

// -------------------- CLASSIFIER --------------------

export function classifyText(text: string, ctx: ClassifyContext = {}): Finding[] {
  let allFindings: Finding[] = [];
  const baseCtx: ClassifyContext = {
    ...ctx,
    surroundingText: ctx.surroundingText ?? text.slice(0, 10000), // Larger context window for pair detection
  };

  for (const rule of rules) {
    const pattern = new RegExp(rule.pattern.source, rule.pattern.flags + (rule.pattern.flags.includes('g') ? '' : 'g'));
    
    let m: RegExpExecArray | null;
    while ((m = pattern.exec(text))) {
      // Create a local context window for the predicate
      const start = Math.max(0, m.index - 500);
      const end = Math.min(text.length, m.index + m[0].length + 500);
      const localCtx = { ...baseCtx, surroundingText: text.slice(start, end) };

      if (rule.predicate && !rule.predicate(m, localCtx)) continue;
      const raw = (m[1] ?? m[0]) as string;
      allFindings.push(makeFinding(rule, raw, localCtx));
    }
  }

  const deduped = dedupeFindings(allFindings);

  // --- AWS Pair Logic ---
  const hasAwsKeyId = deduped.some(f => f.type === "AWS Access Key ID");
  const hasAwsSecret = deduped.some(f => f.type === "AWS Secret Access Key");
  
  return deduped.map(f => {
      if (f.type === "AWS Secret Access Key") {
          if (hasAwsKeyId) {
              return { 
                  ...f, 
                  severity: "critical", 
                  reason: "CRITICAL: AWS Credential pair detected. Both Access Key ID and Secret Access Key found in this content." 
              };
          } else {
              return { 
                  ...f, 
                  severity: "info", 
                  reason: "INFO: Possible token-like string. AWS Secret format found but no matching Access Key ID detected nearby." 
              };
          }
      }
      if (f.type === "AWS Access Key ID" && hasAwsSecret) {
          return {
              ...f,
              severity: "critical",
              reason: "CRITICAL: AWS Access Key ID found as part of a complete credential pair."
          };
      }
      return f;
  });
}

function makeFinding(rule: Rule, raw: string, ctx: ClassifyContext): Finding {
  return {
    type: rule.type,
    category: rule.category,
    severity: rule.severity,
    confidence: rule.confidence,
    value: raw,
    reason: rule.reason,
    source: ctx.sourceId ?? ctx.url,
    evidence: ctx.surroundingText ? ctx.surroundingText.slice(0, 200) : undefined,
    tags: rule.tags ?? [],
  };
}

function dedupeFindings(findings: Finding[]): Finding[] {
  const seen = new Map<string, Finding>();

  for (const f of findings) {
    const key = `${f.type}|${f.value}|${f.source ?? ""}`;
    const existing = seen.get(key);

    if (!existing || f.confidence > existing.confidence) {
      seen.set(key, f);
    }
  }

  return Array.from(seen.values());
}