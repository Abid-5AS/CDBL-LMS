"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { Loader2, AlertTriangle } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
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

const formSchema = z.object({
  days: z.coerce
    .number()
    .min(1, "Must request at least 1 day")
    .max(
      ENCASHMENT_POLICY.MAX_ENCASHMENT_PER_REQUEST,
      `Max ${ENCASHMENT_POLICY.MAX_ENCASHMENT_PER_REQUEST} days allowed`
    ),
  reason: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

interface EncashmentRequestFormProps {
  maxEncashableDays: number;
}

export function EncashmentRequestForm({
  maxEncashableDays,
}: EncashmentRequestFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      days: 0,
      reason: "",
    },
  });

  const onSubmit = async (data: FormData) => {
    if (data.days > maxEncashableDays) {
      toast.error(
        `You can only encash up to ${maxEncashableDays} days based on your balance.`
      );
      return;
    }

    setIsSubmitting(true);
    const formData = new FormData();
    formData.append("days", data.days.toString());
    formData.append("reason", data.reason || "");

    try {
      const result = await submitEncashmentRequest(formData);
      if (result.success) {
        toast.success("Encashment request submitted successfully");
        reset();
      } else {
        toast.error(result.error || "Failed to submit request");
      }
    } catch (error) {
      toast.error("An unexpected error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

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

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="days">Days to Encash</Label>
            <Input
              id="days"
              type="number"
              placeholder="e.g. 5"
              {...register("days")}
            />
            {errors.days && (
              <p className="text-sm text-red-500">{errors.days.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="reason">Reason (Optional)</Label>
            <Textarea
              id="reason"
              placeholder="Why are you requesting encashment?"
              {...register("reason")}
            />
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={isSubmitting || maxEncashableDays <= 0}
          >
            {isSubmitting ? (
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
