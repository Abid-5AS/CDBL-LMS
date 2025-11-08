"use client";

import { useState } from "react";
import {
  Button,
  Textarea,
  Input,
  Label,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui";
import { toast } from "sonner";
import { Mail } from "lucide-react";

export function ContactSupport() {
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !message.trim()) {
      toast.error("Please fill in all fields");
      return;
    }

    setIsSubmitting(true);
    // In a real app, this would send to a backend
    setTimeout(() => {
      setIsSubmitting(false);
      toast.success("Support request submitted", {
        description: "We'll get back to you soon via email.",
      });
      setSubject("");
      setMessage("");
    }, 1000);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Mail className="h-5 w-5 text-data-warning" />
          <CardTitle>Contact Support</CardTitle>
        </div>
        <CardDescription>Get in touch with our support team</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="subject">Subject</Label>
            <Input
              id="subject"
              placeholder="What can we help you with?"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              disabled={isSubmitting}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="message">Message</Label>
            <Textarea
              id="message"
              placeholder="Describe your issue or question..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={5}
              disabled={isSubmitting}
            />
          </div>
          <div className="flex gap-2">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Sending..." : "Send Message"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                window.location.href = `mailto:hr@cdbl.com?subject=${encodeURIComponent(
                  subject
                )}&body=${encodeURIComponent(message)}`;
              }}
            >
              Open Email Client
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Or email us directly at:{" "}
            <a
              href="mailto:hr@cdbl.com"
              className="text-data-info dark:text-data-info hover:underline"
            >
              hr@cdbl.com
            </a>
          </p>
        </form>
      </CardContent>
    </Card>
  );
}
