import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Info } from "lucide-react";

interface DemoIndicatorProps {
  type?: "badge" | "tooltip";
  className?: string;
}

export function DemoIndicator({ type = "badge", className }: DemoIndicatorProps) {
  if (type === "tooltip") {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Info className={`h-4 w-4 text-muted-foreground cursor-help ${className}`} />
          </TooltipTrigger>
          <TooltipContent>
            <p>This is demo data for development purposes.</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <Badge variant="outline" className={`text-[10px] h-5 px-1.5 bg-muted/50 text-muted-foreground border-muted-foreground/30 ${className}`}>
      DEMO
    </Badge>
  );
}
