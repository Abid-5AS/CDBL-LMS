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
  const {
    name,
    email,
    department,
    designation,
    manager,
    joiningDate,
    employmentStatus,
  } = props;

  const values: Record<string, string> = {
    email: email ?? "—",
    department: department ?? "—",
    designation: designation ?? "—",
    manager: manager ?? "—",
    joiningDate: joiningDate ? formatDate(joiningDate) : "—",
    employmentStatus: employmentStatus ?? "Active",
  };

  return (
    <div className="neo-card rounded-2xl border border-[var(--shell-card-border)] bg-[var(--color-card-elevated)] p-6 shadow-[var(--shadow-1)]">
      <div className="mb-5 pb-4 flex items-center justify-between border-b border-[var(--shell-card-border)]">
        <h3 className="text-[0.7rem] font-semibold uppercase tracking-[0.12em] text-[var(--color-text-secondary)]">
          Profile
        </h3>
        <span className="text-sm font-semibold text-[rgb(91,94,252)]">
          {name}
        </span>
      </div>
      <dl className="grid gap-x-8 gap-y-4 lg:grid-cols-2">
        {FIELDS.map((field) => (
          <div key={field.key} className="group">
            <dt className="text-[0.7rem] font-semibold uppercase tracking-[0.12em] text-[var(--color-text-secondary)]">
              {field.label}
            </dt>
            <dd
              className={cn(
                "mt-2 text-sm text-[var(--color-text-primary)] transition-colors",
                field.key === "email" && "font-medium text-[rgb(91,94,252)]"
              )}
            >
              {values[field.key]}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
