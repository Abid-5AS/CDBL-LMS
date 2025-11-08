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
    <div className="rounded-lg border border-border-strong/50 dark:border-border-strong/50 backdrop-blur-xl bg-bg-primary/70 dark:bg-bg-secondary/70 p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-text-secondary dark:text-text-secondary">Profile</h3>
        <span className="text-xs font-medium text-data-info dark:text-data-info">{name}</span>
      </div>
      <dl className="grid gap-x-6 gap-y-3 lg:grid-cols-2">
        {FIELDS.map((field) => (
          <div key={field.key}>
            <dt className="text-xs font-medium uppercase tracking-[0.08em] text-muted-foreground">
              {field.label}
            </dt>
            <dd className={cn("mt-1 text-sm text-text-secondary dark:text-text-secondary", field.key === "email" && "font-medium")}
            >
              {values[field.key]}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
