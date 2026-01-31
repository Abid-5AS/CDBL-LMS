"use client";

import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useSWRConfig } from "swr";

interface NotificationEvent {
  id: number;
  title: string;
  message: string;
  link?: string;
  type: string;
}

export function useNotificationStream() {
  const router = useRouter();
  const { mutate } = useSWRConfig();
  const eventSourceRef = useRef<EventSource | null>(null);

  useEffect(() => {
    // Only connect if not already connected
    if (!eventSourceRef.current) {
      const eventSource = new EventSource("/api/notifications/stream");
      eventSourceRef.current = eventSource;

      eventSource.onopen = () => {
        console.log("Notification stream connected");
      };

      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data) as NotificationEvent;
          
          // Show toast
          toast(data.title, {
            description: data.message,
            action: data.link
              ? {
                  label: "View",
                  onClick: () => router.push(data.link!),
                }
              : undefined,
          });

          // Revalidate notifications query
          mutate("/api/notifications/latest");
          mutate("/api/notifications/unread-count");
          
        } catch (error) {
          console.error("Error parsing notification event:", error);
        }
      };

      eventSource.onerror = (error) => {
        console.error("Notification stream error:", error);
        eventSource.close();
        
        // Attempt reconnect after delay
        setTimeout(() => {
          if (eventSourceRef.current === eventSource) {
            eventSourceRef.current = null;
            // Trigger re-render/re-effect to reconnect
            // In this simple implementation, we just let the effect cleanup and rely on parent re-renders or manual refresh
            // For more robust reconnect, we'd need a state variable
          }
        }, 5000);
      };
    }

    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
    };
  }, [mutate, router]);
}
