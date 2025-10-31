import AppShell from "@/components/app-shell";
import { LifeBuoy, MessageCircle, BookOpen, Mail } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function HelpPage() {
  return (
    <AppShell title="Help" pathname="/help">
      <div className="space-y-6">
        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h1 className="text-2xl font-semibold text-slate-900">Help Center</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Find answers to common questions and get support for using the leave management system
          </p>
        </section>
        <div className="grid gap-6 sm:grid-cols-2">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-blue-600" />
                <CardTitle>Documentation</CardTitle>
              </div>
              <CardDescription>User guides and tutorials</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Comprehensive guides on how to use the leave management system effectively.
              </p>
              <Button variant="outline" size="sm" disabled>
                View Documentation
              </Button>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <MessageCircle className="h-5 w-5 text-green-600" />
                <CardTitle>FAQs</CardTitle>
              </div>
              <CardDescription>Frequently asked questions</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Common questions and answers about leave policies and system usage.
              </p>
              <Button variant="outline" size="sm" disabled>
                Browse FAQs
              </Button>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Mail className="h-5 w-5 text-amber-600" />
                <CardTitle>Contact Support</CardTitle>
              </div>
              <CardDescription>Get in touch with our support team</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Reach out for technical assistance or questions about leave management.
              </p>
              <Button variant="outline" size="sm" disabled>
                Contact Support
              </Button>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <LifeBuoy className="h-5 w-5 text-purple-600" />
                <CardTitle>Quick Help</CardTitle>
              </div>
              <CardDescription>Quick tips and shortcuts</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Learn keyboard shortcuts and productivity tips to work faster.
              </p>
              <Button variant="outline" size="sm" disabled>
                Learn More
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
