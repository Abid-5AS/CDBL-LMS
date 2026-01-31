'use client';

import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useState } from 'react';
import { toast } from 'sonner';

interface CalendarSyncToggleProps {
    initialEnabled: boolean;
    userId: string;
}

export function CalendarSyncToggle({ initialEnabled, userId }: CalendarSyncToggleProps) {
    const [enabled, setEnabled] = useState(initialEnabled);
    const [isLoading, setIsLoading] = useState(false);

    const handleToggle = async (checked: boolean) => {
        setEnabled(checked);
        setIsLoading(true);
        // TODO: Implement API to update user preferences
        // For now, just simulating
        try {
            // await updatePreference(userId, 'enableCalendarSync', checked);
            toast.success(`Calendar sync ${checked ? 'enabled' : 'disabled'}`);
        } catch (error) {
            setEnabled(!checked); // Revert
            toast.error('Failed to update preference');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex items-center space-x-2">
            <Switch 
                id="calendar-sync" 
                checked={enabled} 
                onCheckedChange={handleToggle} 
                disabled={isLoading}
            />
            <Label htmlFor="calendar-sync">Auto-sync approved leaves</Label>
        </div>
    );
}
