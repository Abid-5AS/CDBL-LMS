/**
 * OTP (One-Time Password) Utility Functions
 * Handles generation, validation, and cleanup of OTP codes
 */

import { prisma } from "./prisma";

const OTP_LENGTH = 6;
const OTP_EXPIRY_MINUTES = 10;
const MAX_VERIFICATION_ATTEMPTS = 3;

/**
 * Generate a 6-digit OTP code
 */
export function generateOtpCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Create and save OTP code for a user
 */
export async function createOtpCode(
  userId: number,
  email: string,
  ipAddress?: string
): Promise<{ code: string; expiresAt: Date }> {
  // Invalidate any existing OTP codes for this user
  await prisma.otpCode.updateMany({
    where: {
      userId,
      verified: false,
    },
    data: {
      verified: true, // Mark as used/invalid
    },
  });

  const code = generateOtpCode();
  const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

  await prisma.otpCode.create({
    data: {
      userId,
      email,
      code,
      expiresAt,
      ipAddress: ipAddress || null,
    },
  });

  return { code, expiresAt };
}

/**
 * Verify OTP code
 */
export async function verifyOtpCode(
  email: string,
  code: string,
  ipAddress?: string
): Promise<{
  valid: boolean;
  userId?: number;
  error?: string;
}> {
  // Find the most recent unverified OTP for this email
  const otpRecord = await prisma.otpCode.findFirst({
    where: {
      email,
      code,
      verified: false,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  if (!otpRecord) {
    return {
      valid: false,
      error: "Invalid or expired verification code",
    };
  }

  // Check if OTP has expired
  if (new Date() > otpRecord.expiresAt) {
    // Mark as verified (used) so it can't be reused
    await prisma.otpCode.update({
      where: { id: otpRecord.id },
      data: { verified: true },
    });

    return {
      valid: false,
      error: "Verification code has expired. Please request a new one.",
    };
  }

  // Check verification attempts
  if (otpRecord.attempts >= MAX_VERIFICATION_ATTEMPTS) {
    // Mark as verified (used) so it can't be reused
    await prisma.otpCode.update({
      where: { id: otpRecord.id },
      data: { verified: true },
    });

    return {
      valid: false,
      error: "Too many failed attempts. Please request a new code.",
    };
  }

  // Increment attempts
  await prisma.otpCode.update({
    where: { id: otpRecord.id },
    data: {
      attempts: otpRecord.attempts + 1,
    },
  });

  // Verify the code matches
  if (otpRecord.code !== code) {
    return {
      valid: false,
      error: `Invalid code. ${MAX_VERIFICATION_ATTEMPTS - (otpRecord.attempts + 1)} attempts remaining.`,
    };
  }

  // Mark OTP as verified (used)
  await prisma.otpCode.update({
    where: { id: otpRecord.id },
    data: {
      verified: true,
    },
  });

  return {
    valid: true,
    userId: otpRecord.userId,
  };
}

/**
 * Clean up expired OTP codes (should be run periodically)
 */
export async function cleanupExpiredOtpCodes(): Promise<number> {
  const result = await prisma.otpCode.deleteMany({
    where: {
      OR: [
        { expiresAt: { lt: new Date() } },
        { verified: true },
      ],
    },
  });

  return result.count;
}

/**
 * Get remaining attempts for an OTP
 */
export async function getRemainingAttempts(email: string, code: string): Promise<number> {
  const otpRecord = await prisma.otpCode.findFirst({
    where: {
      email,
      code,
      verified: false,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  if (!otpRecord) {
    return 0;
  }

  return Math.max(0, MAX_VERIFICATION_ATTEMPTS - otpRecord.attempts);
}
