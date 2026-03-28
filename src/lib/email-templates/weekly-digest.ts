// ────────────────────────────────────────────────────────────────────────────
// Weekly Digest email template
// ────────────────────────────────────────────────────────────────────────────

export interface WeeklyDigestData {
  weekStart: string;
  weekEnd: string;
  questionsAnswered: number;
  averageAccuracy: number;
  currentStreak: number;
  topicsStudied: string[];
  badgesEarned: string[];
  weakAreas: string[];
}

const APP_URL = "https://guru-sishya.in";

/**
 * Generates an HTML email for the weekly learning digest.
 * Uses inline CSS for maximum email client compatibility
 * (Gmail, Outlook, Apple Mail).
 */
export function buildWeeklyDigestHtml(data: WeeklyDigestData): string {
  const {
    weekStart,
    weekEnd,
    questionsAnswered,
    averageAccuracy,
    currentStreak,
    topicsStudied,
    badgesEarned,
    weakAreas,
  } = data;

  const accuracyColor =
    averageAccuracy >= 80
      ? "#1DD1A1"
      : averageAccuracy >= 50
        ? "#FDB813"
        : "#E85D26";

  const badgesSection =
    badgesEarned.length > 0
      ? `
      <tr>
        <td style="padding: 16px 24px;">
          <h3 style="margin: 0 0 8px; color: #FDB813; font-size: 16px;">Badges Earned</h3>
          <p style="margin: 0; color: #D1D5DB; font-size: 14px; line-height: 1.6;">
            ${badgesEarned.map((b) => `&#127942; ${escapeHtml(b)}`).join(" &nbsp;&bull;&nbsp; ")}
          </p>
        </td>
      </tr>`
      : "";

  const weakAreasSection =
    weakAreas.length > 0
      ? `
      <tr>
        <td style="padding: 16px 24px;">
          <h3 style="margin: 0 0 8px; color: #E85D26; font-size: 16px;">Areas to Improve</h3>
          <p style="margin: 0; color: #D1D5DB; font-size: 14px; line-height: 1.6;">
            ${weakAreas.map((a) => escapeHtml(a)).join(", ")}
          </p>
        </td>
      </tr>`
      : "";

  const topicsSection =
    topicsStudied.length > 0
      ? `
      <tr>
        <td style="padding: 16px 24px;">
          <h3 style="margin: 0 0 8px; color: #1DD1A1; font-size: 16px;">Topics Studied</h3>
          <p style="margin: 0; color: #D1D5DB; font-size: 14px; line-height: 1.6;">
            ${topicsStudied.map((t) => escapeHtml(t)).join(", ")}
          </p>
        </td>
      </tr>`
      : "";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your Weekly Learning Digest</title>
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
              <p style="margin: 0; color: #9CA3AF; font-size: 13px;">
                Weekly Digest &mdash; ${escapeHtml(weekStart)} to ${escapeHtml(weekEnd)}
              </p>
            </td>
          </tr>

          <!-- Stats Row -->
          <tr>
            <td style="padding: 24px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td width="33%" align="center" style="padding: 12px 4px;">
                    <p style="margin: 0; font-size: 28px; font-weight: bold; color: #E85D26;">${questionsAnswered}</p>
                    <p style="margin: 4px 0 0; font-size: 12px; color: #9CA3AF; text-transform: uppercase;">Questions</p>
                  </td>
                  <td width="33%" align="center" style="padding: 12px 4px;">
                    <p style="margin: 0; font-size: 28px; font-weight: bold; color: ${accuracyColor};">${averageAccuracy}%</p>
                    <p style="margin: 4px 0 0; font-size: 12px; color: #9CA3AF; text-transform: uppercase;">Accuracy</p>
                  </td>
                  <td width="33%" align="center" style="padding: 12px 4px;">
                    <p style="margin: 0; font-size: 28px; font-weight: bold; color: #FDB813;">${currentStreak}</p>
                    <p style="margin: 4px 0 0; font-size: 12px; color: #9CA3AF; text-transform: uppercase;">Day Streak</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Topics -->
          ${topicsSection}

          <!-- Badges -->
          ${badgesSection}

          <!-- Weak Areas -->
          ${weakAreasSection}

          <!-- CTA -->
          <tr>
            <td style="padding: 24px; text-align: center;">
              <a href="${APP_URL}/app/dashboard" style="display: inline-block; padding: 14px 32px; background-color: #E85D26; color: #FFFFFF; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">
                Continue Learning
              </a>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 16px 24px 24px; text-align: center; border-top: 1px solid #374151;">
              <p style="margin: 0; color: #6B7280; font-size: 12px; line-height: 1.6;">
                You received this because you opted in to weekly digests on Guru Sishya.<br>
                <a href="${APP_URL}/app/settings" style="color: #9CA3AF; text-decoration: underline;">Unsubscribe</a>
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

/** Escape HTML entities to prevent XSS in email content */
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
