import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDate } from "@/lib/utils";

type EmployeeProfileCardProps = {
  name: string;
  email: string;
  department?: string | null;
  designation?: string | null;
  manager?: string | null;
  joiningDate?: string | null;
  employmentStatus?: string | null;
};

const FIELDS = [
  { key: "email", label: "Email" },
  { key: "department", label: "Department" },
  { key: "designation", label: "Designation" },
  { key: "manager", label: "Reporting Manager" },
  { key: "joiningDate", label: "Joining Date" },
  { key: "employmentStatus", label: "Status" },
] as const;

export function EmployeeProfileCard({
  name,
  email,
  department,
  designation,
  manager,
  joiningDate,
  employmentStatus,
}: EmployeeProfileCardProps) {
  const values: Record<string, string> = {
    email: email ?? "—",
    department: department ?? "—",
    designation: designation ?? "—",
    manager: manager ?? "—",
    joiningDate: joiningDate ? formatDate(joiningDate) : "—",
    employmentStatus: employmentStatus ?? "Active",
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-slate-900">{name}</CardTitle>
      </CardHeader>
      <CardContent>
        <dl className="grid gap-x-6 gap-y-4 sm:grid-cols-2">
          {FIELDS.map((field) => (
            <div key={field.key}>
              <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{field.label}</dt>
              <dd className="mt-1 text-sm text-slate-900">{values[field.key]}</dd>
            </div>
          ))}
        </dl>
      </CardContent>
    </Card>
  );
}
