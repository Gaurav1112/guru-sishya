// ────────────────────────────────────────────────────────────────────────────
// Achievement / Badge Unlock email template
// ────────────────────────────────────────────────────────────────────────────

export interface AchievementData {
  /** User's display name */
  name: string;
  /** Name of the badge earned */
  badgeName: string;
  /** Short description of the badge */
  badgeDescription: string;
  /** Emoji or icon string for the badge */
  badgeEmoji: string;
  /** How many badges the user has now */
  badgesUnlocked: number;
  /** Total badges available */
  totalBadges: number;
  /** Suggested next action */
  nextSuggestion: string;
}

const APP_URL = "https://guru-sishya.in";

/**
 * Generates an HTML email celebrating a badge unlock.
 * Returns { subject, html } ready for any email provider.
 */
export function buildAchievementEmail(data: AchievementData): {
  subject: string;
  html: string;
} {
  const {
    name,
    badgeName,
    badgeDescription,
    badgeEmoji,
    badgesUnlocked,
    totalBadges,
    nextSuggestion,
  } = data;

  const subject = `You just earned: ${badgeName}!`;

  const progressPercent = Math.round((badgesUnlocked / totalBadges) * 100);

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
              <p style="margin: 0; color: #9CA3AF; font-size: 13px;">Achievement Unlocked</p>
            </td>
          </tr>

          <!-- Badge Celebration -->
          <tr>
            <td style="padding: 32px 24px 8px; text-align: center;">
              <p style="margin: 0; font-size: 48px; line-height: 1;">${escapeHtml(badgeEmoji)}</p>
              <h2 style="margin: 16px 0 0; color: #FDB813; font-size: 22px; line-height: 1.3;">
                Congratulations, ${escapeHtml(name)}!
              </h2>
              <p style="margin: 8px 0 0; color: #F9FAFB; font-size: 18px; font-weight: bold;">
                ${escapeHtml(badgeName)}
              </p>
              <p style="margin: 8px 0 0; color: #D1D5DB; font-size: 14px; line-height: 1.6;">
                ${escapeHtml(badgeDescription)}
              </p>
            </td>
          </tr>

          <!-- Progress -->
          <tr>
            <td style="padding: 24px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #374151; border-radius: 8px;">
                <tr>
                  <td style="padding: 16px;">
                    <p style="margin: 0 0 8px; color: #9CA3AF; font-size: 13px; text-align: center;">
                      Badge Progress
                    </p>
                    <!-- Progress bar -->
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="padding: 0;">
                          <div style="width: 100%; height: 8px; background-color: #4B5563; border-radius: 4px;">
                            <div style="width: ${progressPercent}%; height: 8px; background-color: #FDB813; border-radius: 4px;"></div>
                          </div>
                        </td>
                      </tr>
                    </table>
                    <p style="margin: 8px 0 0; color: #F9FAFB; font-size: 14px; text-align: center; font-weight: bold;">
                      ${badgesUnlocked} of ${totalBadges} badges unlocked
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Next suggestion -->
          <tr>
            <td style="padding: 0 24px 8px;">
              <h3 style="margin: 0 0 8px; color: #1DD1A1; font-size: 16px;">What to do next</h3>
              <p style="margin: 0; color: #D1D5DB; font-size: 14px; line-height: 1.6;">
                ${escapeHtml(nextSuggestion)}
              </p>
            </td>
          </tr>

          <!-- CTA -->
          <tr>
            <td style="padding: 24px; text-align: center;">
              <a href="${APP_URL}/app/badges" style="display: inline-block; padding: 14px 32px; background-color: #E85D26; color: #FFFFFF; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">
                View Your Badges
              </a>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 16px 24px 24px; text-align: center; border-top: 1px solid #374151;">
              <p style="margin: 0; color: #6B7280; font-size: 12px; line-height: 1.6;">
                You received this because you earned a badge on Guru Sishya.<br>
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
