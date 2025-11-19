'use client';

/**
 * Color System Test Component
 * This component demonstrates all semantic colors in both light and dark modes
 * for testing and verification purposes.
 */

export default function ColorSystemTest() {
  return (
    <div className="p-6 space-y-8 bg-bg-primary">
      <h1 className="text-2xl font-bold text-text-primary">Color System Test</h1>
      
      {/* Text Colors */}
      <section>
        <h2 className="text-lg font-semibold text-text-primary mb-4">Text Colors</h2>
        <div className="space-y-2">
          <p className="text-text-primary">Primary text - Main headings and content</p>
          <p className="text-text-secondary">Secondary text - Labels and metadata</p>
          <p className="text-text-tertiary">Tertiary text - Placeholders and disabled</p>
          <p className="text-text-muted">Muted text - Subtle information</p>
          <p className="bg-bg-inverted text-text-inverted p-2 rounded">Inverted text - On dark backgrounds</p>
        </div>
      </section>

      {/* Background Colors */}
      <section>
        <h2 className="text-lg font-semibold text-text-primary mb-4">Background Colors</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div className="bg-bg-primary border border-bg-muted p-4 rounded">
            <p className="text-text-primary">Primary Background</p>
          </div>
          <div className="bg-bg-secondary p-4 rounded">
            <p className="text-text-primary">Secondary Background</p>
          </div>
          <div className="bg-bg-tertiary p-4 rounded">
            <p className="text-text-primary">Tertiary Background</p>
          </div>
          <div className="bg-bg-inverted text-text-inverted p-4 rounded">
            <p>Inverted Background</p>
          </div>
          <div className="bg-bg-muted p-4 rounded">
            <p className="text-text-primary">Muted Background</p>
          </div>
        </div>
      </section>

      {/* Leave Types */}
      <section>
        <h2 className="text-lg font-semibold text-text-primary mb-4">Leave Type Colors</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div className="bg-leave-sick/10 border border-leave-sick/20 p-4 rounded">
            <p className="text-leave-sick font-medium">Sick Leave</p>
          </div>
          <div className="bg-leave-casual/10 border border-leave-casual/20 p-4 rounded">
            <p className="text-leave-casual font-medium">Casual Leave</p>
          </div>
          <div className="bg-leave-earned/10 border border-leave-earned/20 p-4 rounded">
            <p className="text-leave-earned font-medium">Earned Leave</p>
          </div>
          <div className="bg-leave-unpaid/10 border border-leave-unpaid/20 p-4 rounded">
            <p className="text-leave-unpaid font-medium">Unpaid Leave</p>
          </div>
          <div className="bg-leave-maternity/10 border border-leave-maternity/20 p-4 rounded">
            <p className="text-leave-maternity font-medium">Maternity Leave</p>
          </div>
          <div className="bg-leave-paternity/10 border border-leave-paternity/20 p-4 rounded">
            <p className="text-leave-paternity font-medium">Paternity Leave</p>
          </div>
        </div>
      </section>

      {/* Data States */}
      <section>
        <h2 className="text-lg font-semibold text-text-primary mb-4">Data State Colors</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-data-success/10 border border-data-success/20 p-4 rounded">
            <p className="text-data-success font-medium">Success</p>
          </div>
          <div className="bg-data-warning/10 border border-data-warning/20 p-4 rounded">
            <p className="text-data-warning font-medium">Warning</p>
          </div>
          <div className="bg-data-error/10 border border-data-error/20 p-4 rounded">
            <p className="text-data-error font-medium">Error</p>
          </div>
          <div className="bg-data-info/10 border border-data-info/20 p-4 rounded">
            <p className="text-data-info font-medium">Info</p>
          </div>
        </div>
      </section>

      {/* Data Intensities */}
      <section>
        <h2 className="text-lg font-semibold text-text-primary mb-4">
          Data Color Intensities
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            {
              label: "Info Soft",
              className: "bg-data-info-soft text-data-info border-data-info/30",
            },
            {
              label: "Info Strong",
              className: "bg-data-info-strong text-text-inverted border-data-info-strong/40",
            },
            {
              label: "Success Soft",
              className:
                "bg-data-success-soft text-data-success border-data-success/30",
            },
            {
              label: "Success Strong",
              className:
                "bg-data-success-strong text-text-inverted border-data-success-strong/40",
            },
            {
              label: "Warning Soft",
              className:
                "bg-data-warning-soft text-data-warning border-data-warning/30",
            },
            {
              label: "Warning Strong",
              className:
                "bg-data-warning-strong text-text-inverted border-data-warning-strong/40",
            },
            {
              label: "Error Soft",
              className:
                "bg-data-error-soft text-data-error border-data-error/30",
            },
            {
              label: "Error Strong",
              className:
                "bg-data-error-strong text-text-inverted border-data-error-strong/40",
            },
          ].map((item) => (
            <div
              key={item.label}
              className={`${item.className} p-4 rounded border`}
            >
              <p className="font-medium">{item.label}</p>
              <p className="text-text-secondary text-sm">
                {item.label.includes("Soft")
                  ? "Muted surfaces"
                  : "High-contrast surfaces"}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* UI States */}
      <section>
        <h2 className="text-lg font-semibold text-text-primary mb-4">UI State Colors</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div className="bg-status-draft/10 border border-status-draft/20 p-4 rounded">
            <p className="text-status-draft font-medium">Draft</p>
          </div>
          <div className="bg-status-submitted/10 border border-status-submitted/20 p-4 rounded">
            <p className="text-status-submitted font-medium">Submitted</p>
          </div>
          <div className="bg-status-approved/10 border border-status-approved/20 p-4 rounded">
            <p className="text-status-approved font-medium">Approved</p>
          </div>
          <div className="bg-status-rejected/10 border border-status-rejected/20 p-4 rounded">
            <p className="text-status-rejected font-medium">Rejected</p>
          </div>
          <div className="bg-status-returned/10 border border-status-returned/20 p-4 rounded">
            <p className="text-status-returned font-medium">Returned</p>
          </div>
          <div className="bg-status-cancelled/10 border border-status-cancelled/20 p-4 rounded">
            <p className="text-status-cancelled font-medium">Cancelled</p>
          </div>
        </div>
      </section>

      {/* Card Types */}
      <section>
        <h2 className="text-lg font-semibold text-text-primary mb-4">Card Type Colors</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-card-kpi/10 border border-card-kpi/20 p-4 rounded">
            <p className="text-card-kpi font-medium">KPI Card</p>
            <p className="text-text-secondary text-sm mt-1">For metrics and performance data</p>
          </div>
          <div className="bg-card-action/10 border border-card-action/20 p-4 rounded">
            <p className="text-card-action font-medium">Action Card</p>
            <p className="text-text-secondary text-sm mt-1">For interactive elements</p>
          </div>
          <div className="bg-card-summary/10 border border-card-summary/20 p-4 rounded">
            <p className="text-card-summary font-medium">Summary Card</p>
            <p className="text-text-secondary text-sm mt-1">For overview information</p>
          </div>
        </div>
      </section>

      {/* Theme Toggle Instructions */}
      <section className="bg-bg-secondary p-4 rounded">
        <h2 className="text-lg font-semibold text-text-primary mb-2">Testing Instructions</h2>
        <p className="text-text-secondary">
          Toggle between light and dark mode to verify all colors have proper contrast 
          and maintain their semantic meaning across themes.
        </p>
      </section>
    </div>
  );
}
