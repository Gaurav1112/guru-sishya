// ────────────────────────────────────────────────────────────────────────────
// Streak Reminder email template — sent when streak is about to break
// ────────────────────────────────────────────────────────────────────────────

export interface StreakReminderData {
  /** User's display name */
  name: string;
  /** Current streak count in days */
  streakCount: number;
  /** User's longest ever streak */
  longestStreak: number;
  /** Hours remaining before streak resets */
  hoursRemaining: number;
}

const APP_URL = "https://guru-sishya.in";

/**
 * Generates an HTML email reminding users their streak is about to break.
 * Returns { subject, html } ready for any email provider.
 */
export function buildStreakReminderEmail(data: StreakReminderData): {
  subject: string;
  html: string;
} {
  const { name, streakCount, longestStreak, hoursRemaining } = data;

  const subject = `Don't lose your ${streakCount}-day streak!`;

  const urgencyColor = hoursRemaining <= 1 ? "#EF4444" : "#FDB813";

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(subject)}</title>
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
              <p style="margin: 0; color: #9CA3AF; font-size: 13px;">Streak Alert</p>
            </td>
          </tr>

          <!-- Urgency Banner -->
          <tr>
            <td style="padding: 32px 24px 8px; text-align: center;">
              <p style="margin: 0; font-size: 40px; line-height: 1;">&#128293;</p>
              <h2 style="margin: 16px 0 0; color: ${urgencyColor}; font-size: 22px; line-height: 1.3;">
                Your streak expires in ${hoursRemaining} hour${hoursRemaining === 1 ? "" : "s"}!
              </h2>
              <p style="margin: 12px 0 0; color: #D1D5DB; font-size: 14px; line-height: 1.6;">
                Hey ${escapeHtml(name)}, don&rsquo;t let your hard work go to waste.
              </p>
            </td>
          </tr>

          <!-- Streak Stats -->
          <tr>
            <td style="padding: 24px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td width="50%" align="center" style="padding: 12px 4px;">
                    <table role="presentation" cellpadding="0" cellspacing="0" style="background-color: #374151; border-radius: 8px; width: 100%;">
                      <tr>
                        <td style="padding: 16px; text-align: center;">
                          <p style="margin: 0; font-size: 28px; font-weight: bold; color: #E85D26;">${streakCount}</p>
                          <p style="margin: 4px 0 0; font-size: 12px; color: #9CA3AF; text-transform: uppercase;">Current Streak</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                  <td width="50%" align="center" style="padding: 12px 4px;">
                    <table role="presentation" cellpadding="0" cellspacing="0" style="background-color: #374151; border-radius: 8px; width: 100%;">
                      <tr>
                        <td style="padding: 16px; text-align: center;">
                          <p style="margin: 0; font-size: 28px; font-weight: bold; color: #FDB813;">${longestStreak}</p>
                          <p style="margin: 4px 0 0; font-size: 12px; color: #9CA3AF; text-transform: uppercase;">Longest Streak</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Quick action -->
          <tr>
            <td style="padding: 0 24px 8px; text-align: center;">
              <p style="margin: 0; color: #D1D5DB; font-size: 14px; line-height: 1.6;">
                Answer just <strong style="color: #1DD1A1;">1 question</strong> to keep your streak alive.
              </p>
            </td>
          </tr>

          <!-- CTA -->
          <tr>
            <td style="padding: 24px; text-align: center;">
              <a href="${APP_URL}/app/dashboard" style="display: inline-block; padding: 14px 32px; background-color: #E85D26; color: #FFFFFF; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">
                Keep Your Streak
              </a>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 16px 24px 24px; text-align: center; border-top: 1px solid #374151;">
              <p style="margin: 0; color: #6B7280; font-size: 12px; line-height: 1.6;">
                You received this because you have an active streak on Guru Sishya.<br>
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

  return { subject, html };
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
