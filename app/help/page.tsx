import { LifeBuoy, BookOpen } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Button,
} from "@/components/ui";
import Link from "next/link";
import { FAQAccordion } from "./components/FAQAccordion";
import { ContactSupport } from "./components/ContactSupport";

const KEYBOARD_SHORTCUTS = [
  { key: "Ctrl/Cmd + K", description: "Open search (if available)" },
  { key: "Esc", description: "Close dialogs and modals" },
  { key: "/", description: "Focus search input" },
];

export default function HelpPage() {
  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-border-strong dark:border-border-strong bg-bg-primary dark:bg-bg-secondary p-6 shadow-sm">
        <h1 className="text-2xl font-semibold text-foreground">
          Help Center
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Find answers to common questions and get support for using the leave
          management system
        </p>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-data-info dark:text-data-info" />
              <CardTitle>Documentation</CardTitle>
            </div>
            <CardDescription>User guides and tutorials</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Comprehensive guides on how to use the leave management system
              effectively.
            </p>
            <Button variant="outline" size="sm" asChild>
              <Link href="/policies">View Policies</Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <LifeBuoy className="h-5 w-5 text-card-summary dark:text-card-summary" />
              <CardTitle>Quick Help</CardTitle>
            </div>
            <CardDescription>Keyboard shortcuts and tips</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 mb-4">
              {KEYBOARD_SHORTCUTS.map((shortcut, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between text-sm"
                >
                  <span className="text-muted-foreground">
                    {shortcut.description}
                  </span>
                  <kbd className="px-2 py-1 text-xs font-semibold bg-bg-secondary dark:bg-bg-secondary border border-border-strong dark:border-border-strong rounded">
                    {shortcut.key}
                  </kbd>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Frequently Asked Questions</CardTitle>
          <CardDescription>
            Common questions and answers about leave policies and system usage
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FAQAccordion />
        </CardContent>
      </Card>

      <ContactSupport />
    </div>
  );
}
