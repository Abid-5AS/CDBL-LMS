"use client";

import Link from "next/link";
import { Mail, Phone, ExternalLink } from "lucide-react";

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-border bg-background/50">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4 mb-8">
          {/* Resources Section */}
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-4 uppercase tracking-wide">
              Resources
            </h3>
            <ul className="space-y-3">
              <li>
                <Link
                  href="/policies"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Leave Policies
                </Link>
              </li>
              <li>
                <Link
                  href="/faq"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  FAQ
                </Link>
              </li>
              <li>
                <Link
                  href="/guidelines"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Leave Guidelines
                </Link>
              </li>
              <li>
                <Link
                  href="/holidays"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Holiday Calendar
                </Link>
              </li>
            </ul>
          </div>

          {/* Company Section */}
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-4 uppercase tracking-wide">
              Company
            </h3>
            <ul className="space-y-3">
              <li>
                <a
                  href="https://cdbl.com.bd/about/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
                >
                  About CDBL
                  <ExternalLink className="h-3 w-3" />
                </a>
              </li>
              <li>
                <a
                  href="https://cdbl.com.bd/contact/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
                >
                  Contact Us
                  <ExternalLink className="h-3 w-3" />
                </a>
              </li>
              <li>
                <a
                  href="https://cdbl.com.bd/careers/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
                >
                  Careers
                  <ExternalLink className="h-3 w-3" />
                </a>
              </li>
              <li>
                <a
                  href="https://cdbl.com.bd/news-events/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
                >
                  News & Events
                  <ExternalLink className="h-3 w-3" />
                </a>
              </li>
            </ul>
          </div>

          {/* Support Section */}
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-4 uppercase tracking-wide">
              Support
            </h3>
            <ul className="space-y-3">
              <li>
                <Link
                  href="/help"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Help Center
                </Link>
              </li>
              <li>
                <Link
                  href="/feedback"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Send Feedback
                </Link>
              </li>
              <li>
                <Link
                  href="/report-issue"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Report an Issue
                </Link>
              </li>
              <li>
                <a
                  href="mailto:support@cdbl.com.bd"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
                >
                  <Mail className="h-3.5 w-3.5" />
                  Contact Support
                </a>
              </li>
            </ul>
          </div>

          {/* Quick Links Section */}
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-4 uppercase tracking-wide">
              Quick Links
            </h3>
            <ul className="space-y-3">
              <li>
                <a
                  href="https://cdbl.com.bd"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
                >
                  Main Website
                  <ExternalLink className="h-3 w-3" />
                </a>
              </li>
              <li>
                <a
                  href="https://cdbl.com.bd/e-services/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
                >
                  E-Services
                  <ExternalLink className="h-3 w-3" />
                </a>
              </li>
              <li>
                <a
                  href="mailto:hr@cdbl.com.bd"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
                >
                  <Mail className="h-3.5 w-3.5" />
                  HR Department
                </a>
              </li>
              <li>
                <a
                  href="mailto:itsupport@cdbl.com.bd"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
                >
                  <Mail className="h-3.5 w-3.5" />
                  IT Support
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Divider */}
        <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent mb-8" />

        {/* Bottom Section */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Copyright */}
          <p className="text-xs text-muted-foreground text-center sm:text-left">
            © {currentYear} Central Depository Bangladesh Limited. All rights reserved.
            <br className="sm:hidden" />
            <span className="hidden sm:inline"> | </span>
            Leave Management System | Developed and Maintained by CDBL VAS
          </p>

          {/* Footer Links */}
          <div className="flex items-center gap-6 text-xs text-muted-foreground">
            <Link
              href="/privacy"
              className="hover:text-foreground transition-colors"
            >
              Privacy Policy
            </Link>
            <span className="hidden sm:inline">•</span>
            <Link
              href="/terms"
              className="hover:text-foreground transition-colors"
            >
              Terms of Use
            </Link>
            <span className="hidden sm:inline">•</span>
            <a
              href="mailto:feedback@cdbl.com.bd"
              className="hover:text-foreground transition-colors"
            >
              Feedback
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
