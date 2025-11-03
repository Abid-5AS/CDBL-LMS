import crypto from "crypto";
import path from "path";
import { readFile } from "fs/promises";
import { NextResponse } from "next/server";

/**
 * Secret key for signing URLs (should be in environment variable in production)
 * In production, use: process.env.FILE_SIGNING_SECRET || throw new Error("FILE_SIGNING_SECRET not set")
 */
const SIGNING_SECRET = process.env.FILE_SIGNING_SECRET || "change-me-in-production";

/**
 * Signed URL expiry time in milliseconds (15 minutes)
 */
const URL_EXPIRY_MS = 15 * 60 * 1000; // 15 minutes

/**
 * Generate a signed URL for accessing a private file
 * @param filePath - Relative path to the file (e.g., "medical-cert-123.pdf")
 * @returns Signed URL with expiry timestamp and signature
 */
export function generateSignedUrl(filePath: string): string {
  const expiry = Date.now() + URL_EXPIRY_MS;
  const message = `${filePath}:${expiry}`;
  const signature = crypto.createHmac("sha256", SIGNING_SECRET).update(message).digest("hex");
  return `/api/files/signed/${filePath}?expires=${expiry}&sig=${signature}`;
}

/**
 * Verify a signed URL and extract the file path
 * @param filename - Filename from URL path
 * @param expires - Expiry timestamp from query param
 * @param sig - Signature from query param
 * @returns true if valid, false otherwise
 */
export function verifySignedUrl(filename: string, expires: string, sig: string): boolean {
  try {
    const expiryTime = parseInt(expires, 10);
    
    // Check if URL has expired
    if (Date.now() > expiryTime) {
      return false;
    }

    // Verify signature
    const message = `${filename}:${expiryTime}`;
    const expectedSig = crypto.createHmac("sha256", SIGNING_SECRET).update(message).digest("hex");
    
    // Constant-time comparison to prevent timing attacks
    return crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expectedSig));
  } catch {
    return false;
  }
}

/**
 * Get the full file path for a stored file
 * @param filename - Filename from database
 * @returns Absolute path to the file
 */
export function getFilePath(filename: string): string {
  const uploadDir = path.join(process.cwd(), "private", "uploads");
  return path.join(uploadDir, filename);
}

/**
 * Serve a file with verified signed URL
 * @param filename - Filename from URL
 * @param expires - Expiry timestamp
 * @param sig - Signature
 * @returns NextResponse with file or error
 */
export async function serveSignedFile(
  filename: string,
  expires: string,
  sig: string
): Promise<NextResponse> {
  // Verify signature
  if (!verifySignedUrl(filename, expires, sig)) {
    return NextResponse.json(
      { error: "invalid_signature", message: "Invalid or expired signed URL" },
      { status: 403 }
    );
  }

  // Get file path
  const filePath = getFilePath(filename);

  try {
    // Read file
    const fileBuffer = await readFile(filePath);

    // Determine content type from extension
    const ext = path.extname(filename).toLowerCase();
    const contentTypeMap: Record<string, string> = {
      ".pdf": "application/pdf",
      ".jpg": "image/jpeg",
      ".jpeg": "image/jpeg",
      ".png": "image/png",
    };

    const contentType = contentTypeMap[ext] || "application/octet-stream";

    // Return file with appropriate headers
    return new NextResponse(fileBuffer, {
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `inline; filename="${filename}"`,
        "Cache-Control": "private, max-age=900", // 15 minutes cache
      },
    });
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return NextResponse.json({ error: "file_not_found" }, { status: 404 });
    }
    return NextResponse.json({ error: "file_read_error" }, { status: 500 });
  }
}

