import { Card, CardContent } from '@/components/ui/card';
import { Calendar as CalendarIcon } from 'lucide-react';

interface CalendarEventPreviewProps {
    title: string;
    startDate: Date;
    endDate: Date;
    description?: string;
}

export function CalendarEventPreview({ title, startDate, endDate, description }: CalendarEventPreviewProps) {
    return (
        <Card className="bg-muted/50 border-dashed">
            <CardContent className="p-4 flex items-start gap-4">
                <div className="bg-primary/10 p-2 rounded-md text-primary">
                    <CalendarIcon className="h-5 w-5" />
                </div>
                <div>
                    <h4 className="font-medium text-sm">{title}</h4>
                    <p className="text-xs text-muted-foreground mt-1">
                        {startDate.toLocaleDateString()} - {endDate.toLocaleDateString()}
                    </p>
                    {description && (
                        <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
                            {description}
                        </p>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
