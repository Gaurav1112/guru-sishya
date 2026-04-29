// ────────────────────────────────────────────────────────────────────────────
// Welcome email template — sent after first sign-in
// ────────────────────────────────────────────────────────────────────────────

export interface WelcomeData {
  /** User's display name */
  name: string;
}

const APP_URL = "https://guru-sishya.in";

/**
 * Generates a welcome HTML email for new users.
 * Returns { subject, html } ready for any email provider.
 */
export function buildWelcomeEmail(data: WelcomeData): {
  subject: string;
  html: string;
} {
  const { name } = data;

  const subject = "Welcome to Guru Sishya — Your Interview Prep Starts Here";

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
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
              <p style="margin: 0; color: #9CA3AF; font-size: 13px;">Welcome Aboard</p>
            </td>
          </tr>

          <!-- Greeting -->
          <tr>
            <td style="padding: 32px 24px 8px; text-align: center;">
              <h2 style="margin: 0; color: #F9FAFB; font-size: 22px; line-height: 1.3;">
                Hey ${escapeHtml(name)}, welcome! &#127881;
              </h2>
              <p style="margin: 12px 0 0; color: #D1D5DB; font-size: 14px; line-height: 1.6;">
                You just took the first step toward acing your next interview.<br>
                Here&rsquo;s how to get started in under 2 minutes:
              </p>
            </td>
          </tr>

          <!-- Quick-start Steps -->
          <tr>
            <td style="padding: 24px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                ${stepItem("1", "#E85D26", "Pick a Topic", "Choose from DSA, System Design, JavaScript, React, and more.")}
                ${stepItem("2", "#FDB813", "Take a Quiz", "Test yourself with curated MCQs — instant feedback on every answer.")}
                ${stepItem("3", "#1DD1A1", "Review with Flashcards", "Reinforce what you learned and track your mastery over time.")}
              </table>
            </td>
          </tr>

          <!-- Stats -->
          <tr>
            <td style="padding: 0 24px 24px; text-align: center;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #374151; border-radius: 8px;">
                <tr>
                  <td style="padding: 16px;">
                    <p style="margin: 0; color: #9CA3AF; font-size: 13px;">
                      Join thousands preparing with
                    </p>
                    <p style="margin: 8px 0 0; color: #F9FAFB; font-size: 18px; font-weight: bold;">
                      81 topics &nbsp;&bull;&nbsp; 1,730+ questions
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- CTA -->
          <tr>
            <td style="padding: 8px 24px 32px; text-align: center;">
              <a href="${APP_URL}/app/topics" style="display: inline-block; padding: 14px 32px; background-color: #E85D26; color: #FFFFFF; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">
                Start Your First Topic
              </a>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 16px 24px 24px; text-align: center; border-top: 1px solid #374151;">
              <p style="margin: 0; color: #6B7280; font-size: 12px; line-height: 1.6;">
                You received this because you signed up for Guru Sishya.<br>
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

function stepItem(
  number: string,
  color: string,
  title: string,
  description: string,
): string {
  return `
    <tr>
      <td style="padding: 8px 0;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td width="36" valign="top" style="padding-right: 12px;">
              <div style="width: 32px; height: 32px; line-height: 32px; text-align: center; background-color: ${color}; color: #FFFFFF; border-radius: 50%; font-weight: bold; font-size: 14px;">
                ${escapeHtml(number)}
              </div>
            </td>
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
