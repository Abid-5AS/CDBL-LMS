import { NextRequest, NextResponse } from "next/server";
import { NotificationRepository } from "@/lib/repositories/notification.repository";
import { getCurrentUser } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { token, platform } = await req.json();

    if (!token) {
      return NextResponse.json(
        { error: "Token is required" },
        { status: 400 }
      );
    }

    const userId = user.id;

    await NotificationRepository.registerDeviceToken(
      userId,
      token,
      platform || "android"
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to register device token:", error);
    return NextResponse.json(
      { error: "Failed to register device token" },
      { status: 500 }
    );
  }
}
