import { Metadata } from "next";
import Link from "next/link";
import { AlertCircle, ArrowLeft, Mail } from "lucide-react";
import { Button } from "@/components/ui";

export const metadata: Metadata = {
  title: "Report an Issue | CDBL LMS",
  description: "Report technical issues or bugs with the leave management system",
};

export default function ReportIssuePage() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        <div className="surface-card p-8 sm:p-12 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-destructive/10 mb-6">
            <AlertCircle className="w-8 h-8 text-destructive" />
          </div>

          <h1 className="text-3xl font-bold text-foreground mb-4">
            Report an Issue
          </h1>

          <p className="text-muted-foreground mb-8">
            Found a bug or experiencing technical difficulties? A dedicated issue reporting
            form will be available here soon. For immediate technical assistance, please contact our support team.
          </p>

          <div className="space-y-4">
            <p className="text-sm font-medium text-foreground">
              Report issues via email:
            </p>
            <div className="flex flex-col gap-3 justify-center">
              <a
                href="mailto:itsupport@cdbl.com.bd?subject=LMS Issue Report"
                className="inline-flex items-center justify-center gap-2 text-primary hover:underline"
              >
                <Mail className="w-4 h-4" />
                IT Support: itsupport@cdbl.com.bd
              </a>
              <a
                href="mailto:support@cdbl.com.bd?subject=LMS Issue Report"
                className="inline-flex items-center justify-center gap-2 text-primary hover:underline"
              >
                <Mail className="w-4 h-4" />
                General Support: support@cdbl.com.bd
              </a>
            </div>
          </div>

          <div className="mt-8">
            <Link href="/dashboard">
              <Button variant="outline" leftIcon={<ArrowLeft className="w-4 h-4" />}>
                Back to Dashboard
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
