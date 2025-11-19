import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function ActivityPanel() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="text-sm">
          <p className="font-medium text-[#0F172A]">Leave Approved</p>
          <p className="text-xs text-muted-foreground">Rahman approved your EL request</p>
        </div>
        <div className="text-sm">
          <p className="font-medium text-[#0F172A]">New Announcement</p>
          <p className="text-xs text-muted-foreground">HR shared the Q1 policy updates</p>
        </div>
        <div className="text-sm">
          <p className="font-medium text-[#0F172A]">Reminder</p>
          <p className="text-xs text-muted-foreground">Submit ML documents within 7 days</p>
        </div>
      </CardContent>
    </Card>
  );
}
