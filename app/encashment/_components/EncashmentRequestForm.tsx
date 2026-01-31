"use client";

import { useActionState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { Loader2, AlertTriangle } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { submitEncashmentRequest } from "@/app/actions/encashment-actions";
import { ENCASHMENT_POLICY } from "@/lib/schemas/encashment";

interface EncashmentRequestFormProps {
  maxEncashableDays: number;
}

export function EncashmentRequestForm({
  maxEncashableDays,
}: EncashmentRequestFormProps) {
  const formRef = useRef<HTMLFormElement>(null);

  const [state, formAction, isPending] = useActionState(
    async (prevState: any, formData: FormData) => {
      // Client-side validation
      const days = parseInt(formData.get("days") as string);

      if (isNaN(days) || days < 1) {
        return { success: false, error: "Must request at least 1 day" };
      }

      if (days > ENCASHMENT_POLICY.MAX_ENCASHMENT_PER_REQUEST) {
        return {
          success: false,
          error: `Max ${ENCASHMENT_POLICY.MAX_ENCASHMENT_PER_REQUEST} days allowed`,
        };
      }

      if (days > maxEncashableDays) {
        return {
          success: false,
          error: `You can only encash up to ${maxEncashableDays} days based on your balance.`,
        };
      }

      // Call server action
      const result = await submitEncashmentRequest(formData);
      return result;
    },
    { success: false, error: null }
  );

  // Show toast notifications based on state
  useEffect(() => {
    if (state.success) {
      toast.success("Encashment request submitted successfully");
      formRef.current?.reset();
    } else if (state.error) {
      toast.error(state.error);
    }
  }, [state]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Request Encashment</CardTitle>
        <CardDescription>
          Convert your Earned Leave balance into cash.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert variant="warning" className="bg-amber-50 border-amber-200">
          <AlertTriangle className="h-4 w-4 text-amber-600" />
          <AlertTitle className="text-amber-800">Policy Assumption</AlertTitle>
          <AlertDescription className="text-amber-700">
            Please note: This feature assumes you must retain a minimum of{" "}
            <strong>{ENCASHMENT_POLICY.MIN_BALANCE_TO_KEEP} days</strong> of
            Earned Leave. You can encash up to{" "}
            <strong>{ENCASHMENT_POLICY.MAX_ENCASHMENT_PER_REQUEST} days</strong>{" "}
            per request.
          </AlertDescription>
        </Alert>

        <div className="p-4 bg-slate-50 rounded-md border border-slate-100">
          <div className="flex justify-between items-center mb-1">
            <span className="text-sm font-medium text-slate-600">
              Max Encashable Now:
            </span>
            <span className="text-lg font-bold text-slate-900">
              {maxEncashableDays} Days
            </span>
          </div>
          <p className="text-xs text-slate-500">
            (Current Balance - Min Required Balance)
          </p>
        </div>

        <form ref={formRef} action={formAction} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="days">Days to Encash</Label>
            <Input
              id="days"
              name="days"
              type="number"
              placeholder="e.g. 5"
              required
              min={1}
              max={ENCASHMENT_POLICY.MAX_ENCASHMENT_PER_REQUEST}
              disabled={isPending}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="reason">Reason (Optional)</Label>
            <Textarea
              id="reason"
              name="reason"
              placeholder="Why are you requesting encashment?"
              disabled={isPending}
            />
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={isPending || maxEncashableDays <= 0}
          >
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Submitting...
              </>
            ) : (
              "Submit Request"
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
