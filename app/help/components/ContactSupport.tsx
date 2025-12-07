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
import { Mail, Send, ExternalLink } from "lucide-react";

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
    <Card className="border-border/50 shadow-md bg-gradient-to-br from-card to-muted/20">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-orange-500/10 text-orange-600 dark:text-orange-400">
            <Mail className="h-5 w-5" />
          </div>
          <div>
             <CardTitle className="text-xl">Contact Support</CardTitle>
             <CardDescription>Get in touch with our HR team directly.</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="subject" className="text-sm font-medium text-foreground/80">Subject</Label>
            <Input
              id="subject"
              placeholder="Briefly describe your issue..."
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              disabled={isSubmitting}
              className="bg-background/50 focus:bg-background transition-colors"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="message" className="text-sm font-medium text-foreground/80">Message</Label>
            <Textarea
              id="message"
              placeholder="Provide more details so we can help you faster..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={4}
              disabled={isSubmitting}
               className="bg-background/50 focus:bg-background transition-colors resize-none"
            />
          </div>
          <div className="flex gap-3 pt-2">
            <Button type="submit" disabled={isSubmitting} className="flex-1 gap-2 shadow-sm">
              <Send className="w-4 h-4" />
              {isSubmitting ? "Sending..." : "Send Message"}
            </Button>
            <Button
              type="button"
              variant="outline"
              className="gap-2"
              onClick={() => {
                window.location.href = `mailto:hr@cdbl.com?subject=${encodeURIComponent(
                  subject
                )}&body=${encodeURIComponent(message)}`;
              }}
            >
              Open Email App
              <ExternalLink className="w-3.5 h-3.5 opacity-70" />
            </Button>
          </div>
          <div className="text-center pt-2">
             <p className="text-xs text-muted-foreground">
            Direct email:{" "}
            <a
              href="mailto:hr@cdbl.com"
              className="text-primary hover:text-primary/80 font-medium transition-colors hover:underline"
            >
              hr@cdbl.com
            </a>
          </p>
          </div>
         
        </form>
      </CardContent>
    </Card>
  );
}
