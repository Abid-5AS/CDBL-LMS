import { Metadata } from "next";
import Link from "next/link";
import { MessageSquare, ArrowLeft, Mail } from "lucide-react";
import { Button } from "@/components/ui";

export const metadata: Metadata = {
  title: "Send Feedback | CDBL LMS",
  description: "Share your feedback about the leave management system",
};

export default function FeedbackPage() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        <div className="surface-card p-8 sm:p-12 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-6">
            <MessageSquare className="w-8 h-8 text-primary" />
          </div>

          <h1 className="text-3xl font-bold text-foreground mb-4">
            Send Feedback
          </h1>

          <p className="text-muted-foreground mb-8">
            We value your feedback! A feedback form will be available here soon.
            In the meantime, please send your suggestions directly to our team.
          </p>

          <div className="space-y-4">
            <p className="text-sm font-medium text-foreground">
              Send your feedback via email:
            </p>
            <div className="flex flex-col gap-3 justify-center">
              <a
                href="mailto:feedback@cdbl.com.bd?subject=LMS Feedback"
                className="inline-flex items-center justify-center gap-2 text-primary hover:underline"
              >
                <Mail className="w-4 h-4" />
                feedback@cdbl.com.bd
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
