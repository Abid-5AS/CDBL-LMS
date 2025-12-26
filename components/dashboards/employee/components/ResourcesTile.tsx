import { FileText, Calendar as CalendarIcon, Download, ExternalLink } from "lucide-react";
import { Button, Card, CardContent, CardHeader, CardTitle } from "@/components/ui";

export function ResourcesTile() {
    return (
        <Card className="rounded-[20px] border border-outline/60 dark:border-border/60 bg-surface-1 shadow-md h-full">
            <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                    Resources
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
                {/* Policy PDF */}
                <div className="group flex items-center justify-between p-3 rounded-lg border border-border/40 hover:border-border bg-card hover:bg-muted/40 transition-all cursor-pointer">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-600 dark:text-blue-400">
                            <FileText className="h-5 w-5" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-foreground">Leave Policy</p>
                            <p className="text-xs text-muted-foreground">PDF • 2.4 MB</p>
                        </div>
                    </div>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground group-hover:text-foreground">
                        <Download className="h-4 w-4" />
                    </Button>
                </div>

                {/* Holiday Calendar */}
                <div className="group flex items-center justify-between p-3 rounded-lg border border-border/40 hover:border-border bg-card hover:bg-muted/40 transition-all cursor-pointer">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center text-amber-600 dark:text-amber-400">
                            <CalendarIcon className="h-5 w-5" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-foreground">Holiday List</p>
                            <p className="text-xs text-muted-foreground">{new Date().getFullYear()} Calendar</p>
                        </div>
                    </div>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground group-hover:text-foreground">
                        <ExternalLink className="h-4 w-4" />
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}
