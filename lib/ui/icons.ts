import type { LucideIcon } from "lucide-react";
import {
  Activity,
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  ArrowUp,
  Baby,
  Ban,
  BarChart2,
  BarChart3,
  BookOpen,
  Calendar,
  CalendarDays,
  CalendarPlus,
  CheckCircle,
  CheckCircle2,
  CheckSquare,
  CircleCheckBig,
  CircleOff,
  CircleX,
  ClipboardCheck,
  Clock,
  Coffee,
  Crown,
  Download,
  Edit,
  Eye,
  FileText,
  Filter,
  Forward,
  Globe,
  GraduationCap,
  Heart,
  HeartHandshake,
  HeartPulse,
  Home,
  Hourglass,
  LayoutDashboard,
  LineChart,
  Mail,
  PieChart,
  Search,
  Send,
  Settings,
  Shield,
  SlidersHorizontal,
  Smile,
  Sparkles,
  Star,
  Stethoscope,
  Timer,
  TrendingUp,
  Trash2,
  Upload,
  User,
  UserCheck,
  UserCircle,
  UserPlus,
  Users,
  Zap,
  XCircle,
  Moon,
  Sun,
  RefreshCcw,
  ArrowLeft,
} from "lucide-react";

export type IconName =
  | "Activity"
  | "AlertCircle"
  | "AlertTriangle"
  | "ArrowRight"
  | "ArrowUp"
  | "Baby"
  | "Ban"
  | "BarChart2"
  | "BarChart3"
  | "BookOpen"
  | "Calendar"
  | "CalendarDays"
  | "CalendarPlus"
  | "CheckCircle"
  | "CheckCircle2"
  | "CheckSquare"
  | "CircleCheckBig"
  | "CircleOff"
  | "CircleX"
  | "ClipboardCheck"
  | "Clock"
  | "Coffee"
  | "Crown"
  | "Download"
  | "Edit"
  | "Eye"
  | "FileText"
  | "Filter"
  | "Forward"
  | "Globe"
  | "GraduationCap"
  | "Heart"
  | "HeartHandshake"
  | "HeartPulse"
  | "Home"
  | "Hourglass"
  | "LayoutDashboard"
  | "LineChart"
  | "Mail"
  | "PieChart"
  | "RefreshCcw"
  | "Search"
  | "Send"
  | "Settings"
  | "Shield"
  | "SlidersHorizontal"
  | "Smile"
  | "Sparkles"
  | "Star"
  | "Stethoscope"
  | "Timer"
  | "TrendingUp"
  | "Trash2"
  | "Upload"
  | "User"
  | "UserCheck"
  | "UserCircle"
  | "UserPlus"
  | "Users"
  | "Zap"
  | "XCircle"
  | "Moon"
  | "Sun"
  | "ArrowLeft";

const iconLibrary: Record<IconName, LucideIcon> = {
  Activity,
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  ArrowUp,
  Baby,
  Ban,
  BarChart2,
  BarChart3,
  BookOpen,
  Calendar,
  CalendarDays,
  CalendarPlus,
  CheckCircle,
  CheckCircle2,
  CheckSquare,
  CircleCheckBig,
  CircleOff,
  CircleX,
  ClipboardCheck,
  Clock,
  Coffee,
  Crown,
  Download,
  Edit,
  Eye,
  FileText,
  Filter,
  Forward,
  Globe,
  GraduationCap,
  Heart,
  HeartHandshake,
  HeartPulse,
  Home,
  Hourglass,
  LayoutDashboard,
  LineChart,
  Mail,
  PieChart,
  Search,
  Send,
  Settings,
  Shield,
  SlidersHorizontal,
  Smile,
  Sparkles,
  Star,
  Stethoscope,
  Timer,
  TrendingUp,
  Trash2,
  Upload,
  User,
  UserCheck,
  UserCircle,
  UserPlus,
  Users,
  Zap,
  XCircle,
  Moon,
  Sun,
  RefreshCcw,
  ArrowLeft,
};

export const iconSizes = {
  sm: 16,
  md: 20,
  lg: 24,
} as const;

export type IconSize = keyof typeof iconSizes;

export type LeaveTypeIcon =
  | "EARNED"
  | "CASUAL"
  | "MEDICAL"
  | "EXTRAWITHPAY"
  | "EXTRAWITHOUTPAY"
  | "MATERNITY"
  | "PATERNITY"
  | "STUDY"
  | "SPECIAL_DISABILITY"
  | "QUARANTINE";

export const leaveTypeIcons: Record<LeaveTypeIcon, IconName> = {
  EARNED: "Calendar",
  CASUAL: "Coffee",
  MEDICAL: "HeartPulse",
  EXTRAWITHPAY: "Sparkles",
  EXTRAWITHOUTPAY: "Timer",
  MATERNITY: "Baby",
  PATERNITY: "Users",
  STUDY: "GraduationCap",
  SPECIAL_DISABILITY: "HeartHandshake",
  QUARANTINE: "Shield",
};

export type LeaveStatusIcon =
  | "DRAFT"
  | "SUBMITTED"
  | "PENDING"
  | "APPROVED"
  | "REJECTED"
  | "CANCELLED";

export const leaveStatusIcons: Record<LeaveStatusIcon, IconName> = {
  DRAFT: "Edit",
  SUBMITTED: "Send",
  PENDING: "Clock",
  APPROVED: "CheckCircle",
  REJECTED: "XCircle",
  CANCELLED: "Ban",
};

export type ActionIcon =
  | "APPLY"
  | "VIEW"
  | "APPROVE"
  | "REJECT"
  | "FORWARD"
  | "EDIT"
  | "DELETE"
  | "SEARCH"
  | "FILTER"
  | "DOWNLOAD"
  | "UPLOAD";

export const actionIcons: Record<ActionIcon, IconName> = {
  APPLY: "CalendarPlus",
  VIEW: "Eye",
  APPROVE: "CheckCircle2",
  REJECT: "XCircle",
  FORWARD: "Forward",
  EDIT: "Edit",
  DELETE: "Trash2",
  SEARCH: "Search",
  FILTER: "SlidersHorizontal",
  DOWNLOAD: "Download",
  UPLOAD: "Upload",
};

export type NavigationIcon =
  | "DASHBOARD"
  | "LEAVES"
  | "APPROVALS"
  | "EMPLOYEES"
  | "HOLIDAYS"
  | "REPORTS"
  | "SETTINGS"
  | "POLICIES";

export const navigationIcons: Record<NavigationIcon, IconName> = {
  DASHBOARD: "LayoutDashboard",
  LEAVES: "CalendarDays",
  APPROVALS: "ClipboardCheck",
  EMPLOYEES: "Users",
  HOLIDAYS: "Calendar",
  REPORTS: "BarChart3",
  SETTINGS: "Settings",
  POLICIES: "BookOpen",
};

export type RoleIdentifier =
  | "EMPLOYEE"
  | "DEPT_HEAD"
  | "HR_ADMIN"
  | "HR_HEAD"
  | "CEO";

export const roleIcons: Record<RoleIdentifier, IconName> = {
  EMPLOYEE: "User",
  DEPT_HEAD: "UserCheck",
  HR_ADMIN: "Shield",
  HR_HEAD: "Crown",
  CEO: "Activity",
};

export const kpiIcons: Record<string, IconName> = {
  balance: "TrendingUp",
  compliance: "Shield",
  utilization: "Activity",
  headcount: "Users",
  requests: "FileText",
  approvals: "CheckSquare",
};

export type IconTokenMap = typeof iconLibrary;

export function getIcon(name: IconName | string): LucideIcon {
  if (name in iconLibrary) {
    return iconLibrary[name as IconName];
  }
  return FileText;
}

export type IconRenderOptions = {
  name: IconName | string;
  size?: IconSize | number;
  className?: string;
  "aria-hidden"?: boolean;
};

export function resolveSize(size: IconSize | number = "md") {
  if (typeof size === "number") {
    return size;
  }
  return iconSizes[size] ?? iconSizes.md;
}
