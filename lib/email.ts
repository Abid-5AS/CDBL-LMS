/**
 * Email Service for CDBL Leave Management System
 * Handles sending emails via NodeMailer
 */

import * as nodemailer from "nodemailer";

// Email configuration from environment variables
const EMAIL_HOST = process.env.EMAIL_HOST || "smtp.gmail.com";
const EMAIL_PORT = parseInt(process.env.EMAIL_PORT || "587");
const EMAIL_USER = process.env.EMAIL_USER || "";
const EMAIL_PASSWORD = process.env.EMAIL_PASSWORD || "";
const EMAIL_FROM = process.env.EMAIL_FROM || "CDBL LMS <noreply@cdbl.com>";

// Development email override - route all emails to this address for testing
const DEV_EMAIL_OVERRIDE = process.env.DEV_EMAIL_OVERRIDE || "";

// Create reusable transporter
const transporter = nodemailer.createTransport({
  host: EMAIL_HOST,
  port: EMAIL_PORT,
  secure: EMAIL_PORT === 465, // true for port 465, false for other ports
  auth: {
    user: EMAIL_USER,
    pass: EMAIL_PASSWORD,
  },
});

/**
 * Send OTP code via email
 */
export async function sendOtpEmail(
  to: string,
  code: string,
  recipientName: string
): Promise<boolean> {
  try {
    // In development, override the recipient email if DEV_EMAIL_OVERRIDE is set
    const actualRecipient = DEV_EMAIL_OVERRIDE || to;
    const isOverridden = DEV_EMAIL_OVERRIDE && DEV_EMAIL_OVERRIDE !== to;

    const mailOptions = {
      from: EMAIL_FROM,
      to: actualRecipient,
      subject: isOverridden
        ? `CDBL LMS - OTP for ${to}`
        : "CDBL LMS - Your Login Verification Code",
      html: getOtpEmailTemplate(code, recipientName, isOverridden ? to : undefined),
      text: isOverridden
        ? `Login attempt for: ${to}\n\nYour CDBL LMS verification code is: ${code}. This code will expire in 10 minutes. If you didn't request this code, please ignore this email.`
        : `Your CDBL LMS verification code is: ${code}. This code will expire in 10 minutes. If you didn't request this code, please ignore this email.`,
    };

    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error("Failed to send OTP email:", error);
    return false;
  }
}

/**
 * HTML email template for OTP
 */
function getOtpEmailTemplate(
  code: string,
  recipientName: string,
  originalEmail?: string
): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>CDBL LMS - Verification Code</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f8fafc;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <!-- Main Container -->
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" border="0" style="max-width: 600px; background-color: #ffffff; border-radius: 16px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <!-- Header with Logo -->
          <tr>
            <td style="padding: 40px 40px 20px; text-align: center; background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); border-radius: 16px 16px 0 0;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">CDBL LMS</h1>
              <p style="margin: 8px 0 0; color: rgba(255, 255, 255, 0.9); font-size: 14px;">Leave Management System</p>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              ${
                originalEmail
                  ? `<div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; border-radius: 8px; padding: 16px; margin: 0 0 24px;">
                <p style="margin: 0 0 8px; color: #78350f; font-size: 14px; font-weight: 600;">🔐 Development Mode:</p>
                <p style="margin: 0; color: #78350f; font-size: 14px; line-height: 1.5;">
                  Login attempt for: <strong>${originalEmail}</strong>
                </p>
              </div>`
                  : ""
              }
              <h2 style="margin: 0 0 16px; color: #0f172a; font-size: 24px; font-weight: 600;">Welcome back, ${recipientName}!</h2>
              <p style="margin: 0 0 24px; color: #475569; font-size: 16px; line-height: 1.6;">
                You're almost there! Use the verification code below to complete your login to CDBL Leave Management System.
              </p>

              <!-- OTP Code Box -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td align="center" style="padding: 32px 0;">
                    <div style="display: inline-block; background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%); border: 2px solid #3b82f6; border-radius: 12px; padding: 24px 48px;">
                      <p style="margin: 0 0 8px; color: #475569; font-size: 14px; font-weight: 500; text-transform: uppercase; letter-spacing: 0.05em;">Your Verification Code</p>
                      <p style="margin: 0; color: #1e40af; font-size: 36px; font-weight: 700; letter-spacing: 0.2em;">${code}</p>
                    </div>
                  </td>
                </tr>
              </table>

              <!-- Important Notice -->
              <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; border-radius: 8px; padding: 16px; margin: 24px 0;">
                <p style="margin: 0 0 8px; color: #78350f; font-size: 14px; font-weight: 600;">⏱️ Important:</p>
                <p style="margin: 0; color: #78350f; font-size: 14px; line-height: 1.5;">
                  This code will expire in <strong>10 minutes</strong>. For your security, do not share this code with anyone.
                </p>
              </div>

              <!-- Footer Text -->
              <p style="margin: 24px 0 0; color: #64748b; font-size: 14px; line-height: 1.6;">
                If you didn't request this code, you can safely ignore this email. Your account remains secure.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 24px 40px 40px; border-top: 1px solid #e2e8f0;">
              <p style="margin: 0; color: #94a3b8; font-size: 12px; line-height: 1.5; text-align: center;">
                © ${new Date().getFullYear()} Central Depository Bangladesh Limited (CDBL)<br />
                This is an automated message, please do not reply to this email.
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
}

/**
 * Verify email configuration on app startup
 */
export async function verifyEmailConnection(): Promise<boolean> {
  try {
    await transporter.verify();
    console.log("✅ Email service is ready to send messages");
    return true;
  } catch (error) {
    console.error("❌ Email service verification failed:", error);
    console.error("Please check EMAIL_* environment variables");
    return false;
  }
}
