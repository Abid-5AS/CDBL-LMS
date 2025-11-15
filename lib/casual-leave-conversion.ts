/**
 * Casual Leave Conversion Logic (Policy 6.20)
 *
 * Per CDBL Policy 6.20(d): "CL may not be combined with any other kind of leave... max 3 days per spell"
 * Implementation: Auto-convert CL >3 days to EL during application/approval
 *
 * Conversion Rule:
 * - First 3 days → CL balance (if applying for >3 days)
 * - Remaining days → EL balance
 * - If EL insufficient → Reject or warn user to reduce CL portion
 *
 * IMPORTANT: CL >3 days is technically not allowed per policy, so we auto-convert excess to EL
 * This ensures policy compliance while providing flexibility to employees
 */

export interface CLConversionResult {
  totalDaysRequested: number;
  clPortion: number;            // Days from CL balance (max 3)
  elPortion: number;             // Days from EL balance
  requiresConversion: boolean;   // True if CL >3 days
  breakdown: string[];           // Human-readable breakdown
  balanceImpact: {
    cl: { before: number; after: number };
    el?: { before: number; after: number };
  };
  warning?: string;              // Warning if EL is insufficient
}

export interface CLUserBalances {
  cl: number;      // Available CL balance
  el: number;      // Available EL balance
}

const CL_MAX_CONSECUTIVE_DAYS = 3; // Policy 6.20.d - max 3 days per spell

/**
 * Calculate how CL days will be distributed across leave types
 *
 * @param requestedDays - Total CL days employee requested
 * @param balances - User's current available balances
 * @returns Detailed breakdown of conversion
 */
export function calculateCLConversion(
  requestedDays: number,
  balances: CLUserBalances
): CLConversionResult {
  const totalDaysRequested = requestedDays;
  const requiresConversion = requestedDays > CL_MAX_CONSECUTIVE_DAYS;

  // Initialize portions
  let clPortion = 0;
  let elPortion = 0;

  let remainingDays = requestedDays;
  const breakdown: string[] = [];
  let warning: string | undefined;

  // Step 1: Allocate first 3 days to CL (if available)
  if (remainingDays > 0) {
    clPortion = Math.min(remainingDays, CL_MAX_CONSECUTIVE_DAYS, balances.cl);
    remainingDays -= clPortion;

    if (clPortion > 0) {
      breakdown.push(`${clPortion} day(s) from Casual Leave balance`);
    }

    // If user doesn't have enough CL even for first 3 days
    if (clPortion < Math.min(requestedDays, CL_MAX_CONSECUTIVE_DAYS)) {
      warning = `Insufficient CL balance. Only ${clPortion} day(s) available.`;
    }
  }

  // Step 2: Allocate excess to EL (if CL >3 days)
  if (remainingDays > 0 && requiresConversion) {
    if (balances.el >= remainingDays) {
      elPortion = remainingDays;
      remainingDays = 0;

      breakdown.push(
        `${elPortion} day(s) auto-converted to Earned Leave (CL max is ${CL_MAX_CONSECUTIVE_DAYS} days per Policy 6.20.d)`
      );
    } else {
      // Insufficient EL for conversion
      elPortion = balances.el;
      remainingDays -= elPortion;

      if (elPortion > 0) {
        breakdown.push(
          `${elPortion} day(s) auto-converted to Earned Leave (partial)`
        );
      }

      warning = `Insufficient leave balance. You requested ${totalDaysRequested} days (${CL_MAX_CONSECUTIVE_DAYS} CL + ${
        totalDaysRequested - CL_MAX_CONSECUTIVE_DAYS
      } EL), but only have ${balances.cl} CL and ${balances.el} EL available. Please reduce your request or apply for EL directly.`;
    }
  }

  // Build balance impact
  const balanceImpact: CLConversionResult['balanceImpact'] = {
    cl: {
      before: balances.cl,
      after: balances.cl - clPortion,
    },
  };

  if (elPortion > 0) {
    balanceImpact.el = {
      before: balances.el,
      after: balances.el - elPortion,
    };
  }

  return {
    totalDaysRequested,
    clPortion,
    elPortion,
    requiresConversion,
    breakdown,
    balanceImpact,
    warning,
  };
}

/**
 * Generate user-friendly warning message for CL application
 *
 * @param requestedDays - CL days being requested
 * @returns Warning message or null if within limit
 */
export function getCLConversionWarning(requestedDays: number): string | null {
  if (requestedDays <= CL_MAX_CONSECUTIVE_DAYS) {
    return null;
  }

  const excessDays = requestedDays - CL_MAX_CONSECUTIVE_DAYS;

  return `Casual Leave is limited to ${CL_MAX_CONSECUTIVE_DAYS} consecutive days per Policy 6.20.d. ` +
    `Your request for ${requestedDays} days exceeds this by ${excessDays} day(s). ` +
    `The excess will be automatically converted to Earned Leave (EL). ` +
    `Ensure you have sufficient EL balance to proceed. This is a mandatory policy requirement.`;
}

/**
 * Format conversion breakdown for display in UI
 *
 * @param conversion - CLConversionResult from calculateCLConversion
 * @returns Formatted string for display
 */
export function formatCLConversionBreakdown(conversion: CLConversionResult): string {
  if (!conversion.requiresConversion) {
    return `${conversion.totalDaysRequested} day(s) Casual Leave (within ${CL_MAX_CONSECUTIVE_DAYS}-day limit)`;
  }

  const parts: string[] = [];

  parts.push(`**Original Request:** ${conversion.totalDaysRequested} day(s) Casual Leave`);
  parts.push(`**Auto-Conversion Applied (Policy 6.20.d):**`);

  conversion.breakdown.forEach((line, index) => {
    parts.push(`  ${index + 1}. ${line}`);
  });

  if (conversion.warning) {
    parts.push('');
    parts.push(`⚠️ **Warning:** ${conversion.warning}`);
  }

  return parts.join('\n');
}

/**
 * Validate if CL conversion is possible with current balances
 * Returns error if user doesn't have enough balance even after conversion
 *
 * @param requestedDays - CL days requested
 * @param balances - User's current balances
 * @returns Validation result with error if insufficient
 */
export function validateCLConversionBalance(
  requestedDays: number,
  balances: CLUserBalances
): { valid: boolean; error?: string; warning?: string } {
  const conversion = calculateCLConversion(requestedDays, balances);

  // Check if we could allocate all days
  const allocatedDays = conversion.clPortion + conversion.elPortion;

  if (allocatedDays < requestedDays) {
    return {
      valid: false,
      error: `Insufficient leave balance. You requested ${requestedDays} days but only have ${balances.cl} CL and ${balances.el} EL available (CL limited to ${CL_MAX_CONSECUTIVE_DAYS} days max per Policy 6.20.d). Please reduce your request or apply for Earned Leave directly.`,
    };
  }

  // Warn if conversion is happening
  if (conversion.requiresConversion && conversion.elPortion > 0) {
    return {
      valid: true,
      warning: getCLConversionWarning(requestedDays),
    };
  }

  return { valid: true };
}

/**
 * Get the actual leave type breakdown after conversion
 * Used to update balance deductions correctly
 *
 * @param requestedDays - CL days requested
 * @param balances - User's current balances
 * @returns Array of leave type portions to deduct
 */
export function getCLConversionBreakdown(
  requestedDays: number,
  balances: CLUserBalances
): Array<{ type: 'CASUAL' | 'EARNED'; days: number }> {
  const conversion = calculateCLConversion(requestedDays, balances);
  const breakdown: Array<{ type: 'CASUAL' | 'EARNED'; days: number }> = [];

  if (conversion.clPortion > 0) {
    breakdown.push({ type: 'CASUAL', days: conversion.clPortion });
  }

  if (conversion.elPortion > 0) {
    breakdown.push({ type: 'EARNED', days: conversion.elPortion });
  }

  return breakdown;
}
