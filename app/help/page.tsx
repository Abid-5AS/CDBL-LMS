"use client";

import { LifeBuoy, BookOpen, Search, Command, Keyboard } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Button,
  Input,
} from "@/components/ui";
import Link from "next/link";
import { FAQAccordion } from "./components/FAQAccordion";
import { ContactSupport } from "./components/ContactSupport";

const KEYBOARD_SHORTCUTS = [
  { key: "Ctrl/Cmd + K", description: "Open search" },
  { key: "/", description: "Focus search" },
  { key: "Esc", description: "Close dialogs" },
];

export default function HelpPage() {
  return (
    <div className="flex flex-col gap-8 max-w-6xl mx-auto pb-10">
      
      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-3xl bg-primary/5 dark:bg-primary/10 border border-primary/10 p-8 md:p-12 text-center space-y-4">
        <div className="absolute inset-0 bg-grid-white/10 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))] dark:bg-grid-black/10 dark:[mask-image:linear-gradient(0deg,rgba(255,255,255,0.1),rgba(255,255,255,0.5))]" />
        
        <div className="relative z-10 mx-auto max-w-2xl space-y-6">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground">
            How can we help you today?
          </h1>
          <p className="text-muted-foreground text-lg">
            Search for policies, leave types, or quick answers to your questions.
          </p>
          
          <div className="relative max-w-lg mx-auto">
            <Search className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
             <Input 
              className="pl-10 h-11 bg-background/80 backdrop-blur-sm border-primary/20 focus:border-primary/50 shadow-sm text-base" 
              placeholder="Search help articles..." 
            />
            <div className="absolute right-3 top-2.5 hidden sm:flex items-center gap-1 text-xs text-muted-foreground bg-muted/50 px-1.5 py-0.5 rounded border border-border/50">
              <Command className="w-3 h-3" />
              <span>K</span>
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Main Content Column */}
        <div className="lg:col-span-2 space-y-8">
           <section className="space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-border/50">
                 <LifeBuoy className="h-5 w-5 text-primary" />
                 <h2 className="text-xl font-semibold">Frequently Asked Questions</h2>
              </div>
              <FAQAccordion />
           </section>

           <section className="space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-border/50">
                 <BookOpen className="h-5 w-5 text-primary" />
                 <h2 className="text-xl font-semibold">Documentation & Policies</h2>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                 <Card className="hover:border-primary/50 transition-colors cursor-pointer group">
                    <CardHeader>
                       <CardTitle className="group-hover:text-primary transition-colors text-lg">Leave Policy Handbook</CardTitle>
                       <CardDescription>Comprehensive guide to all leave types</CardDescription>
                    </CardHeader>
                 </Card>
                  <Card className="hover:border-primary/50 transition-colors cursor-pointer group">
                    <CardHeader>
                       <CardTitle className="group-hover:text-primary transition-colors text-lg">Approval Workflow</CardTitle>
                       <CardDescription>Understanding the 3-step approval process</CardDescription>
                    </CardHeader>
                 </Card>
              </div>
           </section>
        </div>

        {/* Sidebar Column */}
        <div className="space-y-6">
          <ContactSupport />
          
          <Card className="border-border/50 shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Keyboard className="h-5 w-5 text-muted-foreground" />
                <CardTitle className="text-base">Keyboard Shortcuts</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
               <div className="space-y-3">
                {KEYBOARD_SHORTCUTS.map((shortcut, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between text-sm"
                  >
                    <span className="text-muted-foreground">
                      {shortcut.description}
                    </span>
                    <kbd className="px-2 py-1 text-xs font-mono font-medium bg-muted text-muted-foreground border border-border rounded shadow-sm">
                      {shortcut.key}
                    </kbd>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
