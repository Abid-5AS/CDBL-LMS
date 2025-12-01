import { NextRequest } from "next/server";
import { verifyAuth } from "@/lib/auth-jwt";
import { prisma } from "@/lib/prisma";

/**
 * Server-Sent Events (SSE) endpoint for real-time notifications
 *
 * This endpoint maintains a persistent connection and pushes new notifications
 * to the client in real-time. Uses SSE instead of WebSocket for simplicity.
 *
 * Usage: EventSource('/api/notifications/stream')
 */
export async function GET(request: NextRequest) {
  // Verify authentication
  const authResult = await verifyAuth(request);
  if (!authResult.authenticated || !authResult.user) {
    return new Response("Unauthorized", { status: 401 });
  }

  const userId = authResult.user.id;

  // Set up SSE headers
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      // Send initial connection message
      const initialMessage = `data: ${JSON.stringify({
        type: "connected",
        timestamp: new Date().toISOString(),
      })}\n\n`;
      controller.enqueue(encoder.encode(initialMessage));

      let lastCheckedAt = new Date();
      let intervalId: NodeJS.Timeout;
      let pingIntervalId: NodeJS.Timeout;

      // Function to check for new notifications
      const checkNotifications = async () => {
        try {
          // Get unread notifications created since last check
          const newNotifications = await prisma.notification.findMany({
            where: {
              userId,
              createdAt: {
                gte: lastCheckedAt,
              },
            },
            orderBy: {
              createdAt: "desc",
            },
            take: 10,
          });

          // Send each notification
          for (const notification of newNotifications) {
            const message = `data: ${JSON.stringify({
              type: "notification",
              data: {
                id: notification.id,
                type: notification.type,
                title: notification.title,
                message: notification.message,
                link: notification.link,
                leaveId: notification.leaveId,
                read: notification.read,
                createdAt: notification.createdAt.toISOString(),
              },
            })}\n\n`;
            controller.enqueue(encoder.encode(message));
          }

          // Get updated unread count
          const unreadCount = await prisma.notification.count({
            where: {
              userId,
              read: false,
            },
          });

          // Send unread count update
          const countMessage = `data: ${JSON.stringify({
            type: "unread_count",
            count: unreadCount,
          })}\n\n`;
          controller.enqueue(encoder.encode(countMessage));

          lastCheckedAt = new Date();
        } catch (error) {
          console.error("Error checking notifications:", error);
        }
      };

      // Function to send ping (keep-alive)
      const sendPing = () => {
        try {
          const pingMessage = `: ping ${new Date().toISOString()}\n\n`;
          controller.enqueue(encoder.encode(pingMessage));
        } catch (error) {
          console.error("Error sending ping:", error);
        }
      };

      // Check for notifications every 3 seconds
      intervalId = setInterval(checkNotifications, 3000);

      // Send ping every 30 seconds to keep connection alive
      pingIntervalId = setInterval(sendPing, 30000);

      // Check immediately on connection
      await checkNotifications();

      // Cleanup on connection close
      request.signal.addEventListener("abort", () => {
        clearInterval(intervalId);
        clearInterval(pingIntervalId);
        controller.close();
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no", // Disable nginx buffering
    },
  });
}
