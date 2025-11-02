import { prisma } from "@/lib/prisma";

export type BackdateSetting = boolean | "ask";

export type OrgSettingsType = {
  allowBackdate?: {
    EL?: BackdateSetting;
    CL?: BackdateSetting;
    ML?: BackdateSetting;
  };
  [key: string]: any;
};

/**
 * Get an organization setting by key
 */
export async function getOrgSetting<T = any>(key: string): Promise<T | null> {
  try {
    const setting = await prisma.orgSettings.findUnique({
      where: { key },
    });
    return setting ? (setting.value as T) : null;
  } catch (error) {
    // Model might not exist yet (migration pending)
    console.warn(`OrgSettings model not available: ${error}`);
    return null;
  }
}

/**
 * Set an organization setting
 */
export async function setOrgSetting<T = any>(
  key: string,
  value: T,
  description?: string,
  updatedBy?: number
): Promise<void> {
  await prisma.orgSettings.upsert({
    where: { key },
    create: {
      key,
      value: value as any,
      description,
      updatedBy,
    },
    update: {
      value: value as any,
      description,
      updatedBy,
    },
  });
}

/**
 * Get backdate settings for leave types
 */
export async function getBackdateSettings(): Promise<{
  EL: BackdateSetting;
  CL: BackdateSetting;
  ML: BackdateSetting;
}> {
  const settings = await getOrgSetting<OrgSettingsType>("allowBackdate");
  return {
    EL: settings?.allowBackdate?.EL ?? "ask",
    CL: settings?.allowBackdate?.CL ?? false,
    ML: settings?.allowBackdate?.ML ?? true,
  };
}

/**
 * Initialize default org settings
 */
export async function initDefaultOrgSettings(): Promise<void> {
  // Set default backdate settings
  await setOrgSetting(
    "allowBackdate",
    {
      allowBackdate: {
        EL: "ask",
        CL: false,
        ML: true,
      },
    },
    "Backdate settings for leave types (EL=Earned Leave, CL=Casual Leave, ML=Medical Leave). 'ask' means show confirmation modal."
  );

  // Create audit log entry for EL backdate conflict
  const existingLog = await prisma.auditLog.findFirst({
    where: {
      action: "POLICY_NOTE",
      actorEmail: "system@cdbl.local",
    },
  });

  if (!existingLog) {
    await prisma.auditLog.create({
      data: {
        actorEmail: "system@cdbl.local",
        action: "POLICY_NOTE",
        details: {
          message: "EL backdate toggle set to 'ask' due to source conflict; confirm before go-live.",
        },
      },
    });
  }
}

