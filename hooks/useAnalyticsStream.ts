"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";

interface AnalyticsUpdate {
    type: "connected" | "stats_update" | "leave_approved" | "leave_requested";
    timestamp?: string;
    data?: any;
}

export function useAnalyticsStream() {
    const [isConnected, setIsConnected] = useState(false);
    const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

    useEffect(() => {
        let eventSource: EventSource | null = null;

        const connect = () => {
            eventSource = new EventSource("/api/analytics/stream");

            eventSource.onopen = () => {
                setIsConnected(true);
                console.log("Analytics stream connected");
            };

            eventSource.onmessage = (event) => {
                try {
                    const data: AnalyticsUpdate = JSON.parse(event.data);

                    if (data.type === "stats_update") {
                        setLastUpdate(new Date());
                        // Optionally trigger SWR revalidation here if we had access to mutate
                        // For now, we just expose the lastUpdate timestamp so components can react
                    }
                } catch (error) {
                    console.error("Error parsing SSE message:", error);
                }
            };

            eventSource.onerror = (error) => {
                console.error("Analytics stream error:", error);
                setIsConnected(false);
                eventSource?.close();

                // Retry connection after 5 seconds
                setTimeout(connect, 5000);
            };
        };

        connect();

        return () => {
            if (eventSource) {
                eventSource.close();
            }
        };
    }, []);

    return { isConnected, lastUpdate };
}
