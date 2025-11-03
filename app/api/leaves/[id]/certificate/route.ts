import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { promises as fs } from "fs";
import path from "path";
import { randomUUID } from "crypto";
import { fileTypeFromBuffer } from "file-type";
import { generateSignedUrl } from "@/lib/storage";

export const cache = "no-store";

/**
 * Upload medical or fitness certificate
 * Endpoint: POST /api/leaves/[id]/certificate
 * Rules:
 * - MIME validation via file-type library
 * - Size limit: ≤ 5MB
 * - Save to /private/uploads/
 * - Return signed URL with 15-min expiry
 * - Update leave.certificateUrl or leave.fitnessCertificateUrl
 */
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const leaveId = Number(id);
  if (Number.isNaN(leaveId)) {
    return NextResponse.json({ error: "invalid_id" }, { status: 400 });
  }

  // Get the leave request
  const leave = await prisma.leaveRequest.findUnique({
    where: { id: leaveId },
    include: { requester: { select: { email: true } } },
  });

  if (!leave) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  // Check authorization: employee can upload for own leave, HR roles can upload for any
  const isOwnLeave = leave.requesterId === user.id;
  const isHRRole = ["HR_ADMIN", "HR_HEAD", "CEO"].includes(user.role as string);
  
  if (!isOwnLeave && !isHRRole) {
    return NextResponse.json(
      { error: "forbidden", message: "You can only upload certificates for your own leaves" },
      { status: 403 }
    );
  }

  // Parse form data
  const formData = await request.formData();
  const certificateFile = formData.get("certificate") as File | null;
  const certificateType = (formData.get("type") as string) || "medical"; // "medical" or "fitness"

  if (!certificateFile) {
    return NextResponse.json({ error: "file_required", message: "Certificate file is required" }, { status: 400 });
  }

  // Validate file extension
  const ext = (certificateFile.name.split(".").pop() ?? "").toLowerCase();
  const allowed = ["pdf", "jpg", "jpeg", "png"];
  if (!allowed.includes(ext)) {
    return NextResponse.json(
      { error: "unsupported_file_type", message: "Unsupported file type. Use PDF, JPG, or PNG." },
      { status: 400 }
    );
  }

  // Validate file size (≤ 5MB)
  const maxSize = 5 * 1024 * 1024; // 5MB
  if (certificateFile.size > maxSize) {
    return NextResponse.json(
      { error: "file_too_large", message: "File too large (max 5 MB)." },
      { status: 400 }
    );
  }

  // Read file buffer
  const arrayBuffer = await certificateFile.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  // Validate MIME type using file-type library
  const fileType = await fileTypeFromBuffer(buffer);
  if (!fileType) {
    return NextResponse.json(
      { error: "certificate_invalid_type", message: "Cannot determine file type. Upload a valid PDF, JPG, or PNG file." },
      { status: 400 }
    );
  }

  const allowedMimeTypes = ["application/pdf", "image/jpeg", "image/png"];
  if (!allowedMimeTypes.includes(fileType.mime)) {
    return NextResponse.json(
      { error: "certificate_invalid_type", message: `File content type (${fileType.mime}) not allowed. PDF, JPG, PNG only.` },
      { status: 400 }
    );
  }

  // Sanitize filename
  const safeName = certificateFile.name.replace(/[^\w.\-]/g, "_");
  const finalName = `${randomUUID()}-${safeName}`;

  // Ensure upload directory exists
  const uploadDir = path.join(process.cwd(), "private", "uploads");
  await fs.mkdir(uploadDir, { recursive: true });

  // Save file
  const filePath = path.join(uploadDir, finalName);
  await fs.writeFile(filePath, buffer);

  // Generate signed URL
  const signedUrl = generateSignedUrl(finalName);

  // Update leave request with certificate URL
  const updateData: { certificateUrl?: string; fitnessCertificateUrl?: string } = {};
  if (certificateType === "fitness") {
    updateData.fitnessCertificateUrl = signedUrl;
  } else {
    updateData.certificateUrl = signedUrl;
  }

  await prisma.leaveRequest.update({
    where: { id: leaveId },
    data: updateData,
  });

  // Create audit log
  await prisma.auditLog.create({
    data: {
      actorEmail: user.email,
      action: "UPLOAD_CERTIFICATE",
      targetEmail: leave.requester.email,
      details: {
        leaveId: leave.id,
        certificateType,
        filename: finalName,
        fileSize: certificateFile.size,
        mimeType: fileType.mime,
      },
    },
  });

  return NextResponse.json({
    ok: true,
    url: signedUrl,
    filename: finalName,
    type: certificateType,
  });
}

