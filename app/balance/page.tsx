"use client";

import { RoleBasedDashboard } from "@/components/dashboards/shared/RoleBasedDashboard";
import { LeaveBalanceView } from "@/components/leaves/LeaveBalanceView";
import { Role } from "@/lib/enums";
import { motion } from "framer-motion";

export default function BalancePage() {
  return (
    <RoleBasedDashboard
      role={Role.EMPLOYEE}
      animate={true}
      backgroundVariant="transparent"
      // Omit header/title to allow LeaveBalanceView to manage its own "Your Leave Overview" header
      // but keep the container styles and background from RoleBasedDashboard
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <LeaveBalanceView />
      </motion.div>
    </RoleBasedDashboard>
  );
}
