import { Card } from "@/components/ui/card";

async function getCount() {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL?.replace(/\/$/, "");
  const endpoint = `${baseUrl ?? ""}/api/approvals`;
  try {
    const res = await fetch(endpoint.startsWith("/api") ? "/api/approvals" : endpoint, {
      cache: "no-store",
    });
    if (!res.ok) return 0;
    const data = await res.json();
    return Array.isArray(data.items) ? data.items.length : 0;
  } catch {
    return 0;
  }
}

export default async function PendingApprovalsCard() {
  const count = await getCount();

  return (
    <Card className="px-6 py-4">
      <div className="text-sm text-muted-foreground">Pending Approvals</div>
      <div className="mt-2 text-3xl font-semibold text-foreground">{count}</div>
      <div className="mt-1 text-xs text-muted-foreground">Items requiring your review</div>
    </Card>
  );
}
