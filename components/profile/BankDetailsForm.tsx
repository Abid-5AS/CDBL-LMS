"use client";

import { useActionState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Info } from "lucide-react";
import { updateBankDetails } from "@/app/actions/profile-actions";

export function BankDetailsForm({ details, onUpdate }: any) {
    const formRef = useRef<HTMLFormElement>(null);

    const [state, formAction, isPending] = useActionState(
        async (prevState: any, formData: FormData) => {
            const result = await updateBankDetails(formData);
            if (result.success) {
                onUpdate?.();
            }
            return result;
        },
        { success: false, error: null }
    );

    useEffect(() => {
        if (state.success) {
            toast.success("Bank details updated successfully");
        } else if (state.error) {
            toast.error(state.error);
        }
    }, [state]);

    return (
        <Card>
            <CardHeader>
                <CardTitle>Banking Information</CardTitle>
                <CardDescription>
                    Your bank account details for salary and expense processing
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <Alert>
                    <Info className="h-4 w-4" />
                    <AlertTitle>Important</AlertTitle>
                    <AlertDescription>
                        Please ensure these details are accurate to avoid delays in salary processing.
                    </AlertDescription>
                </Alert>

                <form ref={formRef} action={formAction} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <Label htmlFor="bankName">Bank Name</Label>
                            <Input
                                id="bankName"
                                name="bankName"
                                placeholder="e.g. Dutch Bangla Bank"
                                defaultValue={details?.bankName || ""}
                                required
                                disabled={isPending}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="accountNumber">Account Number</Label>
                            <Input
                                id="accountNumber"
                                name="accountNumber"
                                placeholder="Account Number"
                                defaultValue={details?.accountNumber || ""}
                                required
                                disabled={isPending}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="branchName">Branch Name</Label>
                            <Input
                                id="branchName"
                                name="branchName"
                                placeholder="Branch Name"
                                defaultValue={details?.branchName || ""}
                                disabled={isPending}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="routingNumber">Routing Number</Label>
                            <Input
                                id="routingNumber"
                                name="routingNumber"
                                placeholder="Routing Number"
                                defaultValue={details?.routingNumber || ""}
                                disabled={isPending}
                            />
                        </div>
                    </div>

                    <div className="flex justify-end">
                        <Button type="submit" disabled={isPending}>
                            {isPending ? "Saving..." : "Save Bank Details"}
                        </Button>
                    </div>
                </form>
            </CardContent>
        </Card>
    );
}
