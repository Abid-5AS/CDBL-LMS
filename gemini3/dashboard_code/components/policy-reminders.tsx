import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function PolicyReminders() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Policy Reminders</CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="list-disc pl-4 space-y-2 text-sm text-[#475569]">
          <li>CL: ≤ 3 consecutive days; cap 10/year.</li>
          <li>ML: &gt;3 days certificate required.</li>
          <li>EL: accrues 2 days/month; carry ≤ 60.</li>
        </ul>
      </CardContent>
    </Card>
  );
}
