// ────────────────────────────────────────────────────────────────────────────
// Premium Expiry Reminder email template
// ────────────────────────────────────────────────────────────────────────────

export interface PremiumExpiryData {
  /** Number of days until expiry (3, 1, or 0) */
  daysRemaining: number;
  /** When the subscription expires (formatted string) */
  expiryDate: string;
}

const APP_URL = "https://guru-sishya.in";

/**
 * Generates an HTML email reminding users their Pro subscription is expiring.
 * Sent at: 3 days before, 1 day before, and day of expiry.
 */
export function buildPremiumExpiryHtml(data: PremiumExpiryData): string {
  const { daysRemaining, expiryDate } = data;

  const headline =
    daysRemaining === 0
      ? "Your Pro Subscription Expires Today"
      : daysRemaining === 1
        ? "Your Pro Subscription Expires Tomorrow"
        : `Your Pro Subscription Expires in ${daysRemaining} Days`;

  const urgencyColor = daysRemaining === 0 ? "#EF4444" : "#FDB813";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(headline)}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #111827; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #111827;">
    <tr>
      <td align="center" style="padding: 32px 16px;">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width: 600px; width: 100%; background-color: #1F2937; border-radius: 12px; overflow: hidden;">

          <!-- Header -->
          <tr>
            <td style="padding: 32px 24px 16px; text-align: center; background-color: #0C0A15;">
              <h1 style="margin: 0 0 4px; color: #E85D26; font-size: 24px;">Guru Sishya</h1>
              <p style="margin: 0; color: #9CA3AF; font-size: 13px;">Subscription Reminder</p>
            </td>
          </tr>

          <!-- Headline -->
          <tr>
            <td style="padding: 32px 24px 8px; text-align: center;">
              <h2 style="margin: 0; color: ${urgencyColor}; font-size: 22px; line-height: 1.3;">
                ${escapeHtml(headline)}
              </h2>
              <p style="margin: 12px 0 0; color: #D1D5DB; font-size: 14px;">
                Expires on ${escapeHtml(expiryDate)}
              </p>
            </td>
          </tr>

          <!-- What you lose -->
          <tr>
            <td style="padding: 24px;">
              <h3 style="margin: 0 0 12px; color: #F9FAFB; font-size: 16px;">What you will lose access to:</h3>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                ${lossItem("Guru Mode", "Unlimited AI-powered explanations and mentoring")}
                ${lossItem("Full Vidya Levels", "All 10 mastery levels with advanced challenges")}
                ${lossItem("Interview Boss Rounds", "Hard-mode interview practice with power-ups")}
                ${lossItem("Code Playground Pro", "Java, C, C++, and TypeScript execution")}
                ${lossItem("Priority Support", "Faster responses and feature requests")}
              </table>
            </td>
          </tr>

          <!-- CTA -->
          <tr>
            <td style="padding: 8px 24px 32px; text-align: center;">
              <a href="${APP_URL}/app/pricing" style="display: inline-block; padding: 14px 32px; background-color: #E85D26; color: #FFFFFF; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">
                Renew Now
              </a>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 16px 24px 24px; text-align: center; border-top: 1px solid #374151;">
              <p style="margin: 0; color: #6B7280; font-size: 12px; line-height: 1.6;">
                You received this because you have an active Pro subscription on Guru Sishya.<br>
                <a href="${APP_URL}/app/settings" style="color: #9CA3AF; text-decoration: underline;">Manage Preferences</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function lossItem(title: string, description: string): string {
  return `
    <tr>
      <td style="padding: 8px 0;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td width="28" valign="top" style="padding-right: 8px; color: #EF4444; font-size: 16px;">&#10005;</td>
            <td>
              <p style="margin: 0; color: #F9FAFB; font-size: 14px; font-weight: bold;">${escapeHtml(title)}</p>
              <p style="margin: 2px 0 0; color: #9CA3AF; font-size: 13px;">${escapeHtml(description)}</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>`;
}

/** Escape HTML entities to prevent XSS in email content */
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
