/**
 * services/email.service.js
 * ─────────────────────────────────────────────────────────────
 * Nodemailer wrapper.
 * All email-sending logic lives here; controllers just call sendOtpEmail().
 *
 * ENV vars required (add to .env):
 *   SMTP_HOST      — e.g. smtp.gmail.com
 *   SMTP_PORT      — e.g. 587
 *   SMTP_USER      — your sender email
 *   SMTP_PASS      — app password / SMTP secret
 *   EMAIL_FROM     — display name + address e.g. "Khatabook <no-reply@khatabook.com>"
 * ─────────────────────────────────────────────────────────────
 */

const nodemailer = require('nodemailer');

// ── Transporter (singleton) ────────────────────────────────────
// Created once and reused across all calls.
const createTransporter = () =>
  nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: Number(process.env.SMTP_PORT) || 587,
    secure: Number(process.env.SMTP_PORT) === 465, // true only for port 465
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

// ── HTML Email Template ────────────────────────────────────────
const buildOtpHtml = (otp, purpose = 'verification') => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Your Khatabook OTP</title>
</head>
<body style="margin:0;padding:0;background:#f4f6f9;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6f9;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="480" cellpadding="0" cellspacing="0"
               style="background:#ffffff;border-radius:12px;overflow:hidden;
                      box-shadow:0 4px 20px rgba(0,0,0,0.08);">

          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#2563eb,#1d4ed8);
                        padding:32px 40px;text-align:center;">
              <h1 style="margin:0;color:#ffffff;font-size:24px;font-weight:700;
                          letter-spacing:-0.5px;">📒 Khatabook</h1>
              <p style="margin:6px 0 0;color:#bfdbfe;font-size:13px;">
                Secure Ledger & Expense Manager
              </p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:36px 40px 20px;">
              <p style="margin:0 0 8px;color:#374151;font-size:15px;">Hello,</p>
              <p style="margin:0 0 24px;color:#374151;font-size:15px;line-height:1.6;">
                Use the OTP below to complete your <strong>${purpose}</strong>.
                It is valid for <strong>5 minutes</strong>.
              </p>

              <!-- OTP Box -->
              <div style="background:#eff6ff;border:2px dashed #2563eb;border-radius:10px;
                           padding:20px;text-align:center;margin-bottom:24px;">
                <span style="font-size:38px;font-weight:800;letter-spacing:12px;
                              color:#1d4ed8;font-family:monospace;">
                  ${otp}
                </span>
              </div>

              <p style="color:#6b7280;font-size:13px;line-height:1.6;margin:0 0 8px;">
                ⚠️ Do <strong>not</strong> share this code with anyone.
                Khatabook will never ask for your OTP via phone or chat.
              </p>
              <p style="color:#6b7280;font-size:13px;">
                If you did not request this, you can safely ignore this email.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:16px 40px 32px;border-top:1px solid #f3f4f6;">
              <p style="margin:0;color:#9ca3af;font-size:12px;text-align:center;">
                © ${new Date().getFullYear()} Khatabook Clone. All rights reserved.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;

// ── Public API ─────────────────────────────────────────────────

/**
 * Send an OTP email to a single recipient.
 *
 * @param {object} options
 * @param {string} options.to       - Recipient email address
 * @param {string} options.otp      - The 6-digit OTP string
 * @param {string} [options.purpose] - Human-readable purpose e.g. "email verification"
 * @returns {Promise<void>}
 */
const sendOtpEmail = async ({ to, otp, purpose = 'email verification' }) => {
  const transporter = createTransporter();

  const mailOptions = {
    from: process.env.EMAIL_FROM || `"Khatabook" <${process.env.SMTP_USER}>`,
    to,
    subject: `${otp} — Your Khatabook OTP (valid 5 min)`,
    text: `Your Khatabook OTP for ${purpose} is: ${otp}\nIt expires in 5 minutes. Do not share it with anyone.`,
    html: buildOtpHtml(otp, purpose),
  };

  await transporter.sendMail(mailOptions);
};

/**
 * Send a generic transactional email.
 *
 * @param {object} mailOptions - Standard nodemailer mail options
 * @returns {Promise<void>}
 */
const sendEmail = async (mailOptions) => {
  const transporter = createTransporter();
  await transporter.sendMail({
    from: process.env.EMAIL_FROM || `"Khatabook" <${process.env.SMTP_USER}>`,
    ...mailOptions,
  });
};

module.exports = { sendOtpEmail, sendEmail };
