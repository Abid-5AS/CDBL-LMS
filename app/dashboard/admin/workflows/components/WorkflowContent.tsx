"use client";

import { useEffect, useState } from "react";
import { GlassCard, GlassCardHeader, GlassCardTitle, GlassCardContent } from "@/components/ui/glass-card";
import { Button, Badge } from "@/components/ui";
import { Loader2, Plus, Trash2, Save } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const APPROVER_OPTIONS = ["DEPT_HEAD", "HR_ADMIN", "HR_HEAD", "CEO"];
const REQUESTER_ROLES = ["EMPLOYEE", "DEPT_HEAD", "HR_ADMIN", "HR_HEAD"];

export function WorkflowContent() {
    const [loading, setLoading] = useState(true);
    const [policies, setPolicies] = useState<Record<string, string[]>>({});
    const [activeRole, setActiveRole] = useState("EMPLOYEE");
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetchWorkflows();
    }, []);

    const fetchWorkflows = async () => {
        try {
            const res = await fetch("/api/admin/workflows");
            const data = await res.json();
            const policyMap: Record<string, string[]> = {};

            if (data.defaults) {
                data.defaults.forEach((d: any) => {
                    policyMap[d.requesterRole] = d.chain;
                });
            }
            if (data.policies) {
                data.policies.forEach((p: any) => {
                    if (p.isActive) {
                        policyMap[p.requesterRole] = p.chain as string[];
                    }
                });
            }
            setPolicies(policyMap);
        } catch (err) {
            toast.error("Failed to load workflows");
        } finally {
            setLoading(false);
        }
    };

    const currentChain = policies[activeRole] || [];

    const handleAddStep = (role: string) => {
        const newChain = [...currentChain, role];
        setPolicies(prev => ({ ...prev, [activeRole]: newChain }));
    };

    const handleRemoveStep = (index: number) => {
        const newChain = [...currentChain];
        newChain.splice(index, 1);
        setPolicies(prev => ({ ...prev, [activeRole]: newChain }));
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const res = await fetch("/api/admin/workflows", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    requesterRole: activeRole,
                    chain: currentChain
                })
            });

            if (!res.ok) throw new Error("Failed to save");
            toast.success(`Workflow for ${activeRole} updated!`);
        } catch (err) {
            toast.error("Failed to save changes");
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="flex justify-center p-10"><Loader2 className="animate-spin" /></div>;

    return (
        <div className="container mx-auto py-8 max-w-5xl space-y-6">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold tracking-tight">Workflow Matrix</h1>
                <p className="text-muted-foreground">Configure the approval chain for each employee role.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="space-y-2">
                    <h3 className="text-sm font-medium text-muted-foreground mb-3">Requester Role</h3>
                    {REQUESTER_ROLES.map(role => (
                        <button
                            key={role}
                            onClick={() => setActiveRole(role)}
                            className={cn(
                                "w-full text-left px-4 py-3 rounded-lg text-sm font-medium transition-colors",
                                activeRole === role ? "bg-primary text-primary-foreground shadow-md" : "bg-card hover:bg-muted border"
                            )}
                        >
                            {role.replace("_", " ")}
                        </button>
                    ))}
                </div>

                <div className="md:col-span-3">
                    <GlassCard className="h-full">
                        <GlassCardHeader className="flex flex-row items-center justify-between">
                            <div>
                                <GlassCardTitle>Approval Chain for {activeRole}</GlassCardTitle>
                                <p className="text-xs text-muted-foreground mt-1">Order matters: Left to Right</p>
                            </div>
                            <Button onClick={handleSave} disabled={saving}>
                                {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                                Save
                            </Button>
                        </GlassCardHeader>
                        <GlassCardContent className="space-y-8">
                            <div className="flex flex-wrap items-center gap-2 p-6 bg-muted/30 rounded-xl min-h-[100px] border-2 border-dashed border-muted-foreground/20">
                                <Badge variant="outline" className="bg-background px-3 py-1">Submitted</Badge>

                                {currentChain.length === 0 ? (
                                    <>
                                        <div className="h-0.5 w-8 bg-muted-foreground/30" />
                                        <span className="text-xs text-muted-foreground italic">Self Approval / None</span>
                                    </>
                                ) : (
                                    currentChain.map((step, index) => (
                                        <div key={index} className="flex items-center gap-2 animate-in fade-in slide-in-from-left-2">
                                            <div className="h-0.5 w-8 bg-primary/30" />
                                            <div className="relative group">
                                                <Badge className="px-3 py-1.5 text-sm cursor-grab hover:bg-primary/90">
                                                    {step.replace("_", " ")}
                                                </Badge>
                                                <button
                                                    onClick={() => handleRemoveStep(index)}
                                                    className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                                                >
                                                    <XCircleIcon />
                                                </button>
                                            </div>
                                        </div>
                                    ))
                                )}

                                <div className="flex items-center gap-2">
                                    <div className="h-0.5 w-8 bg-muted-foreground/30" />
                                    <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 border-green-200">
                                        Approved
                                    </Badge>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <h4 className="text-sm font-medium">Add Approver Step</h4>
                                <div className="flex flex-wrap gap-2">
                                    {APPROVER_OPTIONS.map(role => (
                                        <Button
                                            key={role}
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handleAddStep(role)}
                                            className="border-dashed"
                                        >
                                            <Plus className="w-3 h-3 mr-1" />
                                            {role.replace("_", " ")}
                                        </Button>
                                    ))}
                                </div>
                            </div>
                        </GlassCardContent>
                    </GlassCard>
                </div>
            </div>
        </div>
    );
}

function XCircleIcon() {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="m15 9-6 6" /><path d="m9 9 6 6" /></svg>
    )
}
