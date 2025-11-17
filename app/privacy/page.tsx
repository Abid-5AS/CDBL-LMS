import { Metadata } from "next";
import Link from "next/link";
import { Shield, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui";

export const metadata: Metadata = {
  title: "Privacy Policy | CDBL LMS",
  description: "Privacy policy for CDBL Leave Management System",
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        <div className="surface-card p-8 sm:p-12 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-6">
            <Shield className="w-8 h-8 text-primary" />
          </div>

          <h1 className="text-3xl font-bold text-foreground mb-4">
            Privacy Policy
          </h1>

          <p className="text-muted-foreground mb-8">
            This section is currently under development. Our comprehensive privacy policy
            will be available here soon, detailing how we collect, use, and protect your personal information.
          </p>

          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              For privacy-related questions, please contact:
            </p>
            <div className="flex flex-col gap-3 justify-center">
              <a
                href="mailto:hr@cdbl.com.bd"
                className="text-sm text-primary hover:underline"
              >
                HR Department: hr@cdbl.com.bd
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
