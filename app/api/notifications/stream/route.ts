import { getCurrentUser } from "@/lib/auth";
import { notificationEvents, NOTIFICATION_EVENT } from "@/lib/events";
import { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const user = await getCurrentUser();

  if (!user) {
    return new Response("Unauthorized", { status: 401 });
  }

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      // Send initial connection message
      controller.enqueue(encoder.encode("event: connected\ndata: connected\n\n"));

      // Event listener
      const onNotification = (data: any) => {
        // Only send notifications meant for this user
        if (data.userId === user.id) {
          const payload = JSON.stringify(data);
          controller.enqueue(encoder.encode(`data: ${payload}\n\n`));
        }
      };

      // Subscribe to events
      notificationEvents.on(NOTIFICATION_EVENT, onNotification);

      // Keep-alive interval to prevent timeout
      const keepAlive = setInterval(() => {
        controller.enqueue(encoder.encode(": keep-alive\n\n"));
      }, 30000);

      // Cleanup on close
      req.signal.addEventListener("abort", () => {
        clearInterval(keepAlive);
        notificationEvents.off(NOTIFICATION_EVENT, onNotification);
        controller.close();
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
    },
  });
}
