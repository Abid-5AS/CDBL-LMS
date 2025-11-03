import { NextRequest, NextResponse } from "next/server";
import { serveSignedFile } from "@/lib/storage";

/**
 * Serve files via signed URLs
 * Endpoint: GET /api/files/signed/[filename]?expires=...&sig=...
 * Rules:
 * - Verifies signature and expiry
 * - Returns file with appropriate Content-Type headers
 * - 15-minute cache control
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ filename: string }> }
) {
  const { filename } = await params;
  const { searchParams } = new URL(request.url);
  const expires = searchParams.get("expires");
  const sig = searchParams.get("sig");

  if (!expires || !sig) {
    return NextResponse.json(
      { error: "missing_params", message: "Missing expires or sig parameter" },
      { status: 400 }
    );
  }

  return serveSignedFile(filename, expires, sig);
}

