"use client";

import Link from "next/link";
import { Plus, Users, FileText, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function HRQuickActions() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline">
          Quick Actions
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem asChild>
          <Link href="/admin/holidays" className="flex items-center">
            <Calendar className="mr-2 h-4 w-4" />
            Add Holiday
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/employees" className="flex items-center">
            <Users className="mr-2 h-4 w-4" />
            Manage Employees
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/policies" className="flex items-center">
            <FileText className="mr-2 h-4 w-4" />
            Review Policies
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

