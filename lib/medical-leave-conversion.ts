/**
 * Medical Leave Conversion Logic (Policy 6.21.c)
 *
 * Per CDBL Policy 6.21(c): "Medical leave in excess of 14 days SHALL be adjusted with EL/special leave"
 *
 * Implementation: Auto-convert ML >14 days during approval (Option B - Clarified 2025-11-14)
 *
 * Conversion Priority:
 * 1. First 14 days → ML balance
 * 2. Excess days → EL balance (if available)
 * 3. If EL insufficient → Special EL balance (if available)
 * 4. If still insufficient → Extraordinary Leave (without pay)
 */

export interface MLConversionResult {
  totalDaysRequested: number;
  mlPortion: number;           // Days from ML balance (max 14)
  elPortion: number;            // Days from EL balance
  specialElPortion: number;     // Days from Special EL balance
  extraordinaryPortion: number; // Days from Extraordinary (unpaid)
  requiresConversion: boolean;  // True if ML >14 days
  breakdown: string[];          // Human-readable breakdown
  balanceImpact: {
    ml: { before: number; after: number };
    el?: { before: number; after: number };
    specialEl?: { before: number; after: number };
    extraordinary?: { before: number; after: number };
  };
}

export interface UserBalances {
  ml: number;      // Available ML balance
  el: number;      // Available EL balance
  specialEl: number; // Available Special EL balance
}

const ML_ANNUAL_LIMIT = 14; // Policy 6.21 - 14 days per year

/**
 * Calculate how ML days will be distributed across leave types
 *
 * @param requestedDays - Total ML days employee requested
 * @param balances - User's current available balances
 * @returns Detailed breakdown of conversion
 */
export function calculateMLConversion(
  requestedDays: number,
  balances: UserBalances
): MLConversionResult {
  const totalDaysRequested = requestedDays;
  const requiresConversion = requestedDays > ML_ANNUAL_LIMIT;

  // Initialize portions
  let mlPortion = 0;
  let elPortion = 0;
  let specialElPortion = 0;
  let extraordinaryPortion = 0;

  let remainingDays = requestedDays;
  const breakdown: string[] = [];

  // Step 1: Allocate first 14 days to ML (if available)
  if (remainingDays > 0) {
    mlPortion = Math.min(remainingDays, ML_ANNUAL_LIMIT, balances.ml);
    remainingDays -= mlPortion;

    if (mlPortion > 0) {
      breakdown.push(`${mlPortion} days from Medical Leave balance`);
    }
  }

  // Step 2: Allocate excess to EL (if available)
  if (remainingDays > 0 && balances.el > 0) {
    elPortion = Math.min(remainingDays, balances.el);
    remainingDays -= elPortion;

    if (elPortion > 0) {
      breakdown.push(`${elPortion} days converted to Earned Leave (Policy 6.21.c)`);
    }
  }

  // Step 3: Allocate to Special EL (if available)
  if (remainingDays > 0 && balances.specialEl > 0) {
    specialElPortion = Math.min(remainingDays, balances.specialEl);
    remainingDays -= specialElPortion;

    if (specialElPortion > 0) {
      breakdown.push(`${specialElPortion} days converted to Special Leave (Policy 6.21.c)`);
    }
  }

  // Step 4: Remaining goes to Extraordinary Leave (without pay)
  if (remainingDays > 0) {
    extraordinaryPortion = remainingDays;
    breakdown.push(`${extraordinaryPortion} days converted to Extraordinary Leave WITHOUT PAY (Policy 6.21.c)`);
  }

  // Build balance impact
  const balanceImpact: MLConversionResult['balanceImpact'] = {
    ml: {
      before: balances.ml,
      after: balances.ml - mlPortion,
    },
  };

  if (elPortion > 0) {
    balanceImpact.el = {
      before: balances.el,
      after: balances.el - elPortion,
    };
  }

  if (specialElPortion > 0) {
    balanceImpact.specialEl = {
      before: balances.specialEl,
      after: balances.specialEl - specialElPortion,
    };
  }

  if (extraordinaryPortion > 0) {
    balanceImpact.extraordinary = {
      before: 0, // Extraordinary has no balance limit
      after: 0,
    };
  }

  return {
    totalDaysRequested,
    mlPortion,
    elPortion,
    specialElPortion,
    extraordinaryPortion,
    requiresConversion,
    breakdown,
    balanceImpact,
  };
}

/**
 * Generate user-friendly warning message for ML application
 *
 * @param requestedDays - ML days being requested
 * @returns Warning message or null if within limit
 */
export function getMLConversionWarning(requestedDays: number): string | null {
  if (requestedDays <= ML_ANNUAL_LIMIT) {
    return null;
  }

  const excessDays = requestedDays - ML_ANNUAL_LIMIT;

  return `Medical Leave is limited to ${ML_ANNUAL_LIMIT} days per year (Policy 6.21.c). ` +
    `Your request for ${requestedDays} days exceeds this by ${excessDays} day(s). ` +
    `The excess will be automatically converted to Earned Leave (or Special/Extraordinary Leave if EL is insufficient) ` +
    `during the approval process. This is a mandatory policy requirement.`;
}

/**
 * Format conversion breakdown for display in approval UI
 *
 * @param conversion - MLConversionResult from calculateMLConversion
 * @returns Formatted string for display
 */
export function formatConversionBreakdown(conversion: MLConversionResult): string {
  if (!conversion.requiresConversion) {
    return `${conversion.totalDaysRequested} days Medical Leave (within annual limit)`;
  }

  const parts: string[] = [];

  parts.push(`**Original Request:** ${conversion.totalDaysRequested} days Medical Leave`);
  parts.push(`**Auto-Conversion Applied (Policy 6.21.c):**`);

  conversion.breakdown.forEach((line, index) => {
    parts.push(`  ${index + 1}. ${line}`);
  });

  return parts.join('\n');
}

/**
 * Validate if ML conversion is possible with current balances
 * Returns error if user doesn't have enough balance even after conversion
 *
 * @param requestedDays - ML days requested
 * @param balances - User's current balances
 * @returns Validation result with error if insufficient
 */
export function validateMLConversionBalance(
  requestedDays: number,
  balances: UserBalances
): { valid: boolean; error?: string } {
  const conversion = calculateMLConversion(requestedDays, balances);

  // Check if we could allocate all days
  const allocatedDays =
    conversion.mlPortion +
    conversion.elPortion +
    conversion.specialElPortion +
    conversion.extraordinaryPortion;

  if (allocatedDays < requestedDays) {
    return {
      valid: false,
      error: `Insufficient leave balance. Requested ${requestedDays} days but only ${allocatedDays} days available across all leave types.`,
    };
  }

  // Warn if going into Extraordinary Leave (unpaid)
  if (conversion.extraordinaryPortion > 0) {
    // This is allowed but user should be warned
    // We'll return valid but the UI should show this prominently
    return {
      valid: true,
      error: `Warning: ${conversion.extraordinaryPortion} day(s) will be UNPAID Extraordinary Leave due to insufficient EL/Special EL balance.`,
    };
  }

  return { valid: true };
}
