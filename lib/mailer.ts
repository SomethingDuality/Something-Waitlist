import nodemailer from "nodemailer"

// ── Transporter ───────────────────────────────────────────────────────────────
// Reuse a single transporter instance across requests (Next.js module caching).
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS, // Gmail App Password (16-char, no spaces needed)
  },
})

// ── HTML Template ─────────────────────────────────────────────────────────────
function buildWaitlistEmail(name: string, role: string): string {
  const displayName = name && name !== "Anonymous" ? name : "there"
  const roleLabel = role === "founder" ? "Founder" : "Investor"
  const accentColor = role === "founder" ? "#34D399" : "#E3C27A"

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>You're on the Something waitlist</title>
</head>
<body style="margin:0;padding:0;background-color:#0a0a0c;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#0a0a0c;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;">

          <!-- Banner / Logo -->
          <tr>
            <td align="center" style="padding-bottom:32px;">
              <!--
                Replace the src below with your hosted PNG URL once ready.
                e.g. src="https://something.to/banner.png"
                or   src="https://yourdomain.com/thing-logo-white.png"
              -->
              <img
                src="https://something.to/Something.jpeg"
                alt="Something"
                width="560"
                style="display:block;border:0;max-width:100%;border-radius:8px;"
              />
            </td>
          </tr>

          <!-- Card -->
          <tr>
            <td style="background-color:#111114;border:1px solid rgba(255,255,255,0.06);border-radius:16px;padding:40px 40px 36px;color:#ffffff;">

              <!-- Greeting -->
              <p style="margin:0 0 8px;font-size:22px;font-weight:700;color:#ffffff;line-height:1.3;">
                Hey ${displayName},
              </p>

              <!-- Role badge -->
              <p style="margin:0 0 24px;font-size:12px;font-weight:600;letter-spacing:0.08em;text-transform:uppercase;color:${accentColor};">
                ${roleLabel} · Waitlist Confirmed
              </p>

              <!-- Divider -->
              <div style="height:1px;background:linear-gradient(to right,transparent,rgba(255,255,255,0.08),transparent);margin-bottom:24px;"></div>

              <!-- Message -->
              <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:rgba(255,255,255,0.75);">
                Thank you for joining the waitlist of <strong style="color:#ffffff;">Something</strong>!
                We will contact you soon.
              </p>
              <p style="margin:0 0 32px;font-size:15px;line-height:1.7;color:rgba(255,255,255,0.75);">
              Think/Build something or like a potato.
              </p>

              <!-- CTA Button -->
              <table cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="border-radius:10px;background-color:${accentColor};">
                    <a
                      href="https://something.to"
                      style="display:inline-block;padding:12px 28px;font-size:14px;font-weight:600;color:#0a0a0c;text-decoration:none;border-radius:10px;"
                    >
                      Visit Something →
                    </a>
                  </td>
                </tr>
              </table>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td align="center" style="padding-top:28px;">
              <p style="margin:0 0 6px;font-size:11px;color:rgba(255,255,255,0.2);font-family:monospace;">
                something.to · v2.0
              </p>
              <p style="margin:0;font-size:11px;color:rgba(255,255,255,0.12);">
                You received this because you signed up for the Something waitlist.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

// ── Send Function ─────────────────────────────────────────────────────────────
export async function sendWaitlistEmail(
  to: string,
  name: string,
  role: string
): Promise<void> {
  const from = process.env.EMAIL_FROM ?? process.env.SMTP_USER

  console.log("[mailer] Attempting to send email...")
  console.log("[mailer] SMTP_USER:", process.env.SMTP_USER)
  console.log("[mailer] EMAIL_FROM:", from)
  console.log("[mailer] Sending to:", to)

  try {
    const info = await transporter.sendMail({
      from,
      to,
      subject: "You're on the Something waitlist",
      html: buildWaitlistEmail(name, role),
    })
    console.log("[mailer] Email sent successfully. MessageId:", info.messageId)
  } catch (err) {
    console.error("[mailer] sendMail error:", err)
    throw err
  }
}
