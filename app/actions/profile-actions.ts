"use server";

import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function updatePersonalDetails(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) {
    return { success: false, error: "Unauthorized" };
  }

  try {
    const phone = formData.get("phone") as string;
    const address = formData.get("address") as string;
    const permanentAddress = formData.get("permanentAddress") as string;
    const dob = formData.get("dob") as string;
    const gender = formData.get("gender") as string;
    const bloodGroup = formData.get("bloodGroup") as string;
    const maritalStatus = formData.get("maritalStatus") as string;
    const nid = formData.get("nid") as string;
    const tin = formData.get("tin") as string;

    await prisma.userProfile.upsert({
      where: { userId: user.id },
      update: {
        phone: phone || null,
        address: address || null,
        permanentAddress: permanentAddress || null,
        dob: dob ? new Date(dob) : null,
        gender: gender || null,
        bloodGroup: bloodGroup || null,
        maritalStatus: maritalStatus || null,
        nid: nid || null,
        tin: tin || null,
      },
      create: {
        userId: user.id,
        phone: phone || null,
        address: address || null,
        permanentAddress: permanentAddress || null,
        dob: dob ? new Date(dob) : null,
        gender: gender || null,
        bloodGroup: bloodGroup || null,
        maritalStatus: maritalStatus || null,
        nid: nid || null,
        tin: tin || null,
      },
    });

    revalidatePath("/profile");
    return { success: true };
  } catch (error) {
    console.error("Error updating personal details:", error);
    return { success: false, error: "Failed to update personal details" };
  }
}

export async function updateBankDetails(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) {
    return { success: false, error: "Unauthorized" };
  }

  try {
    const bankName = formData.get("bankName") as string;
    const accountNumber = formData.get("accountNumber") as string;
    const branchName = formData.get("branchName") as string;
    const routingNumber = formData.get("routingNumber") as string;

    if (!bankName || !accountNumber) {
      return { success: false, error: "Bank name and account number are required" };
    }

    await prisma.bankDetails.upsert({
      where: { userId: user.id },
      update: {
        bankName,
        accountNumber,
        branchName: branchName || null,
        routingNumber: routingNumber || null,
      },
      create: {
        userId: user.id,
        bankName,
        accountNumber,
        branchName: branchName || null,
        routingNumber: routingNumber || null,
      },
    });

    revalidatePath("/profile");
    return { success: true };
  } catch (error) {
    console.error("Error updating bank details:", error);
    return { success: false, error: "Failed to update bank details" };
  }
}

export async function addEmergencyContact(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) {
    return { success: false, error: "Unauthorized" };
  }

  try {
    const name = formData.get("name") as string;
    const relationship = formData.get("relationship") as string;
    const phone = formData.get("phone") as string;
    const alternatePhone = formData.get("alternatePhone") as string;

    if (!name || !relationship || !phone) {
      return { success: false, error: "Name, relationship, and phone are required" };
    }

    await prisma.emergencyContact.create({
      data: {
        userId: user.id,
        name,
        relationship,
        phone,
        alternatePhone: alternatePhone || null,
      },
    });

    revalidatePath("/profile");
    return { success: true };
  } catch (error) {
    console.error("Error adding emergency contact:", error);
    return { success: false, error: "Failed to add emergency contact" };
  }
}

export async function updateEmergencyContact(contactId: number, formData: FormData) {
  const user = await getCurrentUser();
  if (!user) {
    return { success: false, error: "Unauthorized" };
  }

  try {
    const name = formData.get("name") as string;
    const relationship = formData.get("relationship") as string;
    const phone = formData.get("phone") as string;
    const alternatePhone = formData.get("alternatePhone") as string;

    if (!name || !relationship || !phone) {
      return { success: false, error: "Name, relationship, and phone are required" };
    }

    // Verify ownership
    const contact = await prisma.emergencyContact.findUnique({
      where: { id: contactId },
      select: { userId: true },
    });

    if (!contact || contact.userId !== user.id) {
      return { success: false, error: "Unauthorized to update this contact" };
    }

    await prisma.emergencyContact.update({
      where: { id: contactId },
      data: {
        name,
        relationship,
        phone,
        alternatePhone: alternatePhone || null,
      },
    });

    revalidatePath("/profile");
    return { success: true };
  } catch (error) {
    console.error("Error updating emergency contact:", error);
    return { success: false, error: "Failed to update emergency contact" };
  }
}

export async function deleteEmergencyContact(contactId: number) {
  const user = await getCurrentUser();
  if (!user) {
    return { success: false, error: "Unauthorized" };
  }

  try {
    // Verify ownership
    const contact = await prisma.emergencyContact.findUnique({
      where: { id: contactId },
      select: { userId: true },
    });

    if (!contact || contact.userId !== user.id) {
      return { success: false, error: "Unauthorized to delete this contact" };
    }

    await prisma.emergencyContact.delete({
      where: { id: contactId },
    });

    revalidatePath("/profile");
    return { success: true };
  } catch (error) {
    console.error("Error deleting emergency contact:", error);
    return { success: false, error: "Failed to delete emergency contact" };
  }
}
