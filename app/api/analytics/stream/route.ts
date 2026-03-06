import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
// Prevent Next.js from caching this route
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
    const user = await getCurrentUser();
    if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const encoder = new TextEncoder();

    // Create a streaming response
    const customReadable = new ReadableStream({
        async start(controller) {
            // Send initial connection message
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "connected" })}\n\n`));

            // Polling interval (30 seconds)
            const intervalId = setInterval(async () => {
                try {
                    // Check for recent updates (last 30s)
                    const thirtySecondsAgo = new Date(Date.now() - 30000);

                    // Check for new leaves or status changes
                    const recentActivity = await prisma.leaveRequest.count({
                        where: {
                            updatedAt: { gte: thirtySecondsAgo },
                        },
                    });

                    if (recentActivity > 0) {
                        // Send update event
                        const data = JSON.stringify({
                            type: "stats_update",
                            timestamp: new Date().toISOString(),
                            activityCount: recentActivity
                        });
                        controller.enqueue(encoder.encode(`data: ${data}\n\n`));
                    }

                    // Send heartbeat to keep connection alive
                    controller.enqueue(encoder.encode(`: heartbeat\n\n`));

                } catch (error) {
                    console.error("Error in SSE stream:", error);
                    // Don't close controller here, just log error and retry next interval
                }
            }, 30000);

            // Clean up on close
            req.signal.addEventListener("abort", () => {
                clearInterval(intervalId);
                controller.close();
            });
        },
    });

    return new NextResponse(customReadable, {
        headers: {
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
        },
    });
}
