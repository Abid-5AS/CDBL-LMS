"use client";

import { useState, useTransition } from "react";
import { ArrowLeft, Key, Copy } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createWebhook, updateWebhook } from "@/app/actions/webhook-actions";

const WEBHOOK_EVENTS = [
  { value: "leave.submitted", label: "Leave Submitted", category: "Leave" },
  { value: "leave.approved", label: "Leave Approved", category: "Leave" },
  { value: "leave.rejected", label: "Leave Rejected", category: "Leave" },
  { value: "leave.cancelled", label: "Leave Cancelled", category: "Leave" },
  { value: "leave.updated", label: "Leave Updated", category: "Leave" },
  { value: "approval.pending", label: "Approval Pending", category: "Approval" },
  { value: "approval.completed", label: "Approval Completed", category: "Approval" },
  { value: "balance.updated", label: "Balance Updated", category: "Balance" },
  { value: "balance.low", label: "Balance Low", category: "Balance" },
  { value: "employee.created", label: "Employee Created", category: "Employee" },
  { value: "employee.updated", label: "Employee Updated", category: "Employee" },
  { value: "employee.deleted", label: "Employee Deleted", category: "Employee" },
  { value: "encashment.requested", label: "Encashment Requested", category: "Encashment" },
  { value: "encashment.approved", label: "Encashment Approved", category: "Encashment" },
  { value: "encashment.rejected", label: "Encashment Rejected", category: "Encashment" },
  { value: "encashment.paid", label: "Encashment Paid", category: "Encashment" },
];

type WebhookFormProps = {
  mode: "create" | "edit";
  initialData?: {
    id: number;
    name: string;
    url: string;
    description?: string;
    events: string[];
    enabled: boolean;
    secret?: string;
  };
};

export function WebhookForm({ mode, initialData }: WebhookFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [showSecret, setShowSecret] = useState(false);
  
  const [formData, setFormData] = useState({
    name: initialData?.name || "",
    url: initialData?.url || "",
    events: initialData?.events || [],
    description: initialData?.description || "",
    enabled: initialData?.enabled ?? true,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast.error("Name is required");
      return;
    }

    if (!formData.url.trim()) {
      toast.error("URL is required");
      return;
    }

    try {
      new URL(formData.url);
    } catch {
      toast.error("Invalid URL format");
      return;
    }

    if (formData.events.length === 0) {
      toast.error("Please select at least one event");
      return;
    }

    startTransition(async () => {
      let result;
      if (mode === "create") {
        result = await createWebhook(formData);
      } else {
        if (!initialData?.id) return;
        result = await updateWebhook(initialData.id, formData);
      }

      if (result.success) {
        toast.success(`Webhook ${mode === "create" ? "created" : "updated"} successfully`);
        router.push(mode === "create" ? "/webhooks" : `/webhooks/${initialData?.id}`);
      } else {
        toast.error(result.error || `Failed to ${mode} webhook`);
      }
    });
  };

  const toggleEvent = (event: string) => {
    setFormData((prev) => ({
      ...prev,
      events: prev.events.includes(event)
        ? prev.events.filter((e) => e !== event)
        : [...prev.events, event],
    }));
  };

  const selectAllInCategory = (category: string) => {
    const categoryEvents = WEBHOOK_EVENTS.filter((e) => e.category === category).map(
      (e) => e.value
    );
    const allSelected = categoryEvents.every((e) => formData.events.includes(e));

    if (allSelected) {
      setFormData((prev) => ({
        ...prev,
        events: prev.events.filter((e) => !categoryEvents.includes(e)),
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        events: [...new Set([...prev.events, ...categoryEvents])],
      }));
    }
  };

  const copySecret = () => {
    if (initialData?.secret) {
        navigator.clipboard.writeText(initialData.secret);
        toast.success("Secret copied to clipboard");
    }
  };

  const categories = [...new Set(WEBHOOK_EVENTS.map((e) => e.category))];

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <Link
          href={mode === "edit" ? `/webhooks/${initialData?.id}` : "/webhooks"}
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">
          {mode === "create" ? "Create Webhook" : "Edit Webhook"}
        </h1>
        <p className="text-sm text-gray-600 mt-1">
          {mode === "create" 
            ? "Configure a new webhook endpoint to receive event notifications" 
            : "Update webhook configuration"}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Basic Information
          </h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="My Integration"
                disabled={isPending}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                URL *
              </label>
              <input
                type="url"
                value={formData.url}
                onChange={(e) =>
                  setFormData({ ...formData, url: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                placeholder="https://example.com/webhooks"
                disabled={isPending}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
                placeholder="Optional description"
                disabled={isPending}
              />
            </div>

            <div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.enabled}
                  onChange={(e) =>
                    setFormData({ ...formData, enabled: e.target.checked })
                  }
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  disabled={isPending}
                />
                <span className="text-sm font-medium text-gray-700">
                  Enabled
                </span>
              </label>
            </div>
          </div>
        </div>

        {mode === "edit" && initialData?.secret && (
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center gap-2 mb-4">
              <Key className="w-5 h-5 text-gray-600" />
              <h2 className="text-lg font-semibold text-gray-900">Signing Secret</h2>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              Use this secret to verify webhook signatures.
            </p>
            <div className="flex gap-2">
              <input
                type={showSecret ? "text" : "password"}
                value={initialData.secret}
                readOnly
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md bg-gray-50 font-mono text-sm"
              />
              <button
                type="button"
                onClick={() => setShowSecret(!showSecret)}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
              >
                {showSecret ? "Hide" : "Show"}
              </button>
              <button
                type="button"
                onClick={copySecret}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
              >
                <Copy className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Event Subscriptions *
          </h2>

          <div className="space-y-4">
            {categories.map((category) => (
              <div key={category} className="border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="font-medium text-gray-900">{category}</h3>
                  <button
                    type="button"
                    onClick={() => selectAllInCategory(category)}
                    className="text-sm text-blue-600 hover:text-blue-700"
                    disabled={isPending}
                  >
                    {WEBHOOK_EVENTS.filter((e) => e.category === category).every(
                      (e) => formData.events.includes(e.value)
                    )
                      ? "Deselect All"
                      : "Select All"}
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {WEBHOOK_EVENTS.filter((e) => e.category === category).map(
                    (event) => (
                      <label
                        key={event.value}
                        className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-2 rounded"
                      >
                        <input
                          type="checkbox"
                          checked={formData.events.includes(event.value)}
                          onChange={() => toggleEvent(event.value)}
                          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                          disabled={isPending}
                        />
                        <span className="text-sm text-gray-700">
                          {event.label}
                        </span>
                        <code className="text-xs text-gray-500 ml-auto">
                          {event.value}
                        </code>
                      </label>
                    )
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={isPending}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isPending ? "Saving..." : (mode === "create" ? "Create Webhook" : "Save Changes")}
          </button>
          <Link
            href={mode === "edit" ? `/webhooks/${initialData?.id}` : "/webhooks"}
            className="px-6 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
