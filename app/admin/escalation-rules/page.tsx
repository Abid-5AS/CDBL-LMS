import { Metadata } from "next";
import { redirect } from "next/navigation";

import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { EscalationRules } from "@/components/admin/EscalationRules";
import { SectionHeader } from "@/components/SectionHeader";

export const metadata: Metadata = {
  title: "Escalation Rules | Admin",
  description: "Manage auto-escalation rules",
};

export default async function EscalationRulesPage() {
  const user = await getCurrentUser();

  if (!user || !["HR_ADMIN", "SYSTEM_ADMIN", "CEO"].includes(user.role)) {
    redirect("/dashboard");
  }

  const rules = await prisma.escalationRule.findMany({
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Auto-Escalation Rules"
        description="Configure rules to automatically escalate overdue leave requests."
      />
      
      <EscalationRules rules={rules} />
    </div>
  );
}
