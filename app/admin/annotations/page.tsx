import { AnnotationsManager } from "@/components/admin/AnnotationsManager";

/**
 * Annotations Management Page
 *
 * Admin interface for toggling annotations and guides
 */
export const metadata = {
  title: "Annotations Manager | Admin",
  description: "Manage documentation features and guides",
};

export default function AnnotationsPage() {
  return (
    <div className="min-h-screen bg-background py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <AnnotationsManager />
      </div>
    </div>
  );
}
