"use client";

import { useState, useEffect } from "react";
import { Clock, Calendar as CalendarIcon } from "lucide-react";
import { formatDate } from "@/lib/utils";

export function LiveClock() {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    // Update time every second
    const timeInterval = setInterval(() => {
      setTime(new Date());
    }, 1000);

    return () => clearInterval(timeInterval);
  }, []);

  const formattedTime = time.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });

  const formattedDate = formatDate(time);

  return (
    <div className="flex items-center gap-2 px-3 py-1.5 glass-light rounded-lg text-xs glass-nav-text shrink-0 transition-all hover:bg-white/80 dark:hover:bg-white/5">
      <div className="flex items-center gap-1.5">
        <Clock className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
        <span className="font-mono font-medium">{formattedTime}</span>
      </div>
      <span className="text-muted-foreground/50">|</span>
      <div className="flex items-center gap-1.5">
        <CalendarIcon className="h-3.5 w-3.5 text-slate-600 dark:text-slate-400" />
        <span className="font-medium">{formattedDate}</span>
      </div>
    </div>
  );
}
