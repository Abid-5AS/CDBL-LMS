import { Suspense } from "react";
import { Calendar, Clock, TrendingUp, AlertCircle, CheckCircle, Info } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { connection } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

type BalanceData = {
  type: string;
  opening: number;
  accrued: number;
  used: number;
  closing: number;
};

async function BalanceContent() {
  await connection();

  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  const currentYear = new Date().getFullYear();

  // Fetch balance data from database
  const balances = await prisma.balance.findMany({
    where: {
      userId: user.id,
      year: currentYear,
    },
    select: {
      type: true,
      opening: true,
      accrued: true,
      used: true,
      closing: true,
    },
  });

  // Map to typed array
  const balanceData: BalanceData[] = balances.map(b => ({
    type: b.type,
    opening: b.opening || 0,
    accrued: b.accrued || 0,
    used: b.used || 0,
    closing: b.closing || 0,
  }));

  // Get leave type configurations
  const leaveTypeConfig = {
    CASUAL_LEAVE: {
      label: "Casual Leave",
      icon: Clock,
      color: "text-data-info",
      bgColor: "bg-data-info/10",
      description: "Available casual leave days",
    },
    MEDICAL_LEAVE: {
      label: "Medical Leave",
      icon: Calendar,
      color: "text-data-success",
      bgColor: "bg-data-success/10",
      description: "Available sick leave days",
    },
    EARNED_LEAVE: {
      label: "Earned Leave",
      icon: TrendingUp,
      color: "text-data-warning",
      bgColor: "bg-data-warning/10",
      description: "Accrued earned leave days",
    },
    MATERNITY_LEAVE: {
      label: "Maternity Leave",
      icon: Calendar,
      color: "text-purple-500",
      bgColor: "bg-purple-500/10",
      description: "Maternity leave entitlement",
    },
    PATERNITY_LEAVE: {
      label: "Paternity Leave",
      icon: Calendar,
      color: "text-blue-500",
      bgColor: "bg-blue-500/10",
      description: "Paternity leave entitlement",
    },
  };

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-border-strong bg-bg-primary p-6 shadow-sm">
        <h1 className="text-2xl font-semibold text-text-secondary">Leave Balance</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          View your current leave balances and accrual information for {currentYear}
        </p>
      </section>

      {balanceData.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Info className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="font-semibold text-lg mb-2">No Balance Data Available</h3>
            <p className="text-sm text-muted-foreground">
              Your leave balances will appear here once they are initialized by HR.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {balanceData.map((balance) => {
            const config = leaveTypeConfig[balance.type as keyof typeof leaveTypeConfig];
            if (!config) return null;

            const Icon = config.icon;
            const totalAvailable = balance.opening + balance.accrued;
            const usagePercent = totalAvailable > 0 ? (balance.used / totalAvailable) * 100 : 0;
            const isLow = balance.closing < 3 && balance.closing > 0;
            const isExpiring = balance.type === "CASUAL_LEAVE" && balance.closing > 5 && new Date().getMonth() >= 10; // Nov/Dec

            return (
              <Card key={balance.type} className="relative overflow-hidden">
                <div className={`absolute top-0 left-0 w-1 h-full ${config.bgColor}`} />
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`p-2 rounded-lg ${config.bgColor}`}>
                        <Icon className={`h-5 w-5 ${config.color}`} />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{config.label}</CardTitle>
                        <CardDescription className="text-xs">{config.description}</CardDescription>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Main Balance Display */}
                  <div>
                    <div className="flex items-baseline gap-2">
                      <p className="text-4xl font-bold text-text-secondary">
                        {balance.closing}
                      </p>
                      <p className="text-sm text-muted-foreground">days available</p>
                    </div>

                    {/* Warnings */}
                    {isLow && (
                      <Badge variant="outline" className="mt-2 border-orange-500 text-orange-500">
                        <AlertCircle className="h-3 w-3 mr-1" />
                        Low balance
                      </Badge>
                    )}
                    {isExpiring && (
                      <Badge variant="outline" className="mt-2 border-yellow-500 text-yellow-500">
                        <AlertCircle className="h-3 w-3 mr-1" />
                        Expires Dec 31
                      </Badge>
                    )}
                  </div>

                  {/* Progress Bar */}
                  <div>
                    <div className="flex justify-between text-xs text-muted-foreground mb-2">
                      <span>Usage</span>
                      <span>{balance.used} / {totalAvailable} days</span>
                    </div>
                    <Progress value={usagePercent} className="h-2" />
                  </div>

                  {/* Breakdown */}
                  <div className="pt-3 border-t space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Opening Balance</span>
                      <span className="font-medium">{balance.opening} days</span>
                    </div>
                    {balance.accrued > 0 && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Accrued</span>
                        <span className="font-medium text-green-600">+{balance.accrued} days</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Used</span>
                      <span className="font-medium text-red-600">-{balance.used} days</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Additional Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-500" />
            Balance Information
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <p>• Casual Leave expires at the end of the calendar year (December 31st)</p>
          <p>• Earned Leave can be carried forward to the next year</p>
          <p>• Medical Leave is allocated annually and does not carry forward</p>
          <p>• Balances are updated in real-time when leave requests are approved or cancelled</p>
        </CardContent>
      </Card>
    </div>
  );
}

export default function BalancePage() {
  return (
    <Suspense fallback={<BalanceFallback />}>
      <BalanceContent />
    </Suspense>
  );
}

function BalanceFallback() {
  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-border-strong bg-bg-primary p-6 shadow-sm">
        <div className="h-8 w-48 bg-bg-secondary rounded animate-pulse" />
        <div className="mt-2 h-4 w-64 bg-bg-secondary rounded animate-pulse" />
      </section>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <div className="h-6 w-32 bg-bg-secondary rounded animate-pulse" />
              <div className="h-4 w-40 bg-bg-secondary rounded animate-pulse mt-2" />
            </CardHeader>
            <CardContent>
              <div className="h-10 w-20 bg-bg-secondary rounded animate-pulse" />
              <div className="h-4 w-32 bg-bg-secondary rounded animate-pulse mt-2" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
