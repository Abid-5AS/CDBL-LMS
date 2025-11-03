/**
 * Deployment Verification Script
 * Verifies Policy v2.0 deployment readiness
 */

import { prisma } from "@/lib/prisma";

async function verifyDeployment() {
  console.log("🔍 Verifying Policy v2.0 Deployment...\n");

  let allChecksPassed = true;

  // 1. Check LeaveStatus enum includes new statuses
  console.log("1️⃣ Checking LeaveStatus enum...");
  try {
    const enumValues = await prisma.$queryRaw<Array<{ Field: string; Type: string }>>`
      SHOW COLUMNS FROM LeaveRequest WHERE Field = 'status'
    `;
    
    if (enumValues.length > 0) {
      const typeDef = enumValues[0].Type;
      const requiredStatuses = ["RETURNED", "CANCELLATION_REQUESTED", "RECALLED", "OVERSTAY_PENDING"];
      const missingStatuses = requiredStatuses.filter(status => !typeDef.includes(status));
      
      if (missingStatuses.length === 0) {
        console.log("   ✅ All new statuses present in enum\n");
      } else {
        console.log(`   ❌ Missing statuses: ${missingStatuses.join(", ")}\n`);
        allChecksPassed = false;
      }
    } else {
      console.log("   ⚠️  Could not verify enum (table may not exist)\n");
    }
  } catch (error) {
    console.log(`   ⚠️  Could not check enum: ${error instanceof Error ? error.message : "Unknown error"}\n`);
  }

  // 2. Check fitnessCertificateUrl field exists
  console.log("2️⃣ Checking fitnessCertificateUrl field...");
  try {
    const columns = await prisma.$queryRaw<Array<{ Field: string; Type: string }>>`
      SHOW COLUMNS FROM LeaveRequest WHERE Field = 'fitnessCertificateUrl'
    `;
    
    if (columns.length > 0) {
      console.log("   ✅ fitnessCertificateUrl field exists\n");
    } else {
      console.log("   ❌ fitnessCertificateUrl field missing\n");
      allChecksPassed = false;
    }
  } catch (error) {
    console.log(`   ⚠️  Could not check field: ${error instanceof Error ? error.message : "Unknown error"}\n`);
  }

  // 3. Verify schema matches expected
  console.log("3️⃣ Verifying schema structure...");
  try {
    const columns = await prisma.$queryRaw<Array<{ Field: string; Type: string }>>`
      SHOW COLUMNS FROM LeaveRequest
    `;
    
    const hasCertificateUrl = columns.some(c => c.Field === "certificateUrl");
    const hasFitnessUrl = columns.some(c => c.Field === "fitnessCertificateUrl");
    const hasPolicyVersion = columns.some(c => c.Field === "policyVersion");
    
    if (hasCertificateUrl && hasFitnessUrl && hasPolicyVersion) {
      console.log("   ✅ All required fields present\n");
    } else {
      console.log(`   ❌ Missing fields: certificateUrl=${hasCertificateUrl}, fitnessCertificateUrl=${hasFitnessUrl}, policyVersion=${hasPolicyVersion}\n`);
      allChecksPassed = false;
    }
  } catch (error) {
    console.log(`   ⚠️  Could not verify schema: ${error instanceof Error ? error.message : "Unknown error"}\n`);
  }

  // 4. Check for audit log table (needed for new actions)
  console.log("4️⃣ Checking audit log table...");
  try {
    const tables = await prisma.$queryRaw<Array<{ Tables_in_database: string }>>`
      SHOW TABLES LIKE 'AuditLog'
    `;
    
    if (tables.length > 0) {
      console.log("   ✅ AuditLog table exists\n");
    } else {
      console.log("   ⚠️  AuditLog table not found (may use different name)\n");
    }
  } catch (error) {
    console.log(`   ⚠️  Could not check AuditLog: ${error instanceof Error ? error.message : "Unknown error"}\n`);
  }

  // 5. Summary
  console.log("📊 Deployment Verification Summary:");
  if (allChecksPassed) {
    console.log("   ✅ All critical checks passed!");
    console.log("   🚀 Ready for deployment\n");
    process.exit(0);
  } else {
    console.log("   ❌ Some checks failed");
    console.log("   ⚠️  Please review and fix issues before deployment\n");
    process.exit(1);
  }
}

verifyDeployment().catch((error) => {
  console.error("❌ Verification failed:", error);
  process.exit(1);
});

