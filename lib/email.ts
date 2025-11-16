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
<body style="margin: 0; padding: 0; font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif; background-color: #f8fafc;">
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
 * Send leave submitted notification email
 */
export async function sendLeaveSubmittedEmail(
  to: string,
  recipientName: string,
  requesterName: string,
  leaveType: string,
  startDate: string,
  endDate: string,
  workingDays: number,
  leaveId: number
): Promise<boolean> {
  try {
    const actualRecipient = DEV_EMAIL_OVERRIDE || to;
    const isOverridden = DEV_EMAIL_OVERRIDE && DEV_EMAIL_OVERRIDE !== to;

    const mailOptions = {
      from: EMAIL_FROM,
      to: actualRecipient,
      subject: isOverridden
        ? `CDBL LMS - Leave Approval Required for ${to}`
        : "CDBL LMS - Leave Approval Required",
      html: getLeaveSubmittedTemplate(recipientName, requesterName, leaveType, startDate, endDate, workingDays, leaveId, isOverridden ? to : undefined),
      text: `Dear ${recipientName},\n\n${requesterName} has submitted a ${leaveType} leave request for your approval.\n\nDates: ${startDate} to ${endDate} (${workingDays} working days)\n\nPlease log in to CDBL LMS to review and approve this request.`,
    };

    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error("Failed to send leave submitted email:", error);
    return false;
  }
}

/**
 * Send leave approved notification email
 */
export async function sendLeaveApprovedEmail(
  to: string,
  recipientName: string,
  leaveType: string,
  startDate: string,
  endDate: string,
  approverName: string,
  leaveId: number
): Promise<boolean> {
  try {
    const actualRecipient = DEV_EMAIL_OVERRIDE || to;

    const mailOptions = {
      from: EMAIL_FROM,
      to: actualRecipient,
      subject: "CDBL LMS - Leave Request Approved",
      html: getLeaveApprovedTemplate(recipientName, leaveType, startDate, endDate, approverName, leaveId),
      text: `Dear ${recipientName},\n\nGood news! Your ${leaveType} leave request has been approved by ${approverName}.\n\nDates: ${startDate} to ${endDate}\n\nEnjoy your time off!`,
    };

    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error("Failed to send leave approved email:", error);
    return false;
  }
}

/**
 * Send leave rejected notification email
 */
export async function sendLeaveRejectedEmail(
  to: string,
  recipientName: string,
  leaveType: string,
  startDate: string,
  endDate: string,
  approverName: string,
  reason: string,
  leaveId: number
): Promise<boolean> {
  try {
    const actualRecipient = DEV_EMAIL_OVERRIDE || to;

    const mailOptions = {
      from: EMAIL_FROM,
      to: actualRecipient,
      subject: "CDBL LMS - Leave Request Rejected",
      html: getLeaveRejectedTemplate(recipientName, leaveType, startDate, endDate, approverName, reason, leaveId),
      text: `Dear ${recipientName},\n\nYour ${leaveType} leave request has been rejected by ${approverName}.\n\nDates: ${startDate} to ${endDate}\n\nReason: ${reason}\n\nYou can modify and resubmit your request if needed.`,
    };

    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error("Failed to send leave rejected email:", error);
    return false;
  }
}

/**
 * Send leave returned for modification notification email
 */
export async function sendLeaveReturnedEmail(
  to: string,
  recipientName: string,
  leaveType: string,
  approverName: string,
  comment: string,
  leaveId: number
): Promise<boolean> {
  try {
    const actualRecipient = DEV_EMAIL_OVERRIDE || to;

    const mailOptions = {
      from: EMAIL_FROM,
      to: actualRecipient,
      subject: "CDBL LMS - Leave Request Returned for Modification",
      html: getLeaveReturnedTemplate(recipientName, leaveType, approverName, comment, leaveId),
      text: `Dear ${recipientName},\n\nYour ${leaveType} leave request has been returned by ${approverName} for modification.\n\nComment: ${comment}\n\nPlease update your request and resubmit.`,
    };

    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error("Failed to send leave returned email:", error);
    return false;
  }
}

/**
 * Send leave forwarded notification email to new approver
 */
export async function sendLeaveForwardedEmail(
  to: string,
  recipientName: string,
  requesterName: string,
  forwarderName: string,
  leaveType: string,
  startDate: string,
  endDate: string,
  workingDays: number,
  leaveId: number
): Promise<boolean> {
  try {
    const actualRecipient = DEV_EMAIL_OVERRIDE || to;
    const isOverridden = DEV_EMAIL_OVERRIDE && DEV_EMAIL_OVERRIDE !== to;

    const mailOptions = {
      from: EMAIL_FROM,
      to: actualRecipient,
      subject: isOverridden
        ? `CDBL LMS - Leave Approval Forwarded for ${to}`
        : "CDBL LMS - Leave Approval Forwarded to You",
      html: getLeaveForwardedTemplate(recipientName, requesterName, forwarderName, leaveType, startDate, endDate, workingDays, leaveId, isOverridden ? to : undefined),
      text: `Dear ${recipientName},\n\n${forwarderName} has forwarded ${requesterName}'s ${leaveType} leave request to you for approval.\n\nDates: ${startDate} to ${endDate} (${workingDays} working days)\n\nPlease log in to CDBL LMS to review this request.`,
    };

    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error("Failed to send leave forwarded email:", error);
    return false;
  }
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

// ===== EMAIL TEMPLATES =====

function getLeaveSubmittedTemplate(
  recipientName: string,
  requesterName: string,
  leaveType: string,
  startDate: string,
  endDate: string,
  workingDays: number,
  leaveId: number,
  originalEmail?: string
): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>CDBL LMS - Leave Approval Required</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f8fafc;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" border="0" style="max-width: 600px; background-color: #ffffff; border-radius: 16px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <tr>
            <td style="padding: 40px 40px 20px; text-align: center; background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); border-radius: 16px 16px 0 0;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">📋 Leave Approval Required</h1>
            </td>
          </tr>
          <tr>
            <td style="padding: 40px;">
              ${originalEmail ? `<div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; border-radius: 8px; padding: 16px; margin: 0 0 24px;"><p style="margin: 0; color: #78350f; font-size: 14px;">🔐 Dev Mode - Email for: <strong>${originalEmail}</strong></p></div>` : ''}
              <h2 style="margin: 0 0 16px; color: #0f172a; font-size: 24px;">Dear ${recipientName},</h2>
              <p style="margin: 0 0 24px; color: #475569; font-size: 16px; line-height: 1.6;">
                <strong>${requesterName}</strong> has submitted a leave request that requires your approval.
              </p>
              <div style="background-color: #f1f5f9; border-radius: 12px; padding: 24px; margin: 0 0 24px;">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                  <tr><td style="padding: 8px 0;"><strong style="color: #475569;">Leave Type:</strong></td><td style="padding: 8px 0; text-align: right; color: #0f172a; font-weight: 600;">${leaveType}</td></tr>
                  <tr><td style="padding: 8px 0;"><strong style="color: #475569;">Start Date:</strong></td><td style="padding: 8px 0; text-align: right; color: #0f172a;">${startDate}</td></tr>
                  <tr><td style="padding: 8px 0;"><strong style="color: #475569;">End Date:</strong></td><td style="padding: 8px 0; text-align: right; color: #0f172a;">${endDate}</td></tr>
                  <tr><td style="padding: 8px 0;"><strong style="color: #475569;">Working Days:</strong></td><td style="padding: 8px 0; text-align: right; color: #0f172a; font-weight: 600;">${workingDays} days</td></tr>
                </table>
              </div>
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                <tr><td align="center" style="padding: 16px 0;"><a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/leaves/${leaveId}" style="display: inline-block; background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px;">Review Request</a></td></tr>
              </table>
            </td>
          </tr>
          <tr><td style="padding: 24px 40px 40px; border-top: 1px solid #e2e8f0;"><p style="margin: 0; color: #94a3b8; font-size: 12px; text-align: center;">© ${new Date().getFullYear()} CDBL | Automated notification</p></td></tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
}

function getLeaveApprovedTemplate(
  recipientName: string,
  leaveType: string,
  startDate: string,
  endDate: string,
  approverName: string,
  leaveId: number
): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>CDBL LMS - Leave Approved</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f8fafc;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" border="0" style="max-width: 600px; background-color: #ffffff; border-radius: 16px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <tr>
            <td style="padding: 40px 40px 20px; text-align: center; background: linear-gradient(135deg, #10b981 0%, #059669 100%); border-radius: 16px 16px 0 0;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">✅ Leave Approved!</h1>
            </td>
          </tr>
          <tr>
            <td style="padding: 40px;">
              <h2 style="margin: 0 0 16px; color: #0f172a; font-size: 24px;">Dear ${recipientName},</h2>
              <p style="margin: 0 0 24px; color: #475569; font-size: 16px; line-height: 1.6;">
                Great news! Your ${leaveType} leave request has been approved by <strong>${approverName}</strong>.
              </p>
              <div style="background-color: #ecfdf5; border-left: 4px solid #10b981; border-radius: 8px; padding: 16px; margin: 0 0 24px;">
                <p style="margin: 0 0 8px; color: #065f46; font-size: 14px; font-weight: 600;">Leave Period:</p>
                <p style="margin: 0; color: #065f46; font-size: 18px; font-weight: 700;">${startDate} to ${endDate}</p>
              </div>
              <p style="margin: 0 0 24px; color: #475569; font-size: 16px;">Enjoy your time off! 🎉</p>
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                <tr><td align="center" style="padding: 16px 0;"><a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/leaves/${leaveId}" style="display: inline-block; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px;">View Details</a></td></tr>
              </table>
            </td>
          </tr>
          <tr><td style="padding: 24px 40px 40px; border-top: 1px solid #e2e8f0;"><p style="margin: 0; color: #94a3b8; font-size: 12px; text-align: center;">© ${new Date().getFullYear()} CDBL | Automated notification</p></td></tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
}

function getLeaveRejectedTemplate(
  recipientName: string,
  leaveType: string,
  startDate: string,
  endDate: string,
  approverName: string,
  reason: string,
  leaveId: number
): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>CDBL LMS - Leave Rejected</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f8fafc;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" border="0" style="max-width: 600px; background-color: #ffffff; border-radius: 16px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <tr>
            <td style="padding: 40px 40px 20px; text-align: center; background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); border-radius: 16px 16px 0 0;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">❌ Leave Request Not Approved</h1>
            </td>
          </tr>
          <tr>
            <td style="padding: 40px;">
              <h2 style="margin: 0 0 16px; color: #0f172a; font-size: 24px;">Dear ${recipientName},</h2>
              <p style="margin: 0 0 24px; color: #475569; font-size: 16px; line-height: 1.6;">
                Your ${leaveType} leave request (${startDate} to ${endDate}) has not been approved by <strong>${approverName}</strong>.
              </p>
              <div style="background-color: #fef2f2; border-left: 4px solid #ef4444; border-radius: 8px; padding: 16px; margin: 0 0 24px;">
                <p style="margin: 0 0 8px; color: #991b1b; font-size: 14px; font-weight: 600;">Reason:</p>
                <p style="margin: 0; color: #991b1b; font-size: 16px;">${reason}</p>
              </div>
              <p style="margin: 0 0 24px; color: #475569; font-size: 16px;">You can modify your request and resubmit if needed.</p>
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                <tr><td align="center" style="padding: 16px 0;"><a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/leaves/${leaveId}" style="display: inline-block; background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px;">View Request</a></td></tr>
              </table>
            </td>
          </tr>
          <tr><td style="padding: 24px 40px 40px; border-top: 1px solid #e2e8f0;"><p style="margin: 0; color: #94a3b8; font-size: 12px; text-align: center;">© ${new Date().getFullYear()} CDBL | Automated notification</p></td></tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
}

function getLeaveReturnedTemplate(
  recipientName: string,
  leaveType: string,
  approverName: string,
  comment: string,
  leaveId: number
): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>CDBL LMS - Leave Returned</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f8fafc;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" border="0" style="max-width: 600px; background-color: #ffffff; border-radius: 16px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <tr>
            <td style="padding: 40px 40px 20px; text-align: center; background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); border-radius: 16px 16px 0 0;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">🔄 Leave Returned for Modification</h1>
            </td>
          </tr>
          <tr>
            <td style="padding: 40px;">
              <h2 style="margin: 0 0 16px; color: #0f172a; font-size: 24px;">Dear ${recipientName},</h2>
              <p style="margin: 0 0 24px; color: #475569; font-size: 16px; line-height: 1.6;">
                Your ${leaveType} leave request has been returned by <strong>${approverName}</strong> for modification.
              </p>
              <div style="background-color: #fffbeb; border-left: 4px solid #f59e0b; border-radius: 8px; padding: 16px; margin: 0 0 24px;">
                <p style="margin: 0 0 8px; color: #78350f; font-size: 14px; font-weight: 600;">Comments:</p>
                <p style="margin: 0; color: #78350f; font-size: 16px;">${comment}</p>
              </div>
              <p style="margin: 0 0 24px; color: #475569; font-size: 16px;">Please update your request and resubmit it.</p>
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                <tr><td align="center" style="padding: 16px 0;"><a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/leaves/${leaveId}" style="display: inline-block; background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px;">Modify Request</a></td></tr>
              </table>
            </td>
          </tr>
          <tr><td style="padding: 24px 40px 40px; border-top: 1px solid #e2e8f0;"><p style="margin: 0; color: #94a3b8; font-size: 12px; text-align: center;">© ${new Date().getFullYear()} CDBL | Automated notification</p></td></tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
}

function getLeaveForwardedTemplate(
  recipientName: string,
  requesterName: string,
  forwarderName: string,
  leaveType: string,
  startDate: string,
  endDate: string,
  workingDays: number,
  leaveId: number,
  originalEmail?: string
): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>CDBL LMS - Leave Forwarded</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f8fafc;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" border="0" style="max-width: 600px; background-color: #ffffff; border-radius: 16px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <tr>
            <td style="padding: 40px 40px 20px; text-align: center; background: linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%); border-radius: 16px 16px 0 0;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">➡️ Leave Approval Forwarded</h1>
            </td>
          </tr>
          <tr>
            <td style="padding: 40px;">
              ${originalEmail ? `<div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; border-radius: 8px; padding: 16px; margin: 0 0 24px;"><p style="margin: 0; color: #78350f; font-size: 14px;">🔐 Dev Mode - Email for: <strong>${originalEmail}</strong></p></div>` : ''}
              <h2 style="margin: 0 0 16px; color: #0f172a; font-size: 24px;">Dear ${recipientName},</h2>
              <p style="margin: 0 0 24px; color: #475569; font-size: 16px; line-height: 1.6;">
                <strong>${forwarderName}</strong> has forwarded <strong>${requesterName}</strong>'s leave request to you for approval.
              </p>
              <div style="background-color: #f1f5f9; border-radius: 12px; padding: 24px; margin: 0 0 24px;">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                  <tr><td style="padding: 8px 0;"><strong style="color: #475569;">Leave Type:</strong></td><td style="padding: 8px 0; text-align: right; color: #0f172a; font-weight: 600;">${leaveType}</td></tr>
                  <tr><td style="padding: 8px 0;"><strong style="color: #475569;">Start Date:</strong></td><td style="padding: 8px 0; text-align: right; color: #0f172a;">${startDate}</td></tr>
                  <tr><td style="padding: 8px 0;"><strong style="color: #475569;">End Date:</strong></td><td style="padding: 8px 0; text-align: right; color: #0f172a;">${endDate}</td></tr>
                  <tr><td style="padding: 8px 0;"><strong style="color: #475569;">Working Days:</strong></td><td style="padding: 8px 0; text-align: right; color: #0f172a; font-weight: 600;">${workingDays} days</td></tr>
                  <tr><td style="padding: 8px 0;"><strong style="color: #475569;">Forwarded By:</strong></td><td style="padding: 8px 0; text-align: right; color: #0f172a;">${forwarderName}</td></tr>
                </table>
              </div>
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                <tr><td align="center" style="padding: 16px 0;"><a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/leaves/${leaveId}" style="display: inline-block; background: linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%); color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px;">Review Request</a></td></tr>
              </table>
            </td>
          </tr>
          <tr><td style="padding: 24px 40px 40px; border-top: 1px solid #e2e8f0;"><p style="margin: 0; color: #94a3b8; font-size: 12px; text-align: center;">© ${new Date().getFullYear()} CDBL | Automated notification</p></td></tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
}
