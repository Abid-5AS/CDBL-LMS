"use client";

import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { Send, Save } from "lucide-react";

export function SubmitButton({ 
  disabled, 
  onClick 
}: { 
  disabled: boolean; 
  onClick?: () => void; 
}) {
  const { pending } = useFormStatus();
  
  return (
    <Button
      type="button"
      onClick={onClick}
      disabled={disabled || pending}
      className="bg-primary hover:bg-primary/90 text-primary-foreground transition-all hover:scale-[1.01] hover:shadow-md rounded-full px-6"
      leftIcon={<Send className="size-4" aria-hidden="true" />}
    >
      {pending ? "Submitting Request..." : "Submit Request"}
    </Button>
  );
}

export function SaveDraftButton({ 
  disabled, 
  onClick 
}: { 
  disabled: boolean; 
  onClick?: () => void; 
}) {
  const { pending } = useFormStatus();
  
  return (
    <Button
      type="button"
      variant="secondary"
      onClick={onClick}
      disabled={disabled || pending}
      className="transition-transform hover:scale-[1.02]"
      leftIcon={<Save className="size-4" aria-hidden="true" />}
    >
      {pending ? "Saving..." : "Save Draft"}
    </Button>
  );
}