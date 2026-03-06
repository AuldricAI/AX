// AX — Secret Detection Patterns
// Regex patterns for detecting exposed credentials in browser page source

export interface SecretPattern {
    name: string;
    regex: RegExp;
    severity: 'critical' | 'high' | 'medium';
    description: string;
}

export const SECRET_PATTERNS: SecretPattern[] = [
    // ─── Cloud Providers ────────────────────────────────────────────
    {
        name: 'AWS Access Key',
        regex: /AKIA[0-9A-Z]{16}/g,
        severity: 'critical',
        description: 'AWS IAM access key exposed in client-side code',
    },
    {
        name: 'AWS Secret Key',
        regex: /(?:aws_secret_access_key|AWS_SECRET_ACCESS_KEY)\s*[=:]\s*['"]?([A-Za-z0-9/+=]{40})['"]?/g,
        severity: 'critical',
        description: 'AWS secret access key exposed',
    },

    // ─── Payment Providers ──────────────────────────────────────────
    {
        name: 'Stripe Secret Key',
        regex: /sk_live_[0-9a-zA-Z]{24,}/g,
        severity: 'critical',
        description: 'Stripe live secret key — can charge real cards',
    },
    {
        name: 'Stripe Publishable Key (Live)',
        regex: /pk_live_[0-9a-zA-Z]{24,}/g,
        severity: 'medium',
        description: 'Stripe live publishable key (less sensitive but noteworthy)',
    },

    // ─── Google / Firebase ──────────────────────────────────────────
    {
        name: 'Google API Key',
        regex: /AIza[0-9A-Za-z\-_]{35}/g,
        severity: 'high',
        description: 'Google API key — may have unrestricted access',
    },
    {
        name: 'Firebase Config',
        regex: /firebaseConfig\s*=\s*\{[^}]*apiKey\s*:\s*['"][^'"]+['"]/g,
        severity: 'medium',
        description: 'Firebase configuration with API key (check security rules)',
    },

    // ─── Auth Tokens ────────────────────────────────────────────────
    {
        name: 'JWT Token',
        regex: /eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}/g,
        severity: 'high',
        description: 'JSON Web Token found in page source',
    },
    {
        name: 'Bearer Token in Source',
        regex: /['"]Bearer\s+[A-Za-z0-9_\-.]{20,}['"]/g,
        severity: 'high',
        description: 'Hardcoded Bearer authorization token',
    },

    // ─── Database ───────────────────────────────────────────────────
    {
        name: 'Database Connection String',
        regex: /(?:mongodb\+srv|postgres|mysql|redis):\/\/[^\s'"<>]{10,}/g,
        severity: 'critical',
        description: 'Database connection string with credentials exposed',
    },

    // ─── Generic Secrets ────────────────────────────────────────────
    {
        name: 'Private Key',
        regex: /-----BEGIN (?:RSA |EC |DSA )?PRIVATE KEY-----/g,
        severity: 'critical',
        description: 'Private cryptographic key exposed in client code',
    },
    {
        name: 'Generic API Key Assignment',
        regex: /(?:api_key|apikey|api_secret|secret_key|access_token)\s*[=:]\s*['"][A-Za-z0-9_\-.]{16,}['"]/gi,
        severity: 'high',
        description: 'Potential API key or secret assigned in client code',
    },
    {
        name: 'Hardcoded Password',
        regex: /(?:password|passwd|pwd)\s*[=:]\s*['"][^'"]{8,}['"]/gi,
        severity: 'critical',
        description: 'Hardcoded password in client-side code',
    },

    // ─── GitHub / CI ────────────────────────────────────────────────
    {
        name: 'GitHub Token',
        regex: /gh[pousr]_[A-Za-z0-9_]{36,}/g,
        severity: 'critical',
        description: 'GitHub personal access token or OAuth token',
    },

    // ─── Slack ──────────────────────────────────────────────────────
    {
        name: 'Slack Token',
        regex: /xox[baprs]-[0-9]{10,}-[0-9a-zA-Z]{10,}/g,
        severity: 'high',
        description: 'Slack API token exposed',
    },

    // ─── SendGrid / Mailgun ─────────────────────────────────────────
    {
        name: 'SendGrid API Key',
        regex: /SG\.[A-Za-z0-9_\-.]{22,}\.[A-Za-z0-9_\-.]{22,}/g,
        severity: 'high',
        description: 'SendGrid API key — can send emails on your behalf',
    },
];

export function scanForSecrets(text: string): { pattern: SecretPattern; match: string; index: number }[] {
    const results: { pattern: SecretPattern; match: string; index: number }[] = [];

    for (const pattern of SECRET_PATTERNS) {
        // Reset regex state
        pattern.regex.lastIndex = 0;
        let match: RegExpExecArray | null;
        while ((match = pattern.regex.exec(text)) !== null) {
            results.push({
                pattern,
                match: match[0].length > 40 ? match[0].substring(0, 37) + '...' : match[0],
                index: match.index,
            });
        }
    }

    return results;
}
