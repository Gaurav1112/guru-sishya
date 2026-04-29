// ────────────────────────────────────────────────────────────────────────────
// XP Milestone email template — sent at 100, 500, 1000, 5000 XP
// ────────────────────────────────────────────────────────────────────────────

export interface MilestoneData {
  /** User's display name */
  name: string;
  /** XP milestone reached */
  xp: number;
  /** User's current level */
  level: number;
  /** Number of topics completed */
  topicsCompleted: number;
  /** Number of quizzes taken */
  quizzesTaken: number;
  /** Current streak in days */
  currentStreak: number;
  /** XP needed for the next milestone */
  nextMilestone: number;
}

const APP_URL = "https://guru-sishya.in";

/**
 * Generates an HTML email celebrating an XP milestone.
 * Returns { subject, html } ready for any email provider.
 */
export function buildMilestoneEmail(data: MilestoneData): {
  subject: string;
  html: string;
} {
  const {
    name,
    xp,
    level,
    topicsCompleted,
    quizzesTaken,
    currentStreak,
    nextMilestone,
  } = data;

  const subject = `You've reached ${xp.toLocaleString()} XP — Level Up!`;

  const xpFormatted = xp.toLocaleString();
  const nextFormatted = nextMilestone.toLocaleString();

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
              <p style="margin: 0; color: #9CA3AF; font-size: 13px;">XP Milestone</p>
            </td>
          </tr>

          <!-- Celebration -->
          <tr>
            <td style="padding: 32px 24px 8px; text-align: center;">
              <p style="margin: 0; font-size: 48px; line-height: 1;">&#127942;</p>
              <h2 style="margin: 16px 0 0; color: #FDB813; font-size: 22px; line-height: 1.3;">
                ${escapeHtml(name)}, you hit ${xpFormatted} XP!
              </h2>
              <p style="margin: 12px 0 0; color: #D1D5DB; font-size: 14px; line-height: 1.6;">
                You&rsquo;re now <strong style="color: #E85D26;">Level ${level}</strong> &mdash; keep pushing!
              </p>
            </td>
          </tr>

          <!-- Stats Row -->
          <tr>
            <td style="padding: 24px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td width="33%" align="center" style="padding: 12px 4px;">
                    <p style="margin: 0; font-size: 28px; font-weight: bold; color: #1DD1A1;">${topicsCompleted}</p>
                    <p style="margin: 4px 0 0; font-size: 12px; color: #9CA3AF; text-transform: uppercase;">Topics Done</p>
                  </td>
                  <td width="33%" align="center" style="padding: 12px 4px;">
                    <p style="margin: 0; font-size: 28px; font-weight: bold; color: #E85D26;">${quizzesTaken}</p>
                    <p style="margin: 4px 0 0; font-size: 12px; color: #9CA3AF; text-transform: uppercase;">Quizzes Taken</p>
                  </td>
                  <td width="33%" align="center" style="padding: 12px 4px;">
                    <p style="margin: 0; font-size: 28px; font-weight: bold; color: #FDB813;">${currentStreak}</p>
                    <p style="margin: 4px 0 0; font-size: 12px; color: #9CA3AF; text-transform: uppercase;">Day Streak</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Next milestone -->
          <tr>
            <td style="padding: 0 24px 24px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #374151; border-radius: 8px;">
                <tr>
                  <td style="padding: 16px; text-align: center;">
                    <p style="margin: 0; color: #9CA3AF; font-size: 13px;">Next milestone</p>
                    <p style="margin: 8px 0 0; color: #F9FAFB; font-size: 18px; font-weight: bold;">
                      ${nextFormatted} XP
                    </p>
                    <p style="margin: 4px 0 0; color: #9CA3AF; font-size: 13px;">
                      Only ${(nextMilestone - xp).toLocaleString()} XP to go!
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- CTA -->
          <tr>
            <td style="padding: 8px 24px 32px; text-align: center;">
              <a href="${APP_URL}/app/dashboard" style="display: inline-block; padding: 14px 32px; background-color: #E85D26; color: #FFFFFF; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">
                Keep Going
              </a>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 16px 24px 24px; text-align: center; border-top: 1px solid #374151;">
              <p style="margin: 0; color: #6B7280; font-size: 12px; line-height: 1.6;">
                You received this because you reached an XP milestone on Guru Sishya.<br>
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
