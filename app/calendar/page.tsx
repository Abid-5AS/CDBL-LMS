import { CalendarConnectionCard } from '@/components/calendar/CalendarConnectionCard';
import { CalendarSyncToggle } from '@/components/calendar/CalendarSyncToggle';
import { prisma } from '@/lib/prisma';
import { CalendarProvider } from '@prisma/client';
import { Calendar } from '@/components/ui/calendar'; // Assuming shadcn calendar
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

// Mock user ID retrieval - replace with actual session logic
const getUserId = () => "1"; 

export default async function CalendarPage() {
    const userId = getUserId();
    
    const calendarConfigs = await prisma.calendarConfig.findMany({
        where: { userId: parseInt(userId) },
    });

    const googleConfig = calendarConfigs.find(c => c.provider === CalendarProvider.GOOGLE);
    const outlookConfig = calendarConfigs.find(c => c.provider === CalendarProvider.OUTLOOK);

    // Fetch leaves for calendar display (simplified)
    const leaves = await prisma.leaveRequest.findMany({
        where: { 
            requesterId: parseInt(userId),
            status: { in: ['APPROVED', 'PENDING'] }
        },
    });

    return (
        <div className="container mx-auto py-8 space-y-8">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold">Calendar & Sync</h1>
                <CalendarSyncToggle initialEnabled={true} userId={userId} />
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-6">
                    <h2 className="text-xl font-semibold">Connections</h2>
                    <div className="grid gap-4">
                        <CalendarConnectionCard 
                            provider="GOOGLE_CALENDAR" 
                            isConnected={!!googleConfig?.isActive} 
                            lastSyncedAt={googleConfig?.lastSyncAt}
                            userId={userId}
                        />
                        <CalendarConnectionCard 
                            provider="OUTLOOK" 
                            isConnected={!!outlookConfig?.isActive} 
                            lastSyncedAt={outlookConfig?.lastSyncAt}
                            userId={userId}
                        />
                    </div>
                </div>

                <div className="space-y-6">
                    <h2 className="text-xl font-semibold">Your Leave Calendar</h2>
                    <Card>
                        <CardContent className="p-4">
                            {/* Placeholder for full calendar component */}
                            <Calendar 
                                mode="multiple"
                                selected={leaves.map(l => l.startDate)}
                                className="rounded-md border"
                            />
                            <p className="text-sm text-muted-foreground mt-4 text-center">
                                {leaves.length} upcoming leaves scheduled
                            </p>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
