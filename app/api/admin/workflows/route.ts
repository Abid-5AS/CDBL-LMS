import { NextResponse } from 'next/server';
import { getCurrentUser } from "@/lib/auth";
import { WorkflowService } from '@/lib/workflow-service';
import { AppRole } from '@/lib/rbac';
import { Role } from '@/src/generated/prisma/client';

// Helper to check admin access
async function ensureAdmin() {
    const user = await getCurrentUser();
    if (!user) {
        throw new Error("Unauthorized");
    }

    const role = user.role;
    if (role !== 'SYSTEM_ADMIN' && role !== 'HR_ADMIN' && role !== 'CEO') {
        throw new Error("Forbidden");
    }
    return user;
}

export async function GET() {
    try {
        const user = await ensureAdmin();
        // Fetch all policies
        const data = await WorkflowService.getAllPolicies();
        return NextResponse.json(data);
    } catch (error) {
        return NextResponse.json({ error: "Unauthorized or Internal Error" }, { status: 401 });
    }
}

export async function POST(req: Request) {
    try {
        const user = await ensureAdmin();
        const body = await req.json();
        const { requesterRole, chain } = body;

        if (!requesterRole || !Array.isArray(chain)) {
            return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
        }

        // Update the policy
        const updated = await WorkflowService.updatePolicy(
            requesterRole as AppRole,
            chain as Role[],
            (user as any).id
        );

        return NextResponse.json(updated);
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: "Failed to update policy" }, { status: 500 });
    }
}
