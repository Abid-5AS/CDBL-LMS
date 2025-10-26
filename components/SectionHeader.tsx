import { cn } from "@/lib/utils";

type SectionHeaderProps = {
  title: string;
  className?: string;
  children?: React.ReactNode;
};

export function SectionHeader({ title, className, children }: SectionHeaderProps) {
  return (
    <div className={cn("mb-4 flex items-center justify-between", className)}>
      <h2 className="text-xl font-semibold text-slate-800">{title}</h2>
      {children}
    </div>
  );
}
