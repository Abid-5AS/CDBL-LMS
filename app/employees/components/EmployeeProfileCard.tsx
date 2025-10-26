import { SectionHeader } from "@/components/SectionHeader";
import { cn, formatDate } from "@/lib/utils";

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

export function EmployeeProfileCard(props: EmployeeProfileCardProps) {
  const { name, email, department, designation, manager, joiningDate, employmentStatus } = props;

  const values: Record<string, string> = {
    email: email ?? "—",
    department: department ?? "—",
    designation: designation ?? "—",
    manager: manager ?? "—",
    joiningDate: joiningDate ? formatDate(joiningDate) : "—",
    employmentStatus: employmentStatus ?? "Active",
  };

  return (
    <div className="space-y-4">
      <SectionHeader title="Employee Profile">
        <span className="text-sm font-semibold text-blue-600">{name}</span>
      </SectionHeader>
      <dl className="grid gap-x-8 gap-y-4 lg:grid-cols-2">
        {FIELDS.map((field) => (
          <div key={field.key}>
            <dt className="text-xs font-medium uppercase tracking-[0.08em] text-muted-foreground">
              {field.label}
            </dt>
            <dd className={cn("mt-1 text-sm text-slate-900", field.key === "email" && "font-medium")}
            >
              {values[field.key]}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
